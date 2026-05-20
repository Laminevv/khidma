import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة (404)',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
          >
            الرئيسية
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background blurred accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-50 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="max-w-lg w-full text-center py-16">

          {/* Animated illustration */}
          <div className="relative mx-auto mb-10 w-48 h-48">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-200"
              style={{ animation: 'spin 25s linear infinite' }}
            />
            {/* Inner circle */}
            <div className="absolute inset-4 bg-gradient-to-br from-emerald-50 to-amber-50 rounded-full flex items-center justify-center">
              {/* Compass icon */}
              <svg
                width="72"
                height="72"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'pulse 3s ease-in-out infinite' }}
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#d1fae5" stroke="#10b981" />
              </svg>
            </div>
            {/* Floating dots */}
            <div
              className="absolute top-2 left-6 w-3 h-3 bg-emerald-300 rounded-full"
              style={{ animation: 'bounce 2s ease-in-out infinite' }}
            />
            <div
              className="absolute bottom-6 right-2 w-2 h-2 bg-amber-300 rounded-full"
              style={{ animation: 'bounce 2.5s ease-in-out infinite 0.3s' }}
            />
            <div
              className="absolute top-10 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full"
              style={{ animation: 'bounce 3s ease-in-out infinite 0.6s' }}
            />
          </div>

          {/* Error code */}
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-bold px-5 py-2 rounded-full mb-6 border border-amber-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            خطأ 404
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-snug">
            الصفحة التي تبحث عنها
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-emerald-600">
              غير موجودة
            </span>
          </h1>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
            يبدو أن هذه الصفحة قد تم نقلها أو حذفها. لا تقلق، يمكنك
            العودة إلى الصفحة الرئيسية أو تصفح المشاريع المتاحة.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/30 text-base flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              العودة للرئيسية
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-base flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              تصفح المشاريع
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6 text-center">
        <p className="text-sm text-gray-400">
          جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz
        </p>
      </footer>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
