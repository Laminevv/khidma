'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'

interface NavbarProps {
  /** The user object — null if unauthenticated */
  user: { id: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const { t } = useTranslation()

  return (
    <header className="topnav">
      <div className="max-w-[var(--container)] mx-auto px-6 flex items-center justify-between h-[72px]">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span
            className="text-[22px] font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
          >
            خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/jobs"
            className="text-[14px] font-medium transition-colors duration-200 hover:text-[var(--fg)]"
            style={{ color: 'var(--muted)' }}
          >
            {t('nav.jobs')}
          </Link>
          <Link
            href="/freelancers"
            className="text-[14px] font-medium transition-colors duration-200 hover:text-[var(--fg)]"
            style={{ color: 'var(--muted)' }}
          >
            {t('nav.freelancers')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline">
                {t('auth.login')}
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                {t('auth.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
