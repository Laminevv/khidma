'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper: create notification via SECURITY DEFINER RPC
async function notifyUser(supabase: Awaited<ReturnType<typeof createClient>>, targetUserId: string, senderId: string, type: string, title: string, body?: string, link?: string) {
  if (targetUserId === senderId) return // Don't self-notify
  try {
    await supabase.rpc('create_notification', {
      p_user_id: targetUserId,
      p_type: type,
      p_title: title,
      p_body: body || null,
      p_link: link || null,
    })
  } catch (e) {
    console.error('Notification failed (non-blocking):', e)
  }
}

export async function lockFundsAction(contractId: string, milestoneId: string, amount: number) {
  try {
    const supabase = await createClient()
    
    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { success: false, error: 'Unauthorized' }

    // Server-side input validation
    if (!contractId || !milestoneId) {
      return { success: false, error: 'Missing contract or milestone ID' }
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid amount' }
    }

    // 1. Call the secure RPC to lock funds in escrow
    const { error: rpcError } = await supabase.rpc('lock_milestone_escrow', {
      p_contract_id: contractId,
      p_milestone_id: milestoneId,
      p_amount: amount
    })

    if (rpcError) {
      console.error('Lock escrow RPC error:', rpcError.message)
      if (rpcError.message.includes('Insufficient balance')) {
        return { success: false, error: 'Insufficient balance to fund this milestone.' }
      }
      return { success: false, error: 'Failed to lock funds. Please try again.' }
    }

    // 2. Fetch current contract to update milestone status
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('milestones, freelancer_id, title')
      .eq('id', contractId)
      .single()
      
    if (contractError || !contract) {
      console.error('Contract fetch error:', contractError?.message)
      return { success: false, error: 'Failed to fetch contract details.' }
    }
    
    // 3. Update the milestones JSON array
    const milestones = contract.milestones as Array<Record<string, unknown>>
    const updatedMilestones = milestones.map((m) => 
      m.id === milestoneId ? { ...m, status: 'in_progress' } : m
    )
    
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ milestones: updatedMilestones })
      .eq('id', contractId)
      
    if (updateError) {
      console.error('Milestone update error:', updateError.message)
      return { success: false, error: 'Funds locked but failed to update milestone status.' }
    }

    revalidatePath(`/contracts/${contractId}`)

    // 4. Notify freelancer that funds were locked
    await notifyUser(supabase, contract.freelancer_id, user.id, 'contract_funded',
      'تم تأمين الأموال لمرحلة جديدة',
      `تم تأمين ${amount.toLocaleString()} دج في عقد "${contract.title}"`,
      `/contracts/${contractId}`
    )

    return { success: true }
  } catch (error) {
    console.error('lockFundsAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}

export async function approveAndReleaseAction(contractId: string, milestoneId: string, amount: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return { success: false, error: 'Unauthorized' }

    // Server-side input validation
    if (!contractId || !milestoneId) {
      return { success: false, error: 'Missing contract or milestone ID' }
    }

    // 1. Call the secure RPC to release funds
    const { error: rpcError } = await supabase.rpc('release_milestone_escrow', {
      p_contract_id: contractId,
      p_milestone_id: milestoneId,
      p_fee_pct: 0.10
    })

    if (rpcError) {
      console.error('Release escrow RPC error:', rpcError.message)
      if (rpcError.message.includes('No escrow lock found')) {
        return { success: false, error: 'No locked funds found for this milestone.' }
      }
      return { success: false, error: 'Failed to release funds. Please try again.' }
    }

    // 2. Fetch current contract to update milestone status
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('milestones, status, client_id, freelancer_id, title')
      .eq('id', contractId)
      .single()
      
    if (contractError || !contract) {
      console.error('Contract fetch error:', contractError?.message)
      return { success: false, error: 'Failed to fetch contract details.' }
    }
    
    // 3. Update the milestones JSON array and potentially contract status
    const milestones = contract.milestones as Array<Record<string, unknown>>
    const updatedMilestones = milestones.map((m) => 
      m.id === milestoneId ? { ...m, status: 'approved', approved_at: new Date().toISOString() } : m
    )
    
    const allDone = updatedMilestones.every((m) => m.status === 'approved')
    
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        milestones: updatedMilestones,
        ...(allDone ? { status: 'completed' } : {}) 
      })
      .eq('id', contractId)
      
    if (updateError) {
      console.error('Contract update error:', updateError.message)
      return { success: false, error: 'Funds released but failed to update contract status.' }
    }

    revalidatePath(`/contracts/${contractId}`)

    // 4. Notify freelancer that payment was released
    const fee = Math.round(amount * 0.10)
    const net = amount - fee
    await notifyUser(supabase, contract.freelancer_id, user.id, 'payment_released',
      `تم تحرير ${net.toLocaleString()} دج لرصيدك`,
      `مرحلة في عقد "${contract.title}"`,
      `/contracts/${contractId}`
    )

    // 5. If all milestones done → notify both parties
    if (allDone) {
      await notifyUser(supabase, contract.freelancer_id, user.id, 'contract_completed',
        '🏆 تم إكمال العقد بنجاح!',
        `العقد "${contract.title}" اكتمل. يمكنك تقييم التجربة.`,
        `/contracts/${contractId}`
      )
      await notifyUser(supabase, contract.client_id, user.id, 'contract_completed',
        '🏆 تم إكمال العقد بنجاح!',
        `العقد "${contract.title}" اكتمل. يمكنك تقييم التجربة.`,
        `/contracts/${contractId}`
      )
    }

    return { success: true }
  } catch (error) {
    console.error('approveAndReleaseAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}

export async function submitReviewAction(
  contractId: string,
  revieweeId: string,
  rating: number,
  comment: string
) {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Server-side input validation
    if (!contractId || !revieweeId) {
      return { success: false, error: 'Missing contract or reviewee ID' }
    }
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' }
    }
    if (user.id === revieweeId) {
      return { success: false, error: 'You cannot review yourself' }
    }

    // 3. Verify the contract is completed and the user is a party to it
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, status, client_id, freelancer_id')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      console.error('Contract fetch error:', contractError?.message)
      return { success: false, error: 'Contract not found' }
    }
    if (contract.status !== 'completed') {
      return { success: false, error: 'Reviews can only be submitted for completed contracts' }
    }
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return { success: false, error: 'You are not a party to this contract' }
    }

    // 4. Check for duplicate review (UNIQUE constraint: contract_id + reviewer_id)
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('contract_id', contractId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this contract' }
    }

    // 5. Insert the review
    // The PostgreSQL trigger `update_user_rating` will automatically:
    //   - Recalculate AVG(rating) for the reviewee
    //   - Update profiles.rating and profiles.total_reviews
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        contract_id: contractId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment?.trim() || null,
      })

    if (insertError) {
      console.error('Review insert error:', insertError.message)
      if (insertError.code === '23505') {
        return { success: false, error: 'You have already reviewed this contract' }
      }
      return { success: false, error: 'Failed to submit review. Please try again.' }
    }

    revalidatePath(`/contracts/${contractId}`)
    revalidatePath(`/profile`)

    // 6. Notify the reviewee
    await notifyUser(supabase, revieweeId, user.id, 'new_review',
      '⭐ تلقيت تقييماً جديداً',
      `تقييم ${rating} نجوم${comment ? ': "' + comment.trim().substring(0, 50) + '..."' : ''}`,
      `/contracts/${contractId}`
    )

    return { success: true }
  } catch (error) {
    console.error('submitReviewAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}
