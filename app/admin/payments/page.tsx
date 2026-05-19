import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ClientPaymentsPage from './ClientPaymentsPage'

// BUG-04 FIX: Server-side admin authentication guard added.
// Previously this page used the service-role key with zero access control,
// meaning any URL visitor could see all pending deposits and withdrawals.
export default async function AdminPaymentsPage() {
  // 1. Verify the requester is an authenticated admin
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()

  if (authError) {
    console.error('[AdminPaymentsPage] Auth error:', authError.message)
  }
  if (!user) {
    console.error('[AdminPaymentsPage] No user session — redirecting to login')
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await authClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[AdminPaymentsPage] Profile fetch error:', profileError.message, '| user.id:', user.id)
  }
  if (!profile?.is_admin) {
    console.error('[AdminPaymentsPage] User is not admin — redirecting to dashboard | is_admin:', profile?.is_admin)
    redirect('/dashboard')
  }

  // 2. Use service-role client only AFTER auth is confirmed
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Fetch Total Revenue
  const { data: overview } = await supabase
    .from('admin_overview')
    .select('total_fees_collected')
    .single()

  // 4. Fetch Pending Withdrawals
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

  // 5. Fetch Pending Deposits
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
