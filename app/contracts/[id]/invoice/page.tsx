import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Hash,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react'
import PrintButton from './PrintButton'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch contract data with client, freelancer, and jobs fields
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      client:profiles!client_id(id, username, full_name),
      freelancer:profiles!freelancer_id(id, username, full_name),
      jobs(id, title)
    `)
    .eq('id', id)
    .single()

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 max-w-sm shadow-xs">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-900 font-bold text-lg mb-2">الفاتورة غير متوفرة</p>
          <p className="text-slate-500 text-xs mb-5">العقد المطلوب غير موجود أو تم حذفه.</p>
          <Link href="/contracts" className="btn btn-outline text-xs py-2.5 px-4 w-full justify-center">
            ← العودة إلى قائمة العقود
          </Link>
        </div>
      </div>
    )
  }

  // Security Check: Only the client or the freelancer involved in the contract can view the invoice
  if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
    redirect('/contracts')
  }

  // Financial calculations
  const totalAmount = contract.total_amount || 0
  const platformFee = Math.round(totalAmount * 0.10)
  const netPayout = Math.round(totalAmount * 0.90)

  // Formatting dates
  const invoiceDate = contract.created_at
    ? new Date(contract.created_at).toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('ar-DZ')

  // Generate unique codes based on DB ID
  const invoiceNumber = `KD-INV-${contract.id.substring(0, 8).toUpperCase()}`
  const paymentReference = `BM-REF-${contract.id.substring(24, 36).toUpperCase()}`

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12 print:bg-white print:py-0" dir="rtl">
      
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
        <h1>فاتورة العقد {invoiceNumber} - خدمة.dz</h1>
        <p>فاتورة رسمية وعقد دفع آمن لخدمات العمل الحر عبر منصة خدمة.dz.</p>
      </noscript>

      {/* Floating interactive Print Action Button */}
      <PrintButton />

      {/* Navigation and Back link (hidden during print) */}
      <div className="max-w-4xl mx-auto px-6 mb-6 no-print flex items-center justify-between">
        <Link
          href={`/contracts/${contract.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:no-underline transition-colors"
        >
          <ArrowRight size={14} />
          <span>العودة لتفاصيل العقد</span>
        </Link>
        <span className="text-[11px] text-[var(--muted)] font-mono font-medium">
          مرجع: {contract.id}
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
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                منصة العمل الحر الجزائرية الأولى<br/>
                ضمان الدفع والتعاملات البريدية والبنكية المحلية
              </p>
            </div>

            {/* Invoicing Meta info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 md:text-left text-right">
              <div className="flex items-center gap-2 md:justify-end justify-start">
                <Hash size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">رقم الفاتورة:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2 md:justify-end justify-start">
                <Calendar size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">تاريخ الإصدار:</span>
                <span className="text-xs font-bold text-slate-900">{invoiceDate}</span>
              </div>
              <div className="flex items-center gap-2 md:justify-end justify-start sm:col-span-2">
                <Layers size={13} className="text-[var(--accent)]" />
                <span className="text-xs text-slate-500">مرجع المعاملة (CCP/RIP):</span>
                <span className="text-xs font-bold text-slate-900 font-mono">{paymentReference}</span>
              </div>
            </div>
          </div>

          {/* ─── Sub-Header: Bill To / Issued By Details ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8 mb-8 text-xs leading-relaxed">
            
            {/* Bill To (Client) */}
            <div className="space-y-2">
              <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block border-r-2 border-[var(--accent)] pr-2">
                فاتورة موجهة إلى (العميل / المشتري):
              </span>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                  {contract.client?.full_name || 'حساب صاحب عمل'}
                </h3>
                <p className="text-slate-500">اسم المستخدم: @{contract.client?.username}</p>
                <p className="text-slate-500 mt-1">البلد: الجزائر العاصمة، الجزائر</p>
                <p className="text-slate-400 text-[10px] mt-2">عضو موثق ومسجل عبر خدمة.dz</p>
              </div>
            </div>

            {/* Issued By (Freelancer) */}
            <div className="space-y-2">
              <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block border-r-2 border-emerald-600 pr-2">
                مقدم الخدمة (المستقل / البائع):
              </span>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                  {contract.freelancer?.full_name || 'حساب مستقل'}
                </h3>
                <p className="text-slate-500">اسم المستخدم: @{contract.freelancer?.username}</p>
                <p className="text-slate-500 mt-1">البلد: الجزائر</p>
                <p className="text-slate-400 text-[10px] mt-2">شريك عمل حر معتمد عبر منصة خدمة.dz</p>
              </div>
            </div>

          </div>

          {/* ─── Section 3: Project and Contract Title Details ─── */}
          <div className="mb-8">
            <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-2">
              تفاصيل وموضوع التعاقد:
            </span>
            <div className="bg-[var(--accent-soft)]/20 border border-[var(--accent-soft)] p-4 rounded-2xl">
              <h4 className="font-extrabold text-sm text-[var(--fg)] mb-1">
                {contract.title}
              </h4>
              <p className="text-xs text-slate-600">
                المشروع الأصلي: {contract.jobs?.title || 'عقد عمل حر مباشر'}
              </p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/50 text-[10px] text-[var(--muted)]">
                <span>حالة العقد: <strong className="text-[var(--accent)] font-bold">مكتمل ومسدد بالكامل ✓</strong></span>
                <span>وسيط الدفع: <strong className="text-slate-700">بريدي موب (BaridiMob)</strong></span>
              </div>
            </div>
          </div>

          {/* ─── Section 4: Detailed Financial Table Breakdown ─── */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">البند والخدمة المقدمة</th>
                  <th className="p-4 text-left">القيمة المالية (دج)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">ميزانية العقد الكلية المتفق عليها</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      حجم المعاملات لجميع معالم ومراحل التسليم المؤمنة عبر نظام الضمان.
                    </div>
                  </td>
                  <td className="p-4 text-left font-mono font-bold text-slate-900">
                    {totalAmount.toLocaleString()} دج
                  </td>
                </tr>
                <tr>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">رسوم تشغيل المنصة وصيانة المعاملات (10%)</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      عمولة خدمة.dz لتأمين الضمان (Escrow) والدعم ومعالجة الحوالات البريدية.
                    </div>
                  </td>
                  <td className="p-4 text-left font-mono font-bold text-rose-500">
                    - {platformFee.toLocaleString()} دج
                  </td>
                </tr>
                <tr className="bg-emerald-50/20 text-emerald-950 font-bold border-t border-slate-200">
                  <td className="p-4 text-sm font-extrabold text-[var(--fg)]">
                    صافي الأتعاب المحررة للمستقل (90%)
                  </td>
                  <td className="p-4 text-left text-sm font-mono font-extrabold text-emerald-600">
                    {netPayout.toLocaleString()} دج
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─── Section 5: Stamps & Trusted System Signatures ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center pt-6 border-t border-slate-100 text-xs">
            
            {/* Guarantee Seal Box */}
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
              <CheckCircle2 size={32} className="text-emerald-600 flex-shrink-0" />
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-xs">مدفوع ومضمون بالكامل</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  تؤكد خدمة.dz أن ميزانية هذا المشروع تم تحريرها بالكامل للمستقل بعد تسلم وإقرار جودة المخرجات.
                </p>
              </div>
            </div>

            {/* Visual Signature stamp mockup */}
            <div className="flex flex-col items-center sm:items-end justify-center pr-4">
              <div className="text-center relative">
                <span className="text-[10px] text-slate-400 block mb-1">ختم توثيق المعاملة الرقمي</span>
                
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
            <p>هذه الفاتورة تم توليدها وتأكيدها رقمياً بناءً على شروط وأحكام منصة خدمة.dz.</p>
            <p className="mt-0.5">جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
          </div>

        </div>
      </div>

    </div>
  )
}
