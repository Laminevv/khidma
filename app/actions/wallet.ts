'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestWithdrawalAction(amount: number, payoutDetails: string) {
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Strict Server-Side Validation
  if (amount < 10000) {
    return { success: false, error: 'Minimum withdrawal amount is 10,000 DZD' }
  }

  if (!payoutDetails || payoutDetails.trim().length < 5) {
    return { success: false, error: 'Invalid payout details' }
  }

  // 3. Call the secure RPC to prevent double spending
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_amount: amount,
    p_metadata: { payoutDetails }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
