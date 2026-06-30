import { Router } from 'express';
import * as customerController from '../controllers/customer.controllers.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// 1. STATIC ROUTES (Specific paths first)
router.get('/dashboard', authMiddleware.authMiddleware, customerController.getDashboard);
router.get('/history', authMiddleware.authMiddleware, customerController.getAllTransactions); // MOVED UP HERE
router.get('/search', customerController.searchCustomer); // MOVED UP HERE
router.get('/status/:status', authMiddleware.authMiddleware, customerController.getByStatus);

// 2. POST ROUTES
router.post('/', customerController.createCustomer);
router.post('/transaction', customerController.postTransaction);

// 3. DYNAMIC ROUTES (Catch-all paths last)
router.get('/:id', authMiddleware.authMiddleware, customerController.getOneCustomer);

export default router;
