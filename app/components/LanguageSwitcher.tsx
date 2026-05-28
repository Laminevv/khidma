'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface LanguageOption {
  code: string
  label: string
  dir: 'rtl' | 'ltr'
}

const languages: LanguageOption[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = i18n.language || 'ar'

  useEffect(() => {
    // Apply document attributes on mount and when language changes
    const current = languages.find(l => l.code === currentLang) || languages[0]
    document.documentElement.dir = current.dir
    document.documentElement.lang = current.code
  }, [currentLang])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (code: string) => {
    const selected = languages.find(l => l.code === code) || languages[0]

    // Change language via i18next — this triggers re-renders in all useTranslation consumers
    i18n.changeLanguage(code)

    // Persist preference
    localStorage.setItem('khidma_lang', code)

    // Update document direction and lang
    document.documentElement.dir = selected.dir
    document.documentElement.lang = selected.code

    setIsOpen(false)
  }

  const activeLanguage = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} style={{ zIndex: 90 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer select-none transition-all duration-200 border-[var(--border)] text-[var(--fg)] bg-[var(--surface)] rounded-lg hover:border-[var(--accent)]"
      >
        <Globe size={13} className="text-[var(--accent)]" />
        <span className="font-semibold text-xs">{activeLanguage.label}</span>
        <ChevronDown size={11} className={`text-[var(--muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-md animate-fadeIn"
          style={{ zIndex: 100, transformOrigin: 'top left' }}
        >
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-right text-xs font-bold rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                  currentLang === language.code
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{language.label}</span>
                {currentLang === language.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
