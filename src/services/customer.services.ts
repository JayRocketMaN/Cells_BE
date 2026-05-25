import supabase from '../config/supabase.js';
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
export const createCustomer = async (
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
export const getByStatus = async (
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
};
