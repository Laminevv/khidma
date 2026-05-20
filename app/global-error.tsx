'use client'

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>خطأ في الخادم | خدمة.dz</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Tajawal', sans-serif", margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          {/* Navbar */}
          <nav
            style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid #f3f4f6',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <div
              style={{
                maxWidth: '72rem',
                margin: '0 auto',
                padding: '0 1.5rem',
                height: '4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#10b981',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white" />
                  </svg>
                </div>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                  خدمة<span style={{ color: '#10b981' }}>.dz</span>
                </span>
              </a>
            </div>
          </nav>

          {/* Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background accents */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '500px',
                height: '500px',
                background: '#fef2f2',
                borderRadius: '50%',
                filter: 'blur(120px)',
                zIndex: -1,
                transform: 'translateX(33%) translateY(-25%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '400px',
                height: '400px',
                background: '#ecfdf5',
                borderRadius: '50%',
                filter: 'blur(100px)',
                zIndex: -1,
                transform: 'translateX(-33%) translateY(33%)',
              }}
            />

            <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center', padding: '4rem 0' }}>

              {/* Animated illustration */}
              <div
                style={{
                  position: 'relative',
                  margin: '0 auto 2.5rem',
                  width: '12rem',
                  height: '12rem',
                }}
              >
                {/* Outer ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '4px dashed #fecaca',
                    animation: 'error-spin 20s linear infinite',
                  }}
                />
                {/* Inner circle */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '1rem',
                    background: 'linear-gradient(135deg, #fef2f2, #fff7ed)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Warning icon */}
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: 'error-pulse 3s ease-in-out infinite' }}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#fee2e2" stroke="#ef4444" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                {/* Floating dots */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '1.5rem',
                    width: '0.75rem',
                    height: '0.75rem',
                    background: '#fca5a5',
                    borderRadius: '50%',
                    animation: 'error-bounce 2s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    right: '0.5rem',
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#fdba74',
                    borderRadius: '50%',
                    animation: 'error-bounce 2.5s ease-in-out infinite 0.3s',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '2.5rem',
                    right: 0,
                    width: '0.625rem',
                    height: '0.625rem',
                    background: '#f87171',
                    borderRadius: '50%',
                    animation: 'error-bounce 3s ease-in-out infinite 0.6s',
                  }}
                />
              </div>

              {/* Error badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  marginBottom: '1.5rem',
                  border: '1px solid #fee2e2',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                خطأ 500
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
                  fontWeight: 800,
                  color: '#111827',
                  marginBottom: '1rem',
                  lineHeight: 1.3,
                }}
              >
                حدث خطأ غير متوقع
                <br />
                <span
                  style={{
                    background: 'linear-gradient(to left, #f87171, #ef4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  في الخادم
                </span>
              </h1>

              <p
                style={{
                  color: '#6b7280',
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  lineHeight: 1.7,
                  marginBottom: '2.5rem',
                  maxWidth: '28rem',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                نعتذر عن هذا الخطأ. فريقنا التقني تم إشعاره تلقائياً
                ويعمل على إصلاح المشكلة. يمكنك المحاولة مجدداً أو
                العودة للصفحة الرئيسية.
              </p>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <button
                  onClick={() => unstable_retry()}
                  style={{
                    width: '100%',
                    maxWidth: '20rem',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: "'Tajawal', sans-serif",
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#059669'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#10b981'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  إعادة المحاولة
                </button>
                <a
                  href="/"
                  style={{
                    width: '100%',
                    maxWidth: '20rem',
                    background: '#ffffff',
                    color: '#374151',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: '2px solid #e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: "'Tajawal', sans-serif",
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#a7f3d0'
                    e.currentTarget.style.background = '#ecfdf5'
                    e.currentTarget.style.color = '#047857'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = '#ffffff'
                    e.currentTarget.style.color = '#374151'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  العودة للرئيسية
                </a>
              </div>

            </div>
          </div>

          {/* Footer */}
          <footer
            style={{
              borderTop: '1px solid #f3f4f6',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz
            </p>
          </footer>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes error-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes error-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
          @keyframes error-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      </body>
    </html>
  )
}
