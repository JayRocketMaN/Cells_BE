// backend/src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.services.js';

/**
 * 1. Handles Clock-in/Clock-out (PIN actions)
 * Used by employees on the tablet/entry device.
 */
export const handleStaffAction = async (req: Request, res: Response) => {
    try {
        const { employeeId, pin, deviceName } = req.body;
        const result = await attendanceService.verifyAndProcessLog(employeeId, pin, deviceName);
        
        res.status(200).json({ message: "Action recorded successfully", result });
    } catch (err: any) {
        // Returns 401 for "Invalid PIN" or 500 for server errors
        const statusCode = err.message === "Invalid PIN" ? 401 : 500;
        res.status(statusCode).json({ error: err.message });
    }
};

/**
 * 2. Fetches all logs (Admin Table View)
 * Restricted by verifyAdmin middleware. Used for the general "All Logs" report.
 */
export const getAllLogs = async (req: Request, res: Response) => {
    try {
        // Audit Log: Identifies which admin is accessing the raw data
        const admin = (req as any).admin;
        console.log(`[AUDIT] Raw logs requested by Admin: ${admin.id}`);

        const logs = await attendanceService.getAttendanceLogs();
        res.status(200).json(logs);
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to retrieve logs" });
    }
};

/**
 * 3. Fetches Analytics (Summary Cards, Calendar, and Shifts)
 * Route: GET /api/attendance/history (mapped from getAttendanceDashboardData)
 */
export const getEmployeeHistory = async (req: Request, res: Response) => {
    try {
        // Extracted from Query Params: ?employeeId=...&startDate=...&endDate=...
        const { employeeId, startDate, endDate } = req.query;

        if (!employeeId || !startDate || !endDate) {
            return res.status(400).json({ error: "Missing required query parameters: employeeId, startDate, endDate" });
        }

        const report = await attendanceService.getAttendanceDashboardData(
            employeeId as string,
            startDate as string,
            endDate as string
        );

        res.status(200).json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to generate report" });
    }
};
