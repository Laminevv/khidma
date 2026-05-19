import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ClientPaymentsPage from './ClientPaymentsPage'

// CRITICAL: Force dynamic rendering so Vercel never caches
// the redirect that fires when there's no session at build time.
export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  // ─── Step 1: Get the authenticated user from the session cookie ───
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()

  console.log('[AdminPaymentsPage] Auth result:', {
    userId: user?.id ?? 'NULL',
    email: user?.email ?? 'NULL',
    error: authError?.message ?? 'none',
  })

  if (!user) {
    console.error('[AdminPaymentsPage] No user session — redirecting to /auth/login')
    redirect('/auth/login')
  }

  // ─── Step 2: Check is_admin using the SERVICE-ROLE client ─────────
  // We use service-role here because RLS SELECT policies on `profiles`
  // may block the anon-key client from reading `is_admin`. The user's
  // identity is already verified by getUser() above (which contacts
  // the Supabase Auth server), so this is safe.
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  console.log('[AdminPaymentsPage] Profile result:', {
    userId: user.id,
    is_admin: profile?.is_admin ?? 'NULL',
    error: profileError?.message ?? 'none',
  })

  if (!profile?.is_admin) {
    console.error('[AdminPaymentsPage] User is NOT admin — redirecting to /dashboard')
    redirect('/dashboard')
  }

  // ─── Step 3: Fetch financial data (service-role, already created above) ───
  const { data: overview } = await supabase
    .from('admin_overview')
    .select('total_fees_collected')
    .single()

  const { data: withdrawals } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      created_at,
      metadata,
      profiles!from_user_id(username, full_name)
    `)
    .eq('type', 'withdrawal')
    .eq('status', 'pending')

  const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
    id: w.id,
    amount: w.amount,
    created_at: w.created_at,
    metadata: w.metadata,
    profiles: Array.isArray(w.profiles) ? w.profiles[0] : w.profiles,
  }))

  const { data: deposits } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      created_at,
      metadata,
      payment_method,
      receipt_url,
      profiles!from_user_id(username, full_name)
    `)
    .eq('type', 'deposit')
    .eq('status', 'pending')

  const formattedDeposits = (deposits || []).map((d: any) => ({
    id: d.id,
    amount: d.amount,
    created_at: d.created_at,
    metadata: d.metadata,
    payment_method: d.payment_method,
    receipt_url: d.receipt_url,
    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
  }))

  return (
    <ClientPaymentsPage
      totalRevenue={overview?.total_fees_collected || 0}
      initialWithdrawals={formattedWithdrawals}
      initialDeposits={formattedDeposits}
    />
  )
}
