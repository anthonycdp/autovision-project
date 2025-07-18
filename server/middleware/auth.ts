import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../auth";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(" ")[1];

  // CKDEV-NOTE: Fallback to query parameter for cases where headers can't be set (react-pdf, window.open)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.user.type !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar este recurso" });
  }

  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!roles.includes(req.user.type)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    next();
  };
}
