// backend/src/repositories/attendance.repository.ts
import supabase from '../config/supabase.js';
import { AttendanceLog } from '../types/database.js';

/**
 * Validates if the provided ID is a valid string and not "undefined".
 */
const validateId = (id: string) => {
    if (!id || id === 'undefined') throw new Error("Invalid UUID provided");
};

/**
 * 1. Fetches the hashed PIN and clocking method for an employee.
 */
export const fetchEmployeeCredentials = async (employeeId: string) => {
    validateId(employeeId);

    const { data, error } = await supabase
        .from('employee_credentials')
        .select('hashed_pin, clocking_method')
        .eq('employee_id', employeeId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Employee PIN not set up.");

    return data;
};

/**
 * 2. Fetches the most recent log for an employee for a specific date (today).
 */
export const fetchLatestLogToday = async (employeeId: string, today: string) => {
    validateId(employeeId);

    const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('log_date', today)
        .maybeSingle(); // Returns null instead of erroring if no row exists

    if (error) throw error;
    return data;
};

/**
 * 3. Records a new Clock-In entry.
 */
export const insertClockIn = async (employeeId: string, deviceName: string) => {
    validateId(employeeId);
    const now = new Date();
    
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert([{
            employee_id: employeeId,
            log_date: now.toISOString().split('T')[0], // Formats to YYYY-MM-DD
            clock_in: now.toISOString(),
            device_name: deviceName,
            log_status: 'Present',
            clocking_method: 'PIN'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 4. Updates an existing log for Break Start.
 */
export const updateBreakStart = async (logId: string) => {
    validateId(logId);
    const { data, error } = await supabase
        .from('attendance_logs')
        .update({ break_start: new Date().toISOString() })
        .eq('id', logId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

/**
 * 5. Updates an existing log for Break End.
 */
export const updateBreakEnd = async (logId: string) => {
    validateId(logId);
    const { data, error } = await supabase
        .from('attendance_logs')
        .update({ break_end: new Date().toISOString() })
        .eq('id', logId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 6. Updates an existing log for Clock-Out.
 */
export const updateClockOut = async (logId: string) => {
    validateId(logId);
    const { data, error } = await supabase
        .from('attendance_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', logId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 7. Fetches logs within a specific date range.
 */
export const fetchLogsByDateRange = async (employeeId: string, start: string, end: string): Promise<AttendanceLog[]> => {
    validateId(employeeId);
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * 8. Fetches all logs with joined employee details for the dashboard.
 */
export const fetchAllLogs = async () => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select(`*, employees(full_name, role)`)
        .order('log_date', { ascending: false });
    
    if (error) throw error;
    return data;
};



// ADDED VALIDATION HERE - Used by Middleware
export const findManagementUserById = async (adminId: string) => {
    if (!adminId || adminId === 'undefined') return null; // Return null instead of crashing
    const { data, error } = await supabase
    .from('management_users')
    .select('id, is_super_admin')
    .eq('id', adminId).maybeSingle();
    if (error) throw error;
    return data;
};