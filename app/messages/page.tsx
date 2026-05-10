'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  room_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  other_user_id: string
  other_username: string
  other_full_name: string
  last_message: string
  last_sent_at: string
  unread_count: number
}

function getRoomId(userA: string, userB: string) {
  const sorted = [userA, userB].sort()
  return `${sorted[0]}_${sorted[1]}`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `${mins}د`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}س`
  return `${Math.floor(hours / 24)}ي`
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setCurrentUser(user)

      const convs = await fetchConversations(user.id)

      if (targetUserId) {
        const existing = convs.find((c: Conversation) => c.other_user_id === targetUserId)
        if (existing) {
          openConversation(existing, user)
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .eq('id', targetUserId)
            .single()

          if (profile) {
            const newConv: Conversation = {
              other_user_id: profile.id,
              other_username: profile.username,
              other_full_name: profile.full_name || profile.username,
              last_message: '',
              last_sent_at: new Date().toISOString(),
              unread_count: 0,
            }
            setConversations(prev => [newConv, ...prev])
            openConversation(newConv, user)
          }
        }
      }

      setLoading(false)
    }
    init()
  }, [])

  const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id, username, full_name), receiver:profiles!receiver_id(id, username, full_name)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!msgs) return []

    const convMap = new Map<string, Conversation>()
    for (const msg of msgs) {
      const isMe = msg.sender_id === userId
      const otherId = isMe ? msg.receiver_id : msg.sender_id
      const otherProfile = isMe ? msg.receiver : msg.sender

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          other_user_id: otherId,
          other_username: otherProfile?.username || '',
          other_full_name: otherProfile?.full_name || otherProfile?.username || '',
          last_message: msg.content || '',
          last_sent_at: msg.created_at,
          unread_count: (!isMe && !msg.is_read) ? 1 : 0,
        })
      } else if (!isMe && !msg.is_read) {
        const conv = convMap.get(otherId)!
        convMap.set(otherId, { ...conv, unread_count: conv.unread_count + 1 })
      }
    }

    const result = Array.from(convMap.values())
    setConversations(result)
    return result
  }

  const openConversation = async (conv: Conversation, user?: any) => {
    const me = user || currentUser
    if (!me) return

    setActiveConv(conv)
    setMessages([])

    const roomId = getRoomId(me.id, conv.other_user_id)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('receiver_id', me.id)
      .eq('is_read', false)

    if (channelRef.current) supabase.removeChannel(channelRef.current)

    channelRef.current = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, ({ new: msg }) => {
        setMessages(prev => [...prev, msg as Message])
        if (msg.receiver_id === me.id) {
          supabase.from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', msg.id).then(() => {})
        }
      })
      .subscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !activeConv || sending) return
    setSending(true)

    const roomId = getRoomId(currentUser.id, activeConv.other_user_id)

    await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: currentUser.id,
      receiver_id: activeConv.other_user_id,
      content: newMessage.trim(),
    }).select().single()

    setConversations(prev => prev.map(c =>
      c.other_user_id === activeConv.other_user_id
        ? { ...c, last_message: newMessage.trim(), last_sent_at: new Date().toISOString() }
        : c
    ))

    setNewMessage('')
    setSending(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col" dir="rtl">
      <nav className="bg-white border-b border-gray-100 z-50 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← لوحة التحكم</Link>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto px-6 py-4 gap-4">
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">الرسائل</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-gray-400 text-sm">لا توجد محادثات بعد</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button key={conv.other_user_id} onClick={() => openConversation(conv)}
                  className={`w-full text-right flex items-center gap-3 p-4 hover:bg-gray-50 transition-all border-b border-gray-50 ${
                    activeConv?.other_user_id === conv.other_user_id ? 'bg-emerald-50' : ''
                  }`}>
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {conv.other_full_name?.charAt(0) || '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm truncate">{conv.other_full_name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.last_sent_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-400 truncate">{conv.last_message || 'ابدأ المحادثة...'}</p>
                      {conv.unread_count > 0 && (
                        <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-gray-500 font-medium">اختر محادثة للبدء</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {activeConv.other_full_name?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{activeConv.other_full_name}</div>
                  <div className="text-xs text-emerald-500">@{activeConv.other_username}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-300 text-sm">ابدأ المحادثة 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMe ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <span className="mr-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="اكتب رسالة..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }} />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                    className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
