'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function loginAction(identifier: string, password: string) {
  try {
    const supabase = await createClient()
    let emailToUse = identifier.trim()

    // If it's not an email, treat it as a username
    if (!emailToUse.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', emailToUse.toLowerCase())
        .single()

      if (profileError || !profile) {
        return { error: 'اسم المستخدم غير موجود' }
      }

      // Initialize admin client to bypass RLS and fetch user email from auth.users
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

      if (userError || !user?.email) {
        return { error: 'حدث خطأ أثناء استرداد الحساب' }
      }

      emailToUse = user.email
    }

    // Attempt login with the resolved email
    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password
    })

    if (error) {
      return { error: 'البيانات المدخلة غير صحيحة' }
    }

    return { success: true }
  } catch (error) {
    console.error('Login action error:', error)
    return { error: 'حدث خطأ غير متوقع' }
  }
}
