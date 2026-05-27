import { Request, Response } from 'express';
import * as authService from '../services/auth.services.js';
import { UserRole } from '../types/database.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, company_id, role } = req.body;

    const sanitizedRole = role ? role.toLowerCase() : 'staff';

    // Validation
    const allowedRoles: UserRole[] = ['admin', 'staff', 'customer'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role provided" });
    }

    // Call Service
     const newUser = await authService.registerUser({ 
      email, 
      password, 
      full_name, 
      company_id, 
      role: sanitizedRole 
    });
    
    return res.status(201).json(newUser);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};


/**
 * Handles the login for management users (Shift Managers & Owners)
 */
export const handleManagementLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: "Email and password are required." 
            });
        }

        // 2. Call the Management-specific login service
        // This service uses the 'management_users' table and your plain-text check
        const result = await authService.loginManagementUser(email, password);

        // 3. Success Response
        // Sends back the JWT token and the Super Admin status
        res.status(200).json({
            message: "Login successful",
            token: result.token,
            isSuperAdmin: result.isSuperAdmin
        });

    } catch (err: any) {
        // Handle "Invalid email or password" or "Account not found"
        res.status(401).json({ error: err.message });
    }
};
