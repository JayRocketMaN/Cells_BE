// backend/src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.services.js';
import { calculateNetHours } from '../utils/attendance.utils.js';
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
        const { employeeId, startDate, endDate } = req.query;

        if (!employeeId || !startDate || !endDate) {
            return res.status(400).json({ error: "Missing required query parameters: employeeId, startDate, endDate" });
        }

        // 1. Get raw dashboard data from service
        const report = await attendanceService.getAttendanceDashboardData(
            employeeId as string,
            startDate as string,
            endDate as string
        );

        // 2. Initialize counters for the Summary Cards
        let totalHours = 0;
        let totalOvertime = 0;
        let daysPresent = 0;
        let lateArrivals = 0;

        // 3. Process each shift to calculate hours and aggregate totals
        const enrichedShifts = report.shifts.map((s: any) => {
            const netHours = calculateNetHours(s.clock_in, s.clock_out, s.break_start, s.break_end);
            
            // Aggregate values for Summary
            totalHours += netHours;
            if (netHours > 8) totalOvertime += (netHours - 8);
            if (s.clock_in) daysPresent++;
            
            // Late Logic: Check if clock_in exists and is after 09:00 AM
            if (s.clock_in) {
                const checkInTime = new Date(s.clock_in).getHours();
                if (checkInTime >= 9) lateArrivals++;
            }

            return {
                ...s,
                hours: netHours > 0 ? parseFloat(netHours.toFixed(1)) : 0,
                overtime: netHours > 8 ? parseFloat((netHours - 8).toFixed(1)) : 0,
                shift: s.shift || "Standard"
            };
        });

        // 4. Create the Summary Array matching the UI label order:
        // ["total hours", "days present", "overtime hours", "late arrivals"]
        const summary = [
            { value: parseFloat(totalHours.toFixed(1)), sub: "This month" },
            { value: daysPresent, sub: "Completed shifts" },
            { value: parseFloat(totalOvertime.toFixed(1)), sub: "Extra hours" },
            { value: lateArrivals, sub: "After 9:00 AM" }
        ];

        // 5. Final Response
        res.status(200).json({
            ...report,
            shifts: enrichedShifts,
            summary: summary
        });

    } catch (err: any) {
        console.error("Report Generation Error:", err.message);
        res.status(500).json({ error: err.message || "Failed to generate report" });
    }
};
