'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getKycStatusAction } from '@/app/actions/kyc'

interface KycStatusData {
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  submission: {
    id: string
    status: string
    id_type: string
    rejection_reason: string | null
    submitted_at: string
    reviewed_at: string | null
  } | null
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'بطاقة التعريف الوطنية',
  passport: 'جواز السفر',
  driving_license: 'رخصة القيادة',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function KycStatusPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<KycStatusData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const result = await getKycStatusAction()

      if ('error' in result) {
        setError(result.error)
      } else {
        setData(result)
      }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Status config
  const statusConfig: Record<string, {
    icon: string
    title: string
    subtitle: string
    color: string
    bgColor: string
    borderColor: string
    badgeBg: string
    badgeText: string
  }> = {
    none: {
      icon: '🆔',
      title: 'لم يتم التحقق بعد',
      subtitle: 'قم بإرسال طلب التحقق من هويتك لرفع حدود السحب والحصول على شارة الموثوقية.',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-600',
    },
    pending: {
      icon: '⏳',
      title: 'طلبك قيد المراجعة',
      subtitle: 'فريقنا يراجع وثائقك حالياً. ستصلك إشعار فور صدور القرار.',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-700',
    },
    approved: {
      icon: '✅',
      title: 'تم التحقق من هويتك!',
      subtitle: 'حسابك موثق رسمياً. يمكنك الآن الاستفادة من جميع الميزات بما في ذلك السحب بمبالغ مرتفعة.',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    },
    rejected: {
      icon: '❌',
      title: 'تم رفض طلب التحقق',
      subtitle: 'راجع سبب الرفض أدناه وأعد التقديم بعد تصحيح المشكلة.',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
    },
  }

  const status = data?.kycStatus || 'none'
  const config = statusConfig[status]
  const submission = data?.submission

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            ← لوحة التحكم
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5">
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
          <h1 className="text-2xl font-bold text-gray-900">حالة التحقق من الهوية</h1>
          <p className="text-gray-500 text-sm mt-1">تتبع حالة طلب التحقق الخاص بك</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Main Status Card */}
        <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-6 sm:p-8 mb-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="text-5xl">{config.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${config.badgeBg} ${config.badgeText}`}>
                  {status === 'none' ? 'غير مقدم'
                    : status === 'pending' ? 'قيد المراجعة'
                    : status === 'approved' ? 'موثق ✓'
                    : 'مرفوض'}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{config.subtitle}</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-0 mb-2">
            {/* Step 1: Submitted */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                status !== 'none'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {status !== 'none' ? '✓' : '1'}
              </div>
              <span className="text-xs text-gray-500 mt-2">التقديم</span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 -mt-5 ${
              status === 'pending' || status === 'approved' || status === 'rejected'
                ? 'bg-emerald-400'
                : 'bg-gray-200'
            }`} />

            {/* Step 2: Under Review */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                status === 'pending'
                  ? 'bg-yellow-400 border-yellow-400 text-white animate-pulse'
                  : status === 'approved' || status === 'rejected'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {status === 'pending' ? '⏳'
                  : status === 'approved' || status === 'rejected' ? '✓'
                  : '2'}
              </div>
              <span className="text-xs text-gray-500 mt-2">المراجعة</span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 -mt-5 ${
              status === 'approved' || status === 'rejected'
                ? status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'
                : 'bg-gray-200'
            }`} />

            {/* Step 3: Decision */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                status === 'approved'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : status === 'rejected'
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {status === 'approved' ? '✓'
                  : status === 'rejected' ? '✗'
                  : '3'}
              </div>
              <span className="text-xs text-gray-500 mt-2">القرار</span>
            </div>
          </div>
        </div>

        {/* Submission Details Card */}
        {submission && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">تفاصيل الطلب</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">نوع الوثيقة</span>
                <span className="text-sm font-medium text-gray-900">
                  {ID_TYPE_LABELS[submission.id_type] || submission.id_type}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">تاريخ التقديم</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(submission.submitted_at)}</span>
              </div>
              {submission.reviewed_at && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">تاريخ المراجعة</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(submission.reviewed_at)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">الحالة</span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  submission.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : submission.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {submission.status === 'approved' ? 'مقبول'
                    : submission.status === 'rejected' ? 'مرفوض'
                    : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Card */}
        {submission?.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">سبب الرفض</h3>
                <p className="text-sm text-red-700 leading-relaxed">{submission.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Card — shown when approved */}
        {status === 'approved' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">المزايا المفعّلة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '💰', label: 'سحب بدون حدود', desc: 'سحب مبالغ تتجاوز 50,000 دج' },
                { icon: '✅', label: 'شارة الموثوقية', desc: 'تظهر على ملفك العام وعروضك' },
                { icon: '⭐', label: 'أولوية في النتائج', desc: 'ملفك يظهر أعلى في البحث' },
              ].map((benefit) => (
                <div key={benefit.label} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xl">{benefit.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">{benefit.label}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Show "Submit" button if none or rejected */}
          {(status === 'none' || status === 'rejected') && (
            <Link
              href="/kyc"
              className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-emerald-600 transition-colors text-center"
            >
              {status === 'rejected' ? '🔄 إعادة تقديم الطلب' : '🆔 بدء التحقق'}
            </Link>
          )}

          <Link
            href="/dashboard"
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm text-center transition-colors ${
              status === 'none' || status === 'rejected'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            ← العودة للوحة التحكم
          </Link>

          {status === 'approved' && (
            <Link
              href="/settings"
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors text-center"
            >
              ⚙️ إعدادات الحساب
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
