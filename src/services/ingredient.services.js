import supabase from '../config/supabase.js';

const getAllIngredients = async () => {
  const { data, error } = await supabase.from('ingredients').select('*');
  if (error) throw error;
  return data;
};

const deleteIngredient = async (id) => {
  const { data, error } = await supabase.from('ingredients').delete().eq('id', id).select();
  if (error) throw error;
  return data;
};

export{ getAllIngredients, deleteIngredient };