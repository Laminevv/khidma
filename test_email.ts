import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getUserEmail, getAdminEmails } from './lib/email';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log("Testing getAdminEmails()...");
  const admins = await getAdminEmails();
  console.log("Admin emails:", admins);

  const { data } = await supabase.from('profiles').select('id').limit(1);
  if (data && data.length > 0) {
    console.log(`Testing getUserEmail() for user ${data[0].id}...`);
    const email = await getUserEmail(data[0].id);
    console.log(`User email:`, email);
  } else {
    console.log("No profiles found to test getUserEmail.");
  }
}

run();
