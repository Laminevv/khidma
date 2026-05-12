import { createClient } from '@/lib/supabase/server'
import ClientProfilePage from './ClientProfilePage'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} — خدمة.dz`,
    description: `الملف الشخصي للمستقل ${username} على منصة خدمة.dz`,
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params

  try {
    const supabase = await createClient()

    // 1. Fetch the profile by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role, wilaya, skills, hourly_rate, rating, total_reviews, created_at')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-xl font-bold text-white mb-2">المستخدم غير موجود</h1>
            <p className="text-gray-400 text-sm mb-6">لم نتمكن من العثور على &quot;{username}&quot;</p>
            <Link href="/jobs" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
              تصفح المشاريع
            </Link>
          </div>
        </div>
      )
    }

    // 2. Fetch completed contracts where this user was the freelancer
    const { data: completedContracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        total_amount,
        status,
        start_date,
        created_at,
        updated_at,
        client:profiles!client_id(username, full_name)
      `)
      .eq('freelancer_id', profile.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(10)

    // 3. Fetch reviews where this user was reviewed
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviewer_id(username, full_name)
      `)
      .eq('reviewee_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // 4. Fetch portfolio items
    const { data: portfolios } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    // 5. Get current logged-in user (optional — for "Hire Me" button visibility)
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Format contracts to normalize the client relation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedContracts = (completedContracts || []).map((c: any) => ({
      id: c.id as string,
      title: c.title as string,
      total_amount: c.total_amount as number,
      status: c.status as string,
      start_date: c.start_date as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      client: Array.isArray(c.client) ? c.client[0] : c.client,
    }))

    // Format reviews to normalize the reviewer relation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedReviews = (reviews || []).map((r: any) => ({
      id: r.id as string,
      rating: r.rating as number,
      comment: r.comment as string | null,
      created_at: r.created_at as string,
      reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
    }))

    return (
      <ClientProfilePage
        profile={profile}
        completedContracts={formattedContracts}
        reviews={formattedReviews}
        portfolios={portfolios || []}
        currentUserId={currentUser?.id || null}
      />
    )
  } catch (error) {
    console.error('Profile page error:', error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">حدث خطأ</h1>
          <p className="text-gray-400 text-sm mb-6">حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
          <Link href="/" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    )
  }
}
