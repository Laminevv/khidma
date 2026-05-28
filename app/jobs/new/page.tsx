'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import FileUpload from '@/app/components/FileUpload'
import { 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Code, 
  Palette, 
  Megaphone, 
  PenTool, 
  Languages, 
  BarChart3, 
  HelpCircle,
  Calendar,
  Wallet,
  ArrowRight,
  Plus,
  X,
  FileText,
  AlertCircle,
  Sparkles
} from 'lucide-react'

const CATEGORIES_WITH_ICONS = [
  { value: 'development', icon: Code },
  { value: 'design', icon: Palette },
  { value: 'marketing', icon: Megaphone },
  { value: 'writing', icon: PenTool },
  { value: 'translation', icon: Languages },
  { value: 'data', icon: BarChart3 },
  { value: 'other', icon: HelpCircle },
]

const POPULAR_SKILLS = [
  'React', 'Next.js', 'Node.js', 'Python', 'Laravel', 'WordPress',
  'Figma', 'UI/UX', 'Photoshop', 'SEO', 'Facebook Ads', 'Copywriting',
  'Arabic Translation', 'Video Editing', 'Data Analysis',
]

export default function NewJobPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [step, setStep] = useState(1)

  const DirectionChevronLeft = i18n.language === 'ar' ? ChevronLeft : ChevronRight
  const DirectionChevronRight = i18n.language === 'ar' ? ChevronRight : ChevronLeft

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    required_skills: [] as string[],
    attachments: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUserId(data.user.id)
    })
  }, [router])

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (s && !form.required_skills.includes(s) && form.required_skills.length < 8) {
      setForm({ ...form, required_skills: [...form.required_skills, s] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setForm({ ...form, required_skills: form.required_skills.filter(s => s !== skill) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError('')

    if (!form.title || !form.description || !form.category) {
      setError(t('jobs.new.fillRequired'))
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        client_id: userId,
        title: form.title,
        description: form.description,
        category: form.category,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        deadline: form.deadline || null,
        required_skills: form.required_skills,
        attachments: form.attachments,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      setError(t('errors.generic'))
      setLoading(false)
      return
    }

    router.push(`/jobs/${data.id}`)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all ltr:text-left rtl:text-right"

  const stepTitles = [t('jobs.new.step1'), t('jobs.new.step2'), t('jobs.new.step3')]

  return (
    <div className="min-h-screen pb-16 flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} style={{ background: 'var(--bg)' }}>
      {/* ─── Topnav (Frosted Glass) ─── */}
      <nav className="topnav z-50 flex-shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group hover:no-underline">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-display">
              خدمة<span className="text-accent">.dz</span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 hover:no-underline">
            <DirectionChevronRight size={16} className={i18n.language === 'ar' ? 'order-last' : 'order-first'} />
            <span>{t('nav.dashboard')}</span>
          </Link>
        </div>
      </nav>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col ltr:text-left rtl:text-right">
        {/* Title Section */}
        <div className="mb-8 text-center sm:ltr:text-left sm:rtl:text-right">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-sans tracking-tight">{t('jobs.new.title')}</h1>
          <p className="text-slate-500 text-sm mt-1.5">{t('jobs.new.subtitle')}</p>
        </div>

        {/* Centered Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* Progress Indicator Bar */}
          <div className="mb-10 max-w-lg mx-auto relative">
            <div className="flex items-center justify-between">
              {/* Background Line */}
              <div className="absolute right-0 left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded" />
              {/* Active Progress Line */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-accent -z-10 rounded transition-all duration-300"
                style={{ 
                  [i18n.language === 'ar' ? 'right' : 'left']: '0%',
                  width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                }} 
              />

              {stepTitles.map((title, index) => {
                const currentStepNum = index + 1
                const isActive = step === currentStepNum
                const isCompleted = step > currentStepNum

                return (
                  <div key={index} className="flex flex-col items-center">
                    <button 
                      type="button"
                      disabled={currentStepNum > step && !form.title}
                      onClick={() => setStep(currentStepNum)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? 'bg-accent text-white ring-4 ring-accent-soft scale-105' 
                          : isCompleted
                          ? 'bg-accent text-white hover:bg-accent-hover'
                          : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {isCompleted ? <Check size={14} /> : currentStepNum}
                    </button>
                    <span 
                      className={`text-[10px] sm:text-xs mt-2 font-semibold transition-colors duration-300 ${
                        isActive ? 'text-accent' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* ─── Step 1: Project Details ─── */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('jobs.new.jobTitle')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t('jobs.new.jobTitlePlaceholder')}
                    required
                    maxLength={120}
                    className={inputClass}
                    style={{ color: '#111827' }}
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[11px] text-slate-400">{t('jobs.new.jobTitleDesc')}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{form.title.length}/120</p>
                  </div>
                </div>

                {/* Category Selection Grid */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">
                    {t('jobs.new.category')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CATEGORIES_WITH_ICONS.map((cat) => {
                      const IconComponent = cat.icon
                      const isSelected = form.category === cat.value
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat.value })}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-accent-soft/20 text-accent font-semibold scale-[1.02] shadow-xs'
                              : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-accent' : 'text-slate-400'}`} />
                          <span className="text-xs sm:text-sm font-medium">{t(`jobs.categories.${cat.value}`)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('jobs.new.description')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('jobs.new.descriptionPlaceholder')}
                    required
                    rows={7}
                    className={inputClass + ' resize-none'}
                    style={{ color: '#111827' }}
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[11px] text-slate-400">{t('jobs.new.descriptionDesc')}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{form.description.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 2: Budget & Timeline ─── */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Budget */}
                <div className="bg-slate-50/50 border border-slate-150 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-5 h-5 text-accent" />
                    <label className="block text-sm font-bold text-slate-800">
                      {t('jobs.new.budget')} ({t('common.currency')})
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    {t('jobs.new.budgetDesc')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('jobs.new.minBudget')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.budget_min}
                          onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                          placeholder="5000"
                          min="0"
                          className={inputClass + ' ltr:pl-12 rtl:pr-12'}
                          style={{ color: '#111827' }}
                        />
                        <span className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{t('common.currency')}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('jobs.new.maxBudget')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.budget_max}
                          onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                          placeholder="50000"
                          min="0"
                          className={inputClass + ' ltr:pl-12 rtl:pr-12'}
                          style={{ color: '#111827' }}
                        />
                        <span className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{t('common.currency')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <label className="block text-sm font-bold text-slate-800">
                      {t('jobs.new.deadline')}
                    </label>
                  </div>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputClass}
                    style={{ color: '#111827' }}
                  />
                  <p className="text-xs text-slate-400 mt-1.5">{t('jobs.new.deadlineDesc')}</p>
                </div>
              </div>
            )}

            {/* ─── Step 3: Skills & Attachments ─── */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    {t('jobs.new.skills')}
                  </label>
                  <p className="text-xs text-slate-400 mb-3.5">{t('jobs.new.skillsDesc')}</p>

                  {/* Selected Skill Pills */}
                  {form.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.required_skills.map((skill) => (
                        <span key={skill}
                          className="flex items-center gap-1 bg-accent-soft text-accent text-xs font-semibold px-3 py-1.5 rounded-xl border border-accent/10">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)}
                            className="hover:text-red-500 text-sm font-bold ltr:mr-1 rtl:ml-1 transition-colors">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Skills input search/textbox */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                      placeholder={t('jobs.new.skillsPlaceholder')}
                      className={inputClass + ' flex-1'}
                      style={{ color: '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      {t('jobs.new.add')}
                    </button>
                  </div>

                  {/* Suggested popular skills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {POPULAR_SKILLS.filter(s => !form.required_skills.includes(s)).slice(0, 8).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-accent-soft hover:text-accent font-medium transition-all cursor-pointer"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('jobs.new.attachments')} <span className="text-slate-400 font-normal text-xs">({t('jobs.details.proposalAttachments').includes('اختياري') || t('jobs.details.proposalAttachments').includes('Optional') ? 'Optional' : 'اختياري'})</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {t('jobs.new.attachmentsDesc')}
                  </p>
                  <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50/30">
                    <FileUpload 
                      bucketName="attachments" 
                      folderPath={`jobs/${userId}`} 
                      onUploadComplete={(urls) => setForm({ ...form, attachments: urls })}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Navigation Buttons ─── */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn btn-outline border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  <DirectionChevronRight size={16} />
                  <span>{t('jobs.new.previous')}</span>
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="btn btn-outline border-slate-200 text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:no-underline"
                >
                  <DirectionChevronRight size={16} />
                  <span>{t('jobs.details.cancel')}</span>
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && (!form.title || !form.description || !form.category)) {
                      setError(t('jobs.new.fillRequired'))
                      return
                    }
                    setError('')
                    setStep(step + 1)
                  }}
                  disabled={step === 1 && (!form.title.trim() || !form.category || !form.description.trim())}
                  className="btn bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>{t('jobs.new.next')}</span>
                  <DirectionChevronLeft size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !form.title || !form.description || !form.category}
                  className="btn bg-accent text-white hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-md shadow-accent/15 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      <span>{t('jobs.new.publishing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{t('jobs.new.submit')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
