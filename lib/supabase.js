import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Export the client to be used in controllers
export const supabase = createClient(supabaseUrl, supabaseKey);