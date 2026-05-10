import { createClient } from '@supabase/supabase-js'

const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    return null as any
  }
  
  return createClient(url, key)
}

export const supabase = createSupabaseClient()