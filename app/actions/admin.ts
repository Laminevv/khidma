'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotificationAction } from './notifications'

export async function confirmPayoutAction(transactionId: string) {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication & Admin Status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError.message)
      return { success: false, error: 'Failed to verify admin status' }
    }

    if (!profile?.is_admin) {
      return { success: false, error: 'Forbidden' }
    }

    // 2. Fetch the transaction
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('id, from_user_id, amount, metadata, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) {
      console.error('Transaction fetch error:', txnError?.message)
      return { success: false, error: 'Transaction not found' }
    }

    if (txn.status !== 'pending') {
      return { success: false, error: 'Transaction is not pending' }
    }

    // 3. Update the transaction
    const newMetadata = {
      ...((txn.metadata as Record<string, unknown>) || {}),
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
      console.error('Transaction update error:', updateError.message)
      return { success: false, error: 'Failed to confirm payout. Please try again.' }
    }

    // Notify the freelancer that their withdrawal has been processed
    if (txn.from_user_id) {
      await sendNotificationAction(
        txn.from_user_id,
        'withdrawal_completed',
        'تم تحويل أموالك بنجاح! 🎉',
        `تم تحويل مبلغ ${txn.amount?.toLocaleString()} دج إلى حسابك. شكراً لاستخدامك خدمة.dz`,
        '/wallet'
      )
    }

    revalidatePath('/admin/payments')
    revalidatePath('/admin/withdrawals')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('confirmPayoutAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}

import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function confirmDepositAction(transactionId: string) {
  try {
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Fetch the transaction
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('id, from_user_id, amount, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) {
      return { success: false, error: 'Transaction not found' }
    }

    if (txn.status !== 'pending') {
      return { success: false, error: 'Transaction is not pending' }
    }

    // 3. Increment the user's balance
    if (txn.from_user_id && txn.amount) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', txn.from_user_id)
        .single()

      if (profileError) {
        console.error('Failed to fetch profile for deposit:', profileError)
        return { success: false, error: 'Failed to fetch user profile' }
      }

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: Number(profile.balance) + Number(txn.amount) })
        .eq('id', txn.from_user_id)

      if (balanceError) {
        console.error('Failed to update balance for deposit:', balanceError)
        return { success: false, error: 'Failed to update user balance' }
      }
    }

    // 4. Update the transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        note: 'تم تأكيد الإيداع'
      })
      .eq('id', transactionId)

    if (updateError) {
      return { success: false, error: 'Failed to confirm deposit.' }
    }

    // Notify user
    if (txn.from_user_id) {
      await sendNotificationAction(
        txn.from_user_id,
        'deposit_completed',
        'تم تأكيد إيداعك بنجاح! 💰',
        `تم إضافة مبلغ ${txn.amount?.toLocaleString()} دج إلى محفظتك.`,
        '/wallet'
      )
    }

    revalidatePath('/admin/payments')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('confirmDepositAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

