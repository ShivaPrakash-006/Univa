'use client'

import { useEffect, useState, useRef } from 'react'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifications(d.data || []))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={!n.isRead ? '' : 'ml-3.5'}>
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
