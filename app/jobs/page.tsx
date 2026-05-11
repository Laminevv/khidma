'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Job {
  id: string
  title: string
  description: string
  category: string
  budget_min: number
  budget_max: number
  deadline: string
  status: string
  proposals_count: number
  views_count: number
  created_at: string
  required_skills: string[]
  profiles: {
    username: string
    full_name: string
    wilaya: number
    rating: number
  }
}

const CATEGORIES = [
  { value: 'all', label: 'الكل' },
  { value: 'development', label: 'تطوير' },
  { value: 'design', label: 'تصميم' },
  { value: 'marketing', label: 'تسويق' },
  { value: 'writing', label: 'كتابة' },
  { value: 'translation', label: 'ترجمة' },
  { value: 'data', label: 'بيانات' },
  { value: 'other', label: 'أخرى' },
]

const WILAYAS: Record<number, string> = {
  1: 'أدرار', 2: 'الشلف', 3: 'الأغواط', 4: 'أم البواقي',
  5: 'باتنة', 6: 'بجاية', 7: 'بسكرة', 8: 'بشار',
  9: 'البليدة', 10: 'البويرة', 16: 'الجزائر', 19: 'سطيف',
  23: 'عنابة', 25: 'قسنطينة', 31: 'وهران',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days} يوم`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [user, setUser] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [category, sort])

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*, profiles!client_id(username, full_name, wilaya, rating)')
      .eq('status', 'open')

    if (category !== 'all') query = query.eq('category', category)

    if (sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
    else if (sort === 'budget_high') query = query.order('budget_max', { ascending: false })
    else if (sort === 'budget_low') query = query.order('budget_min', { ascending: true })

    const { data } = await query
    setJobs(data || [])
    setLoading(false)
  }

  const filtered = jobs.filter(j =>
    search === '' ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase())
  )

  const categoryLabel = (cat: string) =>
    CATEGORIES.find(c => c.value === cat)?.label || cat

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">
                  لوحة التحكم
                </Link>
                <Link href="/jobs/new"
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                  + نشر مشروع
                </Link>
              </>
            ) : (
              <Link href="/auth/login"
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">تصفح المشاريع</h1>
          <p className="text-gray-500 text-sm mb-4 sm:mb-6">اعثر على المشروع المناسب لمهاراتك</p>

          {/* Search */}
          <div className="relative max-w-xl">
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مشروع..."
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
              style={{ color: '#111827' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          {showFilters ? 'إخفاء الفلاتر' : 'فلترة المشاريع'}
        </button>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

          {/* Sidebar filters */}
          <div className={`lg:w-52 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">الفئة</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${
                      category === cat.value
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">ترتيب حسب</h3>
                <div className="space-y-1">
                  {[
                    { value: 'newest', label: 'الأحدث' },
                    { value: 'oldest', label: 'الأقدم' },
                    { value: 'budget_high', label: 'أعلى ميزانية' },
                    { value: 'budget_low', label: 'أدنى ميزانية' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSort(s.value)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${
                        sort === s.value
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Jobs list */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'جارٍ التحميل...' : `${filtered.length} مشروع`}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"></div>
                    <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm mb-4">لا توجد مشاريع في هذه الفئة</p>
                {user && (
                  <Link href="/jobs/new"
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors inline-block">
                    كن أول من ينشر مشروعاً
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className="block bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 hover:border-emerald-200 hover:shadow-sm transition-all group">

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-medium">
                            {categoryLabel(job.category)}
                          </span>
                          {job.required_skills?.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <h3 className="font-semibold text-gray-900 text-base mb-2 group-hover:text-emerald-600 transition-colors">
                          {job.title}
                        </h3>

                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            {job.profiles?.full_name || job.profiles?.username}
                          </span>
                          {job.profiles?.wilaya && (
                            <span className="flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              {WILAYAS[job.profiles.wilaya] || `ولاية ${job.profiles.wilaya}`}
                            </span>
                          )}
                          <span>{timeAgo(job.created_at)}</span>
                          <span>{job.proposals_count} عرض</span>
                        </div>
                      </div>

                      <div className="text-left flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 mb-1">
                          {job.budget_min && job.budget_max
                            ? `${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()}`
                            : job.budget_max
                            ? `حتى ${job.budget_max.toLocaleString()}`
                            : 'تفاوض'}
                        </div>
                        <div className="text-xs text-gray-400 text-left">دج</div>
                        {job.deadline && (
                          <div className="text-xs text-orange-500 mt-2">
                            ⏰ {new Date(job.deadline).toLocaleDateString('ar-DZ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
