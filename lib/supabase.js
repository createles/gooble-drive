import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Export the client to be used in controllers
export const supabase = createClient(supabaseUrl, supabaseKey);

// Connection Health Check
const testConnection = async () => {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Supabase Connection Failed:', error.message);
  } else {
    console.log('✅ Supabase Connection Successful. Available Buckets:', data.map(b => b.name));
  }
};

testConnection();