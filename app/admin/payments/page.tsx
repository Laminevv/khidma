import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ClientPaymentsPage from './ClientPaymentsPage'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  // 1. Verify the requester is an authenticated admin
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/auth/login')

  // Use service-role for is_admin check (bypasses RLS)
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  // 2. Fetch financial data
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
