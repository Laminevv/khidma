'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDisputeMessagesAction(disputeId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('dispute_messages')
      .select('*, sender:profiles!sender_id(username, full_name, is_admin, avatar_url)')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('getDisputeMessagesAction error:', error)
      return { success: false, error: 'Failed to load messages' }
    }

    return { success: true, messages: data }
  } catch (error) {
    console.error('getDisputeMessagesAction exception:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

export async function sendDisputeMessageAction(disputeId: string, message: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    if (!message || message.trim() === '') return { success: false, error: 'Message cannot be empty' }

    const { data, error } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: disputeId,
        sender_id: user.id,
        message: message.trim()
      })
      .select('*, sender:profiles!sender_id(username, full_name, is_admin, avatar_url)')
      .single()

    if (error) {
      console.error('sendDisputeMessageAction error:', error)
      return { success: false, error: 'Failed to send message' }
    }

    revalidatePath(`/contracts`)
    return { success: true, message: data }
  } catch (error) {
    console.error('sendDisputeMessageAction exception:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

export async function resolveDisputeAction(
  disputeId: string,
  contractId: string,
  lockedAmount: number,
  clientPct: number,
  freelancerPct: number,
  resolution: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return { success: false, error: 'Unauthorized: Admins only' }

    // Validate percentages
    if (clientPct < 0 || freelancerPct < 0 || (clientPct + freelancerPct) !== 100) {
      return { success: false, error: 'Percentages must be between 0 and 100, and sum to 100' }
    }

    // Call RPC
    const { error: rpcError } = await supabase.rpc('resolve_dispute_escrow', {
      p_dispute_id: disputeId,
      p_locked_amount: lockedAmount,
      p_client_pct: clientPct,
      p_freelancer_pct: freelancerPct,
      p_resolution: resolution,
      p_admin_id: user.id
    })

    if (rpcError) {
      console.error('resolve_dispute_escrow RPC error:', rpcError)
      return { success: false, error: rpcError.message || 'Failed to resolve dispute' }
    }

    // Determine final contract status
    // If client gets 100% refund, cancel contract. Otherwise, complete it.
    const finalContractStatus = clientPct === 100 ? 'cancelled' : 'completed'

    const { error: updateError } = await supabase
      .from('contracts')
      .update({ status: finalContractStatus })
      .eq('id', contractId)

    if (updateError) {
      console.error('Failed to update contract status:', updateError)
      return { success: false, error: 'Dispute resolved, but failed to update contract status' }
    }

    revalidatePath(`/admin`)
    revalidatePath(`/contracts/${contractId}`)
    
    // Notify parties
    const { data: contract } = await supabase.from('contracts').select('client_id, freelancer_id').eq('id', contractId).single()
    if (contract) {
      await supabase.rpc('create_notification', { p_user_id: contract.client_id, p_type: 'dispute_resolved', p_title: 'تم تسوية النزاع', p_body: 'قامت الإدارة بتسوية النزاع وتوزيع الأموال.', p_link: `/contracts/${contractId}` })
      await supabase.rpc('create_notification', { p_user_id: contract.freelancer_id, p_type: 'dispute_resolved', p_title: 'تم تسوية النزاع', p_body: 'قامت الإدارة بتسوية النزاع وتوزيع الأموال.', p_link: `/contracts/${contractId}` })
    }

    return { success: true }
  } catch (error) {
    console.error('resolveDisputeAction exception:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
