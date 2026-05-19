'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getKycSubmissionsAction,
  getKycDocumentUrlAction,
  approveKycAction,
  rejectKycAction,
} from '@/app/actions/kyc'

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

interface Submission {
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

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'بطاقة التعريف',
  passport: 'جواز السفر',
  driving_license: 'رخصة القيادة',
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: 'قيد المراجعة', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { label: 'مقبول',        bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { label: 'مرفوض',        bg: 'bg-red-100',     text: 'text-red-700' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminKycPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<Submission | null>(null)
  const [docUrls, setDocUrls] = useState<{ front?: string; back?: string; selfie?: string }>({})
  const [docLoading, setDocLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectMode, setRejectMode] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      await fetchSubmissions('pending')
      setLoading(false)
    }
    init()
  }, [router])

  const fetchSubmissions = async (status: StatusFilter) => {
    const res = await getKycSubmissionsAction(status)
    const formatted = (res.submissions || []).map((s: any) => ({
      ...s,
      profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
    }))
    setSubmissions(formatted)
  }

  const handleFilterChange = async (f: StatusFilter) => {
    setFilter(f)
    setLoading(true)
    await fetchSubmissions(f)
    setLoading(false)
  }

  // Open the review modal and fetch signed document URLs
  const openReview = async (sub: Submission) => {
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

  const handleApprove = async () => {
    if (!reviewTarget) return
    if (!confirm('هل أنت متأكد من قبول هذا الطلب؟ سيتم توثيق المستخدم رسمياً.')) return
    setActionLoading(reviewTarget.id)
    const res = await approveKycAction(reviewTarget.id)
    if (res.success) {
      setSubmissions(prev => prev.filter(s => s.id !== reviewTarget.id))
      setReviewTarget(null)
    } else {
      alert(res.error || 'حدث خطأ')
    }
    setActionLoading(null)
  }

  const handleReject = async () => {
    if (!reviewTarget) return
    if (rejectReason.trim().length < 5) {
      alert('يجب كتابة سبب الرفض (5 أحرف على الأقل)')
      return
    }
    setActionLoading(reviewTarget.id)
    const res = await rejectKycAction(reviewTarget.id, rejectReason.trim())
    if (res.success) {
      setSubmissions(prev => prev.filter(s => s.id !== reviewTarget.id))
      setReviewTarget(null)
      setRejectMode(false)
      setRejectReason('')
    } else {
      alert(res.error || 'حدث خطأ')
    }
    setActionLoading(null)
  }

  if (loading && submissions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const pendingCount = filter === 'pending' ? submissions.length : null

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar — matches admin/withdrawals pattern */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/></svg>
              </div>
              <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
            </Link>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium mr-1">ADMIN</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">لوحة التحكم</Link>
            <Link href="/admin/payments" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">الإدارة المالية</Link>
            <Link href="/admin/withdrawals" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">طلبات السحب</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">← المنصة</Link>
          </div>
          <div className="flex md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700"><span>📊</span> لوحة التحكم</Link>
            <Link href="/admin/payments" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700"><span>💳</span> الإدارة المالية</Link>
            <Link href="/admin/withdrawals" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700"><span>💸</span> طلبات السحب</Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700"><span>🌐</span> المنصة</Link>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">مراجعة طلبات التحقق 🆔</h1>
            <p className="text-gray-500 text-sm mt-1">مراجعة وثائق الهوية والموافقة أو الرفض</p>
          </div>
          {pendingCount !== null && (
            <div className="bg-white border-r-4 border-emerald-500 p-4 sm:p-5 rounded-2xl border border-gray-100 sm:min-w-[200px]">
              <div className="text-sm text-gray-500 mb-1">طلبات معلقة</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{pendingCount}</div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: 'pending',  label: '⏳ معلقة' },
            { key: 'approved', label: '✅ مقبولة' },
            { key: 'rejected', label: '❌ مرفوضة' },
            { key: 'all',      label: '📋 الكل' },
          ] as { key: StatusFilter; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => handleFilterChange(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {filter === 'pending' ? 'الطلبات المعلقة' : filter === 'approved' ? 'الطلبات المقبولة' : filter === 'rejected' ? 'الطلبات المرفوضة' : 'جميع الطلبات'}
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">{filter === 'pending' ? '✅' : '📭'}</div>
              <p className="text-gray-500 text-sm mb-2">
                {filter === 'pending' ? 'لا توجد طلبات معلقة' : 'لا توجد طلبات في هذا التصنيف'}
              </p>
              <p className="text-gray-400 text-xs">
                {filter === 'pending' ? 'تم معالجة جميع الطلبات' : 'جرب تصنيفاً آخر'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">المستخدم</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">نوع الوثيقة</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">تاريخ التقديم</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">الحالة</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => {
                    const st = STATUS_LABELS[sub.status] || STATUS_LABELS.pending
                    return (
                      <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {sub.profiles?.full_name?.charAt(0) || sub.profiles?.username?.charAt(0) || '؟'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{sub.profiles?.full_name || '—'}</div>
                              <div className="text-xs text-gray-400">@{sub.profiles?.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                            {ID_TYPE_LABELS[sub.id_type] || sub.id_type}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs text-gray-400">{formatDate(sub.submitted_at)}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={() => openReview(sub)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
                          >
                            {sub.status === 'pending' ? '🔍 مراجعة' : '👁️ عرض'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => !actionLoading && setReviewTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-gray-900">مراجعة طلب التحقق</h2>
                <p className="text-xs text-gray-400 mt-0.5">@{reviewTarget.profiles?.username} — {ID_TYPE_LABELS[reviewTarget.id_type]}</p>
              </div>
              <button onClick={() => setReviewTarget(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* User Info */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  {reviewTarget.profiles?.full_name?.charAt(0) || '؟'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{reviewTarget.profiles?.full_name || '—'}</div>
                  <div className="text-sm text-gray-500">@{reviewTarget.profiles?.username}</div>
                  <div className="text-xs text-gray-400 mt-1">تاريخ التقديم: {formatDate(reviewTarget.submitted_at)}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">الوثائق المرفقة</h3>
                {docLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 mr-3">جارٍ تحميل الوثائق...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Front */}
                    <DocPreview label="الوجه الأمامي" url={docUrls.front} required />
                    {/* Back */}
                    <DocPreview label="الوجه الخلفي" url={docUrls.back} />
                    {/* Selfie */}
                    <DocPreview label="سيلفي مع الوثيقة" url={docUrls.selfie} />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">⏱️ الروابط صالحة لمدة 60 ثانية فقط. أعد فتح المراجعة إذا انتهت صلاحيتها.</p>
              </div>

              {/* Existing rejection reason (for already-reviewed submissions) */}
              {reviewTarget.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">سبب الرفض السابق</p>
                  <p className="text-sm text-red-700">{reviewTarget.rejection_reason}</p>
                </div>
              )}

              {/* Reject Reason Input */}
              {rejectMode && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <label className="block text-sm font-medium text-red-800 mb-2">سبب الرفض <span className="text-red-400">*</span></label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="مثال: الصورة غير واضحة / الوثيقة منتهية الصلاحية / الاسم لا يتطابق..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-red-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all resize-none"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                  <p className="text-xs text-red-500 mt-1">سيتم إرسال هذا السبب للمستخدم عبر إشعار.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {reviewTarget.status === 'pending' && (
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                {!rejectMode ? (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={!!actionLoading || docLoading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === reviewTarget.id ? (
                        <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> جارٍ القبول...</>
                      ) : '✅ قبول وتوثيق'}
                    </button>
                    <button
                      onClick={() => setRejectMode(true)}
                      disabled={!!actionLoading}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      ❌ رفض الطلب
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={!!actionLoading || rejectReason.trim().length < 5}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === reviewTarget.id ? (
                        <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> جارٍ الرفض...</>
                      ) : '❌ تأكيد الرفض'}
                    </button>
                    <button
                      onClick={() => { setRejectMode(false); setRejectReason('') }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
                    >
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Close button for non-pending */}
            {reviewTarget.status !== 'pending' && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button onClick={() => setReviewTarget(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors">
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Document Preview Component ──
function DocPreview({ label, url, required }: { label: string; url?: string; required?: boolean }) {
  if (!url) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center min-h-[140px] flex flex-col items-center justify-center">
        <div className="text-2xl mb-1 text-gray-300">{required ? '⚠️' : '—'}</div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xs text-gray-300 mt-0.5">{required ? 'غير متوفر!' : 'لم يُرفق'}</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="aspect-[4/3] bg-gray-100 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="w-full h-full object-contain" />
      </div>
      <div className="p-2 text-center border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline mt-0.5 inline-block">
          فتح بحجم كامل ↗
        </a>
      </div>
    </div>
  )
}
