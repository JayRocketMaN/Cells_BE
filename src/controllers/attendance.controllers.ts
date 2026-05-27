// controllers/attendance.controller.ts
import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.services.js';


// 1. Handles Clock-in/Clock-out (PIN actions)
export const handleStaffAction = async (req: Request, res: Response) => {
    try {
        const { employeeId, pin, deviceName } = req.body;
        const result = await attendanceService.verifyAndProcessLog(employeeId, pin, deviceName);
        res.status(200).json({ message: "Action recorded successfully", result });
    } catch (err: any) {
        res.status(401).json({ error: err.message });
    }
};

// 2. Fetches all logs (Admin view)
/*export const getAllLogs = async (req: Request, res: Response) => {
    try {
        // The service does the heavy lifting of fetching data
        const logs = await attendanceService.getAttendanceLogs();
        
        // Return a clean 200 status with the logs
        res.status(200).json(logs);
    } catch (err: any) {
        // Map any service-level errors to a 500 status
        res.status(500).json({ error: err.message || "Failed to retrieve logs" });
    }
};*/
/**
 * Admin view to fetch all logs.
 * Restricted by verifyAdmin middleware.
 */
export const getAllLogs = async (req: Request, res: Response) => {
    try {
        // 1. Audit Log: Use the data attached by the middleware
        const admin = (req as any).admin;
        console.log(`[AUDIT] Logs requested by Admin: ${admin.email} (ID: ${admin.id})`);

        // 2. Business Logic: Fetch the data
        const logs = await attendanceService.getAttendanceLogs();
        
        // 3. Response
        res.status(200).json(logs);
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to retrieve logs" });
    }
};

// 3. Fetches the Summary, Calendar, and Shifts for the UI cards
export const getAttendanceReport = async (req: Request, res: Response) => {
    try {
        // These come from the URL params: /api/attendance/report?employeeId=...
        const { employeeId, startDate, endDate } = req.query;

        const report = await attendanceService.getAttendanceDashboardData(
            employeeId as string,
            startDate as string,
            endDate as string
        );

        res.status(200).json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
