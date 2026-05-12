'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resolveDisputeAction } from './actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClientDisputesPage({ initialDisputes }: { initialDisputes: any[] }) {
  const [disputes, setDisputes] = useState(initialDisputes)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleResolve = async (disputeId: string, contractId: string, action: 'refund_client' | 'release_freelancer') => {
    if (!confirm(`هل أنت متأكد أنك تريد ${action === 'refund_client' ? 'إعادة الأموال لصاحب العمل' : 'تسليم الأموال للمستقل'}؟ لا يمكن التراجع عن هذا الإجراء.`)) return

    setLoadingAction(disputeId)
    const res = await resolveDisputeAction(disputeId, contractId, action)
    if (res.success) {
      showToast('✅ تم الفصل في النزاع بنجاح')
      setDisputes(disputes.map(d => d.id === disputeId ? { 
        ...d, 
        status: action === 'refund_client' ? 'resolved_client' : 'resolved_freelancer' 
      } : d))
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setLoadingAction(null)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'open') return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-medium border border-red-100">مفتوح ⚖️</span>
    if (status === 'resolved_client') return <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-medium border border-emerald-100">لصالح العميل ✓</span>
    if (status === 'resolved_freelancer') return <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-medium border border-emerald-100">لصالح المستقل ✓</span>
    return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200">{status}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Admin Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← لوحة الإدارة</Link>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-base">خدمة<span className="text-emerald-500">.dz</span> Admin</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة النزاعات ⚖️</h1>
          <p className="text-gray-500 text-sm">مراجعة والفصل في الخلافات بين أصحاب العمل والمستقلين.</p>
        </div>

        {disputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4 opacity-30">✅</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد نزاعات!</h3>
            <p className="text-gray-500">منصة العمل الحر تعمل بشكل مثالي.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-500">{new Date(dispute.created_at).toLocaleDateString('ar-DZ')}</span>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <Link href={`/contracts/${dispute.contract?.id}`} className="font-bold text-gray-900 hover:text-emerald-600 text-lg transition-colors">
                      {dispute.contract?.title}
                    </Link>
                  </div>
                  <div className="text-left">
                    <span className="bg-gray-50 text-gray-900 font-bold px-4 py-2 rounded-xl border border-gray-100 inline-block">
                      {dispute.contract?.total_amount?.toLocaleString()} دج
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-xs text-gray-500 font-medium mb-3">أطراف العقد</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">صاحب العمل:</span>
                        <Link href={`/profile/${dispute.contract?.client?.username}`} className="font-medium text-gray-900 hover:text-emerald-600">
                          {dispute.contract?.client?.full_name}
                        </Link>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">المستقل:</span>
                        <Link href={`/profile/${dispute.contract?.freelancer?.username}`} className="font-medium text-gray-900 hover:text-emerald-600">
                          {dispute.contract?.freelancer?.full_name}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <h4 className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
                      <span>⚠️</span> تفاصيل النزاع
                    </h4>
                    <p className="text-sm text-red-900 leading-relaxed font-medium">
                      <span className="opacity-70 text-xs block mb-1">صاحب الشكوى: {dispute.initiator?.full_name}</span>
                      "{dispute.reason}"
                    </p>
                  </div>
                </div>

                {dispute.status === 'open' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleResolve(dispute.id, dispute.contract?.id, 'refund_client')}
                      disabled={loadingAction === dispute.id}
                      className="flex-1 bg-white border border-gray-200 text-gray-900 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                    >
                      {loadingAction === dispute.id ? '...' : '↩️ إعادة الأموال لصاحب العمل'}
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, dispute.contract?.id, 'release_freelancer')}
                      disabled={loadingAction === dispute.id}
                      className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {loadingAction === dispute.id ? '...' : '💸 تسليم الأموال للمستقل'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
