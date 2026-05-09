'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Milestone {
  id: string
  title: string
  amount: number
  description: string
  status: 'pending' | 'in_progress' | 'submitted' | 'approved'
  due_date?: string
  approved_at?: string
}

interface Contract {
  id: string
  title: string
  total_amount: number
  platform_fee: number
  status: string
  start_date: string
  milestones: Milestone[]
  client_id: string
  freelancer_id: string
  client: { id: string; username: string; full_name: string; balance: number }
  freelancer: { id: string; username: string; full_name: string; balance: number }
  jobs: { id: string; title: string }
}

function msStatusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'في الانتظار',
    in_progress: 'جارٍ التنفيذ',
    submitted: 'تم التسليم',
    approved: 'مُعتمد ✓',
  }
  return map[s] || s
}

function msStatusColor(s: string) {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    in_progress: 'bg-yellow-50 text-yellow-700',
    submitted: 'bg-blue-50 text-blue-700',
    approved: 'bg-emerald-50 text-emerald-700',
  }
  return map[s] || 'bg-gray-100 text-gray-500'
}

export default function ContractDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      await fetchContract()
      setLoading(false)
    }
    init()
  }, [])

  const fetchContract = async () => {
    const { data } = await supabase
      .from('contracts')
      .select(`
        *,
        client:profiles!client_id(id, username, full_name, balance),
        freelancer:profiles!freelancer_id(id, username, full_name, balance),
        jobs(id, title)
      `)
      .eq('id', id)
      .single()
    setContract(data)
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // صاحب العمل — تأمين أموال مرحلة
  const lockFunds = async (milestone: Milestone) => {
    if (!contract) return
    setActionLoading(milestone.id)

    // تحقق من الرصيد
    const { data: profile } = await supabase
      .from('profiles').select('balance').eq('id', userId!).single()

    if ((profile?.balance || 0) < milestone.amount) {
      showToast('رصيدك غير كافٍ لتأمين هذه المرحلة', 'error')
      setActionLoading(null)
      return
    }

    // خصم من رصيد صاحب العمل
    await supabase.from('profiles')
      .update({ balance: (profile?.balance || 0) - milestone.amount })
      .eq('id', userId!)

    // تسجيل معاملة
    await supabase.from('transactions').insert({
      contract_id: contract.id,
      from_user_id: userId,
      amount: milestone.amount,
      type: 'escrow_lock',
      status: 'completed',
      milestone_id: milestone.id,
      note: `تأمين مرحلة: ${milestone.title}`,
    })

    // تحديث حالة المرحلة
    const updatedMilestones = contract.milestones.map(m =>
      m.id === milestone.id ? { ...m, status: 'in_progress' } : m
    )
    await supabase.from('contracts')
      .update({ milestones: updatedMilestones })
      .eq('id', contract.id)

    setContract({ ...contract, milestones: updatedMilestones as Milestone[] })
    showToast(`✅ تم تأمين ${milestone.amount.toLocaleString()} دج للمرحلة`)
    setActionLoading(null)
  }

  // المستقل — تسليم العمل
  const submitWork = async (milestone: Milestone) => {
    if (!contract) return
    setActionLoading(milestone.id)

    const updatedMilestones = contract.milestones.map(m =>
      m.id === milestone.id ? { ...m, status: 'submitted' } : m
    )
    await supabase.from('contracts')
      .update({ milestones: updatedMilestones })
      .eq('id', contract.id)

    setContract({ ...contract, milestones: updatedMilestones as Milestone[] })
    showToast('✅ تم إرسال العمل للمراجعة')
    setActionLoading(null)
  }

  // صاحب العمل — الموافقة وتحرير الدفعة
  const approveAndRelease = async (milestone: Milestone) => {
    if (!contract) return
    setActionLoading(milestone.id)

    const FEE_PCT = 0.05
    const fee = Math.round(milestone.amount * FEE_PCT)
    const net = milestone.amount - fee

    // إضافة للمستقل
    const { data: freelancerProfile } = await supabase
      .from('profiles').select('balance').eq('id', contract.freelancer_id).single()

    await supabase.from('profiles')
      .update({ balance: (freelancerProfile?.balance || 0) + net })
      .eq('id', contract.freelancer_id)

    // تسجيل معاملة
    await supabase.from('transactions').insert({
      contract_id: contract.id,
      from_user_id: userId,
      to_user_id: contract.freelancer_id,
      amount: milestone.amount,
      fee,
      type: 'escrow_release',
      status: 'completed',
      milestone_id: milestone.id,
      note: `تحرير دفعة: ${milestone.title}`,
    })

    // تحديث المرحلة
    const updatedMilestones = contract.milestones.map(m =>
      m.id === milestone.id
        ? { ...m, status: 'approved', approved_at: new Date().toISOString() }
        : m
    )

    // تحقق إذا كل المراحل مكتملة
    const allDone = updatedMilestones.every(m => m.status === 'approved')

    await supabase.from('contracts').update({
      milestones: updatedMilestones,
      ...(allDone ? { status: 'completed' } : {}),
    }).eq('id', contract.id)

    setContract({
      ...contract,
      milestones: updatedMilestones as Milestone[],
      status: allDone ? 'completed' : contract.status,
    })

    showToast(`✅ تم تحرير ${net.toLocaleString()} دج للمستقل (بعد رسوم المنصة 5%)`)
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-500 mb-4">العقد غير موجود</p>
          <Link href="/contracts" className="text-emerald-600 hover:underline">← العودة للعقود</Link>
        </div>
      </div>
    )
  }

  const isClient = contract.client_id === userId
  const isFreelancer = contract.freelancer_id === userId
  const completedMilestones = contract.milestones?.filter(m => m.status === 'approved').length || 0
  const totalMilestones = contract.milestones?.length || 0
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/contracts" className="text-sm text-gray-500 hover:text-gray-900">← عقودي</Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">

          {/* Main */}
          <div className="col-span-2 space-y-6">

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  contract.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  contract.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                  'bg-yellow-50 text-yellow-700'
                }`}>
                  {contract.status === 'active' ? 'نشط' : contract.status === 'completed' ? 'مكتمل ✓' : contract.status}
                </span>
                {contract.jobs && (
                  <Link href={`/jobs/${contract.jobs.id}`} className="text-xs text-emerald-600 hover:underline">
                    {contract.jobs.title}
                  </Link>
                )}
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-4">{contract.title}</h1>

              {/* Progress */}
              {totalMilestones > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>التقدم الإجمالي</span>
                    <span>{completedMilestones}/{totalMilestones} مراحل مكتملة</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <h2 className="font-semibold text-gray-900 mb-5">مراحل التنفيذ والضمان</h2>

              {!contract.milestones || contract.milestones.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-gray-400 text-sm">لا توجد مراحل محددة لهذا العقد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contract.milestones.map((milestone, index) => (
                    <div key={milestone.id}
                      className={`border rounded-2xl p-5 transition-all ${
                        milestone.status === 'approved'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : milestone.status === 'submitted'
                          ? 'border-blue-200 bg-blue-50/20'
                          : milestone.status === 'in_progress'
                          ? 'border-yellow-200 bg-yellow-50/20'
                          : 'border-gray-100'
                      }`}>

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            milestone.status === 'approved' ? 'bg-emerald-500 text-white' :
                            milestone.status === 'in_progress' || milestone.status === 'submitted' ? 'bg-yellow-400 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {milestone.status === 'approved' ? '✓' : index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                            {milestone.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-gray-900">{milestone.amount?.toLocaleString()} دج</div>
                          <span className={`text-xs px-2 py-0.5 rounded-lg mt-1 inline-block ${msStatusColor(milestone.status)}`}>
                            {msStatusLabel(milestone.status)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">

                        {/* صاحب العمل — تأمين الأموال */}
                        {isClient && milestone.status === 'pending' && (
                          <button
                            onClick={() => lockFunds(milestone)}
                            disabled={actionLoading === milestone.id}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === milestone.id ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : '🔒'}
                            تأمين الأموال
                          </button>
                        )}

                        {/* المستقل — تسليم العمل */}
                        {isFreelancer && milestone.status === 'in_progress' && (
                          <button
                            onClick={() => submitWork(milestone)}
                            disabled={actionLoading === milestone.id}
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === milestone.id ? '...' : '📤'}
                            تسليم العمل
                          </button>
                        )}

                        {/* صاحب العمل — الموافقة وتحرير الدفعة */}
                        {isClient && milestone.status === 'submitted' && (
                          <button
                            onClick={() => approveAndRelease(milestone)}
                            disabled={actionLoading === milestone.id}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === milestone.id ? '...' : '✅'}
                            الموافقة وتحرير الدفعة
                          </button>
                        )}

                        {milestone.status === 'approved' && milestone.approved_at && (
                          <span className="text-xs text-emerald-600">
                            تم الاعتماد {new Date(milestone.approved_at).toLocaleDateString('ar-DZ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ملخص العقد</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">المبلغ الإجمالي</span>
                  <span className="font-medium text-gray-900">{contract.total_amount?.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">رسوم المنصة (5%)</span>
                  <span className="font-medium text-red-500">- {Math.round((contract.total_amount || 0) * 0.05).toLocaleString()} دج</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">صافي المستقل</span>
                  <span className="font-bold text-emerald-600">{Math.round((contract.total_amount || 0) * 0.95).toLocaleString()} دج</span>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">أطراف العقد</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {contract.client?.full_name?.charAt(0) || 'ع'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contract.client?.full_name}</div>
                    <div className="text-xs text-gray-400">💼 صاحب العمل</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {contract.freelancer?.full_name?.charAt(0) || 'م'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contract.freelancer?.full_name}</div>
                    <div className="text-xs text-gray-400">🧑‍💻 المستقل</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow info */}
            <div className="bg-emerald-500 rounded-2xl p-6 text-white">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-2">نظام الضمان</h3>
              <p className="text-emerald-100 text-xs leading-relaxed">
                أموالك محمية — تُحجز عند بدء كل مرحلة وتُحرَّر فقط بعد موافقة صاحب العمل على التسليم
              </p>
            </div>

            {/* Message button */}
            <Link
              href={`/messages?user=${isClient ? contract.freelancer_id : contract.client_id}`}
              className="block w-full text-center border border-gray-200 text-gray-700 py-3 rounded-xl text-sm hover:border-emerald-300 hover:text-emerald-600 transition-all"
            >
              💬 مراسلة الطرف الآخر
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
