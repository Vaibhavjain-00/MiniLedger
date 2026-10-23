import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/httpError";
export interface AuthPayload { userId: string; phone: string }
declare global { namespace Express { interface Request { auth?: AuthPayload } } }
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
 const header = req.header("authorization");
 if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Missing Bearer token"));
 const secret = process.env.JWT_SECRET; if (!secret) return next(new HttpError(500, "JWT_SECRET is not configured"));
 try { const payload = jwt.verify(header.slice(7), secret) as AuthPayload; if (!payload.userId || !payload.phone) throw new Error("Invalid token"); req.auth = payload; next(); } catch { next(new HttpError(401, "Invalid or expired token")); }
}
