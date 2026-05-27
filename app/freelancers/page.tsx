'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Search,
  SlidersHorizontal,
  User,
  MapPin,
  Star,
  MessageSquare,
  SearchX,
  Loader2,
  CheckCircle,
  Briefcase,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react'

interface Freelancer {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
  role: string
  wilaya: number
  skills: string[]
  hourly_rate: number
  is_verified: boolean
  rating: number
  total_reviews: number
  created_at: string
}

const CATEGORIES = [
  { value: 'all', label: 'جميع التخصصات' },
  { value: 'development', label: 'تطوير برمجي' },
  { value: 'design', label: 'تصميم وجرافيك' },
  { value: 'marketing', label: 'تسويق رقمي' },
  { value: 'writing', label: 'كتابة محتوى' },
  { value: 'translation', label: 'ترجمة ولغات' },
  { value: 'data', label: 'بيانات وتحليل' },
  { value: 'other', label: 'تخصصات أخرى' },
]

const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
  'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
  'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة',
  'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان',
  'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'إن صالح', 'إن قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة'
]

// Intelligent keyword-to-category mapping for profiles since category is not directly stored on profiles
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  development: ['react', 'next.js', 'node.js', 'python', 'laravel', 'wordpress', 'javascript', 'php', 'html', 'css', 'web', 'app', 'برمجة', 'تطوير', 'مطور', 'كود', 'مبرمج'],
  design: ['figma', 'ui/ux', 'photoshop', 'illustrator', 'design', 'graphic', 'logo', 'تصميم', 'جرافيك', 'شعار', 'صورة', 'مصمم'],
  marketing: ['seo', 'ads', 'marketing', 'social media', 'تسويق', 'إعلانات', 'سيو', 'مسوق'],
  writing: ['writing', 'content', 'copywriting', 'كتابة', 'محتوى', 'مقالات', 'تدوين', 'كاتب'],
  translation: ['translation', 'english', 'french', 'arabic', 'ترجمة', 'فرنسي', 'إنجليزي', 'لغات', 'مترجم'],
  data: ['data', 'analysis', 'excel', 'sql', 'بيانات', 'تحليل', 'إحصاء', 'محلل'],
}

function getArabicRatingDescriptor(rating: number): string {
  if (rating >= 4.8) return 'ممتاز'
  if (rating >= 4.3) return 'جيد جداً'
  if (rating >= 3.5) return 'جيد'
  if (rating >= 2.5) return 'مقبول'
  return 'سيئ'
}

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [wilayaFilter, setWilayaFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [sort, setSort] = useState('rating_high')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    fetchFreelancers()
  }, [])

  const fetchFreelancers = async () => {
    setLoading(true)
    try {
      // Fetch users whose role includes freelancer or both
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['freelancer', 'both'])
        .eq('is_banned', false)

      if (error) throw error

      setFreelancers(data || [])
    } catch (e) {
      console.error('Error fetching freelancers:', e)
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering logic
  const filtered = freelancers.filter(f => {
    // 1. Search query
    const matchesSearch =
      search === '' ||
      f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.bio?.toLowerCase().includes(search.toLowerCase()) ||
      f.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))

    // 2. Category mapping
    let matchesCategory = true
    if (category !== 'all') {
      const keywords = CATEGORY_KEYWORDS[category] || []
      const hasMatchingSkill = f.skills?.some(s =>
        keywords.some(kw => s.toLowerCase().includes(kw))
      )
      const hasMatchingBio = keywords.some(kw => f.bio?.toLowerCase().includes(kw))
      matchesCategory = hasMatchingSkill || hasMatchingBio
    }

    // 3. Wilaya Filter
    const matchesWilaya = wilayaFilter === 'all' || f.wilaya?.toString() === wilayaFilter

    // 4. Verification status
    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && f.is_verified)

    return matchesSearch && matchesCategory && matchesWilaya && matchesVerification
  })

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'rating_high') {
      return (b.rating || 0) - (a.rating || 0) || b.total_reviews - a.total_reviews
    }
    if (sort === 'reviews_count') {
      return b.total_reviews - a.total_reviews
    }
    if (sort === 'hourly_high') {
      return (b.hourly_rate || 0) - (a.hourly_rate || 0)
    }
    if (sort === 'hourly_low') {
      return (a.hourly_rate || 999999) - (b.hourly_rate || 999999)
    }
    if (sort === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return 0
  })

  const renderStars = (rating: number) => {
    const stars = []
    const roundedRating = Number(rating) || 0
    const fullStars = Math.floor(roundedRating)
    const hasHalf = roundedRating % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <span key={i} className="relative inline-block w-3.5 h-3.5 overflow-hidden">
            <Star className="absolute top-0 right-0 w-3.5 h-3.5 text-slate-200 fill-slate-200" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 overflow-hidden" style={{ width: '50%' }}>
              <Star className="absolute top-0 right-0 w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
          </span>
        )
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-slate-200 fill-slate-200" />)
      }
    }
    return stars
  }

  return (
    <div className="min-h-screen pb-12" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      
      {/* ─── Top Navigation ─── */}
      <header className="topnav sticky top-0 z-50 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-16">
          <Link
            href={currentUser ? '/dashboard' : '/'}
            className="text-[19px] font-bold ml-12 group flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={16} className="text-white" />
            </div>
            <span>خدمة<span style={{ color: 'var(--accent)' }}>.dz</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/jobs"
              className="text-[14px] font-medium transition-colors hover:text-[var(--fg)]"
              style={{ color: 'var(--muted)', textDecoration: 'none' }}
            >
              تصفح المشاريع
            </Link>
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--fg)', fontWeight: 600 }}
            >
              تصفح المستقلين
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
            {currentUser ? (
              <>
                <span className="text-[14px] font-semibold hidden sm:inline" style={{ color: 'var(--fg)' }}>
                  {currentUser.user_metadata?.full_name || currentUser.email}
                </span>
                <Link href="/dashboard" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  لوحة التحكم
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold transition-colors hover:text-accent" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                  تسجيل الدخول
                </Link>
                <Link href="/auth/register" className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  ابدأ الآن
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="bg-white border-b border-slate-200/60 py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-6 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-accent-soft text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Award size={13} />
                <span>نخبة المهنيين الجزائريين</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight">ابحث عن أفضل المستقلين</h1>
              <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                تواصل مع نخبة من الخبراء والمبدعين الجزائريين في مختلف المجالات الرقمية لإنجاز مشاريعك بكل احترافية وضمان.
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 sm:gap-1 text-center bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 self-center min-w-[180px]">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{sorted.length}</span>
              <span className="text-xs font-semibold text-slate-500">مستقل متوفر حالياً</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden w-full flex items-center justify-center gap-2 mb-4 text-sm font-semibold transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          {showFilters ? 'إخفاء الفلاتر والأدوات' : 'تصفية وبحث متقدم'}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ─── Filter Sidebar ─── */}
          <aside className={`lg:w-[280px] flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="space-y-6" style={{ position: 'sticky', top: '96px', alignSelf: 'start' }}>
              
              {/* Category Filter */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">التخصص الرئيسي</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className="w-full text-right px-3 py-2 rounded-xl text-sm transition-all"
                      style={{
                        background: category === cat.value ? 'var(--accent-soft)' : 'transparent',
                        color: category === cat.value ? 'var(--accent)' : 'var(--muted)',
                        fontWeight: category === cat.value ? 700 : 400,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wilaya Filter */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">الولاية</h3>
                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                >
                  <option value="all">كل الولايات (58)</option>
                  {WILAYAS.map((w, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} - {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">حالة الحساب</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="verification"
                      checked={verificationFilter === 'all'}
                      onChange={() => setVerificationFilter('all')}
                      className="accent-accent"
                    />
                    <span>الكل</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="verification"
                      checked={verificationFilter === 'verified'}
                      onChange={() => setVerificationFilter('verified')}
                      className="accent-accent"
                    />
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>الحسابات الموثقة فقط (KYC)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Sort Options */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">الترتيب حسب</h3>
                <div className="space-y-1">
                  {[
                    { value: 'rating_high', label: 'الأعلى تقييماً' },
                    { value: 'reviews_count', label: 'الأكثر مراجعة' },
                    { value: 'hourly_low', label: 'أقل سعر بالساعة' },
                    { value: 'hourly_high', label: 'أعلى سعر بالساعة' },
                    { value: 'newest', label: 'المسجلون حديثاً' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSort(s.value)}
                      className="w-full text-right px-3 py-2 rounded-xl text-sm transition-all"
                      style={{
                        background: sort === s.value ? 'var(--accent-soft)' : 'transparent',
                        color: sort === s.value ? 'var(--accent)' : 'var(--muted)',
                        fontWeight: sort === s.value ? 700 : 400,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* ─── Freelancers Directory Feed ─── */}
          <section className="flex-1 flex flex-col gap-5">
            
            {/* Search Input Bar */}
            <div
              className="flex items-center gap-3"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 18px',
              }}
            >
              <Search className="w-5 h-5 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، المهارات أو الكلمات المفتاحية (مثلاً: React، مصمم، سيو)..."
                className="flex-1 border-none outline-none bg-transparent"
                style={{
                  font: 'inherit',
                  fontSize: '15px',
                  color: 'var(--fg)',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Loading Indicator */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl p-6 bg-white border border-slate-100"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-150 rounded w-full" />
                        <div className="h-3 bg-slate-150 rounded w-4/5" />
                        <div className="flex gap-2 pt-2">
                          <div className="h-6 bg-slate-100 rounded-lg w-16" />
                          <div className="h-6 bg-slate-100 rounded-lg w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              
              /* Empty State view */
              <div className="text-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <SearchX className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">لا يوجد مستقلون مطابقون للبحث</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  حاول تغيير الكلمات الدلالية أو الفلاتر المختارة للعثور على المستقل المناسب.
                </p>
                <button
                  onClick={() => { setSearch(''); setCategory('all'); setWilayaFilter('all'); setVerificationFilter('all') }}
                  className="mt-5 bg-accent-soft text-accent text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-accent hover:text-white transition-all cursor-pointer"
                >
                  إعادة ضبط جميع الفلاتر
                </button>
              </div>

            ) : (

              /* Freelancer List Cards */
              <div className="space-y-4">
                {sorted.map((freelancer) => {
                  const hasRating = freelancer.total_reviews > 0
                  const isOwnProfile = currentUser?.id === freelancer.id

                  return (
                    <div
                      key={freelancer.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:border-accent hover:shadow-md hover:shadow-slate-100/50 flex flex-col md:flex-row gap-5"
                    >
                      {/* Left: Avatar Column */}
                      <div className="flex-shrink-0 flex md:flex-col items-center justify-between md:justify-start gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-xs">
                            {freelancer.avatar_url ? (
                              <img
                                src={freelancer.avatar_url}
                                alt={freelancer.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-accent/20 to-accent/5 flex items-center justify-center text-accent text-xl sm:text-2xl font-bold font-display">
                                {freelancer.full_name?.charAt(0) || freelancer.username?.charAt(0)}
                              </div>
                            )}
                          </div>
                          {freelancer.is_verified && (
                            <span
                              className="absolute bottom-0 left-0 bg-white rounded-full p-0.5 border border-slate-50 shadow-xs"
                              title="حساب موثق بالهوية الوطنية"
                            >
                              <CheckCircle size={18} className="text-emerald-500 fill-emerald-50" />
                            </span>
                          )}
                        </div>

                        {/* Wilaya & Hourly Rate for Tablet/Desktop */}
                        <div className="hidden md:flex flex-col items-center gap-1.5 w-full pt-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg w-full justify-center">
                            <MapPin size={12} className="text-slate-400" />
                            <span>
                              {freelancer.wilaya
                                ? WILAYAS[freelancer.wilaya - 1]
                                : 'الجزائر'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft/30 px-2.5 py-1 rounded-lg w-full justify-center">
                            <DollarSign size={12} />
                            <span>
                              {freelancer.hourly_rate
                                ? `${Number(freelancer.hourly_rate).toLocaleString()} دج/س`
                                : 'تفاوضي'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Content/Info Column */}
                      <div className="flex-1 flex flex-col">
                        
                        {/* Name and Rating */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 mb-2.5">
                          <div>
                            <Link
                              href={`/profile/${freelancer.username}`}
                              className="text-lg font-bold text-slate-900 hover:text-accent transition-colors font-sans flex items-center gap-2 group decoration-transparent"
                            >
                              <span>{freelancer.full_name || freelancer.username}</span>
                              <span className="text-xs font-mono font-normal text-slate-400 group-hover:text-accent/80 transition-colors">@{freelancer.username}</span>
                            </Link>
                          </div>

                          {/* Ratings Display */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {renderStars(freelancer.rating || 0)}
                            </div>
                            <span className="text-xs font-extrabold text-slate-800">
                              {freelancer.rating ? Number(freelancer.rating).toFixed(1) : 'جديد'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({freelancer.total_reviews} {freelancer.total_reviews === 1 ? 'تقييم' : 'تقييمات'})
                            </span>
                            {hasRating && (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1">
                                {getArabicRatingDescriptor(freelancer.rating)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bio Text */}
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                          {freelancer.bio || 'لا توجد نبذة تعريفية مضافة حالياً. يمكنك تصفح الملف الشخصي لمشاهدة المهارات ومعرض الأعمال.'}
                        </p>

                        {/* Skills Badges list */}
                        {freelancer.skills && freelancer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {freelancer.skills.slice(0, 7).map((skill, index) => (
                              <span
                                key={index}
                                className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-100"
                                style={{ background: 'var(--bg)', color: 'var(--muted)' }}
                              >
                                {skill}
                              </span>
                            ))}
                            {freelancer.skills.length > 7 && (
                              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">
                                +{freelancer.skills.length - 7} مهارات
                              </span>
                            )}
                          </div>
                        )}

                        {/* Mobile Only Wilaya and Budget Row */}
                        <div className="flex md:hidden items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                            <MapPin size={11} className="text-slate-400" />
                            <span>
                              {freelancer.wilaya
                                ? WILAYAS[freelancer.wilaya - 1]
                                : 'الجزائر'}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft/30 px-2 py-0.5 rounded-lg">
                            <DollarSign size={11} />
                            <span>
                              {freelancer.hourly_rate
                                ? `${Number(freelancer.hourly_rate).toLocaleString()} دج/س`
                                : 'تفاوض'}
                            </span>
                          </span>
                        </div>

                      </div>

                      {/* Right: Actions Column */}
                      <div className="flex sm:flex-row md:flex-col justify-end gap-2.5 md:w-[150px] flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-r border-slate-150/60 md:pr-5">
                        <Link
                          href={`/profile/${freelancer.username}`}
                          className="flex-1 md:w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition-all text-center decoration-transparent"
                        >
                          <span>عرض الملف</span>
                          <ArrowRight size={14} className="scale-x-[-1] flex-shrink-0" />
                        </Link>
                        {!isOwnProfile && currentUser && (
                          <Link
                            href={`/messages?user=${freelancer.id}`}
                            className="flex-1 md:w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent text-white font-semibold rounded-xl text-xs sm:text-sm hover:bg-accent-hover transition-all text-center shadow-sm shadow-accent/10 decoration-transparent"
                          >
                            <MessageSquare size={14} className="flex-shrink-0" />
                            <span>مراسلة</span>
                          </Link>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  )
}
