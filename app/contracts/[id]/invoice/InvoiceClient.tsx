'use client'

import Link from 'next/link'
import {
  Shield,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Hash,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react'
import PrintButton from './PrintButton'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function InvoiceClient({ contract, invoiceNumber, paymentReference, invoiceDate, platformFee, netPayout, totalAmount }: any) {
  const { t, i18n } = useTranslation()
  const DirectionArrow = i18n.language === 'ar' ? ArrowRight : ArrowLeft
  
  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 max-w-sm shadow-xs">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-900 font-bold text-lg mb-2">{t('contracts.invoice.unavailable')}</p>
          <p className="text-slate-500 text-xs mb-5">{t('contracts.invoice.notFound')}</p>
          <Link href="/contracts" className="flex items-center gap-2 justify-center border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-xl text-xs font-medium py-2.5 px-4 w-full transition-colors hover:no-underline">
            <DirectionArrow size={14} />
            {t('contracts.invoice.backToContracts')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12 print:bg-white print:py-0" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Dynamic print-friendly CSS blocks */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Fallback SEO Tags */}
      <noscript>
        <h1>{t('contracts.invoice.invoiceNumber')} {invoiceNumber} - خدمة.dz</h1>
      </noscript>

      {/* Floating interactive Print Action Button */}
      <PrintButton />

      {/* Navigation and Back link (hidden during print) */}
      <div className="max-w-4xl mx-auto px-6 mb-6 no-print flex items-center justify-between">
        <Link
          href={`/contracts/${contract.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:no-underline transition-colors"
        >
          <DirectionArrow size={14} />
          <span>{t('contracts.invoice.backToContract')}</span>
        </Link>
        <span className="text-[11px] text-[var(--muted)] font-mono font-medium">
          {t('contracts.invoice.reference')} {contract.id}
        </span>
      </div>

      {/* Main Core Invoice Sheet Wrapper */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xs print-container relative overflow-hidden">
          
          {/* Decorative Teal Brand Accent line (hidden on print) */}
          <div className="absolute top-0 right-0 w-full h-2 bg-[var(--accent)] no-print" />

          {/* ─── Header: Brand Logo & Invoicing Meta ─── */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-xs">
                  <Shield size={18} className="text-white" />
                </div>
                <span className="text-[24px] font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}>
                  خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {t('contracts.invoice.slogan')}
              </p>
            </div>

            {/* Invoicing Meta info cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 md:text-${i18n.language === 'ar' ? 'right' : 'left'} text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
              <div className={`flex items-center gap-2 md:justify-${i18n.language === 'ar' ? 'end' : 'start'} justify-start`}>
                <Hash size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">{t('contracts.invoice.invoiceNumber')}</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{invoiceNumber}</span>
              </div>
              <div className={`flex items-center gap-2 md:justify-${i18n.language === 'ar' ? 'end' : 'start'} justify-start`}>
                <Calendar size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">{t('contracts.invoice.issueDate')}</span>
                <span className="text-xs font-bold text-slate-900">{invoiceDate}</span>
              </div>
              <div className={`flex items-center gap-2 md:justify-${i18n.language === 'ar' ? 'end' : 'start'} justify-start sm:col-span-2`}>
                <Layers size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">{t('contracts.invoice.transactionRef')}</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{paymentReference}</span>
              </div>
            </div>
          </div>

          {/* ─── Sub-Header: Bill To / Issued By Details ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8 mb-8 text-xs leading-relaxed">
            
            {/* Bill To (Client) */}
            <div className="space-y-2 ltr:text-left rtl:text-right">
              <span className={`text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block ${i18n.language === 'ar' ? 'border-r-2 pr-2' : 'border-l-2 pl-2'} border-[var(--accent)]`}>
                {t('contracts.invoice.billTo')}
              </span>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                  {contract.client?.full_name || t('contracts.invoice.clientAcc')}
                </h3>
                <p className="text-slate-500">{t('contracts.invoice.username')} @{contract.client?.username}</p>
                <p className="text-slate-500 mt-1">{t('contracts.invoice.country')}</p>
                <p className="text-slate-400 text-[10px] mt-2">{t('contracts.invoice.verifiedClient')}</p>
              </div>
            </div>

            {/* Issued By (Freelancer) */}
            <div className="space-y-2 ltr:text-left rtl:text-right">
              <span className={`text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block ${i18n.language === 'ar' ? 'border-r-2 pr-2' : 'border-l-2 pl-2'} border-emerald-600`}>
                {t('contracts.invoice.issuedBy')}
              </span>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                  {contract.freelancer?.full_name || t('contracts.invoice.freelancerAcc')}
                </h3>
                <p className="text-slate-500">{t('contracts.invoice.username')} @{contract.freelancer?.username}</p>
                <p className="text-slate-500 mt-1">{t('contracts.invoice.countryDZ')}</p>
                <p className="text-slate-400 text-[10px] mt-2">{t('contracts.invoice.verifiedFreelancer')}</p>
              </div>
            </div>

          </div>

          {/* ─── Section 3: Project and Contract Title Details ─── */}
          <div className="mb-8 ltr:text-left rtl:text-right">
            <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-2">
              {t('contracts.invoice.contractDetails')}
            </span>
            <div className="bg-[var(--accent-soft)]/20 border border-[var(--accent-soft)] p-4 rounded-2xl">
              <h4 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                {contract.title}
              </h4>
              <p className="text-xs text-slate-600">
                {t('contracts.invoice.originalProject')} {contract.jobs?.title || t('contracts.invoice.directContract')}
              </p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/50 text-[10px] text-[var(--muted)]">
                <span>{t('contracts.invoice.contractStatus')} <strong className="text-[var(--accent)] font-bold">{t('contracts.invoice.paidInFull')}</strong></span>
                <span>{t('contracts.invoice.paymentGateway')} <strong className="text-slate-700">{t('contracts.invoice.baridimob')}</strong></span>
              </div>
            </div>
          </div>

          {/* ─── Section 4: Detailed Financial Table Breakdown ─── */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
            <table className={`w-full text-${i18n.language === 'ar' ? 'right' : 'left'} border-collapse text-xs`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">{t('contracts.invoice.itemService')}</th>
                  <th className={`p-4 text-${i18n.language === 'ar' ? 'left' : 'right'}`}>{t('contracts.invoice.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{t('contracts.invoice.totalBudget')}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {t('contracts.invoice.totalBudgetDesc')}
                    </div>
                  </td>
                  <td className={`p-4 text-${i18n.language === 'ar' ? 'left' : 'right'} font-mono font-bold text-slate-900`} dir="ltr">
                    {totalAmount.toLocaleString()} {t('common.currency')}
                  </td>
                </tr>
                <tr>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{t('contracts.invoice.platformFee')}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {t('contracts.invoice.platformFeeDesc')}
                    </div>
                  </td>
                  <td className={`p-4 text-${i18n.language === 'ar' ? 'left' : 'right'} font-mono font-bold text-rose-500`} dir="ltr">
                    - {platformFee.toLocaleString()} {t('common.currency')}
                  </td>
                </tr>
                <tr className="bg-emerald-50/20 text-emerald-950 font-bold border-t border-slate-200">
                  <td className="p-4 text-sm font-extrabold text-[var(--fg)]">
                    {t('contracts.invoice.netPayout')}
                  </td>
                  <td className={`p-4 text-${i18n.language === 'ar' ? 'left' : 'right'} text-sm font-mono font-extrabold text-emerald-600`} dir="ltr">
                    {netPayout.toLocaleString()} {t('common.currency')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─── Section 5: Stamps & Trusted System Signatures ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center pt-6 border-t border-slate-100 text-xs">
            
            {/* Guarantee Seal Box */}
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl ltr:text-left rtl:text-right">
              <CheckCircle2 size={32} className="text-emerald-600 flex-shrink-0" />
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-xs">{t('contracts.invoice.guaranteed')}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  {t('contracts.invoice.guaranteedDesc')}
                </p>
              </div>
            </div>

            {/* Visual Signature stamp mockup */}
            <div className="flex flex-col items-center sm:items-end justify-center pr-4">
              <div className="text-center relative">
                <span className="text-[10px] text-slate-400 block mb-1">{t('contracts.invoice.digitalStamp')}</span>
                
                {/* Visual Stamp Representation */}
                <div className="border-2 border-emerald-600/40 text-emerald-600/70 font-bold text-[11px] px-4 py-2 rounded-xl inline-block uppercase tracking-wider select-none transform -rotate-3 bg-white shadow-xs">
                  <span className="block font-bold">خدمة.dz</span>
                  <span className="block text-[9px] font-mono mt-0.5">VERIFIED ESCROW & PAY</span>
                </div>

                <span className="text-[9px] text-slate-300 font-mono block mt-2">ID: {contract.id.substring(0, 14)}</span>
              </div>
            </div>

          </div>

          {/* ─── Fine Print and System footer ─── */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-relaxed font-normal">
            <p>{t('contracts.invoice.footer')}</p>
            <p className="mt-0.5">{t('contracts.invoice.copyright').replace('{{year}}', new Date().getFullYear().toString())}</p>
          </div>

        </div>
      </div>

    </div>
  )
}
