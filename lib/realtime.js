/**
 * FreelanceDZ — Supabase Realtime Manager
 * Handles all real-time subscriptions:
 *   - Chat messages (per room)
 *   - Typing indicators
 *   - Notifications (per user)
 *   - Contract milestone updates
 *   - Online presence tracking
 *
 * Usage:
 *   import { realtimeManager } from '@/lib/realtime'
 *   const unsub = realtimeManager.subscribeToRoom(roomId, userId, handlers)
 *   // On component unmount:
 *   unsub()
 */

import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Client initialisation (uses env vars from Next.js)
// ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)

// ─────────────────────────────────────────────────────────────
// Deterministic room_id from two user IDs (mirrors SQL function)
// ─────────────────────────────────────────────────────────────
export function getRoomId(userA, userB) {
  const sorted = [userA, userB].sort()
  // Simple deterministic hash — in production use uuid5
  return `room_${sorted[0]}_${sorted[1]}`
}

// ─────────────────────────────────────────────────────────────
// TYPING INDICATOR — Broadcast (ephemeral, no DB write)
// ─────────────────────────────────────────────────────────────
const typingChannels = new Map()

export function subscribeToTyping(roomId, currentUserId, onTyping) {
  if (typingChannels.has(roomId)) return typingChannels.get(roomId).unsubscribe

  const channel = supabase.channel(`typing:${roomId}`)

  channel
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.user_id !== currentUserId) {
        onTyping(payload.user_id, payload.is_typing)
      }
    })
    .subscribe()

  const handlers = {
    sendTyping: (isTyping) =>
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId, is_typing: isTyping },
      }),
    unsubscribe: () => {
      supabase.removeChannel(channel)
      typingChannels.delete(roomId)
    },
  }

  typingChannels.set(roomId, handlers)
  return handlers
}

// ─────────────────────────────────────────────────────────────
// CHAT — Subscribe to a message room
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} roomId
 * @param {string} currentUserId
 * @param {object} handlers
 * @param {(msg: object) => void}  handlers.onNewMessage
 * @param {(msgId: string) => void} handlers.onMessageRead
 * @returns {() => void} unsubscribe function
 */
export function subscribeToChatRoom(roomId, currentUserId, handlers) {
  const { onNewMessage, onMessageRead } = handlers

  const channel = supabase
    .channel(`chat:${roomId}`)
    // New messages in this room
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      ({ new: msg }) => {
        onNewMessage?.(msg)

        // Auto-mark as read if receiver is viewing
        if (msg.receiver_id === currentUserId) {
          markMessageRead(msg.id)
        }
      }
    )
    // Read receipts
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      ({ new: msg }) => {
        if (msg.is_read) onMessageRead?.(msg.id)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[Realtime] Chat room ${roomId} subscribed`)
      }
    })

  return () => supabase.removeChannel(channel)
}

// ─────────────────────────────────────────────────────────────
// MESSAGES — Fetch paginated history
// ─────────────────────────────────────────────────────────────
export async function fetchMessages(roomId, { page = 0, limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, username, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) throw error
  return data.reverse() // chronological order
}

// ─────────────────────────────────────────────────────────────
// MESSAGES — Send a message
// ─────────────────────────────────────────────────────────────
export async function sendMessage({ senderId, receiverId, content, contractId = null, attachments = [] }) {
  const roomId = getRoomId(senderId, receiverId)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      receiver_id: receiverId,
      contract_id: contractId,
      content,
      attachments: attachments.length ? attachments : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// MESSAGES — Mark as read
// ─────────────────────────────────────────────────────────────
export async function markMessageRead(messageId) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)

  if (error) console.error('[Realtime] markMessageRead error:', error)
}

export async function markAllMessagesRead(roomId, receiverId) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('receiver_id', receiverId)
    .eq('is_read', false)

  if (error) console.error('[Realtime] markAllMessagesRead error:', error)
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS — Subscribe to real-time notifications
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} userId
 * @param {(notification: object) => void} onNotification
 * @returns {() => void} unsubscribe
 */
export function subscribeToNotifications(userId, onNotification) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      ({ new: notif }) => {
        onNotification?.(notif)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS — Fetch unread count
// ─────────────────────────────────────────────────────────────
export async function fetchUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS — Mark all as read
// ─────────────────────────────────────────────────────────────
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

// ─────────────────────────────────────────────────────────────
// CONTRACTS — Subscribe to milestone updates
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} contractId
 * @param {(contract: object) => void} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeToContract(contractId, onUpdate) {
  const channel = supabase
    .channel(`contract:${contractId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'contracts',
        filter: `id=eq.${contractId}`,
      },
      ({ new: contract }) => {
        onUpdate?.(contract)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─────────────────────────────────────────────────────────────
// PRESENCE — Online/offline tracking
// ─────────────────────────────────────────────────────────────
const presenceChannels = new Map()

/**
 * Track user presence in a shared room or globally
 * @param {string} roomKey  — e.g. 'global' or a specific room_id
 * @param {object} userInfo — { id, username, avatar_url }
 * @param {(presenceList: object[]) => void} onChange
 * @returns {{ unsubscribe: () => void }}
 */
export function trackPresence(roomKey, userInfo, onChange) {
  if (presenceChannels.has(roomKey)) {
    presenceChannels.get(roomKey).unsubscribe()
  }

  const channel = supabase.channel(`presence:${roomKey}`, {
    config: { presence: { key: userInfo.id } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const online = Object.values(state).flat()
      onChange?.(online)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.debug(`[Presence] ${key} joined`)
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      console.debug(`[Presence] ${key} left`)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userInfo.id,
          username: userInfo.username,
          avatar_url: userInfo.avatar_url,
          online_at: new Date().toISOString(),
        })
      }
    })

  const handlers = {
    unsubscribe: async () => {
      await channel.untrack()
      supabase.removeChannel(channel)
      presenceChannels.delete(roomKey)
    },
  }

  presenceChannels.set(roomKey, handlers)
  return handlers
}

// ─────────────────────────────────────────────────────────────
// CONVERSATIONS — Fetch all conversation partners
// ─────────────────────────────────────────────────────────────
export async function fetchConversations(userId) {
  // Get latest message per room where user is involved
  const { data, error } = await supabase.rpc('get_user_conversations', {
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// SQL FUNCTION: get_user_conversations (add to schema.sql)
// ─────────────────────────────────────────────────────────────
// CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
// RETURNS TABLE (
//   room_id UUID, other_user_id UUID, other_username TEXT,
//   other_avatar TEXT, last_message TEXT, last_sent_at TIMESTAMPTZ,
//   unread_count BIGINT
// ) LANGUAGE sql STABLE SECURITY DEFINER AS $$
//   SELECT DISTINCT ON (m.room_id)
//     m.room_id,
//     CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
//     p.username, p.avatar_url,
//     m.content, m.created_at,
//     COUNT(*) FILTER (WHERE m2.is_read = FALSE AND m2.receiver_id = p_user_id) AS unread_count
//   FROM public.messages m
//   JOIN public.profiles p ON p.id =
//     CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END
//   LEFT JOIN public.messages m2 ON m2.room_id = m.room_id AND m2.receiver_id = p_user_id
//   WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
//   GROUP BY m.room_id, other_user_id, p.username, p.avatar_url, m.content, m.created_at
//   ORDER BY m.room_id, m.created_at DESC;
// $$;

// ─────────────────────────────────────────────────────────────
// REACT HOOK — useChat
// Place in /hooks/useChat.js
// ─────────────────────────────────────────────────────────────
/**
 * Example React hook usage:
 *
 * export function useChat(currentUserId, otherUserId) {
 *   const roomId = getRoomId(currentUserId, otherUserId)
 *   const [messages, setMessages] = useState([])
 *   const [isTyping, setIsTyping] = useState(false)
 *   const typingTimeout = useRef(null)
 *
 *   useEffect(() => {
 *     fetchMessages(roomId).then(setMessages)
 *
 *     const unsubChat = subscribeToChatRoom(roomId, currentUserId, {
 *       onNewMessage: (msg) => setMessages(prev => [...prev, msg]),
 *       onMessageRead: (msgId) => setMessages(prev =>
 *         prev.map(m => m.id === msgId ? { ...m, is_read: true } : m)
 *       ),
 *     })
 *
 *     const { sendTyping, unsubscribe: unsubTyping } = subscribeToTyping(
 *       roomId, currentUserId, (uid, typing) => setIsTyping(typing)
 *     )
 *
 *     return () => { unsubChat(); unsubTyping() }
 *   }, [roomId])
 *
 *   const handleSend = async (content) => {
 *     await sendMessage({ senderId: currentUserId, receiverId: otherUserId, content })
 *   }
 *
 *   const handleTyping = () => {
 *     sendTyping(true)
 *     clearTimeout(typingTimeout.current)
 *     typingTimeout.current = setTimeout(() => sendTyping(false), 2000)
 *   }
 *
 *   return { messages, isTyping, handleSend, handleTyping }
 * }
 */

export default supabase
