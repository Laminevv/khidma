'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveDisputeAction(disputeId: string, contractId: string, action: 'refund_client' | 'release_freelancer') {
  try {
    const supabase = await createClient()

    // 1. Verify Admin Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { success: false, error: 'Unauthorized' }

    // (In a real app, verify is_admin here)

    // 2. Fetch the dispute & contract details
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select('status, contract_id')
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute || dispute.status !== 'open') {
      return { success: false, error: 'Dispute not found or already resolved.' }
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('total_amount, client_id, freelancer_id, milestones')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) return { success: false, error: 'Contract not found.' }

    // Calculate how much is locked in escrow (milestones 'in_progress' or 'submitted')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockedAmount = (contract.milestones as any[]).reduce((sum, m) => {
      if (m.status === 'in_progress' || m.status === 'submitted') return sum + (m.amount || 0)
      return sum
    }, 0)

    if (lockedAmount > 0) {
      if (action === 'refund_client') {
        // Refund Client: increase client balance
        const { data: clientData } = await supabase.from('profiles').select('balance').eq('id', contract.client_id).single()
        if (clientData) {
          await supabase.from('profiles').update({ balance: clientData.balance + lockedAmount }).eq('id', contract.client_id)
        }
        
        // Log transaction
        await supabase.from('transactions').insert({
          from_user_id: contract.client_id,
          to_user_id: contract.client_id,
          amount: lockedAmount,
          type: 'refund',
          status: 'completed'
        })
      } else if (action === 'release_freelancer') {
        // Release to Freelancer: increase freelancer balance (minus fee)
        const fee = Math.round(lockedAmount * 0.10)
        const net = lockedAmount - fee
        
        const { data: freelancerData } = await supabase.from('profiles').select('balance').eq('id', contract.freelancer_id).single()
        if (freelancerData) {
          await supabase.from('profiles').update({ balance: freelancerData.balance + net }).eq('id', contract.freelancer_id)
        }
        
        // Log transaction
        await supabase.from('transactions').insert({
          from_user_id: contract.client_id,
          to_user_id: contract.freelancer_id,
          amount: lockedAmount,
          type: 'escrow_release',
          status: 'completed'
        })

        // Log fee
        await supabase.from('transactions').insert({
          from_user_id: contract.freelancer_id,
          to_user_id: contract.freelancer_id,
          amount: fee,
          type: 'platform_fee',
          status: 'completed'
        })
        
        // Update admin overview
        const { error: feeErr } = await supabase.rpc('increment_admin_fees', { p_amount: fee })
        if (feeErr) console.error('Error incrementing admin fees:', feeErr)
      }
    }

    // 3. Update Dispute Status
    const newStatus = action === 'refund_client' ? 'resolved_client' : 'resolved_freelancer'
    await supabase.from('disputes').update({
      status: newStatus,
      resolution: action === 'refund_client' ? 'تم إعادة الأموال لصاحب العمل' : 'تم تسليم الأموال للمستقل',
      resolved_at: new Date().toISOString()
    }).eq('id', disputeId)

    // 4. Update Contract Status
    const newContractStatus = action === 'refund_client' ? 'cancelled' : 'completed'
    await supabase.from('contracts').update({ status: newContractStatus }).eq('id', contractId)

    revalidatePath('/admin/disputes')
    revalidatePath(`/contracts/${contractId}`)

    // 5. Notify Users
    const { error: notifErr1 } = await supabase.rpc('create_notification', {
      p_user_id: contract.client_id,
      p_type: 'dispute_resolved',
      p_title: 'تم الفصل في النزاع',
      p_body: action === 'refund_client' ? 'تم الحكم لصالحك وإعادة الأموال إلى رصيدك.' : 'تم الحكم لصالح المستقل وتسليمه قيمة العقد.',
      p_link: `/contracts/${contractId}`
    })
    if (notifErr1) console.error('Notification error 1:', notifErr1)

    const { error: notifErr2 } = await supabase.rpc('create_notification', {
      p_user_id: contract.freelancer_id,
      p_type: 'dispute_resolved',
      p_title: 'تم الفصل في النزاع',
      p_body: action === 'release_freelancer' ? 'تم الحكم لصالحك وتحويل الأموال إلى رصيدك.' : 'تم الحكم لصالح صاحب العمل وإعادة الأموال إليه.',
      p_link: `/contracts/${contractId}`
    })
    if (notifErr2) console.error('Notification error 2:', notifErr2)

    return { success: true }
  } catch (error) {
    console.error('resolveDisputeAction error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
