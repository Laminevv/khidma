'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
      .select('milestones')
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
      .select('milestones, status')
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
    return { success: true }
  } catch (error) {
    console.error('approveAndReleaseAction unexpected error:', error)
    return { success: false, error: 'An unexpected server error occurred. Please try again.' }
  }
}
