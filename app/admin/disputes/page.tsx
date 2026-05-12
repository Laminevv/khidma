import { createClient } from '@/lib/supabase/server'
import ClientDisputesPage from './ClientDisputesPage'
import { redirect } from 'next/navigation'

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Simple admin check based on username or role if implemented
  // Assuming simple check like admin overview page
  // Fetch disputes
  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      id,
      reason,
      status,
      created_at,
      initiator:profiles!initiator_id(id, full_name, username),
      contract:contracts!contract_id(
        id,
        title,
        total_amount,
        client:profiles!client_id(id, full_name, username),
        freelancer:profiles!freelancer_id(id, full_name, username)
      )
    `)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedDisputes = (disputes || []).map((d: any) => ({
    id: d.id,
    reason: d.reason,
    status: d.status,
    created_at: d.created_at,
    initiator: Array.isArray(d.initiator) ? d.initiator[0] : d.initiator,
    contract: Array.isArray(d.contract) ? d.contract[0] : d.contract
  }))

  return <ClientDisputesPage initialDisputes={formattedDisputes} />
}
