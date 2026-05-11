'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Fetch user's notifications ──
export async function getNotifications(limit = 20) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notifications: [], unreadCount: 0 }

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return {
      notifications: notifications || [],
      unreadCount: count || 0,
    }
  } catch (error) {
    console.error('getNotifications error:', error)
    return { notifications: [], unreadCount: 0 }
  }
}

// ── Mark a single notification as read ──
export async function markNotificationRead(notificationId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    return { success: true }
  } catch (error) {
    console.error('markNotificationRead error:', error)
    return { success: false }
  }
}

// ── Mark ALL notifications as read ──
export async function markAllNotificationsRead() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('markAllNotificationsRead error:', error)
    return { success: false }
  }
}

// ── Send a notification (calls SECURITY DEFINER RPC) ──
// This can notify ANY user, bypassing RLS via the RPC.
// Must be called from server actions only.
export async function sendNotificationAction(
  targetUserId: string,
  type: string,
  title: string,
  body?: string,
  link?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Don't notify yourself
    if (targetUserId === user.id) return { success: true }

    const { error } = await supabase.rpc('create_notification', {
      p_user_id: targetUserId,
      p_type: type,
      p_title: title,
      p_body: body || null,
      p_link: link || null,
    })

    if (error) {
      console.error('sendNotification RPC error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('sendNotificationAction error:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
