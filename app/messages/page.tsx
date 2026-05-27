'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FileUpload from '@/app/components/FileUpload'
import { sendNotificationAction } from '@/app/actions/notifications'
import { 
  MessageSquare, 
  Send, 
  Check, 
  CheckCheck, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  FileText,
  Sparkles
} from 'lucide-react'

interface Message {
  id: string
  room_id: string
  sender_id: string
  receiver_id: string
  content: string
  attachments?: string[]
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
  const [attachments, setAttachments] = useState<string[]>([])
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
    if ((!newMessage.trim() && attachments.length === 0) || !currentUser || !activeConv || sending) return
    setSending(true)

    const roomId = getRoomId(currentUser.id, activeConv.other_user_id)

    await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: currentUser.id,
      receiver_id: activeConv.other_user_id,
      content: newMessage.trim(),
      attachments: attachments.length > 0 ? attachments : null,
    }).select().single()

    // Send real-time notification to receiver
    await sendNotificationAction(
      activeConv.other_user_id,
      'message',
      'رسالة جديدة 💬',
      `لديك رسالة جديدة بانتظارك.`,
      `/messages?user=${currentUser.id}`
    )

    setConversations(prev => prev.map(c =>
      c.other_user_id === activeConv.other_user_id
        ? { ...c, last_message: attachments.length > 0 && !newMessage.trim() ? '📎 مرفق' : newMessage.trim(), last_sent_at: new Date().toISOString() }
        : c
    ))

    setNewMessage('')
    setAttachments([])
    setSending(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col" dir="rtl" style={{ background: 'var(--bg)' }}>
      {/* ─── Topnav (Frosted Glass) ─── */}
      <nav className="topnav z-50 flex-shrink-0 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-display">
              خدمة<span className="text-accent">.dz</span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
            <span>لوحة التحكم</span>
            <ChevronLeft size={16} />
          </Link>
        </div>
      </nav>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto px-2 sm:px-6 py-2 sm:py-4 gap-2 sm:gap-4">
        {/* Conversation list — hidden on mobile when a chat is open */}
        <div className={`${activeConv ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-96 flex-shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-col overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <h2 className="font-bold text-slate-800 text-base">المحادثات</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm font-medium">لا توجد محادثات نشطة</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button key={conv.other_user_id} onClick={() => openConversation(conv)}
                  className={`w-full text-right flex items-center gap-3 p-4 hover:bg-slate-50/70 transition-all border-b border-slate-50 relative ${
                    activeConv?.other_user_id === conv.other_user_id 
                      ? 'bg-accent-soft/20 border-r-4 border-r-accent' 
                      : ''
                  }`}>
                  <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                    {conv.other_full_name?.charAt(0) || '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm truncate">{conv.other_full_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(conv.last_sent_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500 truncate leading-relaxed">
                        {conv.last_message || 'ابدأ المحادثة...'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/15 animate-pulse">
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

        {/* Chat area — full width on mobile */}
        <div className={`${!activeConv ? 'hidden sm:flex' : 'flex'} flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-col overflow-hidden`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50/20">
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">صندوق المحادثات</h3>
                <p className="text-slate-400 text-sm leading-relaxed">اختر محادثة من القائمة الجانبية أو ابدأ التواصل مع المستقلين والعملاء لتنسيق مشاريعك.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-xs z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button onClick={() => setActiveConv(null)} className="sm:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeConv.other_full_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{activeConv.other_full_name}</div>
                    <div className="text-xs text-accent font-mono">@{activeConv.other_username}</div>
                  </div>
                </div>
              </div>

              {/* Messages Viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fbfcfd]">
                {messages.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-slate-400 text-sm font-semibold">ابدأ المحادثة 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] sm:max-w-md md:max-w-lg px-4 py-2.5 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-[#0f172a] text-white rounded-tr-none shadow-sm' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
                        }`}>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-col gap-2 mb-2">
                              {msg.attachments.map((url, idx) => {
                                const fileName = url.split('/').pop() || `ملف ${idx + 1}`
                                const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null
                                return isImage ? (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-black/10 transition-all hover:opacity-90">
                                    <img src={url} alt="attachment" className="max-w-full h-auto object-cover" style={{ maxHeight: '200px' }} />
                                  </a>
                                ) : (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${isMe ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]" dir="ltr">{fileName}</span>
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                          <div className={`flex items-center gap-1.5 text-[10px] mt-1.5 ${isMe ? 'text-slate-300 justify-end' : 'text-slate-400 justify-start'}`}>
                            <span className="font-mono">{new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <span>
                                {msg.is_read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-teal-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col gap-2 relative z-10 flex-shrink-0">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-accent-soft text-accent px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-accent/15">
                        <span className="truncate max-w-[150px]" dir="ltr">{url.split('/').pop()}</span>
                        <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-accent hover:text-accent-hover transition-colors font-bold mr-1">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                    <FileUpload 
                      bucketName="attachments"
                      folderPath={`messages/${getRoomId(currentUser?.id, activeConv.other_user_id)}`}
                      onUploadComplete={(urls) => setAttachments(urls)}
                      variant="icon"
                      existingFiles={attachments}
                    />
                  </div>
                  <input type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="اكتب رسالة هنا..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-all text-slate-800"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }} />
                  <button onClick={sendMessage} disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                    className="w-11 h-11 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none shadow-md shadow-accent/10 flex-shrink-0">
                    <Send className="w-4.5 h-4.5 rotate-180" />
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
