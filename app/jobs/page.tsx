'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import {
  Search,
  SlidersHorizontal,
  User,
  MapPin,
  Clock,
  FileText,
  Plus,
  SearchX,
  Loader2,
} from 'lucide-react'

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
    <div className="min-h-screen" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>

      {/* ─── Top Navigation ─── */}
      <header className="topnav">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-16">
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-[19px] font-bold ml-12"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
          >
            خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--fg)' }}
            >
              تصفح المشاريع
            </span>
            <Link
              href="/messages"
              className="text-[14px] font-medium transition-colors hover:text-[var(--fg)]"
              style={{ color: 'var(--muted)', textDecoration: 'none' }}
            >
              الرسائل
            </Link>
          </nav>

          <div className="mr-auto flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="text-[14px] font-semibold hidden sm:inline" style={{ color: 'var(--fg)' }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Link href="/dashboard" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  لوحة التحكم
                </Link>
                <Link href="/jobs/new" className="btn btn-accent" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  <Plus className="w-3.5 h-3.5" />
                  نشر مشروع
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Layout: Sidebar + Feed ─── */}
      <div
        className="max-w-[1200px] mx-auto px-6"
        style={{ marginTop: '32px', marginBottom: '32px' }}
      >

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden w-full flex items-center justify-center gap-2 mb-4 text-sm font-semibold transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {showFilters ? 'إخفاء الفلاتر' : 'فلترة المشاريع'}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Filters Sidebar ─── */}
          <aside
            className={`lg:w-[280px] flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
            style={{ position: 'sticky', top: '96px', alignSelf: 'start' }}
          >
            {/* Category Filter */}
            <div className="mb-6">
              <h3
                className="mb-3 uppercase"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--fg)',
                }}
              >
                الفئة
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="w-full text-right px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: category === cat.value ? 'var(--accent-soft)' : 'transparent',
                      color: category === cat.value ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: category === cat.value ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h3
                className="mb-3 uppercase"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--fg)',
                }}
              >
                ترتيب حسب
              </h3>
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
                    className="w-full text-right px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: sort === s.value ? 'var(--accent-soft)' : 'transparent',
                      color: sort === s.value ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: sort === s.value ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ─── Job Feed ─── */}
          <main className="flex-1 flex flex-col gap-4">

            {/* Search Bar */}
            <div
              className="flex items-center gap-3 mb-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
              }}
            >
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن مشروع (مثلاً: مطور React، مصمم UI)..."
                className="flex-1 border-none outline-none bg-transparent"
                style={{
                  font: 'inherit',
                  fontSize: '15px',
                  color: 'var(--fg)',
                }}
              />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جارٍ التحميل...
                  </span>
                ) : (
                  <>
                    <strong style={{ color: 'var(--fg)' }}>{filtered.length}</strong> مشروع
                  </>
                )}
              </span>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl p-6"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="h-4 rounded w-2/3 mb-3" style={{ background: 'var(--bg)' }} />
                    <div className="h-3 rounded w-full mb-2" style={{ background: 'var(--bg)' }} />
                    <div className="h-3 rounded w-4/5" style={{ background: 'var(--bg)' }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Empty State */
              <div
                className="text-center py-16 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <SearchX className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>لا توجد مشاريع في هذه الفئة</p>
                {user && (
                  <Link href="/jobs/new" className="btn btn-accent" style={{ fontSize: '14px' }}>
                    كن أول من ينشر مشروعاً
                  </Link>
                )}
              </div>
            ) : (
              /* Job Cards */
              <div className="space-y-4">
                {filtered.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block group rounded-xl p-6 transition-all duration-200"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget.style.borderColor = 'var(--accent)');
                      (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)')
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget.style.borderColor = 'var(--border)');
                      (e.currentTarget.style.boxShadow = 'none')
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                          >
                            {categoryLabel(job.category)}
                          </span>
                          {job.required_skills?.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full"
                              style={{ background: 'var(--bg)', color: 'var(--muted)' }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Title */}
                        <h2
                          className="text-[20px] font-bold mb-2 transition-colors"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', margin: 0, marginBottom: '8px' }}
                        >
                          {job.title}
                        </h2>

                        {/* Description */}
                        <p
                          className="text-[14px] leading-relaxed mb-4 line-clamp-2"
                          style={{ color: 'var(--fg)', opacity: 0.8 }}
                        >
                          {job.description}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {job.profiles?.full_name || job.profiles?.username}
                          </span>
                          {job.profiles?.wilaya && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {WILAYAS[job.profiles.wilaya] || `ولاية ${job.profiles.wilaya}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(job.created_at)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {job.proposals_count} عرض
                          </span>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="flex-shrink-0 text-left">
                        <div className="text-[16px] font-bold" style={{ color: 'var(--fg)' }}>
                          {job.budget_min && job.budget_max
                            ? `${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()}`
                            : job.budget_max
                            ? `حتى ${job.budget_max.toLocaleString()}`
                            : 'تفاوض'}
                        </div>
                        <div className="text-xs text-left" style={{ color: 'var(--muted)' }}>دج</div>
                        {job.deadline && (
                          <div
                            className="flex items-center gap-1 mt-2 text-xs"
                            style={{ color: 'var(--warning)' }}
                          >
                            <Clock className="w-3 h-3" />
                            {new Date(job.deadline).toLocaleDateString('ar-DZ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
