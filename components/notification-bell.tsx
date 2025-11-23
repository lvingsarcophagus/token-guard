'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Bell, Trash2, Check } from 'lucide-react'
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let unsubscribe: (() => void) | null = null

    try {
      // Listen to notifications from top-level notifications collection
      const notificationsRef = collection(db, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Notification))

          setNotifications(notifs)
          setUnreadCount(notifs.filter(n => !n.read).length)
        },
        (error) => {
          // Handle permission errors gracefully
          console.warn('[Notifications] Permission denied or error:', error.code)
          // Set empty state on permission error
          setNotifications([])
          setUnreadCount(0)
        }
      )
    } catch (error) {
      console.warn('[Notifications] Failed to setup listener:', error)
      setNotifications([])
      setUnreadCount(0)
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe()
        } catch (error) {
          // Silently handle cleanup errors
          console.warn('[Notifications] Cleanup error:', error)
        }
      }
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const clearAll = async () => {
    try {
      await Promise.all(
        notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)))
      )
      setShowDropdown(false)
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  if (!user) return null

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'tier_upgrade':
        return { border: 'border-l-4 border-green-500', bg: 'bg-green-500/5 hover:bg-green-500/10' }
      case 'tier_downgrade':
        return { border: 'border-l-4 border-orange-500', bg: 'bg-orange-500/5 hover:bg-orange-500/10' }
      case 'warning':
        return { border: 'border-l-4 border-red-500', bg: 'bg-red-500/5 hover:bg-red-500/10' }
      default:
        return { border: 'border-l-4 border-blue-500', bg: 'bg-blue-500/5 hover:bg-blue-500/10' }
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 group"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-[70] max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-black/80 border-b border-white/20 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-mono text-sm font-bold tracking-wider">
                NOTIFICATIONS
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-white/60 hover:text-white font-mono transition-colors"
                    title="Mark all as read"
                  >
                    ✓ READ
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-white/60 hover:text-white font-mono transition-colors"
                    title="Clear all"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 font-mono text-xs">
                NO NOTIFICATIONS
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notif) => {
                  const style = getNotificationStyle(notif.type)
                  return (
                    <div
                      key={notif.id}
                      className={`${style.border} ${style.bg} p-4 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`font-mono text-sm font-bold line-clamp-1 ${
                          !notif.read ? 'text-white' : 'text-white/70'
                        }`}>
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-white/60 font-mono text-xs mb-2 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-white/40 font-mono text-[10px] mb-3">
                        {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-white/60 hover:text-white hover:bg-white/10 rounded transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                            <span>READ</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>DELETE</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
