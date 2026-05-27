import bcrypt from 'bcrypt';
import { AttendanceLog } from '../types/database.js';
import { calculateNetHours } from '../utils/attendance.utils.js';
import * as attendanceRepo from '../repos/attendance.repos.js';

// 1. PIN Verification & Clocking Logic
export const verifyAndProcessLog = async (employeeId: string, rawPin: string, deviceName: string) => {
    // Moved to repo to fix circular dependency
    const cred = await attendanceRepo.fetchEmployeeCredentials(employeeId);
    
    if (!cred) throw new Error("Credentials not found");
    
    console.log('DEBUG: Comparing request PIN:', `'${rawPin}'`, 'against DB Hash:', `'${cred.hashed_pin}'`);
    const isMatch = await bcrypt.compare(String(rawPin), cred.hashed_pin.trim());
    console.log('DB HASH:', cred.hashed_pin);
    if (!isMatch) throw new Error("Invalid PIN");

    const now = new Date().toISOString();
    const today = now.split('T')[0] || '';
    // Uses repo instead of direct supabase call
    const existingLog = await attendanceRepo.fetchLatestLogToday(employeeId, today);

    if (!existingLog) {
        return await attendanceRepo.insertClockIn(employeeId, deviceName);
    } else if (existingLog.clock_in && !existingLog.break_start) {
        return await attendanceRepo.updateBreakStart(existingLog.id);
    } else if (existingLog.break_start && !existingLog.break_end) {
        return await attendanceRepo.updateBreakEnd(existingLog.id);
    } else if (existingLog.break_end && !existingLog.clock_out) {
        return await attendanceRepo.updateClockOut(existingLog.id);
    } else {
        throw new Error("Shift already completed for today.");
    }
};

// 2. NEW: The missing function that was causing the red line!
export const getAttendanceLogs = async () => {
    // This calls your repository to get the list of all logs
    return await attendanceRepo.fetchAllLogs();
};

// 3. Formatting Math Logic (Summary Cards)
export const processMonthlySummary = (logs: AttendanceLog[]) => {
    let totalHours = 0;
    let daysPresent = 0;
    let lateArrivals = 0;
    let overtimeHours = 0;
    const standardShiftHours = 8;

    logs.forEach(log => {
        if (log.log_status !== 'Absent') daysPresent++;
        if (log.log_status === 'Late') lateArrivals++;

        if (log.clock_in && log.clock_out) {
            const dailyHours = calculateNetHours(log.clock_in, log.clock_out, log.break_start || undefined, log.break_end || undefined);
            totalHours += dailyHours;
            if (dailyHours > standardShiftHours) overtimeHours += (dailyHours - standardShiftHours);
        }
    });

    return {
        summary: [
            totalHours.toFixed(1),
            daysPresent.toString(),
            overtimeHours.toFixed(1),
            lateArrivals.toString()
        ]
    };
};

// 4. The Main Dashboard Orchestrator
export const getAttendanceDashboardData = async (employeeId: string, startDate: string, endDate: string) => {
    const logs = await attendanceRepo.fetchLogsByDateRange(employeeId, startDate, endDate);
    const { summary } = processMonthlySummary(logs);

    return {
        summary,
        calendar: logs.map(l => ({ date: l.log_date, status: l.log_status })),
        shifts: logs
    };
};
