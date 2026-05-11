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

  // Fetch existing reviews for this contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      reviewer_id,
      reviewee_id,
      created_at,
      reviewer:profiles!reviewer_id(username, full_name)
    `)
    .eq('contract_id', id)

  const reviews = (rawReviews || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    reviewer_id: r.reviewer_id,
    reviewee_id: r.reviewee_id,
    created_at: r.created_at,
    reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
  }))

  return <ClientContractPage initialContract={contract} userId={user.id} reviews={reviews} />
}
