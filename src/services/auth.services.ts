import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';


export const enrollPin = async (employeeId: any, rawPin: any) => {
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(rawPin, saltRounds);

    const { data, error } = await supabase
        .from('employee_credentials')
        .upsert({ 
            employee_id: employeeId, 
            hashed_pin: hashedPin,
            auth_method: 'pin' 
        })
        .select();

    if (error) throw error;
    return data;
};

export const registerUser = async (userData: any) => {
  const { email, password, full_name, company_id, role } = userData;

  // 1. Hash the password (10 salt rounds is standard)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Save user to the public.users table
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password: hashedPassword,
      full_name,
      company_id,
      role
    }])
    .select('id, email, full_name, company_id, role')
    .single();

  if (error) throw error;
  return data;
};


export const loginUser = async (email: string, password: string) => {
  // 1. Find user in Supabase
  const { data: user, error } = await supabase
    .from('users') // Assumes you have a 'users' table
    .select('id, password, company_id')
    .eq('email', email)
    .single();

  if (error || !user) throw new Error("Invalid email or password");

  // 2. Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  
  // 3. Generate JWT with company_id
  const token = jwt.sign(
    { id: user.id, companyId: user.company_id },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return { token, companyId: user.company_id };
};



export const loginManagementUser = async (email: string, password_raw: string) => {
  // 1. Find user in the management_users table
  const { data: admin, error } = await supabase
    .from('management_users')
    .select('id, password_hash, is_super_admin') // Use password_hash from your schema
    .eq('email', email)
    .single();

  if (error || !admin) throw new Error("Invalid email or password");

  // 2. PLAIN TEXT comparison (Temporary fix for your bcrypt issues)
  const isMatch = (password_raw.trim() === admin.password_hash.trim());
  if (!isMatch) throw new Error("Invalid email or password");

  // 3. Generate JWT with the 'admin' flag
  const token = jwt.sign(
    { 
        id: admin.id, 
        isAdmin: true, 
        isSuperAdmin: admin.is_super_admin 
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return { token, isSuperAdmin: admin.is_super_admin };
};


export const checkManagementAccess = async (adminId: string) => {
    const { data, error } = await supabase
        .from('management_users')
        .select('id, is_super_admin')
        .eq('id', adminId)
        .maybeSingle();

    if (error) throw error;
    return data;
};
