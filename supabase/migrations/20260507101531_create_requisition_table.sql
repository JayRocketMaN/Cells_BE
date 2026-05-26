--Custom Types (Enums)
DO $$ BEGIN
    CREATE TYPE status_requisite AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--Base Dependency Tables (Organizations & Employees)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text UNIQUE,
    role text NOT NULL DEFAULT 'Staff' 
);

--Department Table
CREATE TABLE IF NOT EXISTS public.requisition_department (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT requisition_department_pkey PRIMARY KEY (id),
  CONSTRAINT requisition_department_name_key UNIQUE (name)
);

--Requisition Types (Linked to Department)
CREATE TABLE IF NOT EXISTS public.requisition_requisition_type (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid NOT NULL REFERENCES public.requisition_department(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT requisition_type_pkey PRIMARY KEY (id),
  CONSTRAINT requisition_type_name_key UNIQUE (name, department_id)
);

--Main Requisition Table
CREATE TABLE IF NOT EXISTS public.requisition_table (
  id uuid not null default gen_random_uuid (),
  org_id uuid REFERENCES public.organizations(id),
  created_at timestamp with time zone not null default now(),
  items text not null,
  order_level text not null,
  status public.status_requisite not null default 'pending'::status_requisite,
  department_id uuid REFERENCES public.requisition_department(id) ON DELETE SET NULL,
  requisition_type_id uuid REFERENCES public.requisition_requisition_type (id) ON DELETE SET NULL,
  current_stock text null,
  reorder_level text null,
  requested_qty integer not null,
  notes text null,
  content_note text null,
  requested_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  approval_date timestamp with time zone null,
  estimated_amount numeric(12, 2) null default 0,
  constraint requisition_table_pkey primary key (id)
);

--Individual Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_id uuid REFERENCES public.requisition_department(id) ON DELETE SET NULL,
    requisition_type_id uuid REFERENCES public.requisition_requisition_type(id) ON DELETE SET NULL,
    slug text,
    description TEXT,
    quantity INT,
    urgency VARCHAR(10) NOT NULL DEFAULT 'Medium',
    status status_requisite NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT requests_pkey PRIMARY KEY (id)
);