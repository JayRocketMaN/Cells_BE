import { Request, Response } from 'express';
import * as companyService from '../services/company.services.js';


export const registerCompany = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    // Call the service that creates BOTH the company and the default settings
    const newCompany = await companyService.registerNewCompany({ name });

    return res.status(201).json({
      message: "Company and default settings created successfully",
      data: newCompany
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCompanyContext = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch both profile and settings in parallel for speed
    const [profile, settings] = await Promise.all([
      companyService.getCompanyProfile(companyId),
      companyService.getCompanySettings(companyId)
    ]);

    return res.status(200).json({ profile, settings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


