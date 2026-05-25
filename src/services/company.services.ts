import supabase from '../config/supabase.js';
import { ICompany, ITenantSettings } from '../types/database.js';

export const registerNewCompany = async (companyData: Partial<ICompany>) => {
  // 1. Create the Company Profile
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert([{ 
      name: companyData.name, 
      slug: companyData.name?.toLowerCase().replace(/ /g, '-'), // Basic slug creator
      is_active: true 
    }])
    .select()
    .single();

  if (companyError) throw companyError;

  // 2. Initialize Default Tenant Settings
  // Using your SQL schema's default values
  const { error: settingsError } = await supabase
    .from('tenant_settings')
    .insert([{
      company_id: newCompany.id,
      silver_threshold: 100.00,
      gold_threshold: 500.00,
      plat_threshold: 2000.00
    }]);

  if (settingsError) {
    // If settings fail, you might want to delete the company to stay clean
    await supabase.from('companies').delete().eq('id', newCompany.id);
    throw settingsError;
  }

  return newCompany;
};


export const getCompanyProfile = async (companyId: string): Promise<ICompany> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) throw new Error(error.message);
  return data as ICompany;
};

/**
 * Get tenant-specific business rules (Thresholds, Visit Minima)
 */
export const getCompanySettings = async (companyId: string): Promise<ITenantSettings> => {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) throw new Error(error.message);
  return data as ITenantSettings;
};
