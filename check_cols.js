import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching from profiles:', error);
  } else {
    console.log('Columns in profiles table:', Object.keys(data[0] || {}));
    if (data.length > 0) {
      console.log('Sample profile row:', data[0]);
    } else {
      console.log('No rows found in profiles table to infer columns from data. Trying to get an empty row...');
    }
  }
}

checkColumns();
