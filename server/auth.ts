import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "@shared/schema";

// CKDEV-NOTE: JWT configuration for Autovision authentication system
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// CKDEV-QUESTION: Should access tokens be shorter (5m) for better security?
const JWT_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// CKDEV-NOTE: Token payload structure shared between frontend/backend for type safety
export interface TokenPayload {
  id: string;
  email: string;
  type: "admin" | "common"; // CKDEV-TODO: Add "manager" role for future hierarchy
  iat?: number;
  exp?: number;
}

// CKDEV-NOTE: Generates both access and refresh tokens for complete auth flow
export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    type: user.type,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  // CKDEV-TODO: Store refresh tokens in database with rotation for security
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
}

// CKDEV-NOTE: Token verification throws error if invalid/expired - handle in middleware
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// CKDEV-NOTE: Uses bcrypt with 10 salt rounds for secure password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // CKDEV-QUESTION: Should we increase to 12 for better security?
  return bcrypt.hash(password, saltRounds);
}

// CKDEV-NOTE: Constant-time comparison prevents timing attacks
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
