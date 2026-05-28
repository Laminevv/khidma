'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface Props {
  type: 'notFound' | 'error'
  username?: string
}

export default function ClientProfileError({ type, username }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center">
        {type === 'notFound' ? (
          <>
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('profile.error.notFound')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('profile.error.notFoundDesc')} &quot;{username}&quot;</p>
            <Link href="/jobs" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
              {t('profile.error.browseJobs')}
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('profile.error.title')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('profile.error.desc')}</p>
            <Link href="/" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
              {t('profile.error.home')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
