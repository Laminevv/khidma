'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { requestWithdrawalAction } from '@/app/actions/wallet'
import NotificationBell from '@/app/components/NotificationBell'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import {
  Briefcase,
  FileText,
  Plus,
  Wallet,
  Star,
  CreditCard,
  User as UserIcon,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react'

interface Job {
  id: string
  title: string
  category: string
  budget_max: number
  status: string
  proposals_count: number
  created_at: string
}

interface Profile {
  id: string
  username: string
  full_name: string
  role: string
  deposit_balance: number
  withdrawable_balance: number
  rating: number
  total_reviews: number
  is_admin: boolean
}

export default function DashboardPageClient({ 
  profile, 
  jobs, 
  activeContracts 
}: { 
  profile: Profile, 
  jobs: Job[], 
  activeContracts: number 
}) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const isClient = profile.role === 'client' || profile.role === 'both'
  const DirectionChevron = i18n.language === 'ar' ? ChevronLeft : ChevronRight

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return t('home.time.justNow')
    if (days === 1) return t('home.time.yesterday')
    return t('home.time.daysAgo', { count: days })
  }

  const handleWithdraw = async () => {
    if (profile.withdrawable_balance < 10000) return
    
    const amountStr = prompt(t('dashboard.prompts.withdrawAmount', { amount: profile.withdrawable_balance }), profile.withdrawable_balance.toString())
    if (!amountStr) return
    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount < 10000 || amount > profile.withdrawable_balance) return alert(t('dashboard.invalidAmount'))

    const payoutDetails = prompt(t('dashboard.prompts.paymentDetails'))
    if (!payoutDetails || payoutDetails.trim().length < 5) return alert(t('dashboard.invalidPaymentDetails'))

    setWithdrawLoading(true)
    const res = await requestWithdrawalAction(amount, payoutDetails)
    if (res.success) {
      alert(`✅ ${t('dashboard.withdrawSuccess')}`)
      window.location.reload() // Or update local state but refreshing ensures sync
    } else {
      alert(res.error || t('errors.generic'))
    }
    setWithdrawLoading(false)
  }

  const statusLabel: Record<string, string> = {
    open: t('jobs.status.open'), 
    in_progress: t('jobs.status.in_progress'), 
    completed: t('jobs.status.completed'), 
    cancelled: t('jobs.status.cancelled'),
    pending: t('proposals.status.pending'), 
    accepted: t('proposals.status.accepted'), 
    rejected: t('proposals.status.rejected'),
    disputed: t('jobs.status.disputed')
  }

  const statusBadgeClass: Record<string, string> = {
    open: 'badge-active',
    in_progress: 'badge-pending',
    completed: 'badge-info',
    cancelled: 'badge-error',
    pending: 'badge-pending',
    accepted: 'badge-active',
    rejected: 'badge-error',
    disputed: 'badge-warning'
  }

  return (
    <>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="eyebrow">{t('dashboard.overview')}</span>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}>
            {t('dashboard.welcome')}، {profile.full_name || profile.username} 👋
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:block ltr:ml-4 rtl:mr-4">
            <LanguageSwitcher />
          </div>
          <div className="hidden lg:block ltr:ml-4 rtl:mr-4">
            <NotificationBell />
          </div>
          {isClient ? (
            <Link href="/jobs/new" className="btn btn-accent">
              <Plus className="w-4 h-4" />
              {t('jobs.postJob')}
            </Link>
          ) : (
            <Link href="/jobs" className="btn btn-primary">
              <Search className="w-4 h-4" />
              {t('dashboard.searchProjects')}
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="label">{isClient ? t('dashboard.myProjects') : t('dashboard.myProposals')}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="value">{jobs.length}</div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="label">{t('contracts.activeContracts')}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--success)' }}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="value">{activeContracts}</div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="label">{t('dashboard.totalBalance')}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--warning)' }}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="value text-[20px]">{((profile.deposit_balance || 0) + (profile.withdrawable_balance || 0)).toLocaleString()} {t('common.currency')}</div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="label">{t('profile.rating')}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--info)' }}>
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="value">{profile.rating ? `${profile.rating}` : '—'}</div>
          {profile.rating > 0 && <div className="trend">{profile.total_reviews} {t('profile.reviews')}</div>}
        </div>
      </div>

      {/* Main Grid: Table/List + Side Info */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Col: Projects/Proposals */}
        <div className="flex-1 min-w-0">
          <div className="card h-full" style={{ padding: 0 }}>
            <div className="card-header border-b" style={{ padding: '24px 24px 16px', margin: 0, borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
                {isClient ? t('dashboard.latestProjects') : t('dashboard.latestProposals')}
              </h2>
              <Link href={isClient ? "/jobs" : "/proposals"} className="text-sm font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                {t('common.seeAll')}
              </Link>
            </div>
            
            {jobs.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg)' }}>
                  <Briefcase className="w-8 h-8" style={{ color: 'var(--muted)' }} />
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                  {isClient ? t('dashboard.noProjectsYet') : t('dashboard.noProposalsYet')}
                </p>
                <Link href={isClient ? '/jobs/new' : '/jobs'} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {isClient ? t('jobs.postJob') : t('dashboard.browseAvailableProjects')}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ds-table w-full">
                  <thead>
                    <tr>
                      <th className="ltr:text-left rtl:text-right">{t('dashboard.table.name')}</th>
                      <th className="ltr:text-left rtl:text-right">{t('dashboard.table.category')}</th>
                      <th className="ltr:text-left rtl:text-right">{t('dashboard.table.status')}</th>
                      <th className="ltr:text-left rtl:text-right">{t('dashboard.table.budget')}</th>
                      <th className="ltr:text-left rtl:text-right">{t('dashboard.table.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${job.id}`)}>
                        <td>
                          <div className="font-medium" style={{ color: 'var(--fg)', maxWidth: '250px' }}>
                            <span className="truncate block">{job.title}</span>
                          </div>
                        </td>
                        <td><span style={{ color: 'var(--muted)' }}>{t(`jobs.categories.${job.category}`, job.category)}</span></td>
                        <td>
                          <span className={`badge ${statusBadgeClass[job.status] || 'badge-info'}`}>
                            {statusLabel[job.status] || job.status}
                          </span>
                        </td>
                        <td className="font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                          {job.budget_max ? `${job.budget_max.toLocaleString()} ${t('common.currency')}` : t('dashboard.table.negotiable')}
                        </td>
                        <td><span style={{ color: 'var(--muted)' }}>{timeAgo(job.created_at)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Wallet & Actions */}
        <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Wallet Card */}
          <div className="card relative overflow-hidden" style={{ background: 'var(--accent)', color: 'var(--surface)', padding: '32px 24px', border: 'none' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--surface) 20%, transparent)' }}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80">{t('dashboard.yourWallet')}</span>
              </div>
              
              <div className="mb-6">
                <div className="text-sm opacity-80 mb-1">{t('wallet.balance')}</div>
                <div className="text-3xl font-bold font-mono">
                  {(profile.withdrawable_balance || 0).toLocaleString()} <span className="text-lg opacity-80">{t('common.currency')}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {isClient && (
                  <Link href="/wallet/deposit" className="btn w-full justify-center" style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}>
                    {t('wallet.deposit')}
                  </Link>
                )}
                
                {!isClient && (
                  <button 
                    onClick={handleWithdraw} 
                    disabled={withdrawLoading || (profile.withdrawable_balance || 0) < 10000} 
                    className="btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}
                  >
                    {withdrawLoading ? t('dashboard.requesting') : t('wallet.withdraw')}
                  </button>
                )}
                
                <Link href="/wallet" className="text-center flex items-center justify-center gap-1 text-sm font-medium hover:underline opacity-90 transition-opacity hover:opacity-100">
                  {t('dashboard.manageWallet')}
                  <DirectionChevron className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{t('dashboard.quickLinks')}</h3>
            </div>
            <div className="flex flex-col">
              <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{t('nav.profile')}</span>
                <DirectionChevron className="w-4 h-4 ltr:ml-auto rtl:mr-auto" style={{ color: 'var(--muted)' }} />
              </Link>
              <Link href="/kyc/status" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{t('dashboard.kyc')}</span>
                <DirectionChevron className="w-4 h-4 ltr:ml-auto rtl:mr-auto" style={{ color: 'var(--muted)' }} />
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{t('nav.settings')}</span>
                <DirectionChevron className="w-4 h-4 ltr:ml-auto rtl:mr-auto" style={{ color: 'var(--muted)' }} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
