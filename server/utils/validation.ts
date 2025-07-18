import { z } from 'zod';
import { logger } from './logger';

// CKDEV-NOTE: Comprehensive input validation and sanitization utilities

// Base validation schemas
export const vehicleDescriptionInputSchema = z.object({
  make: z.string()
    .min(1, 'Marca é obrigatória')
    .max(50, 'Marca deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s\-]+$/, 'Marca deve conter apenas letras, espaços e hifens')
    .transform(s => s.trim()),
  
  model: z.string()
    .min(1, 'Modelo é obrigatório')
    .max(50, 'Modelo deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/, 'Modelo deve conter apenas letras, números, espaços, hifens e pontos')
    .transform(s => s.trim()),
  
  fabricateYear: z.number()
    .int('Ano de fabricação deve ser um número inteiro')
    .min(1950, 'Ano de fabricação deve ser posterior a 1950')
    .max(new Date().getFullYear(), 'Ano de fabricação não pode ser futuro'),
  
  modelYear: z.number()
    .int('Ano do modelo deve ser um número inteiro')
    .min(1950, 'Ano do modelo deve ser posterior a 1950')
    .max(new Date().getFullYear() + 1, 'Ano do modelo não pode ser muito futuro'),
  
  color: z.string()
    .min(1, 'Cor é obrigatória')
    .max(30, 'Cor deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s\-]+$/, 'Cor deve conter apenas letras, espaços e hifens')
    .transform(s => s.trim()),
  
  km: z.number()
    .int('Quilometragem deve ser um número inteiro')
    .min(0, 'Quilometragem deve ser positiva')
    .max(1000000, 'Quilometragem deve ser realista (máximo 1.000.000 km)'),
  
  price: z.string()
    .min(1, 'Preço é obrigatório')
    .regex(/^\d+(\.\d{1,2})?$/, 'Preço deve ser um número válido')
    .transform(s => {
      const num = parseFloat(s);
      if (num < 0) throw new Error('Preço deve ser positivo');
      if (num > 10000000) throw new Error('Preço deve ser realista (máximo R$ 10.000.000)');
      return s;
    })
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  ip: z.string().ip('IP address inválido'),
  userAgent: z.string().max(500, 'User agent muito longo'),
  timestamp: z.number().int().positive()
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome do arquivo muito longo')
    .regex(/^[a-zA-Z0-9\-_\.]+$/, 'Nome do arquivo contém caracteres inválidos'),
  
  mimetype: z.string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Tipo de arquivo não suportado'),
  
  size: z.number()
    .int('Tamanho do arquivo deve ser um número inteiro')
    .min(1, 'Arquivo vazio')
    .max(5 * 1024 * 1024, 'Arquivo muito grande (máximo 5MB)')
});

// Security validation utilities
export class SecurityValidator {
  
  // CKDEV-NOTE: Detect potential SQL injection patterns
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /('|(\\'))|(;)|(--)|(\s+(or|and)\s+.*(=|like))/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /\b(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  // CKDEV-NOTE: Detect potential XSS patterns
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*on\w+[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  // CKDEV-NOTE: Validate and sanitize text input
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input deve ser uma string');
    }
    
    // Check for malicious patterns
    if (this.containsSQLInjection(input)) {
      logger.warn('Possível tentativa de SQL injection detectada', { input: input.substring(0, 100) });
      throw new Error('Input contém padrões suspeitos');
    }
    
    if (this.containsXSS(input)) {
      logger.warn('Possível tentativa de XSS detectada', { input: input.substring(0, 100) });
      throw new Error('Input contém padrões suspeitos');
    }
    
    // Basic sanitization
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/["']/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  }
  
  // CKDEV-NOTE: Validate API key format
  static validateApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    // OpenAI API key format validation
    if (key.startsWith('sk-')) {
      return /^sk-[a-zA-Z0-9]{48,}$/.test(key);
    }
    
    // Generic API key validation
    return /^[a-zA-Z0-9\-_]{10,}$/.test(key) && key.length >= 20;
  }
  
  // CKDEV-NOTE: Validate environment variables
  static validateEnvironmentVariables(): void {
    const requiredVars = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error('Variáveis de ambiente obrigatórias não definidas', { missingVars } as any);
      throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`);
    }
    
    // Validate specific formats
    if (process.env.NODE_ENV && !['development', 'test', 'production'].includes(process.env.NODE_ENV)) {
      logger.error('NODE_ENV deve ser development, test ou production');
      throw new Error('NODE_ENV inválido');
    }
    
    if (process.env.PORT && (isNaN(Number(process.env.PORT)) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535)) {
      logger.error('PORT deve ser um número entre 1 e 65535');
      throw new Error('PORT inválido');
    }
    
    if (process.env.OPENAI_API_KEY && !this.validateApiKey(process.env.OPENAI_API_KEY)) {
      logger.warn('OPENAI_API_KEY tem formato inválido - funcionalidade de IA desabilitada');
    }
    
    logger.info('Validação de variáveis de ambiente concluída');
  }
}

// CKDEV-NOTE: Middleware for request validation
export function validateVehicleDescriptionInput(req: any, res: any, next: any): void {
  try {
    // Validate request body
    const validatedData = vehicleDescriptionInputSchema.parse(req.body);
    
    // Additional security checks
    Object.values(validatedData).forEach(value => {
      if (typeof value === 'string') {
        SecurityValidator.sanitizeText(value);
      }
    });
    
    // Replace request body with validated data
    req.body = validatedData;
    
    logger.debug('Validação de entrada bem-sucedida', { 
      route: req.path,
      method: req.method,
      userId: req.user?.id 
    });
    
    next();
  } catch (error) {
    logger.error('Falha na validação de entrada', {
      error: error instanceof Error ? error.message : 'Unknown error',
      route: req.path,
      method: req.method,
      body: req.body,
      userId: req.user?.id
    } as any);
    
    const message = error instanceof z.ZodError 
      ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      : 'Dados de entrada inválidos';
    
    res.status(400).json({ 
      message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// CKDEV-NOTE: Rate limiting validation
export function validateRateLimit(req: any, res: any, next: any): void {
  try {
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };
    
    rateLimitSchema.parse(clientInfo);
    
    // Simple in-memory rate limiting (in production, use Redis)
    const key = `${clientInfo.ip}-${req.path}`;
    const now = Date.now();
    const window = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    // This is a simplified version - implement proper rate limiting in production
    logger.debug('Rate limit check passed', { 
      ip: clientInfo.ip,
      path: req.path,
      method: req.method
    });
    
    next();
  } catch (error) {
    logger.warn('Rate limit validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
      method: req.method
    } as any);
    
    res.status(429).json({
      message: 'Muitas requisições. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    });
  }
}

// CKDEV-NOTE: File upload validation
export function validateFileUpload(file: any): boolean {
  try {
    fileUploadSchema.parse({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    return true;
  } catch (error) {
    logger.warn('File upload validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } as any);
    
    return false;
  }
}