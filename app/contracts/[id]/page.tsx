import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientContractPage from './ClientContractPage'
import Link from 'next/link'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`*, client:profiles!client_id(id, username, full_name, balance), freelancer:profiles!freelancer_id(id, username, full_name, balance), jobs(id, title)`)
    .eq('id', id)
    .single()

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-500 mb-4">العقد غير موجود</p>
          <Link href="/contracts" className="text-emerald-600 hover:underline">← العودة للعقود</Link>
        </div>
      </div>
    )
  }

  return <ClientContractPage initialContract={contract} userId={user.id} />
}
