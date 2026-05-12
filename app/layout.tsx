import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | خدمة.dz',
    default: 'خدمة.dz — منصة العمل الحر الجزائرية',
  },
  description: 'منصة آمنة للعمل الحر في الجزائر تجمع بين الكفاءات المحلية وأصحاب المشاريع مع نظام ضمان (Escrow) ودفع محلي (CCP, BaridiMob).',
  keywords: ['عمل حر', 'مستقل', 'الجزائر', 'فريلانسر', 'خدمة', 'وظائف', 'برمجة', 'تصميم', 'تسويق', 'بريدي موب'],
  authors: [{ name: 'خدمة.dz Team' }],
  creator: 'خدمة.dz',
  publisher: 'خدمة.dz',
  openGraph: {
    type: 'website',
    locale: 'ar_DZ',
    url: 'https://khidma.dz',
    title: 'خدمة.dz — منصة العمل الحر الجزائرية',
    description: 'المنصة الجزائرية الأولى للعمل الحر مع نظام ضمان متكامل ودفع آمن 100%.',
    siteName: 'خدمة.dz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خدمة.dz — العمل الحر في الجزائر',
    description: 'وظّف أفضل المستقلين الجزائريين بأمان عبر نظام الضمان المحلي.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Tajawal', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
