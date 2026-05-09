'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Contract {
  id: string
  title: string
  total_amount: number
  platform_fee: number
  status: string
  start_date: string
  milestones: any[]
  client_id: string
  freelancer_id: string
  client: { username: string; full_name: string }
  freelancer: { username: string; full_name: string }
  jobs: { title: string }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    active: 'نشط', paused: 'موقوف', completed: 'مكتمل',
    disputed: 'متنازع', cancelled: 'ملغي',
  }
  return map[s] || s
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    paused: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-gray-100 text-gray-600',
    disputed: 'bg-red-50 text-red-600',
    cancelled: 'bg-gray-100 text-gray-400',
  }
  return map[s] || 'bg-gray-100 text-gray-600'
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!client_id(username, full_name),
          freelancer:profiles!freelancer_id(username, full_name),
          jobs(title)
        `)
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      setContracts(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← لوحة التحكم</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">عقودي</h1>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 text-sm">لا توجد عقود بعد</p>
            <Link href="/jobs" className="mt-4 inline-block bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors">
              تصفح المشاريع
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const isClient = contract.client_id === userId
              const other = isClient ? contract.freelancer : contract.client
              const completedMilestones = contract.milestones?.filter((m: any) => m.status === 'approved').length || 0
              const totalMilestones = contract.milestones?.length || 0

              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-6 hover:border-emerald-200 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColor(contract.status)}`}>
                          {statusLabel(contract.status)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isClient ? '💼 أنت صاحب العمل' : '🧑‍💻 أنت المستقل'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                        {contract.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {isClient ? `مع المستقل: ${other?.full_name || other?.username}` : `مع صاحب العمل: ${other?.full_name || other?.username}`}
                      </p>

                      {/* Milestone progress */}
                      {totalMilestones > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-32">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(completedMilestones / totalMilestones) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{completedMilestones}/{totalMilestones} مراحل</span>
                        </div>
                      )}
                    </div>

                    <div className="text-left mr-6">
                      <div className="text-xl font-bold text-gray-900">
                        {contract.total_amount?.toLocaleString()} دج
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        بدأ {new Date(contract.start_date).toLocaleDateString('ar-DZ')}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
