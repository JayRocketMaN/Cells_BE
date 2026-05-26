-- DATABASE ENUMS
CREATE TYPE spending_level_type AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE loyalty_tier_type AS ENUM ('Tier 1', 'Tier 2', 'Tier 3');
CREATE TYPE customer_status_type AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other', 'Prefer Not to Say');
CREATE TYPE user_role_type AS ENUM ('admin', 'staff', 'customer'); 

-- COMPANIES TABLE
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, 
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- USERS TABLE
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL, 
    role user_role_type DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TENANT SETTINGS
CREATE TABLE public.tenant_settings (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE, 
    silver_threshold DECIMAL DEFAULT 100.00,
    gold_threshold  DECIMAL DEFAULT 500.00,
    plat_threshold  DECIMAL DEFAULT 2000.00,
    spend_level_med_min DECIMAL DEFAULT 50.00,
    spend_level_high_min DECIMAL DEFAULT 150.00,
    tier2_visit_min INTEGER DEFAULT 5,
    tier3_visit_min INTEGER DEFAULT 15
);

-- CUSTOMERS TABLE
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_serial BIGINT GENERATED ALWAYS AS IDENTITY,
    display_id VARCHAR(50) UNIQUE, 
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,  
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender gender_type,
    preferred_location VARCHAR(100),
    favorite_orders TEXT[],    
    notes TEXT,
    -- Financials
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    visits_count INTEGER DEFAULT 0,
    average_spend DECIMAL(12, 2) GENERATED ALWAYS AS (
        CASE WHEN visits_count > 0 THEN total_spent / visits_count ELSE 0 END
    ) STORED,
    -- Status
    spending_level spending_level_type DEFAULT 'Low',
    loyalty_tier loyalty_tier_type DEFAULT 'Tier 1',
    customer_status customer_status_type DEFAULT 'Bronze',
    feedback_score DECIMAL(3, 2) DEFAULT 0.00,
    -- Visit Dates
    first_visit DATE,
    last_visit DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- TRANSACTIONS TABLE
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL, -- Added to help the trigger find settings
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUNCTION FOR PRETTY ID
CREATE OR REPLACE FUNCTION public.generate_public_customer_id()
RETURNS TRIGGER AS $$
DECLARE
    random_num INTEGER;
BEGIN
    random_num := ((NEW.internal_serial * 137) + 1229) % 9000 + 1000;    
    NEW.display_id := 'CST-' || random_num::TEXT;    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION FOR SYNC FINANCIALS
CREATE OR REPLACE FUNCTION public.sync_customer_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(12, 2);
    v_visits INTEGER;
    v_avg DECIMAL(12, 2);
    -- Settings Variables
    v_s_thresh DECIMAL; v_g_thresh DECIMAL; v_p_thresh DECIMAL;
    v_t2_min INTEGER; v_t3_min INTEGER;
    v_sl_med DECIMAL; v_sl_high DECIMAL;
BEGIN
    -- Get Company Rules
    SELECT silver_threshold, gold_threshold, plat_threshold, tier2_visit_min, tier3_visit_min, spend_level_med_min, spend_level_high_min
    INTO v_s_thresh, v_g_thresh, v_p_thresh, v_t2_min, v_t3_min, v_sl_med, v_sl_high
    FROM public.tenant_settings WHERE company_id = NEW.company_id;

    -- Calculate Totals
    SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total, v_visits
    FROM public.transactions WHERE customer_id = NEW.customer_id;
    
    v_avg := CASE WHEN v_visits > 0 THEN v_total / v_visits ELSE 0 END;

    -- Update Customer
    UPDATE public.customers
    SET 
        total_spent = v_total,
        visits_count = v_visits,
        customer_status = CASE 
            WHEN v_total >= v_p_thresh THEN 'Platinum'::customer_status_type
            WHEN v_total >= v_g_thresh THEN 'Gold'::customer_status_type
            WHEN v_total >= v_s_thresh THEN 'Silver'::customer_status_type
            ELSE 'Bronze'::customer_status_type
        END,
        loyalty_tier = CASE 
            WHEN v_visits >= v_t3_min THEN 'Tier 3'::loyalty_tier_type
            WHEN v_visits >= v_t2_min THEN 'Tier 2'::loyalty_tier_type
            ELSE 'Tier 1'::loyalty_tier_type
        END,
        spending_level = CASE 
            WHEN v_avg >= v_sl_high THEN 'High'::spending_level_type
            WHEN v_avg >= v_sl_med  THEN 'Medium'::spending_level_type
            ELSE 'Low'::spending_level_type
        END
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE TRIGGER trigger_generate_customer_id
BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.generate_public_customer_id();

CREATE TRIGGER trigger_update_stats_on_purchase
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_financials();










