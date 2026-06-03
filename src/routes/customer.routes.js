import { Router } from 'express';
import * as customerController from '../controllers/customer.controllers.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Dashboard & Stats (STRICT - Requires Token)
router.get('/dashboard', authMiddleware.authMiddleware, customerController.getDashboard);
router.get('/status/:status', authMiddleware.authMiddleware, customerController.getByStatus);

// Seamless Registration (SEAMLESS - POS/Reservation)
router.post('/', customerController.createCustomer);

// Search & Transactions (SEAMLESS/STRICT)
router.post('/transaction', customerController.postTransaction);

/** 
 * SEARCH BY DISPLAY ID
 * Logic: Must come BEFORE /:id so it doesn't get captured as a parameter.
 * Usage: GET /api/customers/search?displayId=CST-1229
 */
router.get('/search', customerController.searchCustomer);

// GET ONE BY UUID (STRICT)
router.get('/:id', authMiddleware.authMiddleware, customerController.getOneCustomer);

export default router;
