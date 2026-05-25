import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Add the '!' at the end of the variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

// TypeScript will now allow this because it's guaranteed to be a string
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
