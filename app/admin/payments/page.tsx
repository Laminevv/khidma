import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import ClientPaymentsPage from './ClientPaymentsPage'

// TEMPORARY DIAGNOSTIC PAGE — remove after debugging
export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  // ─── Diagnostic: collect all cookie names ───
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => ({ name: c.name, length: c.value.length }))

  // ─── Step 1: getUser() via cookie-based client ───
  const authClient = await createClient()
  const { data: authData, error: authError } = await authClient.auth.getUser()

  const authDiag = {
    user_id: authData?.user?.id ?? null,
    email: authData?.user?.email ?? null,
    role: authData?.user?.role ?? null,
    error_message: authError?.message ?? null,
    error_status: authError?.status ?? null,
  }

  // ─── Step 2: is_admin check via service-role client ───
  const serviceClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let profileDiag: any = null
  if (authData?.user?.id) {
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, username, full_name, is_admin, is_banned, role')
      .eq('id', authData.user.id)
      .single()

    profileDiag = {
      profile,
      error_message: profileError?.message ?? null,
      error_code: profileError?.code ?? null,
    }
  }

  // ─── Step 3: env var presence check ───
  const envDiag = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ MISSING',
  }

  // ─── Decision: render diagnostic or the real page ───
  const isAuthenticated = !!authData?.user
  const isAdmin = profileDiag?.profile?.is_admin === true

  if (!isAuthenticated || !isAdmin) {
    // DIAGNOSTIC: render raw JSON instead of redirecting
    const diagnostic = {
      timestamp: new Date().toISOString(),
      verdict: !isAuthenticated ? 'AUTH_FAILED — getUser() returned no user' : 'NOT_ADMIN — is_admin is not true',
      cookies: allCookies,
      auth: authDiag,
      profile: profileDiag,
      env: envDiag,
    }

    return (
      <div style={{ padding: 40, fontFamily: 'monospace', direction: 'ltr', background: '#0d1117', color: '#e6edf3', minHeight: '100vh' }}>
        <h1 style={{ color: '#f85149', marginBottom: 8 }}>🔍 Admin Auth Diagnostic</h1>
        <p style={{ color: '#8b949e', marginBottom: 24 }}>This page temporarily shows raw auth data instead of redirecting. Remove after debugging.</p>
        <pre style={{ background: '#161b22', padding: 24, borderRadius: 12, overflow: 'auto', fontSize: 14, lineHeight: 1.6, border: '1px solid #30363d' }}>
          {JSON.stringify(diagnostic, null, 2)}
        </pre>
      </div>
    )
  }

  // ─── Normal page render (admin confirmed) ───
  const { data: overview } = await serviceClient
    .from('admin_overview')
    .select('total_fees_collected')
    .single()

  const { data: withdrawals } = await serviceClient
    .from('transactions')
    .select(`id, amount, created_at, metadata, profiles!from_user_id(username, full_name)`)
    .eq('type', 'withdrawal')
    .eq('status', 'pending')

  const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
    id: w.id, amount: w.amount, created_at: w.created_at, metadata: w.metadata,
    profiles: Array.isArray(w.profiles) ? w.profiles[0] : w.profiles,
  }))

  const { data: deposits } = await serviceClient
    .from('transactions')
    .select(`id, amount, created_at, metadata, payment_method, receipt_url, profiles!from_user_id(username, full_name)`)
    .eq('type', 'deposit')
    .eq('status', 'pending')

  const formattedDeposits = (deposits || []).map((d: any) => ({
    id: d.id, amount: d.amount, created_at: d.created_at, metadata: d.metadata,
    payment_method: d.payment_method, receipt_url: d.receipt_url,
    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
  }))

  return (
    <ClientPaymentsPage
      totalRevenue={overview?.total_fees_collected || 0}
      initialWithdrawals={formattedWithdrawals}
      initialDeposits={formattedDeposits}
    />
  )
}
