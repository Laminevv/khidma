import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WalletPageClient from './WalletPageClient'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, deposit_balance, withdrawable_balance, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, fee, net_amount, type, status, reference, note, metadata, created_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return <WalletPageClient profile={profile} initialTransactions={transactions || []} />
}
