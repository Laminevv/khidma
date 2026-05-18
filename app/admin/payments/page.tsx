import { createClient } from '@supabase/supabase-js'
import ClientPaymentsPage from './ClientPaymentsPage'

export default async function AdminPaymentsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 2. Fetch Total Revenue
  const { data: overview } = await supabase
    .from('admin_overview')
    .select('total_fees_collected')
    .single()

  // 3. Fetch Pending Withdrawals
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

  // Format the data to guarantee a single profile object, resolving TypeScript errors
  const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
    id: w.id,
    amount: w.amount,
    created_at: w.created_at,
    metadata: w.metadata,
    profiles: Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
  }))

  // 4. Fetch Pending Deposits
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
    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
  }))

  return (
    <ClientPaymentsPage 
      totalRevenue={overview?.total_fees_collected || 0}
      initialWithdrawals={formattedWithdrawals}
      initialDeposits={formattedDeposits}
    />
  )
}
