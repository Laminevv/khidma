'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { requestWithdrawalAction } from '@/app/actions/wallet'
import NotificationBell from '@/app/components/NotificationBell'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Wallet,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
  X,
  CreditCard,
  User as UserIcon,
  Search,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react'

interface Profile {
  id: string
  username: string
  full_name: string
  role: string
  deposit_balance: number
  withdrawable_balance: number
  rating: number
  total_reviews: number
  is_admin: boolean
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
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeContracts, setActiveContracts] = useState(0)

  const handleWithdraw = async () => {
    if (!profile || profile.withdrawable_balance < 10000) return
    
    const amountStr = prompt(`لديك ${profile.withdrawable_balance} دج. أدخل المبلغ المراد سحبه:`, profile.withdrawable_balance.toString())
    if (!amountStr) return
    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount < 10000 || amount > profile.withdrawable_balance) return alert('مبلغ غير صالح')

    const payoutDetails = prompt('أدخل تفاصيل الدفع (RIP/CCP):')
    if (!payoutDetails || payoutDetails.trim().length < 5) return alert('تفاصيل الدفع غير صالحة')

    setWithdrawLoading(true)
    const res = await requestWithdrawalAction(amount, payoutDetails)
    if (res.success) {
      alert('✅ تم تقديم طلب السحب بنجاح')
      setProfile({ ...profile, withdrawable_balance: profile.withdrawable_balance - amount })
    } else {
      alert(res.error || 'حدث خطأ')
    }
    setWithdrawLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const isClientRole = profileData?.role === 'client' || profileData?.role === 'both'

      if (isClientRole) {
        const { data: jobsData } = await supabase
          .from('jobs').select('*').eq('client_id', user.id)
          .order('created_at', { ascending: false })
        setJobs(jobsData || [])
      } else {
        const { data: proposals } = await supabase
          .from('proposals').select('*, jobs(id, title, category, budget_max, status)')
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false })
        
        const mappedJobs = (proposals || []).map(p => {
          const job = Array.isArray(p.jobs) ? p.jobs[0] : p.jobs
          return {
            id: job?.id || p.job_id,
            title: job?.title || 'مشروع محذوف',
            category: job?.category || 'غير محدد',
            budget_max: job?.budget_max || 0,
            status: p.status, // Show proposal status
            proposals_count: 0,
            created_at: p.created_at
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setJobs(mappedJobs as any)
      }

      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      
      setActiveContracts(count || 0)

      setLoading(false)
    }
    init()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  const isClient = profile?.role === 'client' || profile?.role === 'both'

  const statusLabel: Record<string, string> = {
    open: 'مفتوح', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي',
    pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض'
  }
  const statusBadgeClass: Record<string, string> = {
    open: 'badge-active',
    in_progress: 'badge-pending',
    completed: 'badge-info',
    cancelled: 'badge-error',
    pending: 'badge-pending',
    accepted: 'badge-active',
    rejected: 'badge-error'
  }

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: 'var(--bg)' }}>
      
      {/* ─── Sidebar (Desktop) ─── */}
      <aside 
        className="hidden lg:flex flex-col flex-shrink-0" 
        style={{ 
          width: 'var(--sidebar-width)', 
          background: 'var(--fg)', 
          color: 'var(--surface)',
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 40
        }}
      >
        <div className="p-6">
          <Link
            href="/"
            className="inline-block text-[24px] font-extrabold mb-10"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--surface)', textDecoration: 'none' }}
          >
            خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
          </Link>
          
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors" style={{ background: 'color-mix(in oklch, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium text-sm">لوحة التحكم</span>
            </Link>
            <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <Search className="w-5 h-5" />
              <span className="font-medium text-sm">تصفح المشاريع</span>
            </Link>
            <Link href="/contracts" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm">العقود النشطة</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium text-sm">الرسائل</span>
            </Link>
            <Link href="/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <Wallet className="w-5 h-5" />
              <span className="font-medium text-sm">المحفظة</span>
            </Link>
            {profile?.is_admin && (
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-500/10 text-red-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium text-sm">الإدارة</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6" style={{ borderTop: '1px solid color-mix(in oklch, var(--surface) 10%, transparent)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
              {profile?.full_name?.charAt(0) || 'م'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{profile?.full_name}</div>
              <div className="text-xs truncate" style={{ color: 'color-mix(in oklch, var(--surface) 50%, transparent)' }}>
                {isClient ? 'صاحب عمل' : 'مستقل'}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm w-full transition-colors hover:text-white"
            style={{ color: 'color-mix(in oklch, var(--surface) 50%, transparent)' }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ lg: { paddingRight: 'var(--sidebar-width)' } } as any}>
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--fg)' }}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="text-[20px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}>
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </Link>
          </div>
          <NotificationBell />
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 space-y-2 absolute top-[65px] inset-x-0 z-50 shadow-lg" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <Link href="/dashboard" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>لوحة التحكم</Link>
            <Link href="/jobs" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>تصفح المشاريع</Link>
            <Link href="/contracts" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>العقود النشطة</Link>
            <Link href="/messages" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>الرسائل</Link>
            <Link href="/wallet" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>المحفظة</Link>
            <div className="h-px w-full my-2" style={{ background: 'var(--border)' }}></div>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium" style={{ color: 'var(--error)' }}>
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        )}

        <main className="p-6 lg:p-10 flex-1 ml-0 lg:mr-[260px]">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="eyebrow">نظرة عامة</span>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}>
                مرحباً، {profile?.full_name || profile?.username} 👋
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:block mr-4">
                <NotificationBell />
              </div>
              {isClient ? (
                <Link href="/jobs/new" className="btn btn-accent">
                  <Plus className="w-4 h-4" />
                  نشر مشروع جديد
                </Link>
              ) : (
                <Link href="/jobs" className="btn btn-primary">
                  <Search className="w-4 h-4" />
                  البحث عن مشاريع
                </Link>
              )}
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="label">{isClient ? 'مشاريعي' : 'عروضي'}</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="value">{jobs.length}</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="label">العقود النشطة</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--success)' }}>
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="value">{activeContracts}</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="label">الرصيد الكلي</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--warning)' }}>
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="value text-[20px]">{((profile?.deposit_balance || 0) + (profile?.withdrawable_balance || 0)).toLocaleString()} دج</div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="label">التقييم</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--info)' }}>
                  <Star className="w-4 h-4" />
                </div>
              </div>
              <div className="value">{profile?.rating ? `${profile.rating}` : '—'}</div>
              {profile?.rating && <div className="trend">{profile.total_reviews} تقييم</div>}
            </div>
          </div>

          {/* Main Grid: Table/List + Side Info */}
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* Left Col: Projects/Proposals */}
            <div className="flex-1 min-w-0">
              <div className="card h-full" style={{ padding: 0 }}>
                <div className="card-header border-b" style={{ padding: '24px 24px 16px', margin: 0, borderColor: 'var(--border)' }}>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
                    {isClient ? 'أحدث المشاريع' : 'أحدث العروض'}
                  </h2>
                  <Link href={isClient ? "/jobs" : "/proposals"} className="text-sm font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                    عرض الكل
                  </Link>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg)' }}>
                      <Briefcase className="w-8 h-8" style={{ color: 'var(--muted)' }} />
                    </div>
                    <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                      {isClient ? 'لم تقم بنشر أي مشروع بعد' : 'لم تقم بتقديم أي عروض بعد'}
                    </p>
                    <Link href={isClient ? '/jobs/new' : '/jobs'} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      {isClient ? 'نشر مشروع جديد' : 'تصفح المشاريع المتاحة'}
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="ds-table">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>الفئة</th>
                          <th>الحالة</th>
                          <th>الميزانية / السعر</th>
                          <th>التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.slice(0, 5).map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${job.id}`)}>
                            <td>
                              <div className="font-medium" style={{ color: 'var(--fg)', maxWidth: '250px' }}>
                                <span className="truncate block">{job.title}</span>
                              </div>
                            </td>
                            <td><span style={{ color: 'var(--muted)' }}>{job.category}</span></td>
                            <td>
                              <span className={`badge ${statusBadgeClass[job.status] || 'badge-info'}`}>
                                {statusLabel[job.status] || job.status}
                              </span>
                            </td>
                            <td className="font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                              {job.budget_max ? `${job.budget_max.toLocaleString()} دج` : 'تفاوض'}
                            </td>
                            <td><span style={{ color: 'var(--muted)' }}>{timeAgo(job.created_at)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Wallet & Actions */}
            <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col gap-6">
              
              {/* Wallet Card */}
              <div className="card relative overflow-hidden" style={{ background: 'var(--accent)', color: 'var(--surface)', padding: '32px 24px', border: 'none' }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--surface) 20%, transparent)' }}>
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-80">محفظتك</span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-sm opacity-80 mb-1">الرصيد القابل للسحب</div>
                    <div className="text-3xl font-bold font-mono">
                      {(profile?.withdrawable_balance || 0).toLocaleString()} <span className="text-lg opacity-80">دج</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {isClient && (
                      <Link href="/wallet/deposit" className="btn w-full justify-center" style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}>
                        شحن الرصيد
                      </Link>
                    )}
                    
                    {!isClient && (
                      <button 
                        onClick={handleWithdraw} 
                        disabled={withdrawLoading || (profile?.withdrawable_balance || 0) < 10000} 
                        className="btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}
                      >
                        {withdrawLoading ? 'جاري الطلب...' : 'سحب الأموال'}
                      </button>
                    )}
                    
                    <Link href="/wallet" className="text-center text-sm font-medium hover:underline opacity-90 transition-opacity hover:opacity-100">
                      إدارة المحفظة كاملة &larr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-0 overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--fg)' }}>روابط سريعة</h3>
                </div>
                <div className="flex flex-col">
                  <Link href={`/profile/${profile?.username}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>ملفي الشخصي</span>
                    <ChevronLeft className="w-4 h-4 mr-auto" style={{ color: 'var(--muted)' }} />
                  </Link>
                  <Link href="/kyc/status" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>التحقق من الهوية</span>
                    <ChevronLeft className="w-4 h-4 mr-auto" style={{ color: 'var(--muted)' }} />
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>الإعدادات</span>
                    <ChevronLeft className="w-4 h-4 mr-auto" style={{ color: 'var(--muted)' }} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
