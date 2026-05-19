import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Uses @supabase/ssr's createBrowserClient which stores the auth
// session in COOKIES (not localStorage). This is critical because
// Server Components and middleware can only read cookies — they
// have zero access to localStorage.
//
// All 17+ files that import { supabase } from '@/lib/supabase'
// continue to work unchanged.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)