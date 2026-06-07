import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controllers.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// SEAMLESS: Customers submit feedback via QR code form
router.post('/', feedbackController.postFeedback);

// STRICT: Only managers can see the Figma dashboard stats/list
router.get('/stats', authMiddleware, feedbackController.getStats);
router.get('/list', authMiddleware, feedbackController.getReviewList);

export default router;
