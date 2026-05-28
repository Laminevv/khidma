'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, ChevronDown } from 'lucide-react'

interface LanguageOption {
  code: string
  label: string
  dir: 'rtl' | 'ltr'
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('ar')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages: LanguageOption[] = [
    { code: 'ar', label: 'العربية (AR)', dir: 'rtl' },
    { code: 'fr', label: 'Français (FR)', dir: 'ltr' },
    { code: 'en', label: 'English (EN)', dir: 'ltr' }
  ]

  useEffect(() => {
    // Check local storage for language preference
    const storedLang = localStorage.getItem('khidma_lang') || 'ar'
    setLang(storedLang)

    // Apply document attributes initially
    const current = languages.find(l => l.code === storedLang) || languages[0]
    document.documentElement.dir = current.dir
    document.documentElement.lang = current.code

    // Handle clicks outside the dropdown to close it
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
    setLang(code)
    localStorage.setItem('khidma_lang', code)

    // Dynamically update document HTML direction and language attributes
    document.documentElement.dir = selected.dir
    document.documentElement.lang = selected.code

    setIsOpen(false)

    // Dispatch event in case other components need to react to language switching
    window.dispatchEvent(new CustomEvent('khidma-language-changed', { detail: code }))
  }

  const activeLanguage = languages.find(l => l.code === lang) || languages[0]

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} style={{ zIndex: 90 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer select-none transition-all duration-200 border-[var(--border)] text-[var(--fg)] bg-[var(--surface)] rounded-lg hover:border-[var(--accent)]"
      >
        <Globe size={13} className="text-[var(--accent)]" />
        <span className="font-semibold text-xs">{activeLanguage.label.split(' ')[0]}</span>
        <ChevronDown size={11} className={`text-[var(--muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-md animate-fadeIn"
          style={{
            zIndex: 100,
            transformOrigin: 'top left',
          }}
        >
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-3 py-2 text-right text-xs font-bold rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                  lang === language.code
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{language.label}</span>
                {lang === language.code && (
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
