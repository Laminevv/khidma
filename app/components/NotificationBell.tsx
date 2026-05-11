'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/actions/notifications'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} د`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} س`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'أمس'
  return `منذ ${days} يوم`
}

function typeIcon(type: string) {
  const map: Record<string, string> = {
    new_proposal: '📋',
    proposal_accepted: '✅',
    contract_funded: '🔒',
    contract_completed: '🏆',
    payment_released: '💰',
    new_review: '⭐',
    new_message: '💬',
  }
  return map[type] || '🔔'
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount and periodically
  const fetchNotifs = async () => {
    const result = await getNotifications()
    setNotifications(result.notifications)
    setUnreadCount(result.unreadCount)
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setLoading(true)
      await fetchNotifs()
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-emerald-50 transition-colors group"
        aria-label="الإشعارات"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500 group-hover:text-emerald-600 transition-colors"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                قراءة الكل
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2 opacity-40">🔔</div>
                <p className="text-gray-400 text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const content = (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer ${
                      notif.is_read
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    }`}
                    onClick={() => {
                      if (!notif.is_read) handleMarkRead(notif.id)
                      if (notif.link) setIsOpen(false)
                    }}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                      notif.is_read ? 'bg-gray-100' : 'bg-emerald-100'
                    }`}>
                      {typeIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>

                    {/* Unread Dot */}
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                )

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
