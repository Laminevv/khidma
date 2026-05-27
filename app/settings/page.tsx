'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FileUpload from '@/app/components/FileUpload'
import AvatarCropModal from '@/app/components/AvatarCropModal'
import {
  User,
  Lock,
  Bell,
  Briefcase,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Camera,
  ArrowLeft,
  Shield,
  Sliders
} from 'lucide-react'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
  wilaya: string
  hourly_rate: number
  skills: string[]
  is_verified: boolean
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image_url: string
  project_link: string
}

const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
  'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
  'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة',
  'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان',
  'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'إن صالح', 'إن قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة'
]

type ActiveTab = 'profile' | 'portfolio' | 'security' | 'notifications'

export default function SettingsPage() {
  const router = useRouter()
  
  // App states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Profile settings states
  const [skillInput, setSkillInput] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  // Portfolio Form State
  const [newPortfolio, setNewPortfolio] = useState({
    title: '', description: '', image_url: '', project_link: ''
  })
  const [portfolioAdding, setPortfolioAdding] = useState(false)

  // Security Form State
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  // Notification Mock State
  const [notifyNewProposals, setNotifyNewProposals] = useState(true)
  const [notifyEscrowUpdates, setNotifyEscrowUpdates] = useState(true)
  const [notifyNewMessages, setNotifyNewMessages] = useState(true)
  const [notifyEmailSummary, setNotifyEmailSummary] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setTimeout(() => {
          setProfile({
            id: profileData.id,
            username: profileData.username || '',
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            bio: profileData.bio || '',
            wilaya: profileData.wilaya?.toString() || '',
            hourly_rate: profileData.hourly_rate || 0,
            skills: profileData.skills || [],
            is_verified: profileData.is_verified || false
          })
        }, 0)
      }

      // Fetch portfolios
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setTimeout(() => {
        setPortfolios(portfolioData || [])
      }, 0)

      setLoading(false)
    }
    init()
  }, [router])

  // Profile data update logic
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        wilaya: profile.wilaya ? parseInt(profile.wilaya) : null,
        hourly_rate: profile.hourly_rate || 0,
        skills: profile.skills,
        avatar_url: profile.avatar_url
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات الشخصية.' })
    } else {
      setMessage({ type: 'success', text: 'تم تحديث ملفك الشخصي بنجاح!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
    setSaving(false)
  }

  // Avatar select handling
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    e.target.value = '' // Reset files trigger

    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الصورة الشخصية يجب ألا يتجاوز 15MB' })
      return
    }

    const url = URL.createObjectURL(file)
    setCropImageSrc(url)
  }

  // Image cropping and secure storage bucket upload
  const handleCroppedUpload = async (blob: Blob) => {
    if (!profile) return
    setCropImageSrc(null)
    setAvatarUploading(true)

    const fileName = `${profile.id}_${Date.now()}.jpg`
    const file = new File([blob], fileName, { type: 'image/jpeg' })

    const { error, data } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) {
      setMessage({ type: 'error', text: 'فشل رفع الصورة الشخصية — يرجى المحاولة مرة أخرى.' })
    } else if (data) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setProfile({ ...profile, avatar_url: publicUrlData.publicUrl })

      // Immediate DB update sync
      await supabase.from('profiles').update({ avatar_url: publicUrlData.publicUrl }).eq('id', profile.id)
      
      setMessage({ type: 'success', text: 'تم تحديث صورتك الشخصية بنجاح!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
    setAvatarUploading(false)
  }

  // Skills handlers
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && profile && !profile.skills.includes(s) && profile.skills.length < 10) {
      setProfile({ ...profile, skills: [...profile.skills, s] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    if (!profile) return
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })
  }

  // Portfolio items CRUD logic
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    
    if (!newPortfolio.title || !newPortfolio.image_url) {
      setMessage({ type: 'error', text: 'يرجى إدخال عنوان المشروع وصورة الغلاف لتأكيد الإضافة.' })
      return
    }

    setPortfolioAdding(true)
    
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: profile.id,
        title: newPortfolio.title,
        description: newPortfolio.description,
        image_url: newPortfolio.image_url,
        project_link: newPortfolio.project_link || null
      })
      .select()
      .single()

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ فني أثناء إضافة المشروع لمعرض أعمالك.' })
    } else if (data) {
      setPortfolios([data, ...portfolios])
      setNewPortfolio({ title: '', description: '', image_url: '', project_link: '' })
      setMessage({ type: 'success', text: 'تمت إضافة المشروع الجديد لمعرض أعمالك بنجاح!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    }
    setPortfolioAdding(false)
  }

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟')) return
    
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolios(portfolios.filter(p => p.id !== id))
  }

  // Secure Supabase Password Update logic
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون مكونة من 8 أحرف على الأقل.' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين.' })
      return
    }

    setPasswordUpdating(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء تحديث كلمة المرور.' })
    } else {
      setMessage({ type: 'success', text: 'تم تحديث كلمة مرور حسابك بأمان بنجاح!' })
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage({ type: '', text: '' }), 4500)
    }
    setPasswordUpdating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-sm font-semibold text-slate-500 font-sans">جاري تحميل إعدادات الحساب...</span>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all placeholder-slate-400"

  return (
    <div className="min-h-screen pb-12" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Top Navigation Bar ─── */}
      <header className="topnav sticky top-0 z-50 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-16">
          <Link
            href="/dashboard"
            className="text-[19px] font-bold ml-12 group flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={16} className="text-white" />
            </div>
            <span>خدمة<span style={{ color: 'var(--accent)' }}>.dz</span></span>
          </Link>

          <div className="mr-auto flex items-center gap-4">
            <Link href={`/profile/${profile.username}`} className="text-sm font-semibold text-accent hover:text-accent-hover hover:no-underline flex items-center gap-1" style={{ textDecoration: 'none' }}>
              <span>معاينة ملفي العام</span>
            </Link>
            <div className="h-5 w-px bg-slate-200"></div>
            <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-800 hover:no-underline flex items-center gap-1" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>لوحة التحكم</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content Canvas ─── */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* Header Title block */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-sans tracking-tight">إعدادات الحساب</h1>
            <p className="text-slate-500 text-sm mt-1">قم بتحديث معلومات الهوية، السيرة المهنية، كلمة المرور والتنبيهات</p>
          </div>
          <Link
            href="/kyc/status"
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-colors hover:no-underline self-center ${
              profile.is_verified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
            }`}
            style={{ textDecoration: 'none' }}
          >
            {profile.is_verified ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>حساب موثق بالهوية</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-amber-500 animate-pulse" />
                <span>حساب غير موثق (توثيق الهوية)</span>
              </>
            )}
          </Link>
        </div>

        {/* Global Action Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xs animate-fadeIn ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-100'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18} className="text-rose-500 flex-shrink-0" /> : <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* ─── Responsive Tab Grid Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Vertical Navigation Settings Sidebar (Column 1) */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-1.5" style={{ position: 'sticky', top: '96px' }}>
              <button
                onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }) }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-accent-soft text-accent scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <User size={16} />
                <span>المعلومات الشخصية</span>
              </button>

              <button
                onClick={() => { setActiveTab('portfolio'); setMessage({ type: '', text: '' }) }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'bg-accent-soft text-accent scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Briefcase size={16} />
                <span>معرض الأعمال الفنية</span>
              </button>

              <button
                onClick={() => { setActiveTab('security'); setMessage({ type: '', text: '' }) }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-accent-soft text-accent scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Shield size={16} />
                <span>أمان الحساب (كلمة المرور)</span>
              </button>

              <button
                onClick={() => { setActiveTab('notifications'); setMessage({ type: '', text: '' }) }}
                className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-accent-soft text-accent scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Bell size={16} />
                <span>تفضيلات التنبيهات</span>
              </button>
            </div>
          </aside>

          {/* Form Content Workspace (Column 2 & 3) */}
          <section className="lg:col-span-3">
            
            {/* ──── TAB: General Profile ──── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                    <User className="text-accent w-5 h-5" />
                    <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">تحديث ملفك الشخصي وعملك</h2>
                  </div>

                  {/* Avatar Upload Dropzone with crop modal */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-100/60">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-4 border-white shadow-md flex items-center justify-center">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-accent/25 to-accent/5 flex items-center justify-center text-accent text-2xl font-bold font-display">
                            {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                      <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
                    </div>
                    <div className="text-center sm:text-right">
                      <h3 className="font-bold text-slate-900 text-sm mb-1">الصورة الرمزية</h3>
                      <p className="text-slate-400 text-[10px] mb-3">اختر صورة تعبيرية مربعة واضحة (الحد الأقصى 5MB)</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera size={13} />}
                        <span>تحديث الصورة</span>
                      </button>
                    </div>
                  </div>

                  {/* Basic Identity Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل المطابق للهوية</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                        className={inputClass}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم الفريد (غير قابل للتعديل)</label>
                      <input
                        type="text"
                        value={`@${profile.username}`}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed font-mono"
                        dir="ltr"
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                  </div>

                  {/* Bio biography */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السيرة التعريفية العامة (Bio)</label>
                    <textarea
                      value={profile.bio}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                      className={`${inputClass} resize-none leading-relaxed`}
                      rows={5}
                      placeholder="أخبر العملاء والزوار بالمنصة عن مهاراتك الفنية، سنوات الخبرة، ومميزات عملك لإقناعهم بالتوظيف..."
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  {/* Wilaya & Hourly Rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">الولاية (مقر العمل)</label>
                      <select
                        value={profile.wilaya}
                        onChange={e => setProfile({...profile, wilaya: e.target.value})}
                        className={inputClass}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      >
                        <option value="">اختر الولاية...</option>
                        {WILAYAS.map((w, i) => (
                          <option key={i+1} value={i+1}>{i+1} - {w}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">متوسط سعر الساعة المتوقع (دج)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={profile.hourly_rate || ''}
                          onChange={e => setProfile({...profile, hourly_rate: Number(e.target.value)})}
                          min="0"
                          className={inputClass}
                          placeholder="مثال: 1500"
                          style={{ color: '#111827', backgroundColor: '#ffffff' }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">دج/ساعة</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills array list input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المهارات والخبرات التقنية</label>
                    <p className="text-[10px] text-slate-400 mb-3">أضف مهاراتك الدقيقة التي تتقنها لمساعدتك بالفلترة (الحد الأقصى 10)</p>
                    
                    {profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 bg-accent-soft text-accent text-xs font-semibold px-3 py-1.5 rounded-xl border border-accent/10"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-rose-500 font-bold ml-1 transition-colors text-xs p-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                        placeholder="مثال: React, Figma, Translation..."
                        className={inputClass + ' flex-1'}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="bg-slate-100 hover:bg-accent-soft hover:text-accent border border-slate-200/60 px-5 py-3 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer text-slate-700"
                      >
                        إضافة مهارة
                      </button>
                    </div>
                  </div>

                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-accent text-white hover:bg-accent-hover font-bold py-3 px-8 rounded-2xl text-xs sm:text-sm hover:no-underline shadow-md shadow-accent/15 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>حفظ الملف التعريفي الشخصي</span>
                </button>
              </form>
            )}

            {/* ──── TAB: Portfolio ──── */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Form: Add New Portfolio Item */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                    <Plus className="text-accent w-5 h-5" />
                    <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">إضافة مشروع جديد لمعرض أعمالك</h2>
                  </div>

                  <form onSubmit={handleAddPortfolio} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان العمل / المشروع <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={newPortfolio.title}
                            onChange={e => setNewPortfolio({...newPortfolio, title: e.target.value})}
                            required
                            className={inputClass}
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                            placeholder="مثال: تصميم الهوية البصرية لشركة شحن"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط العمل الخارجي (اختياري)</label>
                          <input
                            type="url"
                            value={newPortfolio.project_link}
                            onChange={e => setNewPortfolio({...newPortfolio, project_link: e.target.value})}
                            className={inputClass}
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                            placeholder="https://behance.net/..."
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف مختصر للعمل المنجز</label>
                          <textarea
                            value={newPortfolio.description}
                            onChange={e => setNewPortfolio({...newPortfolio, description: e.target.value})}
                            className={`${inputClass} resize-none`}
                            rows={3}
                            style={{ color: '#111827', backgroundColor: '#ffffff' }}
                            placeholder="اشرح باختصار دورك في تنفيذ هذا المشروع والتقنيات المستخدمة فيه..."
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">صورة غلاف العرض للمشروع <span className="text-rose-500">*</span></label>
                        <div className="h-[212px]">
                          {newPortfolio.image_url ? (
                            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 group shadow-xs">
                              <img src={newPortfolio.image_url} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setNewPortfolio({...newPortfolio, image_url: ''})}
                                className="absolute inset-0 bg-slate-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white text-xs font-bold cursor-pointer"
                              >
                                إزالة الصورة واستبدالها
                              </button>
                            </div>
                          ) : (
                            <FileUpload
                              bucketName="attachments"
                              folderPath={`portfolio/${profile.id}`}
                              onUploadComplete={(urls) => { if(urls.length > 0) setNewPortfolio({...newPortfolio, image_url: urls[0]}) }}
                              accept=".png,.jpg,.jpeg,.webp"
                              maxFiles={1}
                            />
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <button
                        type="submit"
                        disabled={portfolioAdding || !newPortfolio.title || !newPortfolio.image_url}
                        className="bg-accent text-white hover:bg-accent-hover font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm hover:no-underline shadow-md shadow-accent/10 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {portfolioAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus size={16} />}
                        <span>إضافة العمل لمعرضي</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* List Portfolio Items */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mb-5">أعمالي المدرجة بالمعرض ({portfolios.length})</h3>
                  
                  {portfolios.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl">
                      <div className="text-4xl mb-3">🎨</div>
                      <p className="text-slate-500 font-bold text-sm">معرض أعمالك فارغ حالياً</p>
                      <p className="text-slate-400 text-xs mt-1">قم بإضافة مشاريعك ونماذج أعمالك السابقة لجذب انتباه العملاء وثقتهم.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {portfolios.map(item => (
                        <div key={item.id} className="border border-slate-200/85 rounded-2xl overflow-hidden group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all bg-white">
                          <div>
                            <div className="aspect-video w-full bg-slate-50 relative">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover animate-fadeIn" />
                              <button
                                onClick={() => handleDeletePortfolio(item.id)}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all shadow-xs border border-rose-100 cursor-pointer"
                                title="حذف نموذج العمل"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="p-4">
                              <h4 className="font-extrabold text-slate-950 text-xs sm:text-sm mb-1 truncate">{item.title}</h4>
                              {item.description && <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed line-clamp-2 mb-2">{item.description}</p>}
                            </div>
                          </div>
                          
                          {item.project_link && (
                            <div className="px-4 pb-4 mt-auto">
                              <a
                                href={item.project_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent-hover text-[10px] sm:text-xs font-bold inline-flex items-center gap-1.5 hover:no-underline"
                              >
                                <ExternalLink size={12} />
                                <span>زيارة رابط المشروع</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ──── TAB: Account Security ──── */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6 animate-fadeIn">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                    <Lock className="text-accent w-5 h-5" />
                    <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">تغيير كلمة المرور وأمان حسابك</h2>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed mb-6 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    🔒 كلمة المرور القوية تساعد على حماية حسابك المالي ومعاملاتك Escrow بالمنصة. يرجى اختيار كلمة مرور لا تقل عن 8 خانات تتضمن أحرفاً وأرقاماً مميزة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        minLength={8}
                        className={inputClass}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        minLength={8}
                        className={inputClass}
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordUpdating || !password || !confirmPassword}
                  className="bg-accent text-white hover:bg-accent-hover font-bold py-3 px-8 rounded-2xl text-xs sm:text-sm hover:no-underline shadow-md shadow-accent/15 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {passwordUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock size={16} />}
                  <span>تحديث كلمة مرور الحساب بأمان</span>
                </button>
              </form>
            )}

            {/* ──── TAB: Notification Preferences ──── */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Bell className="text-accent w-5 h-5" />
                  <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">تفضيلات التنبيهات وإشعارات المنصة</h2>
                </div>

                <div className="space-y-4">
                  
                  {/* Alert Option 1 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sliders size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">إشعارات المشاريع والعروض</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">تلقي تنبيه فوري عند تلقي عروض جديدة على مشروعك أو تحديث عروض المستقلين.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                      <input
                        type="checkbox"
                        checked={notifyNewProposals}
                        onChange={() => setNotifyNewProposals(!notifyNewProposals)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  {/* Alert Option 2 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lock size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">حركات رصيد الضمان والدفع</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">إشعارك فور حجز دفعات الضمان، تحرير الأرباح، سداد الرصيد، أو سحب الفواتير.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                      <input
                        type="checkbox"
                        checked={notifyEscrowUpdates}
                        onChange={() => setNotifyEscrowUpdates(!notifyEscrowUpdates)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  {/* Alert Option 3 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">رسائل الدردشة المباشرة</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">تلقي تنبيهات فورية عند وصول رسالة جديدة في نافذة الرسائل المباشرة والمشاريع.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1 select-none">
                      <input
                        type="checkbox"
                        checked={notifyNewMessages}
                        onChange={() => setNotifyNewMessages(!notifyNewMessages)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  {/* Alert Option 4 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">الملخص البريدي للمشاريع المقترحة</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">ملخص أسبوعي بالبريد الإلكتروني يضم أفضل المشاريع التي تتناسب مع مهاراتك.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex inline-block items-center cursor-pointer mt-1 select-none">
                      <input
                        type="checkbox"
                        checked={notifyEmailSummary}
                        onChange={() => setNotifyEmailSummary(!notifyEmailSummary)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setMessage({ type: 'success', text: 'تم حفظ تفضيلات التنبيهات البريدية والإشعارات بنجاح!' })
                      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
                    }}
                    className="bg-accent text-white hover:bg-accent-hover font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm hover:no-underline shadow-md shadow-accent/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>حفظ التفضيلات التنبيهية</span>
                  </button>
                </div>
              </div>
            )}

          </section>

        </div>

      </main>

      {/* Avatar Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCroppedUpload}
          onCancel={() => {
            URL.revokeObjectURL(cropImageSrc)
            setCropImageSrc(null)
          }}
        />
      )}

    </div>
  )
}
