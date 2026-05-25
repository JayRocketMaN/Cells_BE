import express from 'express';
import * as attendanceController from '../controllers/attendance.controllers.js';
import { authMiddleware } from '../middleware/auth.middleware.js';


const router = express.Router();

// Route for the Dashboard (Hours Worked page)
router.get('/report', authMiddleware, attendanceController.getAttendanceReport);

// Route for the "Clock In/Out" actions (PIN pads)
router.post('/action', attendanceController.handleStaffAction);

// Route for Admin to see all logs
router.get('/all', authMiddleware, attendanceController.getAllLogs);

export default router;
