'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, getAdminEmails, generateEmailHtml } from '@/lib/email'

export interface ContactInput {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

export async function submitContactAction(input: ContactInput) {
  try {
    const { name, email, subject, category, message } = input

    // Basic server-side validations
    if (!name || name.trim().length < 3) {
      return { error: 'يرجى إدخال اسم صحيح (3 أحرف على الأقل)' }
    }
    if (!email || !email.includes('@')) {
      return { error: 'يرجى إدخال بريد إلكتروني صحيح' }
    }
    if (!subject || subject.trim().length < 4) {
      return { error: 'يرجى تحديد عنوان الموضوع' }
    }
    if (!message || message.trim().length < 10) {
      return { error: 'يرجى كتابة رسالتك بالتفصيل (10 أحرف على الأقل)' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Send receipt email to the user
    const userEmailHtml = generateEmailHtml({
      title: 'استلمنا رسالتك بنجاح - خدمة.dz',
      bodyText: `مرحباً ${name}، نشكرك على التواصل مع خدمة.dz. لقد استلمنا رسالتك وسيتواصل معك أحد ممثلي الدعم الفني في أقرب وقت ممكن. إليك ملخص طلبك:`,
      cardItems: [
        { label: 'الموضوع', value: subject },
        { label: 'القسم', value: getCategoryLabel(category) },
        { label: 'الرسالة', value: message }
      ]
    })

    await sendEmail({
      to: email,
      subject: `استلام طلب الدعم: ${subject} - خدمة.dz`,
      text: `مرحباً ${name}، لقد استلمنا رسالتك بعنوان "${subject}" وسنقوم بالرد عليك في أقرب وقت.`,
      html: userEmailHtml
    })

    // 2. Fetch admin emails and notify them
    const adminEmails = await getAdminEmails()
    if (adminEmails.length > 0) {
      const adminEmailHtml = generateEmailHtml({
        title: 'طلب دعم واستفسار جديد',
        bodyText: `تم تقديم طلب اتصال ودعم جديد من قبل زائر/عضو في المنصة بالبيانات التالية:`,
        cardItems: [
          { label: 'اسم المرسل', value: name },
          { label: 'البريد الإلكتروني', value: email },
          { label: 'معرف المستخدم (إن وجد)', value: user?.id || 'زائر غير مسجل' },
          { label: 'القسم الاستفساري', value: getCategoryLabel(category) },
          { label: 'الموضوع', value: subject },
          { label: 'محتوى الرسالة', value: message }
        ]
      })

      await sendEmail({
        to: adminEmails,
        subject: `[طلب دعم جديد] ${subject} - خدمة.dz`,
        text: `طلب دعم جديد من ${name} (${email}): ${message}`,
        html: adminEmailHtml
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Contact submission error:', error)
    return { error: 'حدث خطأ فني غير متوقع أثناء معالجة رسالتك. يرجى المحاولة لاحقاً.' }
  }
}

function getCategoryLabel(cat: string): string {
  const categories: Record<string, string> = {
    general: 'استفسار عام',
    technical: 'دعم فني للمنصة',
    financial: 'مشاكل الشحن أو السحب المالي',
    dispute: 'نزاعات أو شكاوى العقود',
    partnership: 'شراكات وأعمال'
  }
  return categories[cat] || cat
}
