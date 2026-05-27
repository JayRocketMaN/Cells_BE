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


export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extract the Token from the Authorization Header (Bearer <token>)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        // 2. Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        // 3. Ensure the token belongs to an Admin
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: "Access denied: Management only" });
        }

        // 4. (Optional but recommended) Double-check the DB to ensure the admin wasn't deleted
        // This uses the 'id' stored inside the token
        const admin = await authService.checkManagementAccess(decoded.id);

        if (!admin) {
            return res.status(403).json({ error: "Access denied: Management account no longer active" });
        }

        // 5. Attach the full admin data to the request object
        (req as any).admin = admin;

        next();
    } catch (err: any) {
        // Handle expired or invalid tokens
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};


// backend/src/middleware/auth.middleware.ts

/**
 * LEVEL 2: Strict Super Admin Access (Owners Only)
 * Note: This should be used AFTER verifyAdmin in your routes.
 */
export const verifySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get the admin object that was already attached by verifyAdmin
    const admin = (req as any).admin;

    // 2. Safety check: Ensure they are actually a Super Admin
    if (!admin || !admin.is_super_admin) {
        return res.status(403).json({ 
            error: "Access denied: This action requires Company Owner (Super Admin) privileges." 
        });
    }

    // 3. Success!
    next();
};

