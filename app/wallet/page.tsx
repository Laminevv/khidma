import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientWalletPage from './ClientWalletPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'المحفظة — خدمة.dz',
  description: 'إدارة رصيدك وسحوباتك على منصة خدمة.dz',
}

export default async function WalletPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile for balance + role info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, balance, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Fetch user's transactions (deposits, withdrawals, escrow releases)
  // Show transactions where the user is either the sender or receiver
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, fee, net_amount, type, status, reference, note, metadata, created_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <ClientWalletPage
      profile={profile}
      initialTransactions={transactions || []}
    />
  )
}
