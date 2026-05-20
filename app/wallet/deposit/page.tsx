'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  uploadReceiptAction,
  submitManualDepositAction,
  initiateChargilyDepositAction,
} from './actions'

type Method = 'ccp' | 'baridimob' | 'edahabia'

const METHODS = [
  {
    id: 'ccp' as Method,
    label: 'حساب CCP',
    icon: '🏦',
    desc: 'التحويل عبر بريد الجزائر',
  },
  {
    id: 'baridimob' as Method,
    label: 'بريدي موب',
    icon: '📱',
    desc: 'الدفع عبر تطبيق بريدي موب',
  },
  {
    id: 'edahabia' as Method,
    label: 'الذهبية / CIB',
    icon: '💳',
    desc: 'الدفع الإلكتروني عبر Chargily',
  },
]

const ACCOUNT_DETAILS: Record<'ccp' | 'baridimob', { label: string; value: string }[]> = {
  ccp: [
    { label: 'رقم الحساب (RIP)', value: '00799999000000000000' },
    { label: 'اسم المستفيد', value: 'خدمة DZ — Khidma DZ' },
  ],
  baridimob: [
    { label: 'رقم الحساب (RIP)', value: '00799999000000000000' },
    { label: 'اسم المستفيد', value: 'خدمة DZ — Khidma DZ' },
    { label: 'رقم الهاتف', value: '0555 000 000' },
  ],
}

export default function DepositPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [method, setMethod] = useState<Method>('ccp')
  const [amount, setAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderAccount, setSenderAccount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const isManual = method === 'ccp' || method === 'baridimob'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const numAmount = Number(amount)
    if (!numAmount || numAmount < 1000) {
      setError('المبلغ الأدنى للإيداع هو 1,000 دج')
      return
    }

    setLoading(true)

    try {
      if (method === 'edahabia') {
        // BUG-03 FIX: userId is no longer passed; server derives it from session
        const result = await initiateChargilyDepositAction(numAmount)
        if (!result.success) {
          setError(result.error)
          return
        }
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
        }
        return
      }

      // Manual: validate sender details
      if (!senderName.trim() || senderName.trim().length < 3) {
        setError('يجب إدخال الاسم الكامل للمرسل')
        setLoading(false)
        return
      }
      if (!senderAccount.trim() || senderAccount.trim().length < 5) {
        setError('يجب إدخال رقم الحساب/CCP الخاص بالمرسل')
        setLoading(false)
        return
      }

      // Upload receipt first
      if (!file) {
        setError('يجب رفع إيصال الدفع')
        setLoading(false)
        return
      }

      const fd = new FormData()
      fd.append('receipt', file)
      // BUG-03 FIX: userId no longer passed; server derives it from session
      const uploadResult = await uploadReceiptAction(fd)

      if (!uploadResult.success) {
        setError(uploadResult.error)
        setLoading(false)
        return
      }

      // BUG-03 FIX: userId no longer passed; server derives it from session
      const depositResult = await submitManualDepositAction(
        numAmount,
        method as 'ccp' | 'baridimob',
        uploadResult.url,
        senderName.trim(),
        senderAccount.trim()
      )

      if (!depositResult.success) {
        setError(depositResult.error)
        return
      }

      setSuccess(depositResult.message)
      setTimeout(() => router.push('/wallet'), 3000)

    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all'

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلب الإيداع!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{success}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            جارٍ التحويل للمحفظة...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/wallet" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            ← المحفظة
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">إيداع رصيد</h1>
          <p className="text-gray-500 text-sm mt-1">اختر طريقة الدفع المناسبة لك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Method selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">طريقة الدفع</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${method === m.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-100 hover:border-gray-200'
                    }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className={`font-medium text-sm ${method === m.id ? 'text-emerald-700' : 'text-gray-800'}`}>
                    {m.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">مبلغ الإيداع</h2>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10,000"
                min="1000"
                required
                className={inputClass + ' pl-16'}
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                دج
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">الحد الأدنى: 1,000 دج</p>

            {/* Quick amounts */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[5000, 10000, 25000, 50000].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${Number(amount) === a
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}
                >
                  {a.toLocaleString()} دج
                </button>
              ))}
            </div>
          </div>

          {/* Manual payment details */}
          {isManual && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">

              {/* Account details */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">تفاصيل الحساب</h2>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                  {ACCOUNT_DETAILS[method as 'ccp' | 'baridimob'].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">{detail.label}</p>
                        <p className="font-mono font-medium text-gray-900 text-sm">{detail.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(detail.value)}
                        className="flex-shrink-0 text-xs bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all"
                      >
                        {copied === detail.value ? '✓ تم النسخ' : 'نسخ'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mt-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <span className="text-yellow-500 mt-0.5">⚠️</span>
                  <p className="text-xs text-yellow-700 leading-relaxed">
                    بعد إتمام التحويل، ارفع صورة الإيصال أدناه. سيتم تأكيد الإيداع خلال 24 ساعة من مراجعة الفريق.
                  </p>
                </div>
              </div>

              {/* Sender details */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">
                  معلومات المرسل <span className="text-red-400">*</span>
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل للمرسل</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="مثال: محمد أمين بن علي"
                      required
                      minLength={3}
                      className={inputClass}
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الحساب/CCP للمرسل</label>
                    <input
                      type="text"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder="مثال: 00799999000000000000"
                      required
                      minLength={5}
                      className={inputClass}
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                    <p className="text-xs text-gray-400 mt-1">أدخل رقم الحساب الذي تم التحويل منه</p>
                  </div>
                </div>
              </div>

              {/* Receipt upload */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">
                  رفع إيصال الدفع <span className="text-red-400">*</span>
                </h2>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <span className="text-emerald-500 text-lg">✓</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📁</div>
                      <p className="text-sm text-gray-600 font-medium">اضغط لرفع الإيصال</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — حتى 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          {/* Edahabia info */}
          {method === 'edahabia' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  🔒
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">دفع آمن عبر Chargily</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    سيتم تحويلك لبوابة الدفع الآمنة الخاصة بـ Chargily لإتمام العملية.
                    يدعم بطاقات الذهبية (Edahabia) وبطاقات CIB.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-green-600 font-medium">اتصال مشفر SSL</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-xs text-green-600 font-medium">معتمد من بنك الجزائر</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !amount || Number(amount) < 1000}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-semibold text-base hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {method === 'edahabia' ? 'جارٍ التحويل...' : 'جارٍ الإرسال...'}
              </>
            ) : (
              <>
                {method === 'edahabia' ? '🔒 الدفع عبر Chargily' : '📤 إرسال طلب الإيداع'}
                {amount && Number(amount) >= 1000 && (
                  <span className="bg-emerald-600 px-2 py-0.5 rounded-lg text-sm">
                    {Number(amount).toLocaleString()} دج
                  </span>
                )}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            بإرسال الطلب توافق على{' '}
            <Link href="/terms" className="text-emerald-600 hover:underline">سياسة الإيداع</Link>
          </p>

        </form>
      </div>
    </div>
  )
}
