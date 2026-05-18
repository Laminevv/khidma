'use client'

import { useState } from 'react'
import Link from 'next/link'
import { confirmPayoutAction, confirmDepositAction } from '@/app/actions/admin'

export interface Withdrawal {
  id: string
  amount: number
  created_at: string
  metadata: any
  profiles: { username: string; full_name: string } | null
}

export interface Deposit {
  id: string
  amount: number
  created_at: string
  metadata: any
  payment_method: string
  receipt_url: string | null
  profiles: { username: string; full_name: string } | null
}

interface ClientPaymentsPageProps {
  totalRevenue: number
  initialWithdrawals: Withdrawal[]
  initialDeposits: Deposit[]
}

export default function ClientPaymentsPage({ totalRevenue, initialWithdrawals, initialDeposits }: ClientPaymentsPageProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialWithdrawals)
  const [deposits, setDeposits] = useState<Deposit[]>(initialDeposits)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleConfirmPayout = async (id: string) => {
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

  const handleConfirmDeposit = async (id: string) => {
    if (!confirm('هل تأكدت من صحة الإيصال ووصول المبلغ؟ (هذا الإجراء لا يمكن التراجع عنه)')) return
    
    setLoadingId(id)
    const res = await confirmDepositAction(id)
    
    if (res.success) {
      alert('✅ تم تأكيد الإيداع بنجاح')
      setDeposits((prev) => prev.filter((d) => d.id !== id))
    } else {
      alert(res.error || 'حدث خطأ أثناء تأكيد الإيداع')
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Header & Revenue Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">الإدارة المالية</h1>
            <p className="text-gray-400 text-sm">إدارة الإيداعات، السحوبات وعوائد المنصة</p>
          </div>
          
          <div className="bg-gray-900 border-r-4 border-emerald-500 p-4 sm:p-5 rounded-2xl sm:min-w-[250px]">
            <div className="text-sm text-gray-400 mb-1">إجمالي أرباح المنصة (10%)</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-500">
              {totalRevenue.toLocaleString()} دج
            </div>
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">طلبات الإيداع المعلقة</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المستخدم</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">المبلغ</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">طريقة الدفع</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">الإيصال</th>
                <th className="text-right px-6 py-4 text-xs text-gray-400 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    لا توجد طلبات إيداع معلقة
                  </td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{d.profiles?.full_name || '—'}</div>
                      <div className="text-gray-400 text-xs">@{d.profiles?.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-white">{d.amount.toLocaleString()} دج</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs uppercase tracking-wider">
                        {d.payment_method || 'غير معروف'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {d.receipt_url ? (
                        <a 
                          href={d.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline underline-offset-2"
                        >
                          عرض الإيصال
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">لا يوجد إيصال</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleConfirmDeposit(d.id)}
                        disabled={loadingId === d.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingId === d.id ? 'جاري التأكيد...' : 'تأكيد الإيداع ✅'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">طلبات السحب المعلقة</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
                        onClick={() => handleConfirmPayout(w.id)}
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
    </div>
  )
}
