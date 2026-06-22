import { Router } from 'express';
import * as authController from '../controllers/auth.controllers.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/adminLogin', authController.handleManagementLogin);

// Clear the cookie session upon client invocation
router.post('/logout', authController.logout);

export default router;
