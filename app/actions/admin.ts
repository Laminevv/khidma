'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// Helper: admin Supabase client (service role — bypasses RLS)
// ─────────────────────────────────────────────────────────────
function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─────────────────────────────────────────────────────────────
// Helper: verify the calling user is an authenticated admin
// Returns the verified user, or throws an error response.
// ─────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<
  | { user: { id: string }; error: null }
  | { user: null; error: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return { user: null, error: 'Unauthorized' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { user: null, error: 'Forbidden' }
  }

  return { user, error: null }
}

// ─────────────────────────────────────────────────────────────
// confirmPayoutAction — approve a freelancer withdrawal
// ─────────────────────────────────────────────────────────────
export async function confirmPayoutAction(transactionId: string) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError }

    const supabase = getAdminSupabase()

    // Fetch the transaction
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

    const newMetadata = {
      ...((txn.metadata as Record<string, unknown>) || {}),
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'completed', metadata: newMetadata })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Transaction update error:', updateError.message)
      return { success: false, error: 'Failed to confirm payout. Please try again.' }
    }

    // BUG-08 FIX: Use service-role client directly for notification RPC
    // (avoids the user-session dependency of sendNotificationAction)
    if (txn.from_user_id) {
      await supabase.rpc('create_notification', {
        p_user_id: txn.from_user_id,
        p_type: 'withdrawal_completed',
        p_title: 'تم تحويل أموالك بنجاح! 🎉',
        p_body: `تم تحويل مبلغ ${txn.amount?.toLocaleString()} دج إلى حسابك. شكراً لاستخدامك خدمة.dz`,
        p_link: '/wallet',
      })
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

// ─────────────────────────────────────────────────────────────
// confirmDepositAction — approve a manual bank deposit
// BUG-01 FIX: admin authentication added
// BUG-02 FIX: atomic RPC replaces read-then-write balance update
// BUG-08 FIX: notification via service-role client directly
// ─────────────────────────────────────────────────────────────
export async function confirmDepositAction(transactionId: string) {
  try {
    // BUG-01 FIX: Require admin authentication before any operation
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError }

    const supabase = getAdminSupabase()

    // BUG-02 FIX: Call atomic RPC that does balance update + status change
    // in a single PostgreSQL transaction (no race condition).
    // See: supabase/fixes/security_fixes.sql for the RPC definition.
    const { error: rpcError } = await supabase.rpc('confirm_manual_deposit', {
      p_transaction_id: transactionId,
      p_admin_id: user.id,
    })

    if (rpcError) {
      console.error('confirm_manual_deposit RPC error:', rpcError)
      if (rpcError.message.includes('not found')) {
        return { success: false, error: 'Transaction not found' }
      }
      if (rpcError.message.includes('not pending')) {
        return { success: false, error: 'Transaction is not pending' }
      }
      return { success: false, error: 'Failed to confirm deposit. Please try again.' }
    }

    // Fetch user info for the notification (transaction is now completed)
    const { data: txn } = await supabase
      .from('transactions')
      .select('from_user_id, amount')
      .eq('id', transactionId)
      .single()

    // BUG-08 FIX: Use service-role client directly for notification RPC
    if (txn?.from_user_id) {
      await supabase.rpc('create_notification', {
        p_user_id: txn.from_user_id,
        p_type: 'deposit_completed',
        p_title: 'تم تأكيد إيداعك بنجاح! 💰',
        p_body: `تم إضافة مبلغ ${txn.amount?.toLocaleString()} دج إلى محفظتك.`,
        p_link: '/wallet',
      })
    }

    revalidatePath('/admin/payments')
    revalidatePath('/wallet')
    return { success: true }
  } catch (error) {
    console.error('confirmDepositAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

// ─────────────────────────────────────────────────────────────
// BUG-05 FIX: Admin mutations as authenticated Server Actions
// These replace the direct client-side supabase mutations in
// AdminContent.tsx, enforcing server-side admin verification.
// ─────────────────────────────────────────────────────────────

export async function banUserAction(userId: string, currentBanStatus: boolean) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError }

    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId)

    if (error) {
      console.error('banUserAction error:', error.message)
      return { success: false, error: 'Failed to update ban status' }
    }

    revalidatePath('/admin')
    return { success: true, newStatus: !currentBanStatus }
  } catch (error) {
    console.error('banUserAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

export async function verifyUserAction(userId: string, currentVerifiedStatus: boolean) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError }

    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentVerifiedStatus })
      .eq('id', userId)

    if (error) {
      console.error('verifyUserAction error:', error.message)
      return { success: false, error: 'Failed to update verification status' }
    }

    revalidatePath('/admin')
    return { success: true, newStatus: !currentVerifiedStatus }
  } catch (error) {
    console.error('verifyUserAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

export async function deleteJobAction(jobId: string) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError }

    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.error('deleteJobAction error:', error.message)
      return { success: false, error: 'Failed to delete job' }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('deleteJobAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}
