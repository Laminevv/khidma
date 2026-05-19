'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  uploadKycDocumentAction,
  submitKycAction,
  getKycStatusAction,
} from '@/app/actions/kyc'

type IdType = 'national_id' | 'passport' | 'driving_license'

const ID_TYPES: { id: IdType; label: string; icon: string; desc: string }[] = [
  {
    id: 'national_id',
    label: 'بطاقة التعريف الوطنية',
    icon: '🪪',
    desc: 'البطاقة الوطنية الجزائرية',
  },
  {
    id: 'passport',
    label: 'جواز السفر',
    icon: '📕',
    desc: 'جواز السفر الجزائري أو الأجنبي',
  },
  {
    id: 'driving_license',
    label: 'رخصة القيادة',
    icon: '🚗',
    desc: 'رخصة القيادة الجزائرية',
  },
]

interface UploadSlot {
  file: File | null
  path: string | null
  uploading: boolean
  error: string | null
}

export default function KycSubmissionPage() {
  const router = useRouter()

  // Auth
  const [loading, setLoading] = useState(true)
  const [currentKycStatus, setCurrentKycStatus] = useState<string | null>(null)

  // Form state
  const [idType, setIdType] = useState<IdType>('national_id')
  const [idNumber, setIdNumber] = useState('')
  const [front, setFront] = useState<UploadSlot>({ file: null, path: null, uploading: false, error: null })
  const [back, setBack] = useState<UploadSlot>({ file: null, path: null, uploading: false, error: null })
  const [selfie, setSelfie] = useState<UploadSlot>({ file: null, path: null, uploading: false, error: null })

  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check auth + existing KYC status on load
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const result = await getKycStatusAction()
      if ('error' in result) {
        setLoading(false)
        return
      }

      setCurrentKycStatus(result.kycStatus)
      setLoading(false)
    }
    init()
  }, [router])

  // File upload handler (reusable for front/back/selfie)
  const handleFileUpload = async (
    file: File,
    documentType: 'front' | 'back' | 'selfie',
    setter: React.Dispatch<React.SetStateAction<UploadSlot>>
  ) => {
    // Validate locally before uploading
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setter(prev => ({ ...prev, error: 'نوع الملف غير مسموح (JPG, PNG, WebP, PDF فقط)' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setter(prev => ({ ...prev, error: 'حجم الملف يتجاوز 10MB' }))
      return
    }

    setter({ file, path: null, uploading: true, error: null })

    const fd = new FormData()
    fd.append('document', file)
    const result = await uploadKycDocumentAction(fd, documentType)

    if (result.success) {
      setter({ file, path: result.path, uploading: false, error: null })
    } else {
      setter({ file: null, path: null, uploading: false, error: result.error })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validation
    if (!idNumber || idNumber.trim().length < 5) {
      setError('رقم الوثيقة يجب أن يكون 5 أحرف على الأقل')
      return
    }

    if (!front.path) {
      setError('يجب رفع صورة الوجه الأمامي للوثيقة')
      return
    }

    setSubmitting(true)

    try {
      const result = await submitKycAction(
        idType,
        idNumber.trim(),
        front.path,
        back.path || undefined,
        selfie.path || undefined
      )

      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => router.push('/kyc/status'), 3000)
      } else {
        setError(result.error)
      }
    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all'

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Already pending or approved — redirect to status page
  if (currentKycStatus === 'pending' || currentKycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{currentKycStatus === 'approved' ? '✅' : '⏳'}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {currentKycStatus === 'approved'
              ? 'تم التحقق من هويتك بالفعل!'
              : 'طلبك قيد المراجعة'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {currentKycStatus === 'approved'
              ? 'حسابك موثق رسمياً. لا حاجة لإعادة التقديم.'
              : 'طلب التحقق قيد المراجعة من فريقنا. سيتم إشعارك فور صدور القرار.'}
          </p>
          <Link
            href="/kyc/status"
            className="inline-block bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            عرض حالة الطلب
          </Link>
        </div>
      </div>
    )
  }

  // Success state
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلب التحقق!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{success}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            جارٍ التحويل لصفحة المتابعة...
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
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            ← لوحة التحكم
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
          <h1 className="text-2xl font-bold text-gray-900">التحقق من الهوية (KYC)</h1>
          <p className="text-gray-500 text-sm mt-1">
            أكمل التحقق لرفع حدود السحب والحصول على شارة الموثوقية
          </p>
        </div>

        {/* Info banner for rejected — can resubmit */}
        {currentKycStatus === 'rejected' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
            <span className="text-yellow-500 mt-0.5 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">تم رفض طلبك السابق</p>
              <p className="text-xs text-yellow-600 mt-1">
                يمكنك إعادة التقديم بعد تصحيح المشكلة. تحقق من{' '}
                <Link href="/kyc/status" className="underline font-medium">صفحة الحالة</Link>
                {' '}لمعرفة سبب الرفض.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: Document Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
              <h2 className="font-semibold text-gray-900">نوع الوثيقة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ID_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setIdType(t.id)}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${idType === t.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-100 hover:border-gray-200'
                    }`}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className={`font-medium text-sm ${idType === t.id ? 'text-emerald-700' : 'text-gray-800'}`}>
                    {t.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Document Number */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
              <h2 className="font-semibold text-gray-900">رقم الوثيقة</h2>
            </div>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={
                idType === 'national_id' ? 'مثال: 123456789012345678'
                  : idType === 'passport' ? 'مثال: A12345678'
                    : 'مثال: 1234567890'
              }
              required
              minLength={5}
              className={inputClass}
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              dir="ltr"
            />
            <div className="flex items-start gap-2 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <span className="text-blue-500 mt-0.5">🔒</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                رقم الوثيقة يتم تشفيره (SHA-256) ولا يُخزن بشكل نصي مقروء أبداً.
                يُستخدم فقط لمنع تكرار التسجيل بنفس الرقم.
              </p>
            </div>
          </div>

          {/* Step 3: Document Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">3</div>
              <h2 className="font-semibold text-gray-900">صور الوثيقة</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Front — Required */}
              <UploadZone
                label="الوجه الأمامي"
                required
                icon="📸"
                slot={front}
                inputRef={frontRef}
                onFileChange={(file) => handleFileUpload(file, 'front', setFront)}
                onClear={() => setFront({ file: null, path: null, uploading: false, error: null })}
              />

              {/* Back — Optional */}
              <UploadZone
                label="الوجه الخلفي"
                icon="🔄"
                slot={back}
                inputRef={backRef}
                onFileChange={(file) => handleFileUpload(file, 'back', setBack)}
                onClear={() => setBack({ file: null, path: null, uploading: false, error: null })}
              />

              {/* Selfie — Optional */}
              <UploadZone
                label="صورة سيلفي مع الوثيقة"
                icon="🤳"
                slot={selfie}
                inputRef={selfieRef}
                onFileChange={(file) => handleFileUpload(file, 'selfie', setSelfie)}
                onClear={() => setSelfie({ file: null, path: null, uploading: false, error: null })}
              />
            </div>

            <p className="text-xs text-gray-400 mt-4">
              JPG, PNG, WebP, PDF — حتى 10MB لكل ملف. الوجه الأمامي إلزامي.
            </p>
          </div>

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
            disabled={submitting || !front.path || front.uploading || back.uploading || selfie.uploading || !idNumber.trim()}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-semibold text-base hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                جارٍ الإرسال...
              </>
            ) : (
              <>🆔 إرسال طلب التحقق</>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            بإرسال الطلب توافق على{' '}
            <Link href="#" className="text-emerald-600 hover:underline">سياسة الخصوصية</Link>
            {' '}وأن جميع البيانات المقدمة صحيحة ودقيقة.
          </p>

        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Reusable Upload Zone Component (local to this file)
// ─────────────────────────────────────────────────────────────
function UploadZone({
  label,
  required,
  icon,
  slot,
  inputRef,
  onFileChange,
  onClear,
}: {
  label: string
  required?: boolean
  icon: string
  slot: UploadSlot
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (file: File) => void
  onClear: () => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => !slot.uploading && !slot.path && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all min-h-[140px] flex flex-col items-center justify-center ${
          slot.path
            ? 'border-emerald-400 bg-emerald-50 cursor-default'
            : slot.uploading
            ? 'border-gray-200 bg-gray-50 cursor-wait'
            : slot.error
            ? 'border-red-300 bg-red-50 cursor-pointer'
            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer'
        }`}
      >
        {slot.uploading ? (
          <>
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs text-gray-500">جارٍ الرفع...</p>
          </>
        ) : slot.path ? (
          <>
            <div className="text-2xl mb-1">✅</div>
            <p className="text-xs text-emerald-700 font-medium mb-1">{slot.file?.name}</p>
            <p className="text-xs text-gray-400">{slot.file ? `${(slot.file.size / 1024).toFixed(0)} KB` : ''}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="mt-2 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
            >
              إزالة
            </button>
          </>
        ) : (
          <>
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs text-gray-600 font-medium">اضغط لرفع الملف</p>
          </>
        )}
      </div>
      {slot.error && (
        <p className="text-xs text-red-500 mt-1.5">{slot.error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
          // Reset the input so re-selecting the same file works
          e.target.value = ''
        }}
      />
    </div>
  )
}
