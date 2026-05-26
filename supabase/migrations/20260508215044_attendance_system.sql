DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM ('Present', 'Absent', 'Late', 'Leave');
    CREATE TYPE attendance_method_type AS ENUM ('PIN', 'Fingerprint', 'Facial', 'Palm');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Table for secure PIN storage
CREATE TABLE IF NOT EXISTS public.employee_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    clocking_method attendance_method_type NOT NULL DEFAULT 'PIN',
    hashed_pin text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_employee_pin UNIQUE (employee_id)
);

-- 2. Table for Attendance Logs (matching your UI columns)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    log_date date DEFAULT CURRENT_DATE,
    clock_in timestamptz,
    break_start timestamptz,
    break_end timestamptz,
    clock_out timestamptz,
    clocking_method attendance_method_type NOT NULL DEFAULT 'PIN', 
    log_status attendance_status_type NOT NULL DEFAULT 'Present', 
    device_name text, -- e.g., 'Reception Tablet'
    CONSTRAINT unique_daily_log UNIQUE (employee_id, log_date),
    created_at timestamptz DEFAULT now()
);

--Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_credentials ENABLE ROW LEVEL SECURITY;

-- the "Service Role" Policy
CREATE POLICY "Service role full access" 
ON public.attendance_logs 
FOR ALL TO service_role 
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access" 
ON public.employee_credentials 
FOR ALL TO service_role 
USING (true)
WITH CHECK (true);
