-- 1. Create Chef Mario FIRST (This is the "Parent")
INSERT INTO public.employees (id, full_name, email, role)
VALUES ('a38d4803-bed6-4f43-8c83-d94828c9b39e', 'Chef Mario', 'mario@kitchen.com', 'Executive Chef')
ON CONFLICT (id) DO NOTHING;

-- 2. Add his PIN IMMEDIATELY (This is the "Child")
INSERT INTO public.employee_credentials (employee_id, hashed_pin)
VALUES ('a38d4803-bed6-4f43-8c83-d94828c9b39e', '$2a$12$R9h/cIPz0gi.URQHe86EOTz.v.fB8m/88B8m/88B8m/88B8m/88B8')
ON CONFLICT (employee_id) DO NOTHING;

-- 3. Add his Initial Log
INSERT INTO public.attendance_logs (employee_id, log_date, clock_in, log_status)
VALUES ('a38d4803-bed6-4f43-8c83-d94828c9b39e', CURRENT_DATE, now() - interval '3 hours', 'Present')
ON CONFLICT (employee_id, log_date) DO NOTHING;


-- 1. Create a Test Company
INSERT INTO public.companies (id, name, slug)
VALUES 
    ('792c8900-abc3-4321-8888-446655440000', 'The Blue Lounge', 'blue-lounge');

-- 2. Create Custom Settings for this Company
-- We will set low thresholds so we can easily see the "Level Ups"
INSERT INTO public.tenant_settings (
    company_id, 
    silver_threshold, 
    gold_threshold, 
    plat_threshold, 
    tier2_visit_min, 
    tier3_visit_min,
    spend_level_med_min,
    spend_level_high_min
)
VALUES (
    '792c8900-abc3-4321-8888-446655440000', 
    100.00,  -- Becomes Silver at $100
    500.00,  -- Becomes Gold at $500
    1000.00, -- Becomes Platinum at $1000
    2,       -- Tier 2 at 2 visits
    5,       -- Tier 3 at 5 visits
    50.00,   -- Medium spender at $50 avg
    150.00   -- High spender at $150 avg
);

-- 3. Create a Test Customer
-- Note: We don't provide 'display_id', 'total_spent', or 'status' 
-- because our triggers will calculate those!
INSERT INTO public.customers (id, company_id, full_name, email)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    '792c8900-abc3-4321-8888-446655440000', 
    'Teejay Dev', 
    'teejay@example.com'
);

-- 4. Add Transactions to Trigger the Logic
-- Transaction 1: $60 (Should make them Medium Spender + Tier 1 + Bronze)
INSERT INTO public.transactions (customer_id, company_id, amount)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '792c8900-abc3-4321-8888-446655440000', 60.00);

-- Transaction 2: $200 (Total $260: Should make them Silver + Tier 2 + High Spender)
INSERT INTO public.transactions (customer_id, company_id, amount)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '792c8900-abc3-4321-8888-446655440000', 200.00);






-- 1. Seed Organizations
INSERT INTO public.organizations (name) VALUES ('Cells Hospitality Main');

-- -- 2. Seed Employees
-- INSERT INTO public.employees (id, full_name, email) VALUES 
-- ('a38d4803-bed6-4f43-8c83-d94828c9b39e', 'Chef Mario', 'mario@kitchen.com'),
-- (gen_random_uuid(), 'Alfred Admin', 'alfred@cells.com');

-- 3. Seed Departments
INSERT INTO public.requisition_department (name) VALUES
('Inventory'), ('Kitchen'), ('Maintenance');

-- 4. Seed Requisition Types
INSERT INTO public.requisition_requisition_type (name, department_id)
SELECT 'Food Supplies', id FROM public.requisition_department WHERE name='Kitchen';

INSERT INTO public.requisition_requisition_type (name, department_id)
SELECT 'Equipment Repair', id FROM public.requisition_department WHERE name='Maintenance';

-- 5. Seed a Sample Requisition
INSERT INTO public.requisition_table (
    org_id, 
    items, 
    order_level, 
    status, 
    department_id, 
    requisition_type_id, 
    requested_qty, 
    requested_by,
    estimated_amount
) 
VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'Chicken, Spices, Oil',
    'Emergency',
    'pending',
    (SELECT id FROM requisition_department WHERE name='Kitchen'),
    (SELECT id FROM requisition_requisition_type WHERE name='Food Supplies'),
    15,
    'a38d4803-bed6-4f43-8c83-d94828c9b39e',
    250.00
);

-- -- 6. Seed Attendance Credentials
-- INSERT INTO public.employee_credentials (employee_id, hashed_pin)
-- VALUES ('a38d4803-bed6-4f43-8c83-d94828c9b39e', '$2a$10$AF9p06NOCiN8onPNo6mOfO9Y.6f0S96n8YfO9.n8YfO9.n8YfO9.n');

-- -- 7. Seed Sample Attendance Logs
-- INSERT INTO public.attendance_logs (
--     employee_id, 
--     log_date, 
--     clock_in, 
--     log_status, 
--     clocking_method, 
--     device_name
-- ) 
-- VALUES (
--     'a38d4803-bed6-4f43-8c83-d94828c9b39e',
--     CURRENT_DATE,
--     now() - interval '3 hours',
--     'Present',
--     'PIN',
--     'Kitchen Tablet'
-- );
-- 8. Seed Individual Requests
INSERT INTO public.requests (
    org_id, 
    department_id, 
    requisition_type_id, 
    slug, 
    description, 
    quantity, 
    urgency, 
    status
) 
VALUES (
    (SELECT id FROM organizations WHERE name='Cells Hospitality Main' LIMIT 1),
    (SELECT id FROM requisition_department WHERE name='Kitchen' LIMIT 1),
    (SELECT id FROM requisition_requisition_type WHERE name='Food Supplies' LIMIT 1),
    'REQ-2024-001',
    'Emergency restock of vegetable oil and spices for weekend event.',
    10,
    'High',
    'pending'
),
(
    (SELECT id FROM organizations WHERE name='Cells Hospitality Main' LIMIT 1),
    (SELECT id FROM requisition_department WHERE name='Maintenance' LIMIT 1),
    (SELECT id FROM requisition_requisition_type WHERE name='Equipment Repair' LIMIT 1),
    'REQ-2024-002',
    'Dishwasher repair service for main kitchen unit.',
    1,
    'Medium',
    'approved'
);







