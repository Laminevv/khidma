'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockFundsAction(contractId: string, milestoneId: string, amount: number) {
  const supabase = await createClient()
  
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return { success: false, error: 'Unauthorized' }

  // 1. Call the secure RPC to lock funds in escrow
  const { error: rpcError } = await supabase.rpc('lock_milestone_escrow', {
    p_contract_id: contractId,
    p_milestone_id: milestoneId,
    p_amount: amount
  })

  if (rpcError) {
    return { success: false, error: rpcError.message }
  }

  // 2. Fetch current contract to update milestone status
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('milestones')
    .eq('id', contractId)
    .single()
    
  if (contractError) return { success: false, error: contractError.message }
  
  // 3. Update the milestones JSON array
  const updatedMilestones = contract.milestones.map((m: any) => 
    m.id === milestoneId ? { ...m, status: 'in_progress' } : m
  )
  
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ milestones: updatedMilestones })
    .eq('id', contractId)
    
  if (updateError) return { success: false, error: updateError.message }

  revalidatePath(`/contracts/${contractId}`)
  return { success: true }
}

export async function approveAndReleaseAction(contractId: string, milestoneId: string, amount: number) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return { success: false, error: 'Unauthorized' }

  // 1. Call the secure RPC to release funds
  const { error: rpcError } = await supabase.rpc('release_milestone_escrow', {
    p_contract_id: contractId,
    p_milestone_id: milestoneId,
    p_fee_pct: 0.10
  })

  if (rpcError) {
    return { success: false, error: rpcError.message }
  }

  // 2. Fetch current contract to update milestone status
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('milestones, status')
    .eq('id', contractId)
    .single()
    
  if (contractError) return { success: false, error: contractError.message }
  
  // 3. Update the milestones JSON array and potentially contract status
  const updatedMilestones = contract.milestones.map((m: any) => 
    m.id === milestoneId ? { ...m, status: 'approved', approved_at: new Date().toISOString() } : m
  )
  
  const allDone = updatedMilestones.every((m: any) => m.status === 'approved')
  
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ 
      milestones: updatedMilestones,
      ...(allDone ? { status: 'completed' } : {}) 
    })
    .eq('id', contractId)
    
  if (updateError) return { success: false, error: updateError.message }

  revalidatePath(`/contracts/${contractId}`)
  return { success: true }
}
