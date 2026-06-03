/**import supabase from '../config/supabase.js';
import { 
  ICustomer, 
  CreateCustomerInput, 
  CustomerStatus,
  ITransaction, 
  CreateTransactionInput
} from '../types/database.js'

export const getCustomers = async (companyId: string): Promise<ICustomer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('total_spent', { ascending: false });

  if (error) throw new Error(`Fetch Error: ${error.message}`);
  return data as ICustomer[];
};

/**
 * CREATE CUSTOMER
 * Uses 'CreateCustomerInput' to ensure we only send data the DB expects.
 * Triggers: 'trigger_generate_customer_id' runs automatically in Postgres.
 */
/**export const createCustomer = async (
  companyId: string, 
  customerData: CreateCustomerInput
): Promise<ICustomer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...customerData, 
      company_id: companyId // Enforce multi-tenancy
    }])
    .select()
    .single();

  if (error) throw new Error(`Insert Error: ${error.message}`);
  return data as ICustomer;
};

export const addTransaction = async (
  companyId: string, 
  customerId: string, 
  amount: number
): Promise<ITransaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      company_id: companyId,
      customer_id: customerId,
      amount: amount
    }])
    .select()
    .single();

  if (error) throw new Error(`Transaction Error: ${error.message}`);
  
  // Note: Even though we return the transaction, the 'customers' table 
  // has already been updated by your Postgres trigger.
  return data;
};

/**
 * SEGMENTED SEARCH
 * Get customers by their status (Bronze, Silver, Gold, Platinum)
 */
/**export const getByStatus = async (
  companyId: string, 
  status: CustomerStatus
): Promise<ICustomer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('customer_status', status);

  if (error) throw error;
  return data as ICustomer[];
};


export const getCustomerById = async (companyId: string, customerId: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId) // Security: Must belong to your company
    .eq('id', customerId)        // The specific customer UUID
    .single();

  if (error) throw error;
  return data;
};**/

import supabase from '../config/supabase.js';
import { 
  ICustomer, 
  CreateCustomerInput, 
  CustomerStatus,
  ITransaction
} from '../types/database.js'

/**
 * GET ALL CUSTOMERS
 * STRICT: Enforces companyId check before hitting Supabase.
 */
export const getCustomers = async (companyId: string): Promise<ICustomer[]> => {
  if (!companyId) throw new Error("Security Error: companyId is required for Dashboard access");

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('total_spent', { ascending: false });

  if (error) throw new Error(`Fetch Error: ${error.message}`);
  return data as ICustomer[];
};

/**
 * CREATE CUSTOMER (POS & RESERVATION OPTIMISED)
 * SEAMLESS: Allows partial data (like just name/phone) for quick entry.
 */
export const createCustomer = async (
  companyId: string, 
  customerData: Partial<CreateCustomerInput>
): Promise<ICustomer> => {
  if (!companyId) throw new Error("Security Error: companyId is required for registration");

  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...customerData, 
      company_id: companyId 
    }])
    .select()
    .single();

  if (error) {
    console.error(`Supabase Insert Error for Company ${companyId}:`, error.message);
    throw new Error(`Insert Error: ${error.message}`);
  }
  return data as ICustomer;
};

/**
 * ADD TRANSACTION
 * Records sales from POS.
 */
export const addTransaction = async (
  companyId: string, 
  customerId: string, 
  amount: number,
  paymentMethod: string = 'Cash', 
  status: string = 'Successful'
): Promise<ITransaction> => {
  if (!companyId) throw new Error("Security Error: companyId is required");

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      company_id: companyId,
      customer_id: customerId,
      amount: amount,
      payment_method: paymentMethod, // Will fail if not in Enum
      status: status                 // Will fail if not in Enum
    }])
    .select()
    .single();

  if (error) throw new Error(`Transaction Error: ${error.message}`);
  return data;
};

/**
 * GET TRANSACTIONS
 * Logic: Fetches all transactions for a company and "joins" the customer table 
 * to get the name and CST-ID for the dashboard table.
 */
export const getTransactions = async (companyId: string) => {
  if (!companyId) throw new Error("Security Error: companyId is required");

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      payment_method,
      status,
      created_at,
      customers (
        full_name,
        display_id
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Fetch Error:", error.message);
    throw new Error(`Fetch Error: ${error.message}`);
  }

  return data;
};



/**
 * SEGMENTED SEARCH
 */
export const getByStatus = async (
  companyId: string, 
  status: CustomerStatus
): Promise<ICustomer[]> => {
  if (!companyId) throw new Error("Security Error: companyId is required");

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('customer_status', status);

  if (error) throw error;
  return data as ICustomer[];
};

export const getCustomerById = async (companyId: string, customerId: string): Promise<ICustomer | null> => {
  if (!companyId) throw new Error("Security Error: companyId is required");

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', customerId)
    .single();

  if (error) return null;
  return data as ICustomer | null;
};

/**
 * GET ONE CUSTOMER
 * STRICT: Used for profile viewing.
 */

export const getCustomerByDisplayId = async (companyId: string, displayId: string) => {
  if (!companyId) throw new Error("companyId required");

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .eq('display_id', displayId.toUpperCase()) // Ensure it matches 'CST-XXXX'
    .single();

  if (error) return null; // Return null so the UI can show "Not Found"
  return data;
};

