import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    userId?: number;
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (
      err ||
      typeof decoded !== "object" ||
      decoded === null ||
      !("id" in decoded)
    ) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.userId = (decoded as { id: number }).id;
    next();
  });
}

export default authenticateToken;
