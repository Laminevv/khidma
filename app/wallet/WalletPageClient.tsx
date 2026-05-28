'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { requestWithdrawalAction } from '@/app/actions/wallet'
import NotificationBell from '@/app/components/NotificationBell'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, ArrowLeft, ArrowRight,
  TrendingUp, Download, Lock, Unlock, RotateCcw, Percent,
  CheckCircle2, AlertCircle, Clock, History, User, CreditCard,
  Briefcase, Loader2, LogOut, Search, FileText, MessageSquare, ShieldCheck
} from 'lucide-react'

interface Profile {
  id: string
  username: string
  full_name: string
  role: string
  deposit_balance: number
  withdrawable_balance: number
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
  metadata: Record<string, unknown> | null
  created_at: string
}

export default function WalletPageClient({ 
  profile, 
  initialTransactions 
}: { 
  profile: Profile, 
  initialTransactions: Transaction[] 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, i18n } = useTranslation()
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [showDepositSuccess, setShowDepositSuccess] = useState(false)

  // Withdrawal form states
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'ccp' | 'rip'>('ccp')
  
  // CCP specific fields
  const [ccpNumber, setCcpNumber] = useState('')
  const [ccpKey, setCcpKey] = useState('')
  const [ccpFullName, setCcpFullName] = useState('')
  
  // RIP specific fields
  const [ripNumber, setRipNumber] = useState('')
  const [ripFullName, setRipFullName] = useState('')

  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const DirectionArrow = i18n.language === 'ar' ? ArrowLeft : ArrowRight

  const typeLabels: Record<string, string> = {
    deposit: t('wallet.transactions.deposit'),
    escrow_lock: t('wallet.transactions.escrow_lock'),
    escrow_release: t('wallet.transactions.escrow_release'),
    refund: t('wallet.transactions.refund'),
    withdrawal: t('wallet.transactions.withdrawal'),
    platform_fee: t('wallet.transactions.platform_fee'),
  }

  const typeIcons: Record<string, React.ReactNode> = {
    deposit: <Plus className="w-4 h-4 text-emerald-500" />,
    escrow_lock: <Lock className="w-4 h-4 text-amber-500" />,
    escrow_release: <Unlock className="w-4 h-4 text-teal-500" />,
    refund: <RotateCcw className="w-4 h-4 text-blue-500" />,
    withdrawal: <ArrowUpRight className="w-4 h-4 text-rose-500" />,
    platform_fee: <Percent className="w-4 h-4 text-slate-500" />,
  }

  const statusLabels: Record<string, string> = {
    pending: t('wallet.status.pending'),
    completed: t('wallet.status.completed'),
    failed: t('wallet.status.failed'),
    reversed: t('wallet.status.reversed'),
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    failed: 'bg-rose-50 text-rose-700 border-rose-200/80',
    reversed: 'bg-slate-100 text-slate-700 border-slate-200/80',
  }

  useEffect(() => {
    if (searchParams?.get('deposit') === 'success') {
      setTimeout(() => {
        setShowDepositSuccess(true)
      }, 0)
      window.history.replaceState({}, '', '/wallet')
      setTimeout(() => setShowDepositSuccess(false), 6000)
    }
  }, [searchParams])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess(false)

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 10000) {
      setWithdrawError(`${t('walletPage.withdrawForm.minWithdraw')} ${t('common.currency')}`)
      return
    }
    if (amount > profile.withdrawable_balance) {
      setWithdrawError(t('dashboard.invalidAmount'))
      return
    }

    let payoutString = ''
    if (withdrawMethod === 'ccp') {
      if (!ccpNumber || ccpNumber.length < 5 || isNaN(Number(ccpNumber))) {
        setWithdrawError(t('dashboard.invalidPaymentDetails'))
        return
      }
      if (!ccpKey || ccpKey.length !== 2 || isNaN(Number(ccpKey))) {
        setWithdrawError(t('dashboard.invalidPaymentDetails'))
        return
      }
      if (!ccpFullName.trim() || ccpFullName.trim().length < 5) {
        setWithdrawError(t('dashboard.invalidPaymentDetails'))
        return
      }
      payoutString = `CCP: ${ccpNumber} / KEY: ${ccpKey} - Name: ${ccpFullName.trim()}`
    } else {
      if (!ripNumber || ripNumber.length !== 20 || isNaN(Number(ripNumber))) {
        setWithdrawError(t('dashboard.invalidPaymentDetails'))
        return
      }
      if (!ripFullName.trim() || ripFullName.trim().length < 5) {
        setWithdrawError(t('dashboard.invalidPaymentDetails'))
        return
      }
      payoutString = `RIP: ${ripNumber} - Name: ${ripFullName.trim()}`
    }

    setWithdrawLoading(true)
    const res = await requestWithdrawalAction(amount, payoutString)

    if (res.success) {
      setWithdrawSuccess(true)
      // Optimistic update would go here, but a reload is safer for syncing
      setTimeout(() => window.location.reload(), 3500)
    } else {
      setWithdrawError(res.error || t('errors.generic'))
    }
    setWithdrawLoading(false)
  }

  const isClient = profile.role === 'client' || profile.role === 'both'
  const canWithdraw = profile.role === 'freelancer' || profile.role === 'both'
  const deposit_balance = profile.deposit_balance
  const withdrawable_balance = profile.withdrawable_balance

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'pending'))
    .reduce((sum, t) => sum + t.amount, 0)
  const totalEarnings = transactions
    .filter(t => t.type === 'escrow_release' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.net_amount || t.amount - t.fee), 0)
  const pendingWithdrawalsCount = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'pending').length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen pb-12" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Top Navigation Bar ─── */}
      <header className="topnav sticky top-0 z-50 shadow-xs bg-white border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-16">
          <Link
            href="/dashboard"
            className="text-[19px] font-bold ltr:mr-12 rtl:ml-12 group flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={16} className="text-white" />
            </div>
            <span>خدمة<span style={{ color: 'var(--accent)' }}>.dz</span></span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-[14px] font-medium transition-colors hover:text-[var(--fg)] text-slate-500 hover:no-underline" style={{ textDecoration: 'none' }}>{t('nav.dashboard')}</Link>
            <Link href="/jobs" className="text-[14px] font-medium transition-colors hover:text-[var(--fg)] text-slate-500 hover:no-underline" style={{ textDecoration: 'none' }}>{t('nav.jobs')}</Link>
            <Link href="/contracts" className="text-[14px] font-medium transition-colors hover:text-[var(--fg)] text-slate-500 hover:no-underline" style={{ textDecoration: 'none' }}>{t('contracts.activeContracts')}</Link>
            <Link href="/messages" className="text-[14px] font-medium transition-colors hover:text-[var(--fg)] text-slate-500 hover:no-underline" style={{ textDecoration: 'none' }}>{t('nav.messages')}</Link>
            {profile.is_admin && (
              <Link href="/admin" className="text-[14px] font-semibold text-rose-500 hover:text-rose-700 hover:no-underline" style={{ textDecoration: 'none' }}>⚙️ {t('nav.admin')}</Link>
            )}
          </nav>

          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-4">
            <LanguageSwitcher />
            <NotificationBell />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold font-display shadow-xs">
                {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'م'}
              </div>
              <span className="text-[14px] font-semibold hidden sm:inline" style={{ color: 'var(--fg)' }}>
                {profile.full_name || profile.username}
              </span>
            </div>

            {/* Mobile Dropdown Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1.5 shadow-sm absolute w-full top-16">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 hover:no-underline" style={{ textDecoration: 'none' }}>
              <span>🏠</span> {t('nav.dashboard')}
            </Link>
            <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 hover:no-underline" style={{ textDecoration: 'none' }}>
              <span>🔍</span> {t('nav.jobs')}
            </Link>
            <Link href="/contracts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 hover:no-underline" style={{ textDecoration: 'none' }}>
              <span>📝</span> {t('contracts.activeContracts')}
            </Link>
            <Link href="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 hover:no-underline" style={{ textDecoration: 'none' }}>
              <span>💬</span> {t('nav.messages')}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-rose-50 text-sm text-rose-600 hover:no-underline">
              <span>🚪</span> {t('auth.logout')}
            </button>
          </div>
        )}
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* Deposit Success Notification Banner */}
        {showDepositSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{t('walletPage.depositSuccess')}</p>
                <p className="text-xs text-emerald-600/90 mt-0.5">{t('walletPage.depositSuccessDesc')}</p>
              </div>
            </div>
            <button onClick={() => setShowDepositSuccess(false)} className="text-emerald-500 hover:text-emerald-700 font-bold p-1 hover:bg-emerald-100 rounded-lg cursor-pointer">✕</button>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-sans tracking-tight">{t('walletPage.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('walletPage.description')}</p>
          </div>
          <Link href="/dashboard" className="text-xs sm:text-sm font-semibold text-accent hover:text-accent-hover hover:underline transition-colors flex items-center gap-1 self-center">
            <DirectionArrow size={16} />
            <span>{t('walletPage.backToDashboard')}</span>
          </Link>
        </div>

        {/* ─── Fund Breakdown Dashboard ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Available Earnings for Withdrawal */}
          <div className="md:col-span-1 bg-[#0f172a] rounded-3xl p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[180px] border border-slate-800">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent rounded-full blur-2xl"></div>
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-teal-500 rounded-full blur-xl"></div>
            </div>
            <div className="relative">
              <p className="text-slate-400 text-xs font-semibold mb-1">{t('walletPage.earningsBalance')}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{withdrawable_balance.toLocaleString()} <span className="text-xs font-semibold">{t('common.currency')}</span></p>
            </div>
            <div className="relative pt-6">
              {canWithdraw ? (
                <button
                  onClick={() => { setShowWithdrawForm(true); setWithdrawError(''); setWithdrawSuccess(false) }}
                  disabled={withdrawable_balance < 10000}
                  className="w-full bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed border border-accent/20 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft size={16} className={i18n.language === 'ar' ? 'rotate-0' : '-rotate-90'} />
                  <span>{t('walletPage.requestWithdrawal')}</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 bg-slate-800/40 border border-slate-700/60 p-2.5 rounded-xl text-center leading-relaxed">
                  {t('walletPage.freelancersOnlyWithdraw')}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Hiring Deposit Balance */}
          <div className="md:col-span-1 bg-accent rounded-3xl p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[180px]">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white rounded-full"></div>
            </div>
            <div className="relative">
              <p className="text-teal-100 text-xs font-semibold mb-1">{t('walletPage.depositBalance')}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">{deposit_balance.toLocaleString()} <span className="text-xs font-semibold">{t('common.currency')}</span></p>
            </div>
            <div className="relative pt-6">
              {isClient ? (
                <Link
                  href="/wallet/deposit"
                  className="w-full bg-white text-accent hover:bg-teal-50 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 hover:no-underline decoration-transparent text-center"
                >
                  <Plus size={16} />
                  <span>{t('walletPage.depositNow')}</span>
                </Link>
              ) : (
                <div className="text-[11px] text-teal-100 bg-teal-800/40 p-2.5 rounded-xl text-center leading-relaxed">
                  {t('walletPage.clientsOnlyDeposit')}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Total Deposits / Total Earnings */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[180px]">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">
                {canWithdraw ? t('walletPage.totalEarnings') : t('walletPage.totalDeposits')}
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {canWithdraw ? totalEarnings.toLocaleString() : totalDeposits.toLocaleString()} {t('common.currency')}
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100/60">
              {t('walletPage.actualAmountsDesc')}
            </div>
          </div>

          {/* Card 4: Total Withdrawals / Pending Withdrawals */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[180px]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Download size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1">{t('walletPage.totalWithdrawals')}</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {totalWithdrawals.toLocaleString()} {t('common.currency')}
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100/60 flex items-center justify-between">
              <span>{t('walletPage.totalWithdrawalsCount')}</span>
              {pendingWithdrawalsCount > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Clock size={10} />
                  <span>{pendingWithdrawalsCount} {t('walletPage.pending')}</span>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ─── Algerian CCP / RIP Withdrawal Request Drawer Form Modal ─── */}
        {showWithdrawForm && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowWithdrawForm(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-xl border border-slate-100 animate-scaleUp" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-accent-soft rounded-xl flex items-center justify-center">
                    <ArrowDownLeft className="text-accent w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-950 text-lg">{t('walletPage.withdrawForm.title')}</h3>
                </div>
                <button onClick={() => setShowWithdrawForm(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-50 rounded-lg cursor-pointer">✕</button>
              </div>

              {withdrawSuccess ? (
                <div className="text-center py-10 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 mb-2">{t('walletPage.withdrawForm.withdrawRequestSent')}</h4>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
                    {t('walletPage.withdrawForm.withdrawRequestSentDesc')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  
                  {/* Informational Gating Check */}
                  <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 text-center">
                    <p className="text-xs text-emerald-700/80 mb-0.5">{t('walletPage.withdrawForm.availableForInstantTransfer')}</p>
                    <p className="text-xl font-extrabold text-emerald-800 font-mono">{withdrawable_balance.toLocaleString()} {t('common.currency')}</p>
                  </div>

                  {/* Algerian withdrawal tabs */}
                  <div className="bg-slate-50 border border-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('ccp')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${withdrawMethod === 'ccp' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t('walletPage.withdrawForm.ccpAccount')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('rip')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${withdrawMethod === 'rip' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t('walletPage.withdrawForm.ripNumber')}
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.withdrawAmountLabel')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder="50000"
                        min={10000}
                        max={withdrawable_balance}
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all ltr:pl-12 rtl:pr-12"
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                      <span className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">{t('common.currency')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{t('walletPage.withdrawForm.minWithdraw')}</p>
                  </div>

                  {/* Method: CCP Specific Fields */}
                  {withdrawMethod === 'ccp' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.ccpNumberLabel')}</label>
                          <input
                            type="text"
                            value={ccpNumber}
                            onChange={e => setCcpNumber(e.target.value)}
                            placeholder="e.g. 0012345678"
                            maxLength={12}
                            required
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all font-mono ltr:text-left rtl:text-right"
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.ccpKeyLabel')}</label>
                          <input
                            type="text"
                            value={ccpKey}
                            onChange={e => setCcpKey(e.target.value)}
                            placeholder="12"
                            maxLength={2}
                            required
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all font-mono text-center"
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.fullNameLabel')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={ccpFullName}
                            onChange={e => setCcpFullName(e.target.value)}
                            placeholder={t('walletPage.withdrawForm.fullNamePlaceholder')}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all ltr:pl-10 rtl:pr-10"
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          />
                          <User size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Method: RIP Specific Fields */}
                  {withdrawMethod === 'rip' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.ripNumberLabel')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={ripNumber}
                            onChange={e => setRipNumber(e.target.value)}
                            placeholder="00799999001234567890"
                            maxLength={20}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all font-mono ltr:pl-10 rtl:pr-10"
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          />
                          <CreditCard size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{t('walletPage.withdrawForm.ripNumberDesc')}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('walletPage.withdrawForm.fullNameLabel')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={ripFullName}
                            onChange={e => setRipFullName(e.target.value)}
                            placeholder={t('walletPage.withdrawForm.fullNamePlaceholder')}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all ltr:pl-10 rtl:pr-10"
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                          />
                          <User size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Submission Error Display */}
                  {withdrawError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl p-3.5 flex items-center gap-2 animate-fadeIn">
                      <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      type="submit"
                      disabled={withdrawLoading}
                      className="flex-1 bg-accent text-white hover:bg-accent-hover font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shadow-md shadow-accent/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {withdrawLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('dashboard.requesting')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>{t('walletPage.withdrawForm.confirmWithdraw')}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawForm(false)}
                      className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── Transaction History Panel ─── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-4.5 border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-accent" />
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">{t('walletPage.history.title')}</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{transactions.length} {t('walletPage.history.count')}</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-sm">{t('walletPage.history.empty')}</p>
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                {t('walletPage.history.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="ltr:text-left rtl:text-right px-6 py-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">{t('walletPage.history.table.type')}</th>
                    <th className="ltr:text-left rtl:text-right px-6 py-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">{t('walletPage.history.table.amount')}</th>
                    <th className="ltr:text-left rtl:text-right px-6 py-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">{t('walletPage.history.table.fee')}</th>
                    <th className="ltr:text-left rtl:text-right px-6 py-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">{t('walletPage.history.table.status')}</th>
                    <th className="ltr:text-left rtl:text-right px-6 py-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">{t('walletPage.history.table.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {transactions.map(txn => {
                    const isPositive =
                      txn.type === 'deposit' ||
                      txn.type === 'escrow_release' ||
                      txn.type === 'refund'

                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shadow-2xs">
                              {typeIcons[txn.type] || <Briefcase className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block">{typeLabels[txn.type] || txn.type}</span>
                              {txn.reference && (
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{t('walletPage.history.table.reference')}: {txn.reference}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`font-mono text-sm font-extrabold ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isPositive ? '+' : '-'}
                            {txn.amount.toLocaleString()} <span className="text-[10px] font-sans font-bold">{t('common.currency')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          {txn.fee > 0 ? (
                            <span className="text-xs font-mono text-slate-500 font-medium">{txn.fee.toLocaleString()} {t('common.currency')}</span>
                          ) : (
                            <span className="text-slate-300 text-sm font-light">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-bold border ${statusStyles[txn.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {statusLabels[txn.status] || txn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-slate-400 tracking-wide font-medium" dir="ltr" style={{ textAlign: 'left' }}>
                          {new Date(txn.created_at).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
