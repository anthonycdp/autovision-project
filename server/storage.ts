import { 
  users, 
  vehicles, 
  activityLogs,
  vehicleHistory,
  documents,
  type User, 
  type InsertUser, 
  type Vehicle, 
  type InsertVehicle, 
  type UpdateVehicle, 
  type VehicleFilters,
  type UpdateUserProfile,
  type ActivityLog,
  type VehicleHistory,
  type Document,
  type InsertDocument,
  type UpdateDocument,
  type DocumentFilters
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, like, count, desc, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
  // Vehicle operations
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicles(filters: VehicleFilters): Promise<{ vehicles: Vehicle[]; total: number }>;
  createVehicle(vehicle: InsertVehicle, createdBy: string): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: UpdateVehicle): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  updateVehicleImages(id: string, imageURLs: string[]): Promise<void>;
  approveVehicle(id: string, approvedBy: string): Promise<Vehicle>;
  rejectVehicle(id: string, approvedBy: string): Promise<Vehicle>;
  getPendingVehicles(): Promise<Vehicle[]>;
  
  // Activity logs
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;
  getVehicleHistory(vehicleId: string): Promise<any[]>;
  
  // Statistics
  getVehicleStats(): Promise<{
    totalVehicles: number;
    availableVehicles: number;
    reservedVehicles: number;
    soldVehicles: number;
    averagePrice: number;
  }>;
  
  getVehiclesByStatus(): Promise<Array<{ status: string; count: number }>>;
  getSalesData(): Promise<Array<{ month: string; sales: number }>>;
  
  // CKDEV-NOTE: Get distinct vehicle brands for dynamic dropdown
  getVehicleBrands(): Promise<Array<{ make: string; count: number }>>;
  
  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(filters: DocumentFilters): Promise<{ documents: Document[]; total: number }>;
  createDocument(document: InsertDocument, createdBy: string): Promise<Document>;
  updateDocument(id: string, document: UpdateDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User> {
    const updateData: any = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      profileImageUrl: profile.profileImageUrl,
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (profile.password) {
      const { hashPassword } = await import("./auth");
      updateData.passwordHash = await hashPassword(profile.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Vehicle operations
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicles(filters: VehicleFilters): Promise<{ vehicles: Vehicle[]; total: number }> {
    const conditions = [];
    
    if (filters.make) {
      conditions.push(like(vehicles.make, `%${filters.make}%`));
    }
    
    if (filters.model) {
      conditions.push(like(vehicles.model, `%${filters.model}%`));
    }
    
    if (filters.status) {
      conditions.push(eq(vehicles.status, filters.status as any));
    }
    
    if (filters.approvalStatus) {
      conditions.push(eq(vehicles.approvalStatus, filters.approvalStatus as any));
    } else {
      // Only show approved vehicles by default
      conditions.push(eq(vehicles.approvalStatus, "approved"));
    }
    
    if (filters.minKm) {
      conditions.push(gte(vehicles.km, filters.minKm));
    }
    
    if (filters.maxKm) {
      conditions.push(lte(vehicles.km, filters.maxKm));
    }
    
    if (filters.minYear) {
      conditions.push(gte(vehicles.fabricateYear, filters.minYear));
    }
    
    if (filters.maxYear) {
      conditions.push(lte(vehicles.fabricateYear, filters.maxYear));
    }
    
    if (filters.minPrice) {
      conditions.push(gte(vehicles.price, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice) {
      conditions.push(lte(vehicles.price, filters.maxPrice.toString()));
    }
    
    if (filters.color) {
      conditions.push(like(vehicles.color, `%${filters.color}%`));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(vehicles.make, `%${filters.search}%`),
          like(vehicles.model, `%${filters.search}%`),
          like(vehicles.color, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(whereClause);

    const vehiclesList = await db
      .select()
      .from(vehicles)
      .where(whereClause)
      .orderBy(desc(vehicles.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit);

    return {
      vehicles: vehiclesList,
      total: totalResult.count
    };
  }

  async createVehicle(vehicle: InsertVehicle, createdBy: string): Promise<Vehicle> {
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        ...vehicle,
        createdBy,
        approvalStatus: "pending",
      })
      .returning();
    return newVehicle;
  }

  async updateVehicle(id: string, vehicle: UpdateVehicle): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...vehicle, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    // First delete related vehicle history records
    await db.delete(vehicleHistory).where(eq(vehicleHistory.vehicleId, id));
    
    // Delete related activity logs
    await db.delete(activityLogs).where(eq(activityLogs.resourceId, id));
    
    // Then delete the vehicle
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async updateVehicleImages(id: string, imageURLs: string[]): Promise<void> {
    await db
      .update(vehicles)
      .set({ imageURLs, updatedAt: new Date() })
      .where(eq(vehicles.id, id));
  }

  async approveVehicle(id: string, approvedBy: string): Promise<Vehicle> {
    const [approvedVehicle] = await db
      .update(vehicles)
      .set({
        approvalStatus: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return approvedVehicle;
  }

  async rejectVehicle(id: string, approvedBy: string): Promise<Vehicle> {
    const [rejectedVehicle] = await db
      .update(vehicles)
      .set({
        approvalStatus: "rejected",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return rejectedVehicle;
  }

  async getPendingVehicles(): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.approvalStatus, "pending"))
      .orderBy(desc(vehicles.createdAt));
  }

  async getUserActivityLogs(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getVehicleHistory(vehicleId: string): Promise<any[]> {
    return await db
      .select({
        id: vehicleHistory.id,
        action: vehicleHistory.action,
        changes: vehicleHistory.changes,
        createdAt: vehicleHistory.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(vehicleHistory)
      .leftJoin(users, eq(vehicleHistory.userId, users.id))
      .where(eq(vehicleHistory.vehicleId, vehicleId))
      .orderBy(desc(vehicleHistory.createdAt));
  }

  // Statistics
  async getVehicleStats(): Promise<{
    totalVehicles: number;
    availableVehicles: number;
    reservedVehicles: number;
    soldVehicles: number;
    averagePrice: number;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(vehicles);

    const [availableResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, "available"));

    const [reservedResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, "reserved"));

    const [soldResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, "sold"));

    const avgPriceResult = await db
      .select({ avg: vehicles.price })
      .from(vehicles);

    const avgPrice = avgPriceResult.length > 0 
      ? avgPriceResult.reduce((sum, v) => sum + Number(v.avg), 0) / avgPriceResult.length
      : 0;

    return {
      totalVehicles: totalResult.count,
      availableVehicles: availableResult.count,
      reservedVehicles: reservedResult.count,
      soldVehicles: soldResult.count,
      averagePrice: avgPrice
    };
  }

  async getVehiclesByStatus(): Promise<Array<{ status: string; count: number }>> {
    const results = await db
      .select({ status: vehicles.status, count: count() })
      .from(vehicles)
      .groupBy(vehicles.status);
    
    return results.map(r => ({ status: r.status, count: r.count }));
  }

  async getSalesData(): Promise<Array<{ month: string; sales: number }>> {
    // For now, return mock data for sales chart
    // In a real application, this would come from sales/transaction data
    return [
      { month: "Jan", sales: 12 },
      { month: "Fev", sales: 19 },
      { month: "Mar", sales: 15 },
      { month: "Abr", sales: 25 },
      { month: "Mai", sales: 22 },
      { month: "Jun", sales: 18 }
    ];
  }

  // CKDEV-NOTE: Returns distinct vehicle brands with count for dynamic dropdown
  async getVehicleBrands(): Promise<Array<{ make: string; count: number }>> {
    const results = await db
      .select({ 
        make: vehicles.make, 
        count: count() 
      })
      .from(vehicles)
      .where(isNotNull(vehicles.make)) // Garantir que marca não seja null
      .groupBy(vehicles.make)
      .orderBy(vehicles.make);
    
    return results.map(r => ({ 
      make: r.make, 
      count: Number(r.count) // Garantir que count seja número
    }));
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocuments(filters: DocumentFilters): Promise<{ documents: Document[]; total: number }> {
    const conditions = [];
    
    if (filters.category) {
      conditions.push(eq(documents.category, filters.category as any));
    }
    
    if (filters.status) {
      conditions.push(eq(documents.status, filters.status as any));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(documents.name, `%${filters.search}%`),
          like(documents.originalName, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(whereClause);

    const documentsList = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit);

    return {
      documents: documentsList,
      total: totalResult.count
    };
  }

  async createDocument(document: InsertDocument, createdBy: string): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        ...document,
        createdBy,
      })
      .returning();
    return newDocument;
  }

  async updateDocument(id: string, document: UpdateDocument): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();
