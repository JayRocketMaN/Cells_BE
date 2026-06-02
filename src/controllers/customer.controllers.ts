/**import type { Request, Response } from 'express';
import * as customerService from '../services/customer.services.js';
import { CustomerStatus } from '../types/database.js';



export const getDashboard = async (req: Request, res: Response) => {
  try {
    // 1. SECURITY: Trust only the ID from the verified token/session
    const companyId = req.user?.companyId; 

    // 2. VALIDATION: Ensure the ID exists (Guard Clause)
    if (!companyId) {
      return res.status(401).json({ error: "Unauthorized: No company linked to user" });
    }

    // 3. DELEGATION: Call service with the trusted ID
    const customers = await customerService.getCustomers(companyId);
    
    return res.status(200).json(customers);
  } catch (error: any) {
    // 4. ERROR HANDLING: Return specific message for debugging or generic for production
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

/**
 * GET BY STATUS
 * Logic: Extracts the status from the URL and validates it against our Enum.
 */
/**export const getByStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { status } = req.params;

    if (!companyId) return res.status(401).json({ error: "Unauthorized" });
    

    // Validate if the status string matches our allowed ICustomer Statuses
    const validStatuses: CustomerStatus[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (!validStatuses.includes(status as CustomerStatus)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const customers = await customerService.getByStatus(companyId, status as CustomerStatus);
    res.status(200).json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ADD TRANSACTION
 * Logic: Demonstrates how the DB trigger will handle the status updates automatically.
 */
/**export const postTransaction = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { customerId, amount } = req.body;

    if (!companyId) return res.status(401).json({ error: "Unauthorized" });
    if (!customerId || !amount) return res.status(400).json({ error: "Missing required fields" });

    const transaction = await customerService.addTransaction(companyId, customerId, amount);
    
    res.status(201).json({
      message: "Transaction recorded. Customer stats updated via trigger.",
      data: transaction
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: "Unauthorized" });

    // Pass the body to the service
    const customer = await customerService.createCustomer(companyId, req.body);
    
    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getOneCustomer = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;

    if (!companyId) return res.status(401).json({ error: "Unauthorized" });

    const customer = await customerService.getCustomerById(companyId, id as string);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};**/

import type { Request, Response } from 'express';
import * as customerService from '../services/customer.services.js';
import { CustomerStatus } from '../types/database.js';

/**
 * STRICT: Dashboard requires a verified session/token.
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId; 
    if (!companyId) return res.status(401).json({ error: "Unauthorized: Dashboard access requires login" });

    const customers = await customerService.getCustomers(companyId);
    return res.status(200).json(customers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * SEAMLESS: POS Registration allows Company ID in body.
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const companyId = req.body.company_id || req.user?.companyId;
    if (!companyId) return res.status(400).json({ error: "Missing company_id" });

    const { company_id, ...customerData } = req.body;
    const customer = await customerService.createCustomer(companyId, customerData);
    
    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * SEARCH: Find customer by Display ID (e.g., CST-1229)
 * Used by POS and Reservations for quick lookups.
 */
export const searchCustomer = async (req: Request, res: Response) => {
  try {
    // Check query params first for GET requests
    const companyId = (req.query.company_id as string) || req.user?.companyId;
    const displayId = req.query.displayId as string;

    if (!companyId) return res.status(400).json({ error: "Missing company_id" });
    if (!displayId) return res.status(400).json({ error: "Missing displayId parameter" });

    const customer = await customerService.getCustomerByDisplayId(companyId, displayId);
    
    if (!customer) return res.status(404).json({ error: `Customer ${displayId} not found` });

    return res.status(200).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * STRICT: Adding a transaction.
 */
export const postTransaction = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId || req.body.company_id;
    const { customerId, amount } = req.body;

    if (!companyId) return res.status(401).json({ error: "Unauthorized" });
    if (!customerId || !amount) return res.status(400).json({ error: "Missing required fields" });

    const transaction = await customerService.addTransaction(companyId, customerId, amount);
    res.status(201).json({ message: "Transaction recorded", data: transaction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * STRICT: Viewing a single customer profile by UUID.
 */
export const getOneCustomer = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId; 
    if (!companyId) return res.status(401).json({ error: "Unauthorized" });

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: "Missing or invalid customer id" });

    const customer = await customerService.getCustomerById(companyId, id);
    
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    return res.status(200).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET BY STATUS: Filter dashboard (Bronze, Gold, etc).
 */
export const getByStatus = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { status } = req.params;

    if (!companyId) return res.status(401).json({ error: "Unauthorized" });

    const validStatuses: CustomerStatus[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (!validStatuses.includes(status as CustomerStatus)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const customers = await customerService.getByStatus(companyId, status as CustomerStatus);
    res.status(200).json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
