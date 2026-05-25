// backend/src/repositories/attendance.repository.ts
import supabase from '../config/supabase.js';
import { AttendanceLog } from '../types/database.js';

/**
 * Fetches all attendance logs for a specific employee within a date range.
 * This is the ONLY file that should contain Supabase .from() calls for logs.
 */
export const fetchLogsByDateRange = async (
    employeeId: string, 
    start: string, 
    end: string
): Promise<AttendanceLog[]> => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date', { ascending: true });

    if (error) {
        console.error("Database Fetch Error:", error.message);
        throw new Error("Could not retrieve attendance logs.");
    }

    return data || [];
};

/**
 * Fetches the most recent log for an employee today.
 * Used by the Service to decide if the next action is Clock-In, Break, or Clock-Out.
 */
export const fetchLatestLogToday = async (employeeId: string, today: string) => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('log_date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is Supabase code for "no rows found"
        throw error;
    }

    return data;
};

/**
 * Fetches the hashed PIN and clocking method for a specific employee.
 */
export const fetchEmployeeCredentials = async (employeeId: string) => {
    const { data, error } = await supabase
        .from('employee_credentials')
        .select('hashed_pin, clocking_method')
        .eq('employee_id', employeeId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') throw new Error("Employee PIN not set up.");
        throw error;
    }

    return data;
};

export const insertClockIn = async (employeeId: string, deviceName: string) => {
    return await supabase.from('attendance_logs').insert([{
        employee_id: employeeId,
        clock_in: new Date().toISOString(),
        device_name: deviceName,
        log_status: 'Present'
    }]);
};

export const updateBreakStart = async (logId: string) => {
    return await supabase.from('attendance_logs')
        .update({ break_start: new Date().toISOString() })
        .eq('id', logId);
};

export const updateBreakEnd = async (logId: string) => {
    return await supabase.from('attendance_logs')
        .update({ break_end: new Date().toISOString() })
        .eq('id', logId);
};

export const updateClockOut = async (logId: string) => {
    return await supabase.from('attendance_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', logId);
};

export const fetchAllLogs = async () => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select(`*, employees(full_name, role)`)
        .order('log_date', { ascending: false });
    if (error) throw error;
    return data;
};
