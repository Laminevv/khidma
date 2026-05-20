import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc('query_triggers', { q: "SELECT tgname, relname FROM pg_trigger JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid WHERE relname = 'transactions';" });
  
  // if rpc fails, try to use postgrest to query information_schema.triggers
  const { data: triggers } = await supabase
    .from('information_schema.triggers')
    .select('*')
    .eq('event_object_table', 'transactions');

  return NextResponse.json({ triggers, rpc_data: data, rpc_error: error });
}
