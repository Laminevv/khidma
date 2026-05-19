import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Debug: log middleware execution for admin routes
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin')) {
    const cookieNames = request.cookies.getAll().map(c => c.name).join(', ')
    console.log(`[Middleware] ${pathname} | cookies present: [${cookieNames}]`)
  }

  const { data: { user }, error } = await supabase.auth.getUser()

  // Debug: log auth result for admin routes
  if (pathname.startsWith('/admin')) {
    console.log(`[Middleware] ${pathname} | user: ${user?.id ?? 'NULL'} | error: ${error?.message ?? 'none'}`)
    
    // Strict edge-level protection for admin routes
    if (error || !user) {
      console.log(`[Middleware] Unauthorized admin access attempt to ${pathname}. Redirecting to /auth/login.`)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
