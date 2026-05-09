import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { proposal_id } = await req.json()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, jobs(title, client_id)')
    .eq('id', proposal_id)
    .single()

  if (!proposal) return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 })

  const milestones = proposal.milestones?.length > 0
    ? proposal.milestones.map((m: any) => ({ ...m, id: crypto.randomUUID(), status: 'pending' }))
    : [{
        id: crypto.randomUUID(),
        title: 'تسليم العمل كاملاً',
        amount: proposal.bid_amount,
        description: '',
        status: 'pending',
      }]

  const { data: contract, error } = await supabase.from('contracts').insert({
    job_id: proposal.job_id,
    proposal_id: proposal.id,
    client_id: proposal.jobs.client_id,
    freelancer_id: proposal.freelancer_id,
    title: proposal.jobs.title,
    total_amount: proposal.bid_amount,
    platform_fee: Math.round(proposal.bid_amount * 0.05),
    milestones,
    status: 'active',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await Promise.all([
    supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposal_id),
    supabase.from('jobs').update({ status: 'in_progress' }).eq('id', proposal.job_id),
  ])

  return NextResponse.json({ contract_id: contract.id })
}
