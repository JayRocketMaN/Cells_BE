import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;

  // Robust check: Prove it's a string, don't just "assert" it
  if (!secret) {
    console.error("JWT_SECRET is missing from .env");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Using the [1] index we discussed

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // We cast to 'any' here just during the verify step...
    const decoded = jwt.verify(token, secret) as any;
    
    // ...but because of your express.d.ts, 'req.user' is already typed!
    // This assignment is now safe and will have autocomplete.
    req.user = {
        id: decoded.id,
        companyId: decoded.companyId
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};


