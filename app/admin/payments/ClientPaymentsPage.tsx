'use client'

import { useState } from 'react'
import Link from 'next/link'
import { confirmPayoutAction } from '@/app/actions/admin'

export interface Withdrawal {
  id: string
  amount: number
  created_at: string
  metadata: any
  profiles: { username: string; full_name: string } | null
}

interface ClientPaymentsPageProps {
  totalRevenue: number
  initialWithdrawals: Withdrawal[]
}

export default function ClientPaymentsPage({ totalRevenue, initialWithdrawals }: ClientPaymentsPageProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialWithdrawals)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleConfirm = async (id: string) => {
    if (!confirm('هل تم تحويل الأموال بالفعل إلى المستقل؟ (هذا الإجراء لا يمكن التراجع عنه)')) return
    
    setLoadingId(id)
    const res = await confirmPayoutAction(id)
    
    if (res.success) {
      alert('✅ تم تأكيد التحويل بنجاح')
      setWithdrawals((prev) => prev.filter((w) => w.id !== id))
    } else {
      alert(res.error || 'حدث خطأ أثناء تأكيد التحويل')
    }
    setLoadingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Navbar matching Admin Theme */}
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
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← لوحة التحكم
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header & Revenue Tracker */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">الإدارة المالية</h1>
            <p className="text-gray-400 text-sm">إدارة السحوبات وعوائد المنصة</p>
          </div>
          
          <div className="bg-gray-900 border-r-4 border-emerald-500 p-5 rounded-2xl min-w-[250px]">
            <div className="text-sm text-gray-400 mb-1">إجمالي أرباح المنصة (10%)</div>
            <div className="text-2xl font-bold text-emerald-500">
              {totalRevenue.toLocaleString()} دج
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">طلبات السحب المعلقة</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المستخدم</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المبلغ</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">تاريخ الطلب</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">تفاصيل الدفع (RIP/CCP)</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    لا توجد طلبات سحب معلقة
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{w.profiles?.full_name || '—'}</div>
                      <div className="text-gray-400 text-xs">@{w.profiles?.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-white">{w.amount.toLocaleString()} دج</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400" dir="ltr" style={{ textAlign: 'right' }}>
                      {new Date(w.created_at).toLocaleString('ar-DZ')}
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-gray-950 px-2 py-1 rounded text-emerald-400 text-sm border border-gray-800">
                        {w.metadata?.payoutDetails || 'غير متوفر'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleConfirm(w.id)}
                        disabled={loadingId === w.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingId === w.id ? 'جاري التأكيد...' : 'تأكيد الدفع ✅'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
