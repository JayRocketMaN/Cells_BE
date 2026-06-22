import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.services.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is missing from .env");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Read token from cookies instead of authorization header
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    const companyId = decoded.companyId || decoded.company_id;

    if (!companyId) {
      console.error("Token verified, but no companyId found in payload");
      return res.status(401).json({ error: "Invalid token payload: companyId missing" });
    }

    req.user = {
        id: decoded.id,
        companyId: companyId
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

/**
 * Merged Admin Middleware
 */
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET missing from environment");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // Read token from cookies instead of authorization header
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, secret) as any;

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: "Access denied: Management only" });
        }

        const admin = await (authService as any).checkManagementAccess(decoded.id);

        if (!admin) {
            return res.status(403).json({ error: "Access denied: Management account inactive" });
        }

        (req as any).admin = admin;
        next();
    } catch (err: any) {
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

/**
 *Super Admin Check
 */
export const verifySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;

    if (!admin || !admin.is_super_admin) {
        return res.status(403).json({ 
            error: "Access denied: Company Owner (Super Admin) privileges required." 
        });
    }

    next(); 
};
