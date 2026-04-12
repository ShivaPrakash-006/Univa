'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  type Stats = {
    students: number;
    professors: number;
    books: number;
    activeLoans: number;
    ordersToday: number;
    activeUsers: number;
    recentLogs?: unknown[];
  };

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.students || 0,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Professors',
      value: stats?.professors || 0,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Books in Library',
      value: stats?.books || 0,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Active Loans',
      color: 'text-red-600',
      bg: 'bg-red-100',   
      value: stats?.activeLoans || 0,
    },
    {
      label: 'Orders Today',
      value: stats?.ordersToday || 0,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers || 0,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];


  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration Panel</h1>
          <p className="text-sm text-gray-500">System overview and management</p>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(card => (
          <div
            key={card.label}
            className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            {/* Accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.bg} rounded-l-xl`} />

            <div className="pl-3">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>

          <div className="space-y-2">
            {[
              { href: '/dashboard/admin/users', label: 'Create New User Account'},
              { href: '/dashboard/admin/audit', label: 'View Audit Trail'},
              { href: '/dashboard/admin/terms', label: 'Manage Academic Terms'},
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all text-sm font-medium text-gray-800"
              >
                {action.label}
                <svg
                  className="w-4 h-4 text-gray-400 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}
