'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/app/components/NotificationBell'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  LogOut,
  Wallet,
  Menu,
  X,
  Search,
  ShieldCheck
} from 'lucide-react'

export default function DashboardLayoutClient({ children, profile }: { children: React.ReactNode, profile: any }) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isClient = profile?.role === 'client' || profile?.role === 'both'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} style={{ background: 'var(--bg)' }}>
      {/* ─── Sidebar (Desktop) ─── */}
      <aside 
        className="hidden lg:flex flex-col flex-shrink-0" 
        style={{ 
          width: 'var(--sidebar-width)', 
          background: 'var(--fg)', 
          color: 'var(--surface)',
          position: 'fixed',
          top: 0,
          [i18n.language === 'ar' ? 'right' : 'left']: 0,
          bottom: 0,
          zIndex: 40
        }}
      >
        <div className="p-6">
          <Link
            href="/"
            className="inline-block text-[24px] font-extrabold mb-10"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--surface)', textDecoration: 'none' }}
          >
            خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
          </Link>
          
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors" style={{ background: 'color-mix(in oklch, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium text-sm">{t('nav.dashboard')}</span>
            </Link>
            <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <Search className="w-5 h-5" />
              <span className="font-medium text-sm">{t('nav.jobs')}</span>
            </Link>
            <Link href="/contracts" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <FileText className="w-5 h-5" />
              <span className="font-medium text-sm">{t('contracts.activeContracts')}</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium text-sm">{t('nav.messages')}</span>
            </Link>
            <Link href="/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'color-mix(in oklch, var(--surface) 70%, transparent)' }}>
              <Wallet className="w-5 h-5" />
              <span className="font-medium text-sm">{t('nav.wallet')}</span>
            </Link>
            {profile?.is_admin && (
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-500/10 text-red-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium text-sm">{t('nav.admin')}</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6" style={{ borderTop: '1px solid color-mix(in oklch, var(--surface) 10%, transparent)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
              {profile?.full_name?.charAt(0) || 'م'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{profile?.full_name}</div>
              <div className="text-xs truncate" style={{ color: 'color-mix(in oklch, var(--surface) 50%, transparent)' }}>
                {isClient ? t('roles.client') : t('roles.freelancer')}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm w-full transition-colors hover:text-white"
            style={{ color: 'color-mix(in oklch, var(--surface) 50%, transparent)' }}
          >
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Wrapper ─── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ [i18n.language === 'ar' ? 'paddingRight' : 'paddingLeft']: 'var(--sidebar-width)' }}>
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--fg)' }}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="text-[20px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}>
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 space-y-2 absolute top-[65px] inset-x-0 z-50 shadow-lg" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <Link href="/dashboard" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>{t('nav.dashboard')}</Link>
            <Link href="/jobs" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>{t('nav.jobs')}</Link>
            <Link href="/contracts" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>{t('contracts.activeContracts')}</Link>
            <Link href="/messages" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>{t('nav.messages')}</Link>
            <Link href="/wallet" className="block px-4 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--muted)' }}>{t('nav.wallet')}</Link>
            <div className="h-px w-full my-2" style={{ background: 'var(--border)' }}></div>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium" style={{ color: 'var(--error)' }}>
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </button>
          </div>
        )}

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-end px-10 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        <main className="p-6 lg:p-10 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
