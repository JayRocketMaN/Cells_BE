import { Router } from 'express';
import * as customerController from '../controllers/customer.controllers.js';

const router = Router();


router.get('/dashboard', customerController.getDashboard);
router.get('/status/:status', customerController.getByStatus);
router.post('/transaction', customerController.postTransaction);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getOneCustomer);


export default router;
