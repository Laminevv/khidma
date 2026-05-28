'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { sendNotificationAction } from '@/app/actions/notifications'
import FileUpload from '@/app/components/FileUpload'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Proposal {
  id: string
  freelancer_id: string
  cover_letter: string
  bid_amount: number
  delivery_days: number
  status: string
  attachments: string[]
  created_at: string
  profiles: { username: string; full_name: string; rating: number; total_reviews: number }
}

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [job, setJob] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [proposal, setProposal] = useState({
    cover_letter: '',
    bid_amount: '',
    delivery_days: '',
    attachments: [] as string[],
  })

  const DirectionArrow = i18n.language === 'ar' ? ArrowLeft : ArrowRight

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return t('time.justNow', { defaultValue: 'اليوم' })
    if (days === 1) return t('time.daysAgo', { count: 1 })
    return t('time.daysAgo', { count: days })
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: job } = await supabase
        .from('jobs')
        .select('*, profiles!client_id(id, username, full_name, wilaya, rating, total_reviews)')
        .eq('id', id)
        .single()
      setJob(job)

      if (user) {
        const { data: existing } = await supabase
          .from('proposals').select('id').eq('job_id', id).eq('freelancer_id', user.id).single()
        if (existing) setSubmitted(true)

        if (job && user.id === job.client_id) {
          const { data: props } = await supabase
            .from('proposals')
            .select('*, profiles!freelancer_id(username, full_name, rating, total_reviews)')
            .eq('job_id', id)
            .order('created_at', { ascending: false })
          setProposals(props || [])
        }
      }

      setLoading(false)

      if (job) {
        await supabase.from('jobs').update({ views_count: (job.views_count || 0) + 1 }).eq('id', id)
      }
    }
    init()
  }, [id])

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth/login'); return }
    setSubmitting(true)

    const { error } = await supabase.from('proposals').insert({
      job_id: id,
      freelancer_id: user.id,
      cover_letter: proposal.cover_letter,
      bid_amount: Number(proposal.bid_amount),
      delivery_days: Number(proposal.delivery_days),
      attachments: proposal.attachments,
    })

    if (!error) {
      setSubmitted(true)
      setShowProposalForm(false)

      sendNotificationAction(
        job.client_id,
        'new_proposal',
        'تلقيت عرضاً جديداً',
        `عرض جديد بقيمة ${Number(proposal.bid_amount).toLocaleString()} دج على مشروع "${job.title}"`,
        `/jobs/${id}`
      )
    }
    setSubmitting(false)
  }

  const handleAcceptProposal = async (prop: Proposal) => {
    setAcceptingId(prop.id)
    try {
      const milestones = [{
        id: crypto.randomUUID(),
        title: 'تسليم العمل كاملاً',
        amount: prop.bid_amount,
        description: '',
        status: 'pending',
      }]

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          job_id: job.id,
          proposal_id: prop.id,
          client_id: user.id,
          freelancer_id: prop.freelancer_id,
          title: job.title,
          total_amount: prop.bid_amount,
          platform_fee: Math.round(prop.bid_amount * 0.05),
          milestones,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        alert('Error: ' + error.message)
        setAcceptingId(null)
        return
      }

      await Promise.all([
        supabase.from('proposals').update({ status: 'accepted' }).eq('id', prop.id),
        supabase.from('jobs').update({ status: 'in_progress' }).eq('id', job.id),
      ])

      sendNotificationAction(
        prop.freelancer_id,
        'proposal_accepted',
        '✅ تم قبول عرضك!',
        `تم قبول عرضك على "${job.title}" وإنشاء عقد جديد`,
        `/contracts/${contract.id}`
      )

      router.push(`/contracts/${contract.id}`)
    } catch {
      alert(t('errors.generic'))
    }
    setAcceptingId(null)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all ltr:text-left rtl:text-right"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('jobs.details.notFound')}</p>
          <Link href="/jobs" className="text-emerald-600 hover:underline flex items-center justify-center gap-1">
            <DirectionArrow size={16} /> {t('jobs.details.backToJobs')}
          </Link>
        </div>
      </div>
    )
  }

  const isClient = user?.id === job.client_id

  return (
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <DirectionArrow size={16} /> {t('jobs.details.backToJobs')}
          </Link>
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-base">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ltr:text-left rtl:text-right">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Main */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Job header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">
                  {t(`jobs.categories.${job.category}`, { defaultValue: job.category })}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  job.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t(`jobs.status.${job.status}`, { defaultValue: job.status })}
                </span>
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-4">{job.title}</h1>

              <div className="flex items-center gap-5 text-xs text-gray-400 mb-6 flex-wrap">
                <span>📅 {timeAgo(job.created_at)}</span>
                <span>👁 {job.views_count || 0} {t('jobs.details.views')}</span>
                <span>📋 {job.proposals_count || 0} {t('jobs.details.proposals')}</span>
                {job.deadline && <span>⏰ {t('jobs.details.endsIn')} {new Date(job.deadline).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</span>}
              </div>

              <div className="border-t border-gray-100 pt-5 mt-5">
                <h2 className="font-semibold text-gray-900 mb-3">{t('jobs.details.description')}</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>

              {job.attachments && job.attachments.length > 0 && (
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <h2 className="font-semibold text-gray-900 mb-3">{t('jobs.details.attachments')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.attachments.map((url: string, idx: number) => {
                      const fileName = url.split('/').pop() || `Attachment ${idx + 1}`
                      return (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-sm border border-emerald-100 hover:bg-emerald-100 transition-colors">
                          <span>📎</span>
                          <span className="truncate max-w-[150px]" dir="ltr">{fileName}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {job.required_skills?.length > 0 && (
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <h2 className="font-semibold text-gray-900 mb-3">{t('jobs.details.requiredSkills')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill: string) => (
                      <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Proposal form */}
            {showProposalForm && (
              <div className="bg-white rounded-2xl border border-emerald-200 p-7">
                <h2 className="font-semibold text-gray-900 mb-5">{t('jobs.details.submitProposal')}</h2>
                <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('jobs.details.coverLetter')}</label>
                    <textarea
                      value={proposal.cover_letter}
                      onChange={(e) => setProposal({ ...proposal, cover_letter: e.target.value })}
                      placeholder={t('jobs.details.coverLetterPlaceholder')}
                      required rows={5}
                      className={inputClass + ' resize-none'}
                      style={{ color: '#111827' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('jobs.details.bidAmount')} ({t('common.currency')})</label>
                      <input type="number" value={proposal.bid_amount}
                        onChange={(e) => setProposal({ ...proposal, bid_amount: e.target.value })}
                        placeholder="15000" required min="0"
                        className={inputClass} style={{ color: '#111827' }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('jobs.details.deliveryDays')}</label>
                      <input type="number" value={proposal.delivery_days}
                        onChange={(e) => setProposal({ ...proposal, delivery_days: e.target.value })}
                        placeholder="7" required min="1"
                        className={inputClass} style={{ color: '#111827' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('jobs.details.proposalAttachments')}</label>
                    <FileUpload 
                      bucketName="attachments" 
                      folderPath={`proposals/${user?.id}`} 
                      onUploadComplete={(urls) => setProposal({ ...proposal, attachments: urls })}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={submitting}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {submitting && (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      )}
                      {t('jobs.details.sendProposal')}
                    </button>
                    <button type="button" onClick={() => setShowProposalForm(false)}
                      className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                      {t('jobs.details.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Submitted */}
            {submitted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-emerald-700 font-medium">{t('jobs.details.proposalSent')}</p>
                <p className="text-emerald-600 text-sm mt-1">{t('jobs.details.clientWillContact')}</p>
                <Link href={`/messages?user=${job.client_id}`}
                  className="mt-3 inline-block bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
                  💬 {t('jobs.details.messageClient')}
                </Link>
              </div>
            )}

            {/* Proposals list for client */}
            {isClient && proposals.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-7">
                <h2 className="font-semibold text-gray-900 mb-5">{t('jobs.details.receivedProposals')} ({proposals.length})</h2>
                <div className="space-y-4">
                  {proposals.map((prop) => (
                    <div key={prop.id} className={`border rounded-xl p-5 ${
                      prop.status === 'accepted' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${prop.profiles?.username}`} className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-emerald-300 transition-all">
                            {prop.profiles?.full_name?.charAt(0) || 'م'}
                          </Link>
                          <div>
                            <Link href={`/profile/${prop.profiles?.username}`} className="font-medium text-gray-900 text-sm hover:text-emerald-600 transition-colors">{prop.profiles?.full_name}</Link>
                            <div className="text-xs text-gray-400">@{prop.profiles?.username}</div>
                            {prop.profiles?.rating > 0 && (
                              <div className="text-xs text-yellow-600">⭐ {prop.profiles.rating}</div>
                            )}
                          </div>
                        </div>
                        <div className="ltr:text-right rtl:text-left">
                          <div className="font-bold text-gray-900">{prop.bid_amount?.toLocaleString()} {t('common.currency')}</div>
                          <div className="text-xs text-gray-400">{prop.delivery_days} {t('time.daysAgo').replace('منذ ', '').replace('{{count}} ', '')}</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{prop.cover_letter}</p>

                      {prop.attachments && prop.attachments.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {prop.attachments.map((url: string, idx: number) => {
                            const fileName = url.split('/').pop() || `Attachment ${idx + 1}`
                            return (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-100 hover:text-emerald-600 transition-colors">
                                <span>📎</span>
                                <span className="truncate max-w-[120px]" dir="ltr">{fileName}</span>
                              </a>
                            )
                          })}
                        </div>
                      )}

                      {prop.status === 'accepted' ? (
                        <span className="text-sm text-emerald-600 font-medium">✅ {t('jobs.details.acceptedProposal')}</span>
                      ) : prop.status === 'rejected' ? (
                        <span className="text-sm text-gray-400">{t('jobs.details.rejectedProposal')}</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            disabled={acceptingId === prop.id}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {acceptingId === prop.id ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : '✓'}
                            {t('jobs.details.acceptAndCreateContract')}
                          </button>
                          <Link href={`/messages?user=${prop.freelancer_id}`}
                            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:border-emerald-300 hover:text-emerald-600 transition-all">
                            💬 {t('jobs.details.message')}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('jobs.details.budget')}</h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {job.budget_min && job.budget_max
                  ? `${job.budget_min.toLocaleString()} — ${job.budget_max.toLocaleString()}`
                  : job.budget_max ? `${t('jobs.upTo')} ${job.budget_max.toLocaleString()}` : t('jobs.details.negotiable')}
              </div>
              <div className="text-xs text-gray-400 mb-5">{t('common.currency')}</div>

              {!isClient && job.status === 'open' && (
                <>
                  {!user ? (
                    <Link href="/auth/login"
                      className="w-full block text-center bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors text-sm">
                      {t('jobs.details.loginToPropose')}
                    </Link>
                  ) : submitted ? (
                    <div className="text-center text-emerald-600 text-sm font-medium py-2">✅ {t('jobs.details.proposalSent')}</div>
                  ) : (
                    <button onClick={() => setShowProposalForm(true)}
                      className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors text-sm">
                      {t('jobs.details.submitProposal')}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('jobs.details.client')}</h3>
              <Link href={`/profile/${job.profiles?.username}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold group-hover:ring-2 group-hover:ring-emerald-300 transition-all">
                  {job.profiles?.full_name?.charAt(0) || 'م'}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">{job.profiles?.full_name}</div>
                  <div className="text-xs text-gray-400">@{job.profiles?.username}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
