'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: string
  userName: string
  collegeId: string
  navItems: NavItem[]
}

export default function Sidebar({ role, userName, collegeId, navItems }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const roleStyles = {
    STUDENT: 'bg-gray-500',
    PROFESSOR: 'bg-orange-500',
    LIBRARIAN: 'bg-yellow-500',
    COOK: 'bg-orange-600',
    CANTEEN_SERVER: 'bg-orange-400',
    ADMIN: 'bg-red-600',
  };

  const roleLabels = {
    STUDENT: 'Student',
    PROFESSOR: 'Professor',
    LIBRARIAN: 'Librarian',
    COOK: 'Cook',
    CANTEEN_SERVER: 'Canteen Server',
    ADMIN: 'Administrator',
  };

  return (
    <aside className="w-64 h-screen flex-shrink-0 bg-gray-900 text-white border-r border-gray-800 flex flex-col overflow-hidden ">

      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0"> {/* Add min-w-0 */}
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="font-bold text-lg truncate">Univa</span>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 ... flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1"> {/* Add flex-1 and min-w-0 */}
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate"> {/* Add truncate */}
              {collegeId} · {roleLabels[role as keyof typeof roleLabels]}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="flex-shrink-0">{item.icon}</span> {/* Add flex-shrink-0 */}
              <span className="truncate">{item.label}</span> {/* Wrap label in span with truncate */}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>

    </aside>
  );
}
