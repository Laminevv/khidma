'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmPayoutAction(transactionId: string) {
  const supabase = await createClient()

  // 1. Verify Authentication & Admin Status
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, error: 'Forbidden' }
  }

  // 2. Fetch the transaction
  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .select('id, metadata, status')
    .eq('id', transactionId)
    .single()

  if (txnError || !txn) {
    return { success: false, error: 'Transaction not found' }
  }

  if (txn.status !== 'pending') {
    return { success: false, error: 'Transaction is not pending' }
  }

  // 3. Update the transaction
  const newMetadata = {
    ...((txn.metadata as any) || {}),
    resolved_by: user.id,
    resolved_at: new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: 'completed',
      metadata: newMetadata
    })
    .eq('id', transactionId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/admin/payments')
  return { success: true }
}
