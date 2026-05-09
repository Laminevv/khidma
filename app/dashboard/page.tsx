'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  full_name: string
  role: string
  balance: number
  rating: number
  total_reviews: number
}

interface Job {
  id: string
  title: string
  category: string
  budget_max: number
  status: string
  proposals_count: number
  created_at: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'اليوم'
  if (days === 1) return 'أمس'
  return `منذ ${days} يوم`
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: jobsData } = await supabase
        .from('jobs').select('*').eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setJobs(jobsData || [])

      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isClient = profile?.role === 'client' || profile?.role === 'both'

  const statusLabel: Record<string, string> = {
    open: 'مفتوح', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي',
  }
  const statusColor: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-50 text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">المشاريع</Link>
            <Link href="/messages" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">الرسائل</Link>
            <span className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
              <span>{isClient ? '💼' : '🧑‍💻'}</span>
              <span>{isClient ? 'صاحب عمل' : 'مستقل'}</span>
            </span>
            <div className="flex items-center gap-2 mr-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0) || 'م'}
              </div>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">خروج</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مرحباً، {profile?.full_name || profile?.username} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">{isClient ? 'أنت مسجّل كصاحب عمل' : 'أنت مسجّل كمستقل'}</p>
          </div>
          {isClient ? (
            <Link href="/jobs/new" className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">+ نشر مشروع جديد</Link>
          ) : (
            <Link href="/jobs" className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">تصفح المشاريع</Link>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: isClient ? 'مشاريعي' : 'عروضي', value: jobs.length.toString(), icon: '📋', color: 'bg-blue-50 text-blue-600' },
            { label: 'العقود النشطة', value: '0', icon: '📝', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'الرصيد', value: `${(profile?.balance || 0).toLocaleString()} دج`, icon: '💰', color: 'bg-yellow-50 text-yellow-600' },
            { label: 'التقييم', value: profile?.rating ? `${profile.rating} ⭐` : '—', icon: '⭐', color: 'bg-purple-50 text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
              <div className="text-xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">{isClient ? 'مشاريعي' : 'عروضي الأخيرة'}</h2>
                {isClient && <Link href="/jobs/new" className="text-xs text-emerald-600 hover:underline">+ نشر جديد</Link>}
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">{isClient ? '📋' : '🎯'}</div>
                  <p className="text-gray-500 text-sm mb-4">{isClient ? 'لم تنشر أي مشروع بعد' : 'لم تقدم أي عرض بعد'}</p>
                  <Link href={isClient ? '/jobs/new' : '/jobs'}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors inline-block">
                    {isClient ? 'نشر أول مشروع' : 'تصفح المشاريع'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColor[job.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusLabel[job.status] || job.status}
                          </span>
                          <span className="text-xs text-gray-400">{job.category}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">{job.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{job.proposals_count || 0} عرض · {timeAgo(job.created_at)}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mr-4">
                        {job.budget_max ? `${job.budget_max.toLocaleString()} دج` : 'تفاوض'}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {profile?.full_name?.charAt(0) || 'م'}
                </div>
                <h3 className="font-semibold text-gray-900">{profile?.full_name}</h3>
                <p className="text-gray-400 text-sm">@{profile?.username}</p>
                <span className="inline-block mt-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                  {isClient ? 'صاحب عمل' : 'مستقل'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">روابط سريعة</h3>
              <div className="space-y-1">
                {[
                  { label: 'تصفح المشاريع', href: '/jobs', icon: '🔍' },
                  { label: 'الرسائل', href: '/messages', icon: '💬' },
                  { label: 'المحفظة', href: '/wallet', icon: '💳' },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500 rounded-2xl p-6 text-white">
              <p className="text-emerald-100 text-xs mb-1">الرصيد المتاح</p>
              <p className="text-2xl font-bold mb-4">{(profile?.balance || 0).toLocaleString()} دج</p>
              <Link href="/wallet" className="bg-white text-emerald-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors inline-block">
                إدارة المحفظة
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
