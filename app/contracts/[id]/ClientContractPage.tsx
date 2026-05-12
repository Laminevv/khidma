'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lockFundsAction, approveAndReleaseAction, submitReviewAction, raiseDisputeAction } from './actions'

interface Milestone {
  id: string
  title: string
  amount: number
  description: string
  status: 'pending' | 'in_progress' | 'submitted' | 'approved'
  due_date?: string
  approved_at?: string
  delivery_files?: string[]
  delivery_note?: string
}

interface Contract {
  id: string
  title: string
  total_amount: number
  status: string
  start_date: string
  milestones: Milestone[]
  client_id: string
  freelancer_id: string
  client: { id: string; username: string; full_name: string; balance: number }
  freelancer: { id: string; username: string; full_name: string; balance: number }
  jobs: { id: string; title: string }
}

interface Review {
  id: string
  rating: number
  comment: string | null
  reviewer_id: string
  reviewee_id: string
  created_at: string
  reviewer: { username: string; full_name: string } | null
}

function msStatusLabel(s: string) {
  const map: Record<string, string> = { pending: 'في الانتظار', in_progress: 'جارٍ التنفيذ', submitted: 'تم التسليم', approved: 'مُعتمد ✓' }
  return map[s] || s
}

function msStatusColor(s: string) {
  const map: Record<string, string> = { pending: 'bg-gray-100 text-gray-500', in_progress: 'bg-yellow-50 text-yellow-700', submitted: 'bg-blue-50 text-blue-700', approved: 'bg-emerald-50 text-emerald-700' }
  return map[s] || 'bg-gray-100 text-gray-500'
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl transition-all duration-150 hover:scale-110 ${
            star <= (hover || value) ? 'text-amber-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-sm" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ClientContractPage({ initialContract, userId, reviews: initialReviews = [] }: { initialContract: Contract, userId: string, reviews?: Review[] }) {
  const [contract, setContract] = useState<Contract>(initialContract)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState<Milestone | null>(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Review state
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const lockFunds = async (milestone: Milestone) => {
    setActionLoading(milestone.id)
    const res = await lockFundsAction(contract.id, milestone.id, milestone.amount)
    if (res.success) {
      showToast(`✅ تم تأمين ${milestone.amount.toLocaleString()} دج`)
      const updated = contract.milestones.map(m => m.id === milestone.id ? { ...m, status: 'in_progress' } : m)
      setContract({ ...contract, milestones: updated as Milestone[] })
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setActionLoading(null)
  }

  const submitWork = async () => {
    if (!contract || !showDeliveryModal) return
    setUploading(true)
    const uploadedUrls: string[] = []
    for (const file of deliveryFiles) {
      const fileName = `${contract.id}/${showDeliveryModal.id}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('deliverables').upload(fileName, file)
      if (!error && data) uploadedUrls.push(data.path)
    }
    const updated = contract.milestones.map(m =>
      m.id === showDeliveryModal.id ? { ...m, status: 'submitted', delivery_files: uploadedUrls, delivery_note: deliveryNote } : m
    )
    await supabase.from('contracts').update({ milestones: updated }).eq('id', contract.id)
    setContract({ ...contract, milestones: updated as Milestone[] })
    showToast('✅ تم إرسال العمل للمراجعة')
    setShowDeliveryModal(null); setDeliveryNote(''); setDeliveryFiles([])
    setUploading(false)
  }

  const approveAndRelease = async (milestone: Milestone) => {
    setActionLoading(milestone.id)
    const res = await approveAndReleaseAction(contract.id, milestone.id, milestone.amount)
    if (res.success) {
      const fee = Math.round(milestone.amount * 0.10)
      const net = milestone.amount - fee
      showToast(`✅ تم تحرير ${net.toLocaleString()} دج للمستقل`)
      const updated = contract.milestones.map(m => m.id === milestone.id ? { ...m, status: 'approved', approved_at: new Date().toISOString() } : m)
      const allDone = updated.every(m => m.status === 'approved')
      setContract({ ...contract, milestones: updated as Milestone[], status: allDone ? 'completed' : contract.status })
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setActionLoading(null)
  }

  const downloadFile = async (filePath: string, index: number) => {
    const { data } = await supabase.storage.from('deliverables').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) {
      const response = await fetch(data.signedUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filePath.split('/').pop() || `file_${index + 1}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const isClient = contract.client_id === userId
  const isFreelancer = contract.freelancer_id === userId
  const completedMilestones = contract.milestones?.filter(m => m.status === 'approved').length || 0
  const totalMilestones = contract.milestones?.length || 0
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  // Review helpers
  const hasUserReviewed = reviews.some(r => r.reviewer_id === userId)
  const revieweeId = isClient ? contract.freelancer_id : contract.client_id
  const revieweeName = isClient ? contract.freelancer?.full_name : contract.client?.full_name
  const canReview = contract.status === 'completed' && !hasUserReviewed

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      showToast('يرجى اختيار تقييم من 1 إلى 5', 'error')
      return
    }
    setReviewLoading(true)
    const res = await submitReviewAction(contract.id, revieweeId, reviewRating, reviewComment)
    if (res.success) {
      showToast('✅ تم إرسال التقييم بنجاح!')
      setReviews([...reviews, {
        id: Date.now().toString(),
        rating: reviewRating,
        comment: reviewComment || null,
        reviewer_id: userId,
        reviewee_id: revieweeId,
        created_at: new Date().toISOString(),
        reviewer: isClient ? { username: contract.client?.username || '', full_name: contract.client?.full_name || '' } : { username: contract.freelancer?.username || '', full_name: contract.freelancer?.full_name || '' },
      }])
      setShowReviewModal(false)
      setReviewRating(0)
      setReviewComment('')
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setReviewLoading(false)
  }

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      showToast('يرجى كتابة سبب النزاع', 'error')
      return
    }
    setDisputeLoading(true)
    const res = await raiseDisputeAction(contract.id, disputeReason)
    if (res.success) {
      showToast('✅ تم فتح النزاع بنجاح')
      setContract({ ...contract, status: 'disputed' })
      setShowDisputeModal(false)
      setDisputeReason('')
    } else {
      showToast(res.error || 'حدث خطأ', 'error')
    }
    setDisputeLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md" dir="rtl">
            <h3 className="font-bold text-gray-900 text-base mb-4">تسليم العمل — {showDeliveryModal.title}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات التسليم <span className="text-red-400">*</span></label>
              <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="اشرح ما أنجزته..." rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                style={{ color: '#111827' }} />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">رفع الملفات (اختياري)</label>
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                <div className="text-2xl mb-1">📁</div>
                <p className="text-sm text-gray-500">اضغط لرفع الملفات</p>
                <p className="text-xs text-gray-400 mt-1">PDF, ZIP, PNG, JPG</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                onChange={(e) => setDeliveryFiles(Array.from(e.target.files || []))} />
              {deliveryFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {deliveryFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <span>📄</span><span className="truncate flex-1">{f.name}</span>
                      <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={submitWork} disabled={uploading || !deliveryNote.trim()}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {uploading ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : '📤'}
                {uploading ? 'جارٍ الرفع...' : 'إرسال التسليم'}
              </button>
              <button onClick={() => { setShowDeliveryModal(null); setDeliveryNote(''); setDeliveryFiles([]) }}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/contracts" className="text-sm text-gray-500 hover:text-gray-900">← عقودي</Link>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-base">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${contract.status === 'active' ? 'bg-emerald-50 text-emerald-700' : contract.status === 'completed' ? 'bg-gray-100 text-gray-600' : contract.status === 'disputed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {contract.status === 'active' ? 'نشط' : contract.status === 'completed' ? 'مكتمل ✓' : contract.status === 'disputed' ? 'في حالة نزاع ⚖️' : contract.status}
                </span>
                {contract.jobs && <Link href={`/jobs/${contract.jobs.id}`} className="text-xs text-emerald-600 hover:underline truncate">{contract.jobs.title}</Link>}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{contract.title}</h1>
              {totalMilestones > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>التقدم الإجمالي</span>
                    <span>{completedMilestones}/{totalMilestones} مراحل</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {contract.status === 'disputed' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 text-red-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚖️</div>
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">تم تجميد هذا العقد بسبب نزاع</h3>
                    <p className="text-sm text-red-700 leading-relaxed">
                      فريق الإدارة يقوم حالياً بمراجعة العقد وسيتواصل معكم قريباً عبر الرسائل الخاصة للوصول إلى حل يرضي الطرفين.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-7">
              <h2 className="font-semibold text-gray-900 mb-4 sm:mb-5">مراحل التنفيذ والضمان</h2>
              <div className="space-y-4">
                {contract.milestones?.map((milestone, index) => (
                  <div key={milestone.id} className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                    milestone.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' :
                    milestone.status === 'submitted' ? 'border-blue-200 bg-blue-50/20' :
                    milestone.status === 'in_progress' ? 'border-yellow-200 bg-yellow-50/20' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          milestone.status === 'approved' ? 'bg-emerald-500 text-white' :
                          milestone.status === 'in_progress' || milestone.status === 'submitted' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {milestone.status === 'approved' ? '✓' : index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{milestone.title}</h3>
                          {milestone.description && <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>}
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="font-bold text-gray-900 text-sm sm:text-base">{milestone.amount?.toLocaleString()} دج</div>
                        <span className={`text-xs px-2 py-0.5 rounded-lg mt-1 inline-block ${msStatusColor(milestone.status)}`}>
                          {msStatusLabel(milestone.status)}
                        </span>
                      </div>
                    </div>

                    {milestone.delivery_note && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-blue-700 font-medium mb-1">ملاحظات التسليم:</p>
                        <p className="text-sm text-blue-600">{milestone.delivery_note}</p>
                        {milestone.delivery_files && milestone.delivery_files.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {milestone.delivery_files.map((file, i) => (
                              <button key={i} onClick={() => downloadFile(file, i)}
                                className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1">
                                📄 تحميل الملف {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {isClient && milestone.status === 'pending' && (
                        <button onClick={() => lockFunds(milestone)} disabled={actionLoading === milestone.id}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 w-full sm:w-auto justify-center">
                          {actionLoading === milestone.id ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : '🔒'}
                          تأمين الأموال
                        </button>
                      )}
                      {isFreelancer && milestone.status === 'in_progress' && (
                        <button onClick={() => setShowDeliveryModal(milestone)}
                          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 w-full sm:w-auto justify-center">
                          📤 تسليم العمل
                        </button>
                      )}
                      {isClient && milestone.status === 'submitted' && contract.status !== 'disputed' && (
                        <button onClick={() => approveAndRelease(milestone)} disabled={actionLoading === milestone.id}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 w-full sm:w-auto justify-center">
                          {actionLoading === milestone.id ? '...' : '✅'} الموافقة وتحرير الدفعة
                        </button>
                      )}
                      {milestone.status === 'approved' && milestone.approved_at && (
                        <span className="text-xs text-emerald-600">تم الاعتماد {new Date(milestone.approved_at).toLocaleDateString('ar-DZ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Reviews Section ── */}
            {contract.status === 'completed' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-lg">⭐</span> التقييمات
                  </h2>
                  {canReview && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1.5"
                    >
                      ✍️ أضف تقييم
                    </button>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2 opacity-40">💬</div>
                    <p className="text-gray-400 text-sm">لا توجد تقييمات بعد</p>
                    {canReview && (
                      <p className="text-gray-500 text-xs mt-1">كن أول من يُقيّم!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {review.reviewer?.full_name?.charAt(0) || '؟'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {review.reviewer?.full_name || 'مستخدم'}
                                {review.reviewer_id === userId && (
                                  <span className="text-xs text-emerald-600 mr-1">(أنت)</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(review.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <StarRatingDisplay rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-2 pr-12">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {hasUserReviewed && (
                  <div className="mt-4 text-center">
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">✅ لقد قمت بتقييم هذا العقد</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ملخص العقد</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المبلغ الإجمالي</span>
                  <span className="font-medium text-gray-900">{contract.total_amount?.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">رسوم المنصة (10%)</span>
                  <span className="font-medium text-red-500">- {Math.round((contract.total_amount || 0) * 0.10).toLocaleString()} دج</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">صافي المستقل</span>
                  <span className="font-bold text-emerald-600">{Math.round((contract.total_amount || 0) * 0.90).toLocaleString()} دج</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">أطراف العقد</h3>
              <div className="space-y-3">
                <Link href={`/profile/${contract.client?.username}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                    {contract.client?.full_name?.charAt(0) || 'ع'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{contract.client?.full_name}</div>
                    <div className="text-xs text-gray-400">💼 صاحب العمل</div>
                  </div>
                </Link>
                <Link href={`/profile/${contract.freelancer?.username}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 group-hover:ring-2 group-hover:ring-emerald-300 transition-all">
                    {contract.freelancer?.full_name?.charAt(0) || 'م'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">{contract.freelancer?.full_name}</div>
                    <div className="text-xs text-gray-400">🧑‍💻 المستقل</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-emerald-500 rounded-2xl p-4 sm:p-6 text-white">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-2">نظام الضمان</h3>
              <p className="text-emerald-100 text-xs leading-relaxed">أموالك محمية — تُحجز عند بدء كل مرحلة وتُحرَّر فقط بعد موافقة صاحب العمل</p>
            </div>

            <Link href={`/messages?user=${isClient ? contract.freelancer_id : contract.client_id}`}
              className="block w-full text-center border border-gray-200 text-gray-700 py-3 rounded-xl text-sm hover:border-emerald-300 hover:text-emerald-600 transition-all font-medium">
              💬 مراسلة الطرف الآخر
            </Link>

            {(contract.status === 'active' || contract.status === 'paused') && (
              <button onClick={() => setShowDisputeModal(true)}
                className="w-full text-center border border-red-200 text-red-600 py-3 rounded-xl text-sm hover:bg-red-50 transition-all font-medium">
                ⚖️ رفع نزاع
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Dispute Modal ── */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md" dir="rtl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">رفع نزاع</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              عند رفع النزاع، سيتم تجميد العقد فوراً. يرجى توضيح المشكلة بالتفصيل وسيقوم فريق الإدارة بالتدخل في أقرب وقت.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">سبب النزاع <span className="text-red-500">*</span></label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل لكي يتمكن الفريق من المساعدة..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none"
                style={{ color: '#111827' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRaiseDispute}
                disabled={disputeLoading || !disputeReason.trim()}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {disputeLoading ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : '⚖️'}
                {disputeLoading ? 'جارٍ الإرسال...' : 'تأكيد رفع النزاع'}
              </button>
              <button
                onClick={() => { setShowDisputeModal(false); setDisputeReason('') }}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md" dir="rtl">
            <h3 className="font-bold text-gray-900 text-base mb-1">تقييم التعاون</h3>
            <p className="text-sm text-gray-500 mb-5">كيف كانت تجربتك مع {revieweeName}؟</p>

            {/* Star Rating Input */}
            <div className="flex flex-col items-center mb-5">
              <StarRatingInput value={reviewRating} onChange={setReviewRating} />
              <p className="text-sm text-gray-500 mt-2 h-5">
                {reviewRating === 1 && 'سيئ'}
                {reviewRating === 2 && 'مقبول'}
                {reviewRating === 3 && 'جيد'}
                {reviewRating === 4 && 'جيد جداً'}
                {reviewRating === 5 && 'ممتاز!'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">تعليق (اختياري)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اكتب تعليقك عن التجربة..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 resize-none"
                style={{ color: '#111827' }}
              />
              <p className="text-xs text-gray-400 mt-1 text-left" dir="ltr">{reviewComment.length}/500</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading || reviewRating === 0}
                className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {reviewLoading ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : '⭐'}
                {reviewLoading ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
              <button
                onClick={() => { setShowReviewModal(false); setReviewRating(0); setReviewComment('') }}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
