'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { ArrowLeft, ArrowRight, CheckCircle, ShieldAlert, XCircle, Clock, AlertCircle } from 'lucide-react'

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

export default function ContractsPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const DirectionArrow = i18n.language === 'ar' ? ArrowLeft : ArrowRight

  function statusLabel(s: string) {
    return t(`contracts.status.${s}`, { defaultValue: s })
  }

  function statusColor(s: string) {
    const map: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700',
      paused: 'bg-yellow-50 text-yellow-700',
      completed: 'bg-gray-100 text-gray-600',
      disputed: 'bg-red-50 text-red-600',
      cancelled: 'bg-gray-100 text-gray-400',
      cancellation_pending: 'bg-orange-50 text-orange-700',
    }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

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
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:no-underline">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 hover:no-underline">
            <DirectionArrow size={16} /> {t('nav.dashboard')}
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ltr:text-left rtl:text-right">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">{t('contracts.title')}</h1>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 text-sm mb-4">{t('contracts.empty')}</p>
            <Link href="/jobs" className="inline-block bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
              {t('contracts.browseJobs')}
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
                  className="block bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 hover:border-emerald-200 hover:shadow-sm transition-all group hover:no-underline text-inherit">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColor(contract.status)}`}>
                          {statusLabel(contract.status)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isClient ? t('contracts.roles.client') : t('contracts.roles.freelancer')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1 text-base">
                        {contract.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {isClient ? t('contracts.withFreelancer') : t('contracts.withClient')}{other?.full_name || other?.username}
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
                          <span className="text-xs text-gray-400">{completedMilestones}/{totalMilestones} {t('contracts.milestonesCount')}</span>
                        </div>
                      )}
                    </div>

                    <div className="ltr:text-right rtl:text-left sm:ltr:ml-6 sm:rtl:mr-6">
                      <div className="text-lg sm:text-xl font-bold text-gray-900">
                        {contract.total_amount?.toLocaleString()} {t('common.currency')}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t('contracts.started')} {new Date(contract.start_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
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
