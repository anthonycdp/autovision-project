import fs from 'fs';
import path from 'path';

// CKDEV-NOTE: Comprehensive logging system with different levels and secure handling
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logDir: string;
  private logLevel: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private sanitizeForLog(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    // CKDEV-NOTE: Remove sensitive information from logs
    const sensitiveFields = [
      'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
      'apiKey', 'secret', 'authorization', 'cookie', 'session',
      'OPENAI_API_KEY', 'SENDGRID_API_KEY', 'JWT_SECRET', 'SESSION_SECRET'
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, userId, ip, userAgent, method, url, statusCode, responseTime, error } = entry;
    
    const logObj: any = {
      timestamp,
      level: level.toUpperCase(),
      message,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost'
    };

    if (context) logObj.context = this.sanitizeForLog(context);
    if (userId) logObj.userId = userId;
    if (ip) logObj.ip = ip;
    if (userAgent) logObj.userAgent = userAgent;
    if (method) logObj.method = method;
    if (url) logObj.url = url;
    if (statusCode) logObj.statusCode = statusCode;
    if (responseTime) logObj.responseTime = `${responseTime}ms`;
    if (error) logObj.error = error;

    return JSON.stringify(logObj) + '\n';
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private writeToFile(content: string): void {
    const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    
    try {
      // Check file size and rotate if necessary
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxLogSize) {
          this.rotateLogFile(logFile);
        }
      }

      fs.appendFileSync(logFile, content, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogFile(logFile: string): void {
    const baseFile = logFile.replace('.log', '');
    
    // Move existing rotated files
    for (let i = this.maxLogFiles - 1; i >= 1; i--) {
      const oldFile = `${baseFile}.${i}.log`;
      const newFile = `${baseFile}.${i + 1}.log`;
      
      if (fs.existsSync(oldFile)) {
        if (i === this.maxLogFiles - 1) {
          fs.unlinkSync(oldFile); // Delete oldest file
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current file to .1
    if (fs.existsSync(logFile)) {
      fs.renameSync(logFile, `${baseFile}.1.log`);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.log(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.warn(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.error(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.debug(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }

  // CKDEV-NOTE: Specialized logging for API requests
  logApiRequest(req: any, res: any, responseTime: number, error?: Error): void {
    const level = error ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `API Request: ${req.method} ${req.url}`,
      userId: req.user?.id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context: {
        headers: this.sanitizeForLog(req.headers),
        body: this.sanitizeForLog(req.body),
        query: this.sanitizeForLog(req.query)
      }
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.log(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }

  // CKDEV-NOTE: Specialized logging for OpenAI API calls
  logOpenAIRequest(operation: string, success: boolean, error?: Error, context?: Record<string, any>): void {
    const level = success ? 'info' : 'error';
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `OpenAI API ${operation}: ${success ? 'SUCCESS' : 'FAILED'}`,
      context: this.sanitizeForLog(context),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    const formattedEntry = this.formatLogEntry(entry);
    console.log(formattedEntry.trim());
    this.writeToFile(formattedEntry);
  }
}

// CKDEV-NOTE: Singleton logger instance
export const logger = new Logger();