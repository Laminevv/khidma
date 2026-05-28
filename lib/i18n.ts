import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ar from '@/i18n/ar.json'
import en from '@/i18n/en.json'
import fr from '@/i18n/fr.json'

// Check for stored language preference (client-side only)
const getStoredLang = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('khidma_lang') || 'ar'
  }
  return 'ar'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: getStoredLang(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n
