import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.services.js';


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
  const decoded = jwt.verify(token, secret) as any;
  
  // Use a fallback to ensure companyId is NEVER undefined
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
 * Merged Admin Middleware:
 * 1. Verifies JWT Token
 * 2. Fetches full Admin object from DB
 * 3. Attaches 'admin' to the request for subsequent functions
 */
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET missing from environment");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // 1. Extract Bearer Token
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        // 2. Verify JWT
        const decoded = jwt.verify(token, secret) as any;

        // 3. Simple Check: Was this token issued to an Admin?
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: "Access denied: Management only" });
        }

        // 4. DB Check: Fetch full record to get 'is_super_admin' status
        // This avoids the "Invalid UUID" error by using the ID from the TOKEN
        const admin = await authService.checkManagementAccess(decoded.id);

        if (!admin) {
            return res.status(403).json({ error: "Access denied: Management account inactive" });
        }

        // 5. Attach full object to request for verifySuperAdmin to use
        (req as any).admin = admin;

        next();
    } catch (err: any) {
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

/**
 * Level 2: Super Admin Check
 * Use this AFTER verifyAdmin in your routes.
 */
export const verifySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // Uses the 'admin' object attached in the previous step
    const admin = (req as any).admin;

    if (!admin || !admin.is_super_admin) {
        return res.status(403).json({ 
            error: "Access denied: Company Owner (Super Admin) privileges required." 
        });
    }

    next(); 
};


