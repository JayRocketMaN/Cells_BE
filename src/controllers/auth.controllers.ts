import { Request, Response } from 'express';
import * as authService from '../services/auth.services.js';
import { UserRole } from '../types/database.js';
import { CookieOptions } from 'express';

// Centralized cookie settings for consistency
const cookieOptions: CookieOptions = {
  httpOnly: true,                                 // Shields the cookie from client-side JS (XSS defense)
  secure: process.env.NODE_ENV === 'production', // true over HTTPS in production, false in local dev
  sameSite: 'lax',                                // Basic CSRF protection mitigation
  maxAge: 24 * 60 * 60 * 1000,                    // 1-day life expectancy in milliseconds
  path: '/',                                      // Available routing scope across your domain
};

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
    
    // Destructure the generated token from your existing service layer execution
    const { token, ...userData } = await authService.loginUser(email, password);
    
    // Attach token via cookie header and return user metadata in the payload
    return res
      .status(200)
      .cookie('token', token, cookieOptions)
      .json({ 
        message: "Login successful",
        user: userData 
      });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
};


/**
 * Handles the login for management users (Shift Managers & Owners)
 */
export const handleManagementLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: "Email and password are required." 
            });
        }

        const result = await authService.loginManagementUser(email, password);

        // Attach token via cookie header and strip it from the plain text body payload
        return res
          .status(200)
          .cookie('token', result.token, cookieOptions)
          .json({
              message: "Login successful",
              isSuperAdmin: result.isSuperAdmin
          });

    } catch (err: any) {
        return res.status(401).json({ error: err.message });
    }
};

/**
 * NEW: Clears out active authentication credentials on user departure
 */
export const logout = async (req: Request, res: Response) => {
  // Strip the duration parameter out to configure the cleanup routine correctly
  const { maxAge, ...clearOptions } = cookieOptions;
  
  return res
    .clearCookie('token', clearOptions)
    .status(200)
    .json({ message: "Logged out successfully" });
};
