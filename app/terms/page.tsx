import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'شروط وأحكام استخدام منصة خدمة.dz للعمل الحر في الجزائر.',
}

const LAST_UPDATED = '20 مايو 2026'

// Reusable section component
function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="text-gray-600 leading-[1.9] text-[15px] space-y-4 pr-1">
        {children}
      </div>
    </section>
  )
}

export default function TermsPage() {
  const sections = [
    { id: 'intro', title: 'مقدمة وتعريفات', icon: '📋' },
    { id: 'registration', title: 'التسجيل والحسابات', icon: '👤' },
    { id: 'kyc', title: 'التحقق من الهوية (KYC)', icon: '🪪' },
    { id: 'services', title: 'استخدام الخدمات', icon: '⚙️' },
    { id: 'escrow', title: 'نظام الضمان (Escrow)', icon: '🛡️' },
    { id: 'payments', title: 'الإيداع والسحب', icon: '💳' },
    { id: 'fees', title: 'العمولات والرسوم', icon: '🧾' },
    { id: 'obligations', title: 'التزامات المستخدمين', icon: '📌' },
    { id: 'disputes', title: 'النزاعات والوساطة', icon: '⚖️' },
    { id: 'ip', title: 'الملكية الفكرية', icon: '©️' },
    { id: 'liability', title: 'حدود المسؤولية', icon: '🔒' },
    { id: 'termination', title: 'إنهاء الحساب', icon: '🚫' },
    { id: 'changes', title: 'تعديل الشروط', icon: '📝' },
    { id: 'law', title: 'القانون الواجب التطبيق', icon: '🏛️' },
    { id: 'contact', title: 'التواصل معنا', icon: '📧' },
  ]

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors hidden sm:block">
              سياسة الخصوصية
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">
              الرئيسية
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Sidebar — Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">فهرس المحتويات</h3>
                <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all"
                    >
                      <span className="text-xs">{s.icon}</span>
                      <span>{s.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0">

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 mb-8">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-4 py-2 rounded-full mb-5 border border-emerald-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                وثيقة قانونية
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">شروط الاستخدام</h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                باستخدامك لمنصة خدمة.dz فإنك توافق على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية قبل استخدام المنصة.
              </p>
              <div className="flex items-center gap-4 mt-5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  آخر تحديث: {LAST_UPDATED}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  ~10 دقائق قراءة
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">

              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 space-y-12">

                <Section id="intro" icon="📋" title="مقدمة وتعريفات">
                  <p>
                    مرحباً بكم في <strong>خدمة.dz</strong> (يُشار إليها فيما بعد بـ &quot;المنصة&quot; أو &quot;نحن&quot;). المنصة هي سوق إلكتروني للعمل الحر يربط بين أصحاب المشاريع (&quot;العملاء&quot;) والمستقلين (&quot;مقدمي الخدمات&quot;) في الجزائر.
                  </p>
                  <p>في هذه الشروط، تعني المصطلحات التالية:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>&quot;المستخدم&quot;</strong>: أي شخص يستخدم المنصة، سواء كان عميلاً أو مستقلاً.</li>
                    <li><strong>&quot;الحساب&quot;</strong>: حساب المستخدم المسجل على المنصة.</li>
                    <li><strong>&quot;المشروع&quot;</strong>: أي عمل أو مهمة يتم نشرها على المنصة.</li>
                    <li><strong>&quot;العقد&quot;</strong>: الاتفاقية التي تنشأ بين العميل والمستقل عبر المنصة.</li>
                    <li><strong>&quot;نظام الضمان (Escrow)&quot;</strong>: آلية حجز الأموال لحماية حقوق الطرفين.</li>
                    <li><strong>&quot;المحفظة&quot;</strong>: الرصيد الإلكتروني للمستخدم داخل المنصة.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="registration" icon="👤" title="التسجيل والحسابات">
                  <p>
                    للاستفادة من خدمات المنصة، يجب عليك إنشاء حساب بتقديم معلومات صحيحة ودقيقة. يتعهد المستخدم بما يلي:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>أن يكون عمره 18 سنة على الأقل أو الحد الأدنى القانوني في بلد إقامته.</li>
                    <li>تقديم اسم حقيقي كامل ومعلومات اتصال صحيحة.</li>
                    <li>عدم إنشاء أكثر من حساب واحد لنفس الشخص.</li>
                    <li>الحفاظ على سرية بيانات الدخول وعدم مشاركتها مع أي طرف ثالث.</li>
                    <li>إبلاغ المنصة فوراً في حالة اشتباه بأي اختراق أمني للحساب.</li>
                  </ul>
                  <p>
                    تحتفظ المنصة بحق رفض أو تعليق أي حساب دون إبداء أسباب إذا تبين وجود معلومات مغلوطة أو مخالفة لهذه الشروط.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="kyc" icon="🪪" title="التحقق من الهوية (KYC)">
                  <p>
                    في إطار الامتثال للتشريعات المحلية ومكافحة الاحتيال، تتطلب المنصة من المستخدمين إتمام عملية التحقق من الهوية (Know Your Customer) قبل إجراء عمليات مالية معينة:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>تقديم نسخة من بطاقة التعريف الوطنية أو جواز السفر ساري المفعول.</li>
                    <li>صورة شخصية واضحة (Selfie) للتأكد من هوية المستخدم.</li>
                    <li>قد تُطلب وثائق إضافية حسب حجم المعاملات (كشف حساب بنكي، إثبات عنوان).</li>
                  </ul>
                  <p>
                    تتم معالجة وثائق التحقق خلال 24-72 ساعة عمل. تحتفظ المنصة بحق تقييد أو تعليق الحسابات التي لم تُكمل عملية التحقق أو التي قدمت وثائق مشبوهة.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="services" icon="⚙️" title="استخدام الخدمات">
                  <p>تُستخدم المنصة كوسيط بين العملاء والمستقلين. بصفتك مستخدماً، فأنت توافق على:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>عدم استخدام المنصة لأي أغراض غير قانونية أو مخالفة للنظام العام.</li>
                    <li>عدم نشر محتوى مسيء أو تمييزي أو مضلل.</li>
                    <li>عدم التحايل على نظام المنصة بالتواصل خارجها لتجنب العمولات.</li>
                    <li>الالتزام بالمواعيد النهائية المتفق عليها في العقود.</li>
                    <li>تقديم عمل أصلي وعالي الجودة يتوافق مع وصف المشروع.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="escrow" icon="🛡️" title="نظام الضمان (Escrow)">
                  <p>
                    تعمل المنصة بنظام ضمان (Escrow) لحماية حقوق كلا الطرفين. آلية العمل:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>حجز الأموال:</strong> عند بدء مرحلة من العقد، يتم خصم المبلغ المتفق عليه من محفظة العميل وحجزه في نظام الضمان.</li>
                    <li><strong>تسليم العمل:</strong> يقوم المستقل بتسليم العمل المطلوب عبر المنصة.</li>
                    <li><strong>تحرير الدفعة:</strong> بعد موافقة العميل على العمل المُسلّم، يتم تحرير المبلغ المحجوز إلى محفظة المستقل بعد خصم العمولة.</li>
                    <li><strong>النزاعات:</strong> في حالة عدم الاتفاق، يمكن لأي طرف فتح نزاع ليتم حله من قبل فريق الوساطة.</li>
                  </ul>
                  <p>
                    الأموال المحجوزة في نظام الضمان ليست أرباحاً مؤكدة لأي طرف حتى يتم تحريرها رسمياً من قبل المنصة.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="payments" icon="💳" title="الإيداع والسحب">
                  <p>تدعم المنصة طرق الدفع المحلية التالية:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>حساب CCP (بريد الجزائر):</strong> تحويل يدوي مع رفع إيصال.</li>
                    <li><strong>بريدي موب:</strong> تحويل عبر تطبيق بريدي موب مع رفع إيصال.</li>
                    <li><strong>البطاقة الذهبية (Edahabia) / CIB:</strong> دفع إلكتروني فوري عبر بوابة Chargily.</li>
                  </ul>
                  <p>بخصوص الإيداعات:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>الحد الأدنى للإيداع هو 1,000 دج.</li>
                    <li>يتم تأكيد الإيداعات اليدوية (CCP/بريدي موب) خلال 24 ساعة عمل.</li>
                    <li>يتم تأكيد الإيداعات الإلكترونية (Edahabia/CIB) تلقائياً بعد تأكيد الدفع.</li>
                    <li>لا يمكن أن يكون لديك أكثر من 3 طلبات إيداع معلقة في نفس الوقت.</li>
                  </ul>
                  <p>بخصوص السحوبات:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>يجب إتمام التحقق من الهوية (KYC) قبل طلب أي سحب.</li>
                    <li>الحد الأدنى للسحب هو 2,000 دج.</li>
                    <li>يتم معالجة طلبات السحب خلال 1-3 أيام عمل.</li>
                    <li>تحتفظ المنصة بحق تعليق عمليات السحب في حالة وجود شبهة احتيال أو مخالفة.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="fees" icon="🧾" title="العمولات والرسوم">
                  <p>
                    تتقاضى المنصة عمولة على كل معاملة ناجحة تتم عبر نظام الضمان. تفاصيل العمولة:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>عمولة الخدمة:</strong> يتم خصم نسبة من قيمة كل دفعة يتم تحريرها (تُعلن النسبة بوضوح قبل كل معاملة).</li>
                    <li><strong>رسوم الإيداع:</strong> الإيداعات عبر CCP وبريدي موب مجانية. الإيداعات عبر البطاقة قد تشمل رسوم بوابة الدفع.</li>
                    <li><strong>رسوم السحب:</strong> قد تُفرض رسوم رمزية على عمليات السحب حسب طريقة السحب المختارة.</li>
                  </ul>
                  <p>
                    تحتفظ المنصة بحق تعديل نسب العمولة مع إشعار مسبق لا يقل عن 30 يوماً.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="obligations" icon="📌" title="التزامات المستخدمين">
                  <p><strong>التزامات العميل:</strong></p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>وصف المشروع بشكل واضح ودقيق يتضمن كافة المتطلبات.</li>
                    <li>توفير الرصيد الكافي في المحفظة لتغطية مراحل العقد.</li>
                    <li>مراجعة العمل المُسلّم وإبداء الرأي خلال المدة المحددة.</li>
                    <li>عدم طلب عمل إضافي يتجاوز نطاق المشروع الأصلي دون اتفاق جديد.</li>
                  </ul>
                  <p><strong>التزامات المستقل:</strong></p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>تنفيذ العمل وفقاً للمواصفات المتفق عليها في العقد.</li>
                    <li>الالتزام بالمواعيد النهائية والتواصل بشكل منتظم مع العميل.</li>
                    <li>تقديم عمل أصلي خالٍ من أي انتهاك لحقوق الملكية الفكرية.</li>
                    <li>عدم مشاركة معلومات العميل السرية مع أطراف خارجية.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="disputes" icon="⚖️" title="النزاعات والوساطة">
                  <p>
                    في حالة نشوب نزاع بين العميل والمستقل حول جودة العمل أو شروط التسليم:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>يمكن لأي طرف فتح نزاع عبر صفحة العقد في المنصة.</li>
                    <li>يقوم فريق الوساطة بمراجعة المشروع والأدلة المقدمة من الطرفين.</li>
                    <li>يتم إصدار قرار خلال 3-7 أيام عمل من تاريخ فتح النزاع.</li>
                    <li>قرارات فريق الوساطة نهائية وملزمة لكلا الطرفين فيما يتعلق بالأموال المحجوزة.</li>
                  </ul>
                  <p>
                    تشجع المنصة الطرفين على محاولة حل الخلافات ودياً قبل اللجوء إلى نظام النزاعات الرسمي.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="ip" icon="©️" title="الملكية الفكرية">
                  <p>
                    عند تحرير الدفعة الكاملة للمستقل، تنتقل حقوق الملكية الفكرية للعمل المُنجز إلى العميل ما لم يُتفق على خلاف ذلك كتابةً. يلتزم المستقل بما يلي:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>تقديم عمل أصلي لا ينتهك حقوق أي طرف ثالث.</li>
                    <li>عدم إعادة استخدام أو بيع العمل المُسلّم لطرف آخر (إلا إذا كانت الخدمة صريحة في ذلك).</li>
                    <li>نقل جميع الملفات المصدرية والأصول الرقمية المرتبطة بالمشروع.</li>
                  </ul>
                  <p>
                    المنصة ذاتها ومحتوياتها (الشعار، التصميم، الكود البرمجي) محمية بحقوق الملكية الفكرية لصالح خدمة.dz.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="liability" icon="🔒" title="حدود المسؤولية">
                  <p>
                    المنصة تعمل كوسيط تقني بين العملاء والمستقلين، ولا تتحمل المسؤولية عن:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>جودة الأعمال المنجزة أو مدى مطابقتها لتوقعات العميل.</li>
                    <li>أي أضرار مباشرة أو غير مباشرة ناتجة عن التعامل بين المستخدمين.</li>
                    <li>انقطاعات الخدمة المؤقتة لأسباب تقنية أو صيانة مجدولة.</li>
                    <li>الخسائر الناتجة عن إهمال المستخدم في حماية بيانات حسابه.</li>
                  </ul>
                  <p>
                    تبذل المنصة قصارى جهدها لتوفير خدمة آمنة ومستقرة، لكنها تُقدّم &quot;كما هي&quot; دون أي ضمانات صريحة أو ضمنية.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="termination" icon="🚫" title="إنهاء الحساب">
                  <p>
                    يحق لأي مستخدم إغلاق حسابه في أي وقت عبر صفحة الإعدادات. كما تحتفظ المنصة بحق تعليق أو إنهاء أي حساب في الحالات التالية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>مخالفة شروط الاستخدام بشكل متكرر أو جسيم.</li>
                    <li>تقديم معلومات مغلوطة أو وثائق مزورة.</li>
                    <li>محاولة الاحتيال أو التلاعب بنظام الضمان.</li>
                    <li>إرسال محتوى مسيء أو تمييزي أو غير قانوني.</li>
                    <li>عدم النشاط لأكثر من 12 شهراً متتالياً (بعد إشعار مسبق).</li>
                  </ul>
                  <p>
                    في حالة إنهاء الحساب، سيتم معالجة أي أموال متبقية في المحفظة وفقاً للإجراءات المعمول بها.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="changes" icon="📝" title="تعديل الشروط">
                  <p>
                    تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت. في حالة إجراء تعديلات جوهرية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>سيتم إشعار المستخدمين عبر البريد الإلكتروني أو إشعار داخل المنصة قبل 30 يوماً من دخول التعديلات حيز التنفيذ.</li>
                    <li>استمرارك في استخدام المنصة بعد التعديل يعني موافقتك الضمنية على الشروط الجديدة.</li>
                    <li>يحق لك إغلاق حسابك وسحب أموالك إذا لم توافق على التعديلات الجديدة.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="law" icon="🏛️" title="القانون الواجب التطبيق">
                  <p>
                    تخضع هذه الشروط وتُفسّر وفقاً لقوانين الجمهورية الجزائرية الديمقراطية الشعبية. في حالة نشوب أي نزاع قانوني لا يمكن حله ودياً، تكون المحاكم الجزائرية المختصة هي الجهة القضائية الوحيدة المعنية بالنظر فيه.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="contact" icon="📧" title="التواصل معنا">
                  <p>
                    لأي استفسارات أو ملاحظات حول شروط الاستخدام هذه، يمكنكم التواصل معنا عبر:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>البريد الإلكتروني:</strong> support@khidma.dz</li>
                    <li><strong>نموذج الاتصال:</strong> متاح عبر صفحة &quot;اتصل بنا&quot; في المنصة.</li>
                  </ul>
                </Section>
              </div>

            </div>
          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">سياسة الخصوصية</Link>
            <Link href="/" className="hover:text-emerald-600 transition-colors">الرئيسية</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
