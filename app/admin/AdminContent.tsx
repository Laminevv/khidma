'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { banUserAction, verifyUserAction, deleteJobAction } from '@/app/actions/admin'
import {
  getKycSubmissionsAction,
  getKycDocumentUrlAction,
  approveKycAction,
  rejectKycAction,
} from '@/app/actions/kyc'
import DisputesTab from './DisputesTab'
import {
  Briefcase,
  Users,
  ShieldAlert,
  ShieldCheck,
  Ban,
  TrendingUp,
  Loader2,
  ExternalLink,
  Clock,
  Search,
  Check,
  X,
  Scale
} from 'lucide-react'

interface Stats {
  total_users: number
  new_users_30d: number
  active_jobs: number
  active_contracts: number
  open_disputes: number
  banned_users: number
  active_escrow_volume: number
  pending_kyc_requests: number
}

interface User {
  id: string
  username: string
  full_name: string
  role: string
  is_verified: boolean
  is_banned: boolean
  is_admin: boolean
  deposit_balance: number
  withdrawable_balance: number
  rating: number
  created_at: string
}

interface Job {
  id: string
  title: string
  category: string
  status: string
  proposals_count: number
  budget_max: number
  created_at: string
  profiles: { username: string; full_name: string }
}

interface KycSubmission {
  id: string
  user_id: string
  status: string
  id_type: string
  id_front_url: string
  id_back_url: string | null
  selfie_url: string | null
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  profiles: { username: string; full_name: string | null; avatar_url: string | null }
}

type Tab = 'overview' | 'kyc' | 'users' | 'jobs' | 'disputes'
type KycFilter = 'pending' | 'approved' | 'rejected' | 'all'

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'بطاقة التعريف البيومترية',
  passport: 'جواز السفر البيومتري',
  driving_license: 'رخصة السياقة',
}

const CATEGORY_LABELS: Record<string, string> = {
  development: 'تطوير برمجي',
  design: 'تصميم وجرافيك',
  marketing: 'تسويق رقمي',
  writing: 'كتابة محتوى',
  translation: 'ترجمة ولغات',
  data: 'بيانات وتحليل',
  other: 'أخرى',
}

export default function AdminPage() {
  const router = useRouter()
  
  // Auth and page loading states
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  
  // Data lists states
  const [users, setUsers] = useState<User[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([])
  
  // Search and filter states
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState<KycFilter>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // KYC Review Modal State
  const [reviewTarget, setReviewTarget] = useState<KycSubmission | null>(null)
  const [docUrls, setDocUrls] = useState<{ front?: string; back?: string; selfie?: string }>({})
  const [docLoading, setDocLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectMode, setRejectMode] = useState(false)

  const fetchStats = async () => {
    // Parallel counting queries
    const [
      { count: totalUsers },
      { count: newUsers },
      { count: activeJobs },
      { count: activeContracts },
      { count: openDisputes },
      { count: bannedUsers },
      { count: pendingKyc }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    // Calculate Active Escrow Volume (locked milestone funds)
    const { data: activeContractsData } = await supabase
      .from('contracts')
      .select('total_amount')
      .eq('status', 'active')
    
    const activeEscrowVolume = activeContractsData?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0

    setStats({
      total_users: totalUsers || 0,
      new_users_30d: newUsers || 0,
      active_jobs: activeJobs || 0,
      active_contracts: activeContracts || 0,
      open_disputes: openDisputes || 0,
      banned_users: bannedUsers || 0,
      active_escrow_volume: activeEscrowVolume,
      pending_kyc_requests: pendingKyc || 0,
    })
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .limit(100)
    setUsers(data || [])
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles!client_id(username, full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    const formatted = (data || []).map((j) => {
      const item = j as unknown as {
        id: string
        title: string
        category: string
        status: string
        proposals_count: number
        budget_max: number
        created_at: string
        profiles: { username: string; full_name: string } | { username: string; full_name: string }[]
      }
      return {
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }
    })
    setJobs(formatted)
  }

  const fetchKycSubmissions = async (status: KycFilter) => {
    const res = await getKycSubmissionsAction(status)
    const formatted = (res.submissions || []).map((s) => {
      const item = s as unknown as {
        id: string
        user_id: string
        status: string
        id_type: string
        id_front_url: string
        id_back_url: string | null
        selfie_url: string | null
        rejection_reason: string | null
        submitted_at: string
        reviewed_at: string | null
        profiles: { username: string; full_name: string | null; avatar_url: string | null } | { username: string; full_name: string | null; avatar_url: string | null }[]
      }
      return {
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }
    })
    setKycSubmissions(formatted)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchJobs(),
        fetchKycSubmissions('pending')
      ])
      setLoading(false)
    }
    init()
  }, [router])

  const handleKycFilterChange = async (f: KycFilter) => {
    setKycFilter(f)
    setActionLoading('kyc_fetch')
    await fetchKycSubmissions(f)
    setActionLoading(null)
  }

  // Admin user ban mutator
  const banUser = async (userId: string, isBanned: boolean) => {
    setActionLoading(`ban_${userId}`)
    const res = await banUserAction(userId, isBanned)
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u))
      fetchStats()
    } else {
      alert(res.error || 'حدث خطأ فني أثناء تعديل حظر المستخدم.')
    }
    setActionLoading(null)
  }

  // Admin user verification mutator
  const verifyUser = async (userId: string, isVerified: boolean) => {
    setActionLoading(`verify_${userId}`)
    const res = await verifyUserAction(userId, isVerified)
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !isVerified } : u))
    } else {
      alert(res.error || 'حدث خطأ فني أثناء تحديث شارة التوثيق.')
    }
    setActionLoading(null)
  }

  // Admin job deletion mutator
  const deleteJob = async (jobId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟')) return
    setActionLoading(`job_${jobId}`)
    const res = await deleteJobAction(jobId)
    if (res.success) {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      fetchStats()
    } else {
      alert(res.error || 'حدث خطأ أثناء محاولة حذف المشروع.')
    }
    setActionLoading(null)
  }

  // Open secure KYC Review Modal and fetch Private storage signed URLs
  const openKycReview = async (sub: KycSubmission) => {
    setReviewTarget(sub)
    setRejectMode(false)
    setRejectReason('')
    setDocUrls({})
    setDocLoading(true)

    const urls: { front?: string; back?: string; selfie?: string } = {}
    const frontRes = await getKycDocumentUrlAction(sub.id_front_url)
    if ('url' in frontRes) urls.front = frontRes.url

    if (sub.id_back_url) {
      const backRes = await getKycDocumentUrlAction(sub.id_back_url)
      if ('url' in backRes) urls.back = backRes.url
    }
    if (sub.selfie_url) {
      const selfieRes = await getKycDocumentUrlAction(sub.selfie_url)
      if ('url' in selfieRes) urls.selfie = selfieRes.url
    }

    setDocUrls(urls)
    setDocLoading(false)
  }

  // KYC Approval mutator
  const handleApproveKyc = async () => {
    if (!reviewTarget) return
    if (!confirm('هل أنت متأكد من قبول أوراق الهوية هذه؟ سيتم توثيق المستخدم وتفعيل الشارة زرقاء.')) return
    
    setActionLoading(`approve_kyc_${reviewTarget.id}`)
    const res = await approveKycAction(reviewTarget.id)
    if (res.success) {
      setKycSubmissions(prev => prev.filter(s => s.id !== reviewTarget.id))
      setReviewTarget(null)
      fetchStats()
      fetchUsers()
    } else {
      alert(res.error || 'حدث خطأ أثناء محاولة تفعيل شارة الهوية.')
    }
    setActionLoading(null)
  }

  // KYC Rejection mutator
  const handleRejectKyc = async () => {
    if (!reviewTarget) return
    if (rejectReason.trim().length < 5) {
      alert('يرجى تدوين سبب الرفض بالتفصيل (5 أحرف على الأقل).')
      return
    }

    setActionLoading(`reject_kyc_${reviewTarget.id}`)
    const res = await rejectKycAction(reviewTarget.id, rejectReason.trim())
    if (res.success) {
      setKycSubmissions(prev => prev.filter(s => s.id !== reviewTarget.id))
      setReviewTarget(null)
      setRejectMode(false)
      setRejectReason('')
      fetchStats()
    } else {
      alert(res.error || 'حدث خطأ أثناء محاولة رفض المعاملة.')
    }
    setActionLoading(null)
  }

  // Data Filtering
  const filteredUsers = users.filter(u =>
    search === '' ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredJobs = jobs.filter(j =>
    search === '' ||
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-sm font-semibold text-slate-500 font-sans">تأمين الحساب والتحضير للوحة التحكم...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen pb-12" dir="rtl" style={{ background: '#0b0f19', color: '#f8fafc' }}>
      
      {/* ─── Top Navbar ─── */}
      <nav className="border-b border-slate-800 bg-[#0f172a] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/15">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-white text-base">خدمة<span className="text-accent">.dz</span></span>
            <span className="bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">لوحة الإشراف العليا</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors hover:no-underline" style={{ textDecoration: 'none' }}>
              ← مغادرة لوحة التحكم
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Main Content Grid ─── */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Navigation Tabs bar */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { key: 'overview', label: '📊 ملخص الأداء' },
            { key: 'kyc',      label: '🪪 توثيق الهوية (KYC)', count: stats?.pending_kyc_requests },
            { key: 'users',    label: '👥 إدارة الحسابات' },
            { key: 'jobs',     label: '📋 فلترة المشاريع' },
            { key: 'disputes', label: '⚖️ النزاعات والدعم', count: stats?.open_disputes },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as Tab); setSearch('') }}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === t.key
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/15'
                  : 'bg-[#111827] text-slate-400 border-slate-800 hover:bg-[#1a2336] hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-white text-accent animate-pulse' : 'bg-rose-500 text-white animate-pulse'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: OVERVIEW METRICS ─── */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Overview Stats Cards */}
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                <span>نظرة عامة على صحة وأداء المنصة</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي المستخدمين', value: stats.total_users, icon: <Users size={22} />, color: 'border-r-blue-500 bg-[#0f172a]' },
                  { label: 'نشاط رصيد الضمان (Escrow)', value: `${stats.active_escrow_volume.toLocaleString()} دج`, icon: <TrendingUp size={22} />, color: 'border-r-emerald-500 bg-[#0f172a]' },
                  { label: 'طلبات توثيق معلقة (KYC)', value: stats.pending_kyc_requests, icon: <ShieldCheck size={22} />, color: 'border-r-amber-500 bg-[#0f172a]', animate: stats.pending_kyc_requests > 0 },
                  { label: 'نزاعات معلقة للفصل', value: stats.open_disputes, icon: <ShieldAlert size={22} />, color: 'border-r-rose-500 bg-[#0f172a]', animate: stats.open_disputes > 0 },
                  { label: 'مشاريع معلنة ونشطة', value: stats.active_jobs, icon: <Briefcase size={22} />, color: 'border-r-indigo-500 bg-[#0f172a]' },
                  { label: 'عقود نشطة حالياً', value: stats.active_contracts, icon: <Clock size={22} />, color: 'border-r-purple-500 bg-[#0f172a]' },
                  { label: 'مستخدمون جدد (30 يوم)', value: stats.new_users_30d, icon: <Users size={22} />, color: 'border-r-teal-500 bg-[#0f172a]' },
                  { label: 'حسابات محظورة', value: stats.banned_users, icon: <Ban size={22} />, color: 'border-r-slate-600 bg-[#0f172a]' },
                ].map((s, idx) => (
                  <div key={idx} className={`rounded-3xl border border-slate-800 p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden shadow-sm ${s.color}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-xs font-bold leading-relaxed">{s.label}</span>
                      <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 ${s.animate ? 'animate-pulse text-amber-500' : ''}`}>
                        {s.icon}
                      </div>
                    </div>
                    <div className="pt-4">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">{s.value}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Control Deck */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-white text-sm sm:text-base mb-4">وحدات التحكم السريعة</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <button onClick={() => setActiveTab('kyc')} className="bg-[#111827] hover:bg-[#1a2336] border border-slate-800 hover:border-slate-700 text-slate-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] cursor-pointer">
                  <span>🆔</span>
                  <span>طلبات التوثيق</span>
                </button>
                <button onClick={() => setActiveTab('users')} className="bg-[#111827] hover:bg-[#1a2336] border border-slate-800 hover:border-slate-700 text-slate-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] cursor-pointer">
                  <span>👥</span>
                  <span>إدارة الأعضاء</span>
                </button>
                <button onClick={() => setActiveTab('disputes')} className="bg-[#111827] hover:bg-[#1a2336] border border-slate-800 hover:border-slate-700 text-slate-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] cursor-pointer">
                  <span>⚖️</span>
                  <span>تسوية النزاعات المفتوحة</span>
                </button>
                <Link href="/admin/payments" className="bg-[#111827] hover:bg-[#1a2336] border border-slate-800 hover:border-slate-700 text-slate-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] hover:no-underline decoration-transparent" style={{ textDecoration: 'none' }}>
                  <span>💳</span>
                  <span>الإيداعات المالية</span>
                </Link>
                <Link href="/admin/withdrawals" className="bg-[#111827] hover:bg-[#1a2336] border border-slate-800 hover:border-slate-700 text-slate-200 p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] hover:no-underline decoration-transparent" style={{ textDecoration: 'none' }}>
                  <span>💸</span>
                  <span>طلبات سحب الأرباح</span>
                </Link>
                <Link href="/dashboard" className="bg-accent hover:bg-accent-hover text-white p-4 rounded-2xl text-xs sm:text-sm font-bold text-right transition-all flex flex-col justify-between min-h-[100px] hover:no-underline decoration-transparent shadow-md shadow-accent/15" style={{ textDecoration: 'none' }}>
                  <span>🌐</span>
                  <span>عرض المنصة الرئيسية</span>
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 2: DEDICATED KYC MANAGEMENT DESK ─── */}
        {activeTab === 'kyc' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <span>طلبات التحقق من الهوية الوطنية (KYC)</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">راجع وثائق الهوية البيومترية المرفوعة من المستقلين لتفعيل شارة التوثيق البرونزية.</p>
              </div>

              {/* Status Selector Filters */}
              <div className="flex gap-2 flex-wrap bg-[#0f172a] border border-slate-800 p-1.5 rounded-2xl">
                {([
                  { key: 'pending',  label: '⏳ معلقة' },
                  { key: 'approved', label: '✅ مقبولة' },
                  { key: 'rejected', label: '❌ مرفوضة' },
                  { key: 'all',      label: '📋 الكل' },
                ] as { key: KycFilter; label: string }[]).map(filterItem => (
                  <button
                    key={filterItem.key}
                    onClick={() => handleKycFilterChange(filterItem.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      kycFilter === filterItem.key
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KYC Table Grid */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              {actionLoading === 'kyc_fetch' ? (
                <div className="text-center py-20">
                  <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
                  <span className="text-slate-400 text-xs font-bold">جاري تحميل قائمة طلبات التحقق...</span>
                </div>
              ) : kycSubmissions.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">📭</div>
                  <h4 className="text-sm font-bold text-slate-350">قائمة المستندات فارغة</h4>
                  <p className="text-xs text-slate-500 mt-1">لا توجد طلبات هوية تطابق الفلترة المحددة حالياً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#111827]/40">
                        <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">العضو / المستقل</th>
                        <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">نوع وثيقة الإثبات</th>
                        <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">تاريخ التقديم</th>
                        <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">حالة التدقيق</th>
                        <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {kycSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {sub.profiles?.full_name?.charAt(0) || sub.profiles?.username?.charAt(0) || '؟'}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-white block">{sub.profiles?.full_name || '—'}</span>
                                <span className="text-xs text-slate-400 block mt-0.5">@{sub.profiles?.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-[#111827] border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                              {ID_TYPE_LABELS[sub.id_type] || sub.id_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                            {new Date(sub.submitted_at).toLocaleDateString('ar-DZ')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                              sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                              sub.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse'
                            }`}>
                              {sub.status === 'approved' ? 'تم قبولها' : sub.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openKycReview(sub)}
                              className="bg-accent text-white hover:bg-accent-hover text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{sub.status === 'pending' ? '🔍 مراجعة وتدقيق' : '👁️ معاينة المستند'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── TAB 3: USER MANAGEMENT DESK ─── */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <span>إدارة حسابات الأعضاء</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">تعديل التوثيق، الحظر، ومعاينة أرصدة العملاء والمستقلين.</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو اسم المستخدم..."
                  className="bg-[#0f172a] border border-slate-800 text-white text-xs px-4 py-2.5 rounded-2xl w-64 focus:outline-none focus:border-accent tracking-wide"
                  style={{ color: 'white', backgroundColor: '#0f172a' }}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#111827]/40">
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">العضو</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">الدور الفعلي</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">المحفظة (دج)</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">شارة التوثيق</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">تاريخ الانضمام</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {user.full_name?.charAt(0) || user.username?.charAt(0) || '؟'}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">{user.full_name || '—'}</span>
                              <span className="text-xs text-slate-400 block mt-0.5">@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            user.role === 'client' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            user.role === 'freelancer' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {user.role === 'client' ? 'عميل (صاحب عمل)' : user.role === 'freelancer' ? 'مستقل' : 'مستقل وعميل'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-200">
                          {((user.deposit_balance || 0) + (user.withdrawable_balance || 0)).toLocaleString()} دج
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.is_banned && <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-lg font-bold">محظور</span>}
                            {user.is_verified && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-lg font-bold">موثق ✓</span>}
                            {!user.is_banned && !user.is_verified && <span className="text-xs text-slate-500 font-semibold">عادي</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                          {new Date(user.created_at).toLocaleDateString('ar-DZ')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => verifyUser(user.id, user.is_verified)}
                              disabled={!!actionLoading}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                                user.is_verified
                                  ? 'bg-[#111827] text-slate-300 border-slate-800 hover:bg-[#1a2336]'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {actionLoading === `verify_${user.id}` ? '...' : user.is_verified ? 'إلغاء التوثيق' : 'توثيق الحساب'}
                            </button>
                            
                            <button
                              onClick={() => banUser(user.id, user.is_banned)}
                              disabled={!!actionLoading}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                                user.is_banned
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              {actionLoading === `ban_${user.id}` ? '...' : user.is_banned ? 'فك الحظر' : 'حظر الحساب'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-slate-500 font-bold">لا يوجد أعضاء مطابقون للبحث</div>
              )}
            </div>

          </div>
        )}

        {/* ─── TAB 4: JOB MONITORING DESK ─── */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <span>رقابة المشاريع المنشورة</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">تتبع جودة المشاريع ومراقبة العروض المقدمة وتصفية المحتوى المسيء.</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بعناوين المشاريع..."
                  className="bg-[#0f172a] border border-slate-800 text-white text-xs px-4 py-2.5 rounded-2xl w-64 focus:outline-none focus:border-accent"
                  style={{ color: 'white', backgroundColor: '#0f172a' }}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#111827]/40">
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">تفاصيل المشروع</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">صاحب العمل</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">الفئة الرئيسية</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">الحالة</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">العروض المودعة</th>
                      <th className="text-right px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-white block">{job.title}</span>
                          <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                            {job.budget_max ? `الميزانية القصوى: ${Number(job.budget_max).toLocaleString()} دج` : 'تفاوض مباشر'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs sm:text-sm text-slate-350">
                          @{job.profiles?.username}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-[#111827] border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                            {CATEGORY_LABELS[job.category] || job.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            job.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            job.status === 'in_progress' ? 'bg-yellow-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {job.status === 'open' ? 'مفتوح للتقديم' : job.status === 'in_progress' ? 'قيد التنفيذ' : job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-white">
                          {job.proposals_count || 0} عروض
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/jobs/${job.id}`} className="text-[10px] font-bold bg-[#111827] border border-slate-800 text-slate-200 hover:bg-[#1a2336] px-3.5 py-1.5 rounded-xl transition-all hover:no-underline text-center">
                              معاينة
                            </Link>
                            <button
                              onClick={() => deleteJob(job.id)}
                              disabled={actionLoading === `job_${job.id}`}
                              className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              {actionLoading === `job_${job.id}` ? '...' : 'حذف وإزالة'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredJobs.length === 0 && (
                <div className="text-center py-16 text-slate-500 font-bold">لا يوجد مشاريع مطابقة للبحث</div>
              )}
            </div>

          </div>
        )}

        {/* ─── TAB 5: DISPUTE & SUPPORT DESK ─── */}
        {activeTab === 'disputes' && (
          <div className="animate-fadeIn bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
              <Scale className="text-accent w-5 h-5" />
              <h2 className="font-extrabold text-slate-100 text-sm sm:text-base">مركز إدارة وفض النزاعات المالية</h2>
            </div>
            <DisputesTab />
          </div>
        )}

      </main>

      {/* ─── Secure KYC Document Review Overlay Drawer ─── */}
      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-fadeIn" onClick={() => !actionLoading && setReviewTarget(null)}>
          <div className="bg-[#0f172a] border border-slate-850 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 sticky top-0 bg-[#0f172a] z-10">
              <div>
                <h3 className="font-extrabold text-white text-base">مراجعة وثائق الهوية الوطنية</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">الرمز المرجعي: {reviewTarget.id.substring(0, 13)}... / {ID_TYPE_LABELS[reviewTarget.id_type] || reviewTarget.id_type}</p>
              </div>
              <button onClick={() => setReviewTarget(null)} className="text-slate-400 hover:text-slate-200 transition-all p-1 hover:bg-slate-800 rounded-lg cursor-pointer">
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 sm:px-8 py-6 space-y-6">
              
              {/* User Bio Stats Summary */}
              <div className="flex items-center gap-4 bg-[#111827] border border-slate-800 rounded-2xl p-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white text-base font-bold">
                  {reviewTarget.profiles?.full_name?.charAt(0) || '؟'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{reviewTarget.profiles?.full_name || '—'}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">@{reviewTarget.profiles?.username}</p>
                  <p className="text-[10px] text-slate-400 mt-1">تاريخ إرسال المستندات: {new Date(reviewTarget.submitted_at).toLocaleDateString('ar-DZ')}</p>
                </div>
              </div>

              {/* Secure Document Previews */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-3.5">الوثائق الرسمية المرفوعة</h4>
                
                {docLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2.5">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <span className="text-xs font-bold text-slate-400">جاري توليد روابط التشفير الآمنة...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Front document preview */}
                    <KycDocCard label="الجهة الأمامية" url={docUrls.front} required />
                    {/* Back document preview */}
                    <KycDocCard label="الجهة الخلفية" url={docUrls.back} />
                    {/* Selfie document preview */}
                    <KycDocCard label="السيلفي المطابق" url={docUrls.selfie} />
                  </div>
                )}
                
                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed bg-[#111827] border border-slate-800 p-2.5 rounded-xl flex items-center gap-1.5">
                  <Clock size={12} className="text-accent flex-shrink-0 animate-spin" />
                  <span>أمان عالي: الروابط المفرزة أعلاه مؤقتة (Expires in 60s) وسيتم حجبها تلقائياً بعد مرور دقيقة لحماية صور ID.</span>
                </p>
              </div>

              {/* Rejection Reason Form Box */}
              {rejectMode && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-rose-300 mb-2">يرجى كتابة سبب الرفض بالتفصيل <span className="text-rose-500">*</span></label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="مثال: الصورة الأمامية غير واضحة المعالم، يرجى إعادة التقاط الصورة في إضاءة كافية وحمل البطاقة..."
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-rose-500/25 bg-[#0f172a] text-slate-100 text-xs focus:outline-none focus:border-rose-400 transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-rose-400/80 mt-1.5">سيتم إرسال هذا التوضيح مباشرة إلى العضو عبر البريد وتنبيهات حسابه لمساعدته على التصحيح.</p>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            {reviewTarget.status === 'pending' && (
              <div className="px-6 sm:px-8 py-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3 bg-[#0f172a] rounded-b-3xl">
                {!rejectMode ? (
                  <>
                    <button
                      onClick={handleApproveKyc}
                      disabled={!!actionLoading || docLoading}
                      className="flex-1 bg-accent text-white hover:bg-accent-hover py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-accent/10 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading === `approve_kyc_${reviewTarget.id}` ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري قبول التوثيق...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>الموافقة وتوثيق الحساب رسمياً</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setRejectMode(true)}
                      disabled={!!actionLoading}
                      className="flex-1 bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-500/20 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-rose-400"
                    >
                      رفض هذا الطلب
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRejectKyc}
                      disabled={!!actionLoading || rejectReason.trim().length < 5}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-rose-500/15 transition-all disabled:opacity-45 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading === `reject_kyc_${reviewTarget.id}` ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري إرسال الرفض...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>تأكيد رفض الطلب نهائياً</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => { setRejectMode(false); setRejectReason('') }}
                      className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      إلغاء والتراجع
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Non-pending review close footer */}
            {reviewTarget.status !== 'pending' && (
              <div className="px-6 sm:px-8 py-5 border-t border-slate-800 bg-[#0f172a] rounded-b-3xl">
                <button
                  onClick={() => setReviewTarget(null)}
                  className="w-full bg-[#111827] border border-slate-800 hover:bg-[#1a2336] text-slate-350 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  إغلاق نافذة المعاينة
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

// ── Secure document image previewer inside modal drawer ──
function KycDocCard({ label, url, required }: { label: string; url?: string; required?: boolean }) {
  if (!url) {
    return (
      <div className="border border-slate-800 rounded-2xl p-4 text-center min-h-[140px] bg-[#111827]/40 flex flex-col items-center justify-center">
        <div className="text-xl mb-1 text-slate-500">{required ? '⚠️' : '—'}</div>
        <p className="text-[10px] text-slate-500 font-bold">{label}</p>
        <p className="text-[9px] text-slate-500/80 mt-1 leading-snug">{required ? 'المستند مفقود!' : 'المستند الاختياري لم يرفق'}</p>
      </div>
    )
  }

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#111827]">
      <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center relative p-1.5 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="w-full h-full object-contain hover:scale-105 transition-all duration-300" />
      </div>
      <div className="p-3 text-center border-t border-slate-800/85">
        <p className="text-[10px] font-bold text-slate-300">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-accent hover:text-accent-hover hover:no-underline font-bold mt-1 inline-flex items-center gap-0.5"
          style={{ textDecoration: 'none' }}
        >
          <ExternalLink size={10} />
          <span>حجم كامل ↗</span>
        </a>
      </div>
    </div>
  )
}
