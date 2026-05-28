'use client'

import { useState, useEffect } from 'react'
import { getDisputeMessagesAction, sendDisputeMessageAction } from '@/app/actions/disputes'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface DisputeMessage {
  id: string
  message: string
  created_at: string
  sender_id: string
  sender: { username: string; full_name: string; is_admin: boolean; avatar_url: string | null }
}

export default function DisputeChatModal({ disputeId, onClose, currentUserId }: { disputeId: string, onClose: () => void, currentUserId: string }) {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<DisputeMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    const res = await getDisputeMessagesAction(disputeId)
    if (res.success) setMessages(res.messages || [])
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const msg = newMessage
    setNewMessage('')
    const res = await sendDisputeMessageAction(disputeId, msg)
    if (res.success && res.message) {
      setMessages(prev => [...prev, res.message as DisputeMessage])
    } else {
      alert(t('errors.generic'))
      setNewMessage(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl h-[80vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl ltr:text-left rtl:text-right" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">⚖️</span> {t('contracts.disputeChat.title')}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{t('contracts.disputeChat.description')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
          {loading ? (
            <div className="text-center text-gray-500 text-sm mt-10">...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10">💬</div>
          ) : (
            messages.map(msg => {
              const isAdmin = msg.sender.is_admin
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-center my-6' : isMe ? 'items-end' : 'items-start'}`}>
                  {isAdmin ? (
                    <div className="bg-red-50 border border-red-100 text-red-800 px-5 py-3 rounded-2xl text-center max-w-[90%] shadow-sm">
                      <div className="text-xs font-bold text-red-600 mb-1 flex items-center justify-center gap-1">
                        <span>🛡️</span> {t('contracts.disputeChat.admin')}
                      </div>
                      <div className="text-sm font-medium">{msg.message}</div>
                    </div>
                  ) : (
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe ? 'bg-emerald-500 text-white ltr:rounded-tl-sm rtl:rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 ltr:rounded-tr-sm rtl:rounded-tl-sm'
                    }`}>
                      {!isMe && <div className="text-xs text-gray-500 font-bold mb-1">{msg.sender.full_name}</div>}
                      <div className="text-sm leading-relaxed">{msg.message}</div>
                      <div className={`text-[10px] mt-1 text-left ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={t('contracts.disputeChat.typeMessage')}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors ltr:text-left rtl:text-right"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-emerald-500 text-white px-5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
            >
              {t('contracts.disputeChat.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
