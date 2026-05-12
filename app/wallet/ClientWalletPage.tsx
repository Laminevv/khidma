'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestWithdrawalAction } from '@/app/actions/wallet'
import NotificationBell from '@/app/components/NotificationBell'

interface Profile {
  id: string
  username: string
  full_name: string
  role: string
  balance: number
  is_admin: boolean
}

interface Transaction {
  id: string
  amount: number
  fee: number
  net_amount: number
  type: string
  status: string
  reference: string | null
  note: string | null
  metadata: any
  created_at: string
}

interface Props {
  profile: Profile
  initialTransactions: Transaction[]
}

const typeLabels: Record<string, string> = {
  deposit: 'إيداع',
  escrow_lock: 'تأمين (Escrow)',
  escrow_release: 'تحرير دفعة',
  refund: 'استرداد',
  withdrawal: 'سحب',
  platform_fee: 'رسوم المنصة',
}

const typeIcons: Record<string, string> = {
  deposit: '💰',
  escrow_lock: '🔒',
  escrow_release: '✅',
  refund: '↩️',
  withdrawal: '💸',
  platform_fee: '🏦',
}

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  completed: 'مكتمل',
  failed: 'فشل',
  reversed: 'مسترد',
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  reversed: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function ClientWalletPage({ profile, initialTransactions }: Props) {
  const [balance, setBalance] = useState(profile.balance)
  const [transactions] = useState<Transaction[]>(initialTransactions)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Withdrawal form state
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [payoutDetails, setPayoutDetails] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  const isClient = profile.role === 'client' || profile.role === 'both'

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess(false)

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 10000) {
      setWithdrawError('الحد الأدنى للسحب هو 10,000 دج')
      return
    }
    if (amount > balance) {
      setWithdrawError('المبلغ المطلوب يتجاوز رصيدك المتاح')
      return
    }
    if (!payoutDetails.trim() || payoutDetails.trim().length < 5) {
      setWithdrawError('يرجى إدخال تفاصيل الدفع بشكل صحيح (RIP أو CCP)')
      return
    }

    setWithdrawLoading(true)
    const res = await requestWithdrawalAction(amount, payoutDetails.trim())

    if (res.success) {
      setWithdrawSuccess(true)
      setBalance(prev => prev - amount)
      setWithdrawAmount('')
      setPayoutDetails('')
      setTimeout(() => {
        setShowWithdrawForm(false)
        setWithdrawSuccess(false)
      }, 3000)
    } else {
      setWithdrawError(res.error || 'حدث خطأ أثناء معالجة طلب السحب')
    }
    setWithdrawLoading(false)
  }

  // Stats
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'pending'))
    .reduce((sum, t) => sum + t.amount, 0)
  const totalEarnings = transactions
    .filter(t => t.type === 'escrow_release' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.net_amount || t.amount - t.fee), 0)
  const pendingWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar — matches dashboard */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">لوحة التحكم</Link>
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">المشاريع</Link>
            <Link href="/contracts" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">العقود</Link>
            <Link href="/messages" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50">الرسائل</Link>
            {profile.is_admin && (
              <Link href="/admin" className="text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50">⚙️ الإدارة</Link>
            )}
            <NotificationBell />
            <div className="flex items-center gap-2 mr-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile.full_name?.charAt(0) || 'م'}
              </div>
            </div>
          </div>

          {/* Mobile nav icons */}
          <div className="flex md:hidden items-center gap-1">
            <NotificationBell />
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
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>🏠</span> لوحة التحكم
            </Link>
            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>🔍</span> المشاريع
            </Link>
            <Link href="/contracts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>📝</span> العقود
            </Link>
            <Link href="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700">
              <span>💬</span> الرسائل
            </Link>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">المحفظة 💳</h1>
            <p className="text-gray-500 text-sm mt-1">إدارة رصيدك ومعاملاتك المالية</p>
          </div>
          <Link href="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
            ← العودة للوحة التحكم
          </Link>
        </div>

        {/* Balance Card + Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {/* Main Balance */}
          <div className="sm:col-span-2 lg:col-span-1 bg-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
            </div>
            <div className="relative">
              <p className="text-emerald-100 text-xs mb-1">الرصيد المتاح</p>
              <p className="text-3xl font-bold mb-4">{balance.toLocaleString()} دج</p>
              <div className="flex gap-2 mt-2">
                {!isClient && (
                  <button
                    onClick={() => { setShowWithdrawForm(true); setWithdrawError(''); setWithdrawSuccess(false) }}
                    disabled={balance < 10000}
                    className="bg-white text-emerald-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💸 سحب الأموال
                  </button>
                )}
                {isClient && (
                  <button
                    onClick={async () => {
                      const amountStr = prompt('أدخل المبلغ الذي تريد شحنه (دج):', '5000')
                      if (!amountStr) return
                      const amount = parseInt(amountStr)
                      if (isNaN(amount) || amount <= 0) return alert('مبلغ غير صالح')
                      try {
                        const res = await fetch('/api/funding/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount })
                        })
                        const data = await res.json()
                        if (data.checkout_url) window.location.href = data.checkout_url
                        else alert(data.error || 'حدث خطأ')
                      } catch { alert('حدث خطأ في الاتصال') }
                    }}
                    className="bg-white text-emerald-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    ➕ شحن الرصيد
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 bg-blue-50 text-blue-600">💰</div>
            <div className="text-xl font-bold text-gray-900 mb-1">{totalDeposits.toLocaleString()} دج</div>
            <div className="text-xs text-gray-500">إجمالي الإيداعات</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 bg-emerald-50 text-emerald-600">✅</div>
            <div className="text-xl font-bold text-gray-900 mb-1">{totalEarnings.toLocaleString()} دج</div>
            <div className="text-xs text-gray-500">إجمالي الأرباح</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 bg-yellow-50 text-yellow-600">💸</div>
            <div className="text-xl font-bold text-gray-900 mb-1">{totalWithdrawals.toLocaleString()} دج</div>
            <div className="text-xs text-gray-500">إجمالي السحوبات {pendingWithdrawals > 0 && <span className="text-yellow-600">({pendingWithdrawals} معلقة)</span>}</div>
          </div>
        </div>

        {/* Withdrawal Form Modal */}
        {showWithdrawForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdrawForm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">طلب سحب 💸</h3>
                <button onClick={() => setShowWithdrawForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              {withdrawSuccess ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">تم تقديم طلب السحب بنجاح!</h4>
                  <p className="text-gray-500 text-sm">سيقوم المسؤول بمراجعة طلبك وتحويل المبلغ في أقرب وقت.</p>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-0.5">رصيدك المتاح</p>
                    <p className="text-lg font-bold text-emerald-700">{balance.toLocaleString()} دج</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">المبلغ المراد سحبه (دج)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="مثال: 50000"
                      min={10000}
                      max={balance}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                    <p className="text-xs text-gray-400 mt-1">الحد الأدنى للسحب: 10,000 دج</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">تفاصيل الدفع</label>
                    <input
                      type="text"
                      value={payoutDetails}
                      onChange={e => setPayoutDetails(e.target.value)}
                      placeholder="رقم حساب CCP أو BaridiMob RIP"
                      required
                      minLength={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                    <p className="text-xs text-gray-400 mt-1">أدخل رقم حساب CCP أو RIP الخاص بك لاستلام التحويل</p>
                  </div>

                  {withdrawError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 flex items-center gap-2">
                      <span>⚠️</span> {withdrawError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={withdrawLoading}
                      className="flex-1 bg-emerald-500 text-white font-medium py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {withdrawLoading ? 'جاري المعالجة...' : 'تأكيد طلب السحب'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawForm(false)}
                      className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">سجل المعاملات</h2>
            <span className="text-xs text-gray-400">{transactions.length} معاملة</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 text-sm mb-2">لا توجد معاملات بعد</p>
              <p className="text-gray-400 text-xs">ستظهر معاملاتك المالية هنا بمجرد البدء في استخدام المنصة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">النوع</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">المبلغ</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">الرسوم</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">الحالة</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs text-gray-400 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeIcons[txn.type] || '📋'}</span>
                          <span className="text-sm font-medium text-gray-900">{typeLabels[txn.type] || txn.type}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`font-bold text-sm ${txn.type === 'deposit' || txn.type === 'escrow_release' || txn.type === 'refund' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {txn.type === 'deposit' || txn.type === 'escrow_release' || txn.type === 'refund' ? '+' : '-'}
                          {txn.amount.toLocaleString()} دج
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                        {txn.fee > 0 ? `${txn.fee.toLocaleString()} دج` : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${statusStyles[txn.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {statusLabels[txn.status] || txn.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs text-gray-400" dir="ltr" style={{ textAlign: 'right' }}>
                        {new Date(txn.created_at).toLocaleString('ar-DZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
