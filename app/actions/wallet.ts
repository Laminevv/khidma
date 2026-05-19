'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestWithdrawalAction(amount: number, payoutDetails: string) {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Strict Server-Side Validation
    if (typeof amount !== 'number' || isNaN(amount) || amount < 10000) {
      return { success: false, error: 'Minimum withdrawal amount is 10,000 DZD' }
    }

    if (!payoutDetails || typeof payoutDetails !== 'string' || payoutDetails.trim().length < 5) {
      return { success: false, error: 'Invalid payout details' }
    }

    // Gating: Require KYC verification for withdrawals >= 50,000 DZD
    if (amount >= 50000) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single()
      
      if (!profile?.is_verified) {
        return { success: false, error: 'يجب توثيق هويتك (KYC) لسحب مبالغ تتجاوز 50,000 دج.' }
      }
    }

    // 3. Call the secure RPC to prevent double spending
    const { error: rpcError } = await supabase.rpc('request_withdrawal', {
      p_amount: amount,
      p_metadata: { payoutDetails: payoutDetails.trim() }
    })

    if (rpcError) {
      console.error('Withdrawal RPC error:', rpcError.message)
      // Provide a user-friendly message for the known balance error
      if (rpcError.message.includes('Insufficient balance')) {
        return { success: false, error: 'Insufficient balance for this withdrawal.' }
      }
      return { success: false, error: 'Failed to process withdrawal. Please try again.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('requestWithdrawalAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}
