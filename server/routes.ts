import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { generateTokens, verifyToken, hashPassword, verifyPassword } from "./auth";
import { authenticateToken, requireAdmin, AuthRequest } from "./middleware/auth";
import { upload, documentUpload } from "./middleware/upload";
import { generateVehicleDescription, generateVehicleComparisonSummary } from "./services/openai";
import { logActivity, logVehicleHistory } from "./services/activityLogger";
import { logger } from "./utils/logger";
import { validatePDFFile, formatValidationErrors } from "./utils/pdfValidator";
import { validateVehicleDescriptionInput, validateRateLimit } from "./utils/validation";
import { 
  loginSchema, 
  insertUserSchema, 
  insertVehicleSchema, 
  updateVehicleSchema, 
  vehicleFiltersSchema,
  updateUserProfileSchema,
  insertDocumentSchema,
  updateDocumentSchema,
  documentFiltersSchema
} from "@shared/schema";

// CKDEV-NOTE: Main route registration function - all API endpoints defined here
export async function registerRoutes(app: Express): Promise<Server> {
  // CKDEV-NOTE: Static file serving for vehicle images and documents uploaded via multer
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // CKDEV-NOTE: Authentication routes - login, refresh, and user info
  // CKDEV-NOTE: Login endpoint with email/password authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // CKDEV-NOTE: Generic error message prevents email enumeration attacks
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const tokens = generateTokens(user);
      
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
        },
        ...tokens,
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // CKDEV-NOTE: Refresh token endpoint for seamless token renewal
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token requerido" });
      }

      // CKDEV-TODO: Implement refresh token rotation for better security
      const payload = verifyToken(refreshToken);
      const user = await storage.getUser(payload.id);
      
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const tokens = generateTokens(user);
      
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
        },
        ...tokens,
      });
    } catch (error) {
      res.status(403).json({ message: "Token inválido" });
    }
  });

  // CKDEV-NOTE: User info endpoint - returns current authenticated user data
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // CKDEV-NOTE: User management routes - admin-only access for user CRUD operations
  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPassword = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt,
      }));
      res.json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // CKDEV-NOTE: Create new user endpoint - only admins can create users
  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, email, password, type } = req.body;
      
      // CKDEV-NOTE: Prevent duplicate users by checking email uniqueness
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }

      const passwordHash = await hashPassword(password);
      const userData = insertUserSchema.parse({
        name,
        email,
        passwordHash,
        type,
      });

      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação do usuário" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, type } = req.body;
      
      // Prevent editing self role
      if (id === req.user!.id && type && type !== req.user!.type) {
        return res.status(400).json({ message: "Não é possível alterar o próprio tipo de usuário" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Este email já está em uso" });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (type) updateData.type = type;
      if (password) updateData.passwordHash = await hashPassword(password);

      const updatedUser = await storage.updateUser(id, updateData);
      
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        type: updatedUser.type,
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // CKDEV-NOTE: Delete user endpoint with self-deletion protection
  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // CKDEV-NOTE: Prevent admins from accidentally deleting their own accounts
      if (id === req.user!.id) {
        return res.status(400).json({ message: "Não é possível deletar a própria conta" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.deleteUser(id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "DELETE_USER",
        resourceType: "user",
        resourceId: id,
        details: { deletedUserName: user.name, deletedUserEmail: user.email },
        req,
      });
      
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // CKDEV-NOTE: User profile self-update endpoint - users can modify their own data
  app.put("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const profileData = updateUserProfileSchema.parse(req.body);
      
      // CKDEV-NOTE: Validate email uniqueness when user changes their email
      if (profileData.email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(profileData.email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).json({ message: "Email já está em uso" });
        }
      }
      
      const updatedUser = await storage.updateUserProfile(req.user!.id, profileData);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "UPDATE_PROFILE",
        resourceType: "user",
        resourceId: req.user!.id,
        details: { updatedFields: Object.keys(profileData) },
        req,
      });
      
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        type: updatedUser.type,
        phone: updatedUser.phone,
        profileImageUrl: updatedUser.profileImageUrl,
      });
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // CKDEV-NOTE: Activity logs endpoint - returns user's audit trail
  app.get("/api/activity-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getUserActivityLogs(req.user!.id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar logs de atividade" });
    }
  });

  // CKDEV-NOTE: Vehicle CRUD operations - core business logic for vehicle management
  // CKDEV-NOTE: Vehicle listing with filtering, pagination, and search capabilities
  app.get("/api/vehicles", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const filters = vehicleFiltersSchema.parse(req.query);
      const result = await storage.getVehicles(filters);
      res.json(result);
    } catch (error) {
      console.error("Vehicle filters error:", error);
      res.status(400).json({ message: "Parâmetros de filtro inválidos" });
    }
  });

  // CKDEV-NOTE: Get single vehicle by ID with full details
  app.get("/api/vehicles/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar veículo" });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      
      // Generate automatic description if not provided
      if (!vehicleData.description) {
        try {
          vehicleData.description = await generateVehicleDescription({
            make: vehicleData.make,
            model: vehicleData.model,
            fabricateYear: vehicleData.fabricateYear,
            modelYear: vehicleData.modelYear,
            color: vehicleData.color,
            km: vehicleData.km,
            price: vehicleData.price,
          });
        } catch (error) {
          console.error("Failed to generate vehicle description:", error);
          // Continue without description if generation fails
        }
      }
      
      const vehicle = await storage.createVehicle(vehicleData, req.user!.id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "CREATE_VEHICLE",
        resourceType: "vehicle",
        resourceId: vehicle.id,
        details: { make: vehicle.make, model: vehicle.model, year: vehicle.fabricateYear },
        req,
      });
      
      // Log vehicle history
      await logVehicleHistory({
        vehicleId: vehicle.id,
        userId: req.user!.id,
        action: "CREATE",
        changes: vehicleData,
      });
      
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação do veículo" });
    }
  });

  app.put("/api/vehicles/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const vehicleData = updateVehicleSchema.parse(req.body);
      
      const existingVehicle = await storage.getVehicle(id);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const updatedVehicle = await storage.updateVehicle(id, vehicleData);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "UPDATE_VEHICLE",
        resourceType: "vehicle",
        resourceId: id,
        details: { changes: vehicleData },
        req,
      });
      
      // Log vehicle history
      await logVehicleHistory({
        vehicleId: id,
        userId: req.user!.id,
        action: "UPDATE",
        changes: vehicleData,
      });
      
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do veículo" });
    }
  });

  app.delete("/api/vehicles/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      await storage.deleteVehicle(id);
      
      // Log deletion activity
      await logActivity({
        userId: req.user!.id,
        action: "DELETE_VEHICLE",
        resourceType: "vehicle",
        resourceId: id,
        details: { make: vehicle.make, model: vehicle.model, year: vehicle.fabricateYear },
        req,
      });
      
      res.json({ message: "Veículo deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Erro ao deletar veículo" });
    }
  });

  // Vehicle image upload
  app.post("/api/vehicles/:id/images", 
    authenticateToken, 
    requireAdmin, 
    upload.array("images", 10), 
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
        }

        const vehicle = await storage.getVehicle(id);
        if (!vehicle) {
          return res.status(404).json({ message: "Veículo não encontrado" });
        }

        const imageURLs = files.map(file => `/uploads/images/${file.filename}`);
        await storage.updateVehicleImages(id, imageURLs);
        
        res.json({ message: "Imagens enviadas com sucesso", imageURLs });
      } catch (error) {
        res.status(500).json({ message: "Erro ao enviar imagens" });
      }
    }
  );

  // Vehicle approval routes (admin only)
  app.get("/api/vehicles/pending", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingVehicles = await storage.getPendingVehicles();
      res.json(pendingVehicles);
    } catch (error) {
      console.error("Error fetching pending vehicles:", error);
      res.status(500).json({ message: "Erro ao buscar veículos pendentes" });
    }
  });

  app.post("/api/vehicles/:id/approve", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const approvedVehicle = await storage.approveVehicle(id, req.user!.id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "APPROVE_VEHICLE",
        resourceType: "vehicle",
        resourceId: id,
        details: { make: vehicle.make, model: vehicle.model },
        req,
      });
      
      // Log vehicle history
      await logVehicleHistory({
        vehicleId: id,
        userId: req.user!.id,
        action: "APPROVE",
        changes: { approvalStatus: "approved" },
      });
      
      res.json(approvedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao aprovar veículo" });
    }
  });

  app.post("/api/vehicles/:id/reject", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const rejectedVehicle = await storage.rejectVehicle(id, req.user!.id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "REJECT_VEHICLE",
        resourceType: "vehicle",
        resourceId: id,
        details: { make: vehicle.make, model: vehicle.model },
        req,
      });
      
      // Log vehicle history
      await logVehicleHistory({
        vehicleId: id,
        userId: req.user!.id,
        action: "REJECT",
        changes: { approvalStatus: "rejected" },
      });
      
      res.json(rejectedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao rejeitar veículo" });
    }
  });

  // Request approval for a vehicle (available to vehicle owner or admin)
  app.post("/api/vehicles/:id/request-approval", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Check if user is the vehicle owner or admin
      if (vehicle.createdBy !== req.user!.id && req.user!.type !== "admin") {
        return res.status(403).json({ message: "Não autorizado" });
      }

      // Update vehicle to pending approval
      const updatedVehicle = await storage.updateVehicle(id, {
        approvalStatus: "pending",
        approvedBy: null,
        approvedAt: null
      });
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "REQUEST_APPROVAL",
        resourceType: "vehicle",
        resourceId: id,
        details: { make: vehicle.make, model: vehicle.model },
        req,
      });
      
      res.json(updatedVehicle);
    } catch (error) {
      console.error("Error requesting approval:", error);
      res.status(500).json({ message: "Erro ao solicitar aprovação" });
    }
  });

  // Vehicle history and comparison routes
  app.get("/api/vehicles/:id/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getVehicleHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar histórico do veículo" });
    }
  });

  app.post("/api/vehicles/compare", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { vehicleIds } = req.body;
      console.log("Comparison request received:", { vehicleIds });
      
      if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length < 2) {
        return res.status(400).json({ message: "Pelo menos dois veículos devem ser selecionados para comparação" });
      }
      
      const vehicles = await Promise.all(
        vehicleIds.map(id => storage.getVehicle(id))
      );
      
      const validVehicles = vehicles.filter(v => v !== undefined);
      console.log("Valid vehicles found:", validVehicles.length);
      
      if (validVehicles.length < 2) {
        return res.status(400).json({ message: "Veículos não encontrados" });
      }
      
      // Generate comparison summary using AI
      let comparisonSummary = "";
      try {
        comparisonSummary = await generateVehicleComparisonSummary(validVehicles);
      } catch (error) {
        console.error("Failed to generate comparison summary:", error);
        // Use fallback if AI fails
        comparisonSummary = "Comparação realizada com sucesso. Analise os detalhes dos veículos acima para fazer sua escolha.";
      }
      
      const response = {
        vehicles: validVehicles,
        comparisonSummary,
      };
      
      console.log("Sending comparison response:", { vehicleCount: validVehicles.length, hasSummary: !!comparisonSummary });
      res.json(response);
    } catch (error) {
      console.error("Comparison endpoint error:", error);
      res.status(500).json({ message: "Erro ao comparar veículos" });
    }
  });

  // Generate description preview for form data
  app.post("/api/vehicles/generate-description-preview", 
    authenticateToken, 
    validateRateLimit,
    validateVehicleDescriptionInput,
    async (req: AuthRequest, res) => {
    try {
      const { make, model, fabricateYear, modelYear, color, km, price } = req.body;
      
      logger.info('Iniciando geração de descrição preview', {
        userId: req.user?.id,
        make,
        model,
        year: fabricateYear
      });

      const startTime = Date.now();
      
      const description = await generateVehicleDescription({
        make,
        model,
        fabricateYear,
        modelYear,
        color: color || "N/A",
        km: km || 0,
        price: price || "0",
      });
      
      const responseTime = Date.now() - startTime;
      
      logger.info('Descrição preview gerada com sucesso', {
        userId: req.user?.id,
        responseTime: `${responseTime}ms`,
        descriptionLength: description.length,
        fallbackUsed: !process.env.OPENAI_API_KEY
      });
      
      res.json({ 
        description, 
        fallbackUsed: !process.env.OPENAI_API_KEY 
      });
    } catch (error) {
      logger.error("Generate description preview error", error instanceof Error ? error : new Error(String(error)), {
        userId: req.user?.id,
        make: req.body.make,
        model: req.body.model
      });
      
      // Provide more detailed error messages
      let errorMessage = "Erro ao gerar descrição do veículo";
      
      if (error instanceof Error) {
        if (error.message.includes("exceeded your current quota")) {
          errorMessage = "Cota da OpenAI excedida. Usando descrição padrão.";
        } else if (error.message.includes("Invalid API key")) {
          errorMessage = "Chave da OpenAI inválida. Usando descrição padrão.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Timeout da OpenAI. Tente novamente.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Limite de taxa da OpenAI excedido. Tente novamente em alguns minutos.";
        }
      }
      
      res.status(500).json({ 
        message: errorMessage,
        fallbackUsed: !process.env.OPENAI_API_KEY 
      });
    }
  });

  // Generate description for existing vehicle
  app.post("/api/vehicles/:id/generate-description", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const description = await generateVehicleDescription({
        make: vehicle.make,
        model: vehicle.model,
        fabricateYear: vehicle.fabricateYear,
        modelYear: vehicle.modelYear,
        color: vehicle.color,
        km: vehicle.km,
        price: vehicle.price,
      });
      
      const updatedVehicle = await storage.updateVehicle(id, { description });
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "GENERATE_DESCRIPTION",
        resourceType: "vehicle",
        resourceId: id,
        details: { make: vehicle.make, model: vehicle.model },
        req,
      });
      
      res.json({ 
        description, 
        vehicle: updatedVehicle, 
        fallbackUsed: !process.env.OPENAI_API_KEY 
      });
    } catch (error) {
      console.error("Generate description error:", error);
      
      // Provide more detailed error messages
      let errorMessage = "Erro ao gerar descrição do veículo";
      
      if (error instanceof Error) {
        if (error.message.includes("exceeded your current quota")) {
          errorMessage = "Cota da OpenAI excedida. Usando descrição padrão.";
        } else if (error.message.includes("Invalid API key")) {
          errorMessage = "Chave da OpenAI inválida. Usando descrição padrão.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Timeout da OpenAI. Tente novamente.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Limite de taxa da OpenAI excedido. Tente novamente em alguns minutos.";
        }
      }
      
      res.status(500).json({ 
        message: errorMessage,
        fallbackUsed: !process.env.OPENAI_API_KEY 
      });
    }
  });

  // CKDEV-NOTE: Brands endpoint - returns distinct vehicle brands from database
  app.get("/api/marcas", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const brands = await storage.getVehicleBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar marcas" });
    }
  });

  // Statistics routes
  app.get("/api/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getVehicleStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/stats/vehicles-by-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await storage.getVehiclesByStatus();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar dados por status" });
    }
  });

  app.get("/api/stats/sales", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await storage.getSalesData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar dados de vendas" });
    }
  });

  // CKDEV-NOTE: Document management routes
  // Get all documents with filtering
  app.get("/api/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const filters = documentFiltersSchema.parse(req.query);
      const result = await storage.getDocuments(filters);
      res.json(result);
    } catch (error) {
      console.error("Document filters error:", error);
      res.status(400).json({ message: "Parâmetros de filtro inválidos" });
    }
  });

  // Get single document by ID
  app.get("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar documento" });
    }
  });

  // Create new document
  app.post("/api/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData, req.user!.id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "CREATE_DOCUMENT",
        resourceType: "document",
        resourceId: document.id,
        details: { name: document.name, type: document.type },
        req,
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação do documento" });
    }
  });

  // Update document
  app.put("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const documentData = updateDocumentSchema.parse(req.body);
      
      const existingDocument = await storage.getDocument(id);
      if (!existingDocument) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Check if user is document owner or admin
      if (existingDocument.createdBy !== req.user!.id && req.user!.type !== "admin") {
        return res.status(403).json({ message: "Não autorizado" });
      }

      const updatedDocument = await storage.updateDocument(id, documentData);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "UPDATE_DOCUMENT",
        resourceType: "document",
        resourceId: id,
        details: { changes: documentData },
        req,
      });
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do documento" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Check if user is document owner or admin
      if (document.createdBy !== req.user!.id && req.user!.type !== "admin") {
        return res.status(403).json({ message: "Não autorizado" });
      }

      await storage.deleteDocument(id);
      
      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "DELETE_DOCUMENT",
        resourceType: "document",
        resourceId: id,
        details: { name: document.name, type: document.type },
        req,
      });
      
      res.json({ message: "Documento deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Erro ao deletar documento" });
    }
  });

  // Upload document file
  app.post("/api/documents/upload", 
    authenticateToken, 
    documentUpload.single("file"),
    async (req: AuthRequest, res) => {
      try {
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "Nenhum arquivo foi enviado" });
        }

        // Validate file type
        const allowedTypes = ['.pdf', '.docx', '.txt', '.xlsx', '.jpeg', '.jpg', '.png'];
        const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
          return res.status(400).json({ 
            message: "Tipo de arquivo não suportado. Apenas PDF, DOCX, TXT, XLSX, JPEG e PNG são permitidos." 
          });
        }

        // CKDEV-NOTE: Enhanced PDF validation for better preview reliability
        if (fileExtension === '.pdf') {
          try {
            const fullPath = file.path;
            const validationResult = await validatePDFFile(fullPath);
            
            if (!validationResult.isValid) {
              logger.error('PDF validation failed', {
                filename: file.originalname,
                errors: validationResult.errors,
                warnings: validationResult.warnings,
              } as any);
              
              return res.status(400).json({ 
                message: `PDF inválido: ${formatValidationErrors(validationResult)}`,
                details: validationResult.errors
              });
            }
            
            if (validationResult.warnings.length > 0) {
              logger.warn('PDF has warnings', {
                filename: file.originalname,
                warnings: validationResult.warnings,
              });
            }
            
            logger.info('PDF validation successful', {
              filename: file.originalname,
              fileSize: validationResult.metadata.fileSize,
              hasValidHeader: validationResult.metadata.hasValidHeader,
              hasValidFooter: validationResult.metadata.hasValidFooter,
            });
          } catch (validationError) {
            logger.error('PDF validation error', {
              filename: file.originalname,
              error: validationError instanceof Error ? validationError.message : 'Unknown error',
            } as any);
            
            return res.status(400).json({ 
              message: "Erro ao validar arquivo PDF. Verifique se o arquivo não está corrompido.",
            });
          }
        }

        const documentData = {
          name: file.originalname,
          originalName: file.originalname,
          type: fileExtension.replace('.', ''),
          size: file.size,
          filePath: `/uploads/documents/${file.filename}`,
          category: req.body.category || 'other',
          status: req.body.status || 'active',
        };

        const document = await storage.createDocument(documentData, req.user!.id);
        
        // Log activity
        await logActivity({
          userId: req.user!.id,
          action: "UPLOAD_DOCUMENT",
          resourceType: "document",
          resourceId: document.id,
          details: { name: document.name, type: document.type, size: document.size },
          req,
        });
        
        res.status(201).json(document);
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
      }
    }
  );

  // Download document
  app.get("/api/documents/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Log activity
      await logActivity({
        userId: req.user!.id,
        action: "DOWNLOAD_DOCUMENT",
        resourceType: "document",
        resourceId: id,
        details: { name: document.name, type: document.type },
        req,
      });

      const filePath = document.filePath.replace('/uploads/documents/', '');
      const fullPath = `uploads/documents/${filePath}`;
      
      console.log('Document download request:', {
        id,
        type: document.type,
        filePath: document.filePath,
        fullPath,
        originalName: document.originalName
      });
      
      // For PDFs and images, we want to serve them inline for preview
      if (['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(document.type.toLowerCase())) {
        const fs = await import('fs');
        const path = await import('path');
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
        }
        
        // Set appropriate content type
        const contentTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'webp': 'image/webp'
        };
        
        const contentType = contentTypes[document.type.toLowerCase()] || 'application/octet-stream';
        
        // Send file with appropriate headers for inline display
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
      } else {
        // For other file types, force download
        res.download(fullPath, document.originalName);
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Erro ao fazer download do arquivo" });
    }
  });

  // CKDEV-NOTE: Preview endpoint optimized for inline display (no forced download)
  app.get("/api/documents/:id/preview", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      const filePath = document.filePath.replace('/uploads/documents/', '');
      const fullPath = `uploads/documents/${filePath}`;
      
      console.log('Document preview request:', {
        id,
        type: document.type,
        filePath: document.filePath,
        fullPath,
        userAgent: req.headers['user-agent']
      });

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }

      // Set appropriate content type
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
      };
      
      const contentType = contentTypes[document.type.toLowerCase()] || 'application/octet-stream';
      
      // CKDEV-NOTE: Headers optimized for inline preview and react-pdf compatibility
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // CKDEV-NOTE: CORS headers for react-pdf cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

      // Handle range requests for large PDFs
      const stats = fs.statSync(fullPath);
      const fileSize = stats.size;
      const range = req.headers.range;

      if (range) {
        // Parse range header
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunksize.toString());
        res.status(206);

        const stream = fs.createReadStream(fullPath, { start, end });
        stream.pipe(res);
      } else {
        // Serve complete file
        res.setHeader('Content-Length', fileSize.toString());
        const stream = fs.createReadStream(fullPath);
        stream.pipe(res);
      }

    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).json({ message: "Erro ao visualizar arquivo" });
    }
  });

  // Get document content (for text files)
  app.get("/api/documents/:id/content", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Only allow text file content retrieval
      if (!['txt', 'md'].includes(document.type)) {
        return res.status(400).json({ message: "Tipo de arquivo não suportado para visualização de conteúdo" });
      }

      const filePath = document.filePath.replace('/uploads/documents/', '');
      const fullPath = `uploads/documents/${filePath}`;
      
      // Read file content
      const fs = await import('fs/promises');
      const content = await fs.readFile(fullPath, 'utf-8');
      
      res.type('text/plain').send(content);
    } catch (error) {
      console.error("Content read error:", error);
      res.status(500).json({ message: "Erro ao ler conteúdo do arquivo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
