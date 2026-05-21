import { Resend } from 'resend'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Initialize Resend with the API key
const resendApiKey = process.env.RESEND_API_KEY || ''

let resend: Resend | null = null
if (resendApiKey) {
  resend = new Resend(resendApiKey)
} else {
  console.warn(
    '⚠️ WARNING: RESEND_API_KEY is not defined in .env.local. Email notifications will be logged to the console instead of sent.'
  )
}

// Helper: admin Supabase client (service role — bypasses RLS to read auth.users)
export function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Fetch a single user's email securely from auth.users using their profile ID
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = getAdminSupabase()
    const { data: { user }, error } = await admin.auth.admin.getUserById(userId)
    if (error || !user?.email) {
      console.error(`Error fetching email for user ${userId}:`, error?.message)
      return null
    }
    return user.email
  } catch (err) {
    console.error(`Exception fetching email for user ${userId}:`, err)
    return null
  }
}

/**
 * Fetch the email addresses of all admin users
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const admin = getAdminSupabase()
    
    // 1. Get all profile IDs where is_admin is true
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id')
      .eq('is_admin', true)

    if (error || !profiles) {
      console.error('Error fetching admin profiles:', error?.message)
      return []
    }

    const emails: string[] = []
    
    // 2. Fetch email for each admin profile
    for (const p of profiles) {
      const email = await getUserEmail(p.id)
      if (email) emails.push(email)
    }

    return emails
  } catch (err) {
    console.error('Exception fetching admin emails:', err)
    return []
  }
}

/**
 * Core sendEmail utility function
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[]
  subject: string
  text: string
  html?: string
}) {
  const recipients = Array.isArray(to) ? to : [to]
  
  if (recipients.length === 0) {
    console.warn('⚠️ sendEmail called with no recipients.')
    return { success: false, error: 'No recipients specified' }
  }

  // Fallback to console in development if Resend is not configured
  if (!resend) {
    console.log(`📡 [EMAIL SIMULATION]
=============================================
TO:      ${recipients.join(', ')}
SUBJECT: ${subject}
TEXT:    ${text}
HTML:    ${html ? '(HTML Content Provided)' : 'N/A'}
=============================================`)
    return { success: true, simulated: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Khidma.dz <onboarding@resend.dev>', // Resend sandbox domain default sender
      to: recipients,
      subject,
      text,
      html: html || text,
    })

    if (error) {
      console.error('❌ Resend API Error:', error)
      return { success: false, error }
    }

    console.log(`✅ Email sent successfully via Resend. ID: ${data?.id}`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error)
    return { success: false, error }
  }
}

/**
 * HTML Email template generator for premium, brand-aligned emails.
 */
export function generateEmailHtml({
  title,
  bodyText,
  buttonLabel,
  buttonUrl,
  cardItems,
}: {
  title: string
  bodyText: string
  buttonLabel?: string
  buttonUrl?: string
  cardItems?: Array<{ label: string; value: string }>
}) {
  const cardHtml = cardItems && cardItems.length > 0
    ? `
      <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        ${cardItems
          .map(
            (item) => `
          <div style="font-size: 15px; margin-bottom: 12px; color: #e5e7eb; line-height: 1.5;">
            <strong style="color: #9ca3af; font-weight: 500;">${item.label}:</strong>
            <span style="direction: ltr; display: inline-block;">${item.value}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `
    : ''

  const buttonHtml = buttonLabel && buttonUrl
    ? `
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${buttonUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff !important; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
          ${buttonLabel}
        </a>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 0; direction: rtl; text-align: right;">
      <div style="width: 100%; background-color: #0b0f19; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">خدمة.dz</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 20px; line-height: 1.4;">${title}</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 30px;">${bodyText}</p>
            
            ${cardHtml}
            ${buttonHtml}
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              إذا واجهت أي صعوبة، يرجى الرد على هذا البريد الإلكتروني للتواصل مع فريق الدعم الفني.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #0b0f19; padding: 30px 40px; border-top: 1px solid #1f2937; text-align: center; font-size: 13px; color: #4b5563;">
            <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} خدمة.dz. جميع الحقوق محفوظة.</p>
            <p style="margin: 0;">منصة العمل الحر والضمان المالي الأولى في الجزائر.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
