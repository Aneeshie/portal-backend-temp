import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Role } from "./types";

// Separate secrets for employers and candidates
const SECRETS: Record<Role, string> = {
  employer: process.env.EMPLOYER_JWT_SECRET ?? "employer-secret",
  candidate: process.env.CANDIDATE_JWT_SECRET ?? "candidate-secret",
};

export const sign = (id: string, role: Role) => jwt.sign({ id, role }, SECRETS[role], { expiresIn: "7d" });

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (role: Role) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });
  try {
    const payload = jwt.verify(token, SECRETS[role]) as { id: string; role: Role };
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ ok: false, error: `Invalid ${role} token` });
  }
};
