import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Export the client to be used in controllers
export const supabase = createClient(supabaseUrl, supabaseKey);

// Optional connection check function
export const checkSupabaseConnection = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Key missing in environment variables.');
    return;
  }
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Supabase Connection Failed:', error.message);
    } else {
      console.log('✅ Supabase Connection Successful. Buckets:', data.map(b => b.name));
    }
  } catch (err) {
    console.error('❌ Supabase Connection Error:', err.message);
  }
};