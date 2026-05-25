import supabase from '../config/supabase.js';

// settings.service.ts
export const updateCompanyThresholds = async (companyId: string, updates: object) => {
  const { data, error } = await supabase
    .from('tenant_settings')
    .update(updates)
    .eq('company_id', companyId)
    .select();

  if (error) throw error;
  return data;
};

export const getCompanySettings = async (companyId: string) => {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) throw error;
  return data;
};
