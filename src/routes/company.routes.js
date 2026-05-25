// routes/company.routes.ts
import { Router } from 'express';
import * as companyController from '../controllers/company.controllers.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', companyController.registerCompany);
router.get('/config', authMiddleware, companyController.getCompanyContext);


export default router;









