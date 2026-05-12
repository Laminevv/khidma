'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { confirmPayoutAction } from '@/app/actions/admin'

interface Withdrawal {
  id: string
  amount: number
  status: string
  metadata: any
  created_at: string
  from_user_id: string
  profiles: { username: string; full_name: string } | null
}

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [totalPending, setTotalPending] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()

      if (!profile?.is_admin) { router.push('/dashboard'); return }

      // Fetch pending withdrawals with freelancer profile info
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, status, metadata, created_at, from_user_id, profiles!from_user_id(username, full_name)')
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const formatted = (data || []).map((w: any) => ({
        ...w,
        profiles: Array.isArray(w.profiles) ? w.profiles[0] : w.profiles,
      }))

      setWithdrawals(formatted)
      setTotalPending(formatted.reduce((sum: number, w: Withdrawal) => sum + w.amount, 0))
      setLoading(false)
    }
    init()
  }, [])

  const handleConfirm = async (id: string) => {
    if (!confirm('هل تم تحويل الأموال بالفعل إلى المستقل عبر BaridiMob/CCP؟\n\nهذا الإجراء لا يمكن التراجع عنه.')) return

    setLoadingId(id)
    const res = await confirmPayoutAction(id)

    if (res.success) {
      setWithdrawals(prev => prev.filter(w => w.id !== id))
      setTotalPending(prev => {
        const removed = withdrawals.find(w => w.id === id)
        return prev - (removed?.amount || 0)
      })
    } else {
      alert(res.error || 'حدث خطأ أثناء تأكيد التحويل')
    }
    setLoadingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
            </Link>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium mr-1">ADMIN</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">لوحة التحكم</Link>
            <Link href="/admin/payments" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">الإدارة المالية</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">← العودة للمنصة</Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>📊</span> لوحة التحكم
            </Link>
            <Link href="/admin/payments" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>💳</span> الإدارة المالية
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>🌐</span> العودة للمنصة
            </Link>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">طلبات السحب 💸</h1>
            <p className="text-gray-500 text-sm mt-1">مراجعة وتأكيد تحويلات المستقلين</p>
          </div>

          <div className="bg-white border-r-4 border-emerald-500 p-4 sm:p-5 rounded-2xl border border-gray-100 sm:min-w-[220px]">
            <div className="text-sm text-gray-500 mb-1">إجمالي المعلق</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {totalPending.toLocaleString()} دج
            </div>
            <div className="text-xs text-gray-400 mt-1">{withdrawals.length} طلب معلق</div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">الطلبات المعلقة</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-500 text-sm mb-2">لا توجد طلبات سحب معلقة</p>
              <p className="text-gray-400 text-xs">تم معالجة جميع طلبات السحب</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">المستقل</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">المبلغ</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">تفاصيل الدفع (CCP/RIP)</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">تاريخ الطلب</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {w.profiles?.full_name?.charAt(0) || '؟'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{w.profiles?.full_name || '—'}</div>
                            <div className="text-xs text-gray-400">@{w.profiles?.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-bold text-gray-900 text-sm">{w.amount.toLocaleString()} دج</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-emerald-700 text-sm border border-gray-200 font-mono">
                          {w.metadata?.payoutDetails || 'غير متوفر'}
                        </code>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs text-gray-400" dir="ltr" style={{ textAlign: 'right' }}>
                        {new Date(w.created_at).toLocaleString('ar-DZ')}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleConfirm(w.id)}
                          disabled={loadingId === w.id}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loadingId === w.id ? (
                            <>
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                              جاري التأكيد...
                            </>
                          ) : (
                            'تأكيد الدفع ✅'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <p className="text-sm text-emerald-800 font-medium mb-1">كيفية تأكيد السحب</p>
            <ol className="text-xs text-emerald-700 space-y-1 list-decimal pr-4">
              <li>قم بنسخ تفاصيل الدفع (CCP/RIP) من الجدول أعلاه</li>
              <li>حوّل المبلغ يدوياً عبر BaridiMob أو بريد الجزائر</li>
              <li>بعد التأكد من نجاح التحويل، اضغط على &quot;تأكيد الدفع&quot;</li>
              <li>سيتم إشعار المستقل تلقائياً بنجاح التحويل</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
