import supabase from '../config/supabase.js';

export const submitFeedback = async (companyId: string, feedbackData: any) => {
  const { data, error } = await supabase
    .from('customer_feedback')
    .insert([{ ...feedbackData, company_id: companyId }])
    .select(`*, customers(full_name, display_id)`)
    .single();

  if (error) throw error;
  return data;
};

export const getFeedbackStats = async (companyId: string) => {
  const { data, error } = await supabase
    .from('customer_feedback')
    .select('rating')
    .eq('company_id', companyId);

  if (error) throw error;

  const total = data.length;
  const avg = total > 0 ? (data.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : "0.0";

  return {
    averageRating: avg,
    totalReviews: total,
    // These counts fill your 5-star, 4-star cards in Figma
    stars: {
      five: data.filter(r => r.rating === 5).length,
      four: data.filter(r => r.rating === 4).length,
      three: data.filter(r => r.rating === 3).length,
      two: data.filter(r => r.rating === 2).length,
      one: data.filter(r => r.rating === 1).length,
    }
  };
};

export const getAllReviews = async (companyId: string) => {
  const { data, error } = await supabase
    .from('customer_feedback')
    .select(`
      id, rating, comment, status, created_at,
      customers (full_name, display_id)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
