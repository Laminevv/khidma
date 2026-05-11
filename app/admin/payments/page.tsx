import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientPaymentsPage from './ClientPaymentsPage'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  
  // 1. Strict Server-Side Security Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch admin status directly from the database using auth.uid() via the RPC
  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) {
    redirect('/dashboard')
  }

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

  return (
    <ClientPaymentsPage 
      totalRevenue={overview?.total_fees_collected || 0}
      initialWithdrawals={formattedWithdrawals} 
    />
  )
}
