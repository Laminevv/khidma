'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Stats {
  total_users: number
  new_users_30d: number
  active_jobs: number
  active_contracts: number
  open_disputes: number
  banned_users: number
}

interface User {
  id: string
  username: string
  full_name: string
  role: string
  is_verified: boolean
  is_banned: boolean
  is_admin: boolean
  balance: number
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

type Tab = 'overview' | 'users' | 'jobs'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await Promise.all([fetchStats(), fetchUsers(), fetchJobs()])
      setLoading(false)
    }
    init()
  }, [])

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { count: newUsers },
      { count: activeJobs },
      { count: activeContracts },
      { count: openDisputes },
      { count: bannedUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    ])

    setStats({
      total_users: totalUsers || 0,
      new_users_30d: newUsers || 0,
      active_jobs: activeJobs || 0,
      active_contracts: activeContracts || 0,
      open_disputes: openDisputes || 0,
      banned_users: bannedUsers || 0,
    })
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .limit(50)
    setUsers(data || [])
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles!client_id(username, full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setJobs(data || [])
  }

  const banUser = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId)
    await supabase.from('profiles').update({ is_banned: !isBanned }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u))
    setActionLoading(null)
  }

  const verifyUser = async (userId: string, isVerified: boolean) => {
    setActionLoading(userId)
    await supabase.from('profiles').update({ is_verified: !isVerified }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !isVerified } : u))
    setActionLoading(null)
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return
    setActionLoading(jobId)
    await supabase.from('jobs').delete().eq('id', jobId)
    setJobs(prev => prev.filter(j => j.id !== jobId))
    setActionLoading(null)
  }

  const filteredUsers = users.filter(u =>
    search === '' ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredJobs = jobs.filter(j =>
    search === '' || j.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-white">خدمة<span className="text-emerald-400">.dz</span></span>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← العودة للمنصة
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'overview', label: '📊 نظرة عامة' },
            { key: 'users',    label: '👥 المستخدمون' },
            { key: 'jobs',     label: '📋 المشاريع' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as Tab); setSearch('') }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">نظرة عامة على المنصة</h1>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'إجمالي المستخدمين', value: stats.total_users, icon: '👥', color: 'border-blue-500' },
                { label: 'مستخدمون جدد (30 يوم)', value: stats.new_users_30d, icon: '🆕', color: 'border-emerald-500' },
                { label: 'مشاريع مفتوحة', value: stats.active_jobs, icon: '📋', color: 'border-purple-500' },
                { label: 'عقود نشطة', value: stats.active_contracts, icon: '📝', color: 'border-yellow-500' },
                { label: 'نزاعات مفتوحة', value: stats.open_disputes, icon: '⚠️', color: 'border-red-500' },
                { label: 'مستخدمون محظورون', value: stats.banned_users, icon: '🚫', color: 'border-gray-500' },
              ].map((s) => (
                <div key={s.label} className={`bg-gray-900 rounded-2xl border-r-4 ${s.color} p-6`}>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">إجراءات سريعة</h2>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setTab('users')}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl text-sm transition-all text-right">
                  👥 إدارة المستخدمين
                </button>
                <button onClick={() => setTab('jobs')}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl text-sm transition-all text-right">
                  📋 مراقبة المشاريع
                </button>
                <Link href="/dashboard"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm transition-all text-right block">
                  🌐 عرض المنصة
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">المستخدمون</h1>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم..."
                  className="bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-emerald-500"
                  style={{ color: 'white' }}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المستخدم</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الدور</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الرصيد</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الحالة</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">تاريخ التسجيل</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.full_name?.charAt(0) || user.username?.charAt(0) || '؟'}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{user.full_name || '—'}</div>
                            <div className="text-gray-400 text-xs">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          user.role === 'client' ? 'bg-blue-900 text-blue-300' :
                          user.role === 'freelancer' ? 'bg-purple-900 text-purple-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {user.role === 'client' ? 'صاحب عمل' : user.role === 'freelancer' ? 'مستقل' : 'الاثنان'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{(user.balance || 0).toLocaleString()} دج</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.is_banned && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-lg">محظور</span>}
                          {user.is_verified && <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-lg">موثق ✓</span>}
                          {!user.is_banned && !user.is_verified && <span className="text-xs text-gray-500">عادي</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => verifyUser(user.id, user.is_verified)}
                            disabled={actionLoading === user.id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              user.is_verified
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600'
                            }`}
                          >
                            {user.is_verified ? 'إلغاء التوثيق' : 'توثيق'}
                          </button>
                          <button
                            onClick={() => banUser(user.id, user.is_banned)}
                            disabled={actionLoading === user.id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              user.is_banned
                                ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600'
                                : 'bg-red-800 text-red-200 hover:bg-red-700'
                            }`}
                          >
                            {actionLoading === user.id ? '...' : user.is_banned ? 'رفع الحظر' : 'حظر'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">لا توجد نتائج</div>
              )}
            </div>
          </div>
        )}

        {/* ── JOBS ── */}
        {tab === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">المشاريع</h1>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالعنوان..."
                className="bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-emerald-500"
                style={{ color: 'white' }}
              />
            </div>

            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المشروع</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">صاحب العمل</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الفئة</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الحالة</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">العروض</th>
                    <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white text-sm font-medium">{job.title}</div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {job.budget_max ? `${job.budget_max.toLocaleString()} دج` : 'تفاوض'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        @{job.profiles?.username}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">{job.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                          job.status === 'open' ? 'bg-emerald-900 text-emerald-300' :
                          job.status === 'in_progress' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {job.status === 'open' ? 'مفتوح' : job.status === 'in_progress' ? 'قيد التنفيذ' : job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{job.proposals_count || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/jobs/${job.id}`}
                            className="text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                            عرض
                          </Link>
                          <button
                            onClick={() => deleteJob(job.id)}
                            disabled={actionLoading === job.id}
                            className="text-xs bg-red-800 text-red-200 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {actionLoading === job.id ? '...' : 'حذف'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobs.length === 0 && (
                <div className="text-center py-12 text-gray-500">لا توجد نتائج</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
