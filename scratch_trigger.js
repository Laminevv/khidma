const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  console.log(await res.text());
}
main();
