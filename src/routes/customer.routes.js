import { Router } from 'express';
import * as customerController from '../controllers/customer.controllers.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();

// This tells the router: "Every route defined below this line MUST pass through authMiddleware"
router.use(authMiddleware);

router.get('/dashboard', customerController.getDashboard);
router.get('/status/:status', customerController.getByStatus);
router.post('/transaction', customerController.postTransaction);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getOneCustomer);


export default router;
