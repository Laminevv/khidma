import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRoles() {
  const { data, error } = await supabase.from('profiles').select('role, is_admin');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total profiles: ${data.length}`);
    const roles = new Set(data.map(p => p.role));
    console.log('Distinct roles:', Array.from(roles));
    const admins = data.filter(p => p.is_admin);
    console.log(`Profiles with is_admin=true: ${admins.length}`);
    const roleAdmins = data.filter(p => p.role === 'admin');
    console.log(`Profiles with role='admin': ${roleAdmins.length}`);
  }
}

checkRoles();
