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
    recentLogs: AuditLog[];
  };

  type AuditLog = {
    id: string;
    action: string;
    entity: string;
    createdAt: string; // or Date depending on API
    user?: {
      name?: string;
    };
  };

  const [stats, setStats] = useState<Stats>({
    students: 0,
    professors: 0,
    books: 0,
    activeLoans: 0,
    ordersToday: 0,
    activeUsers: 0,
    recentLogs: [],
  })
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

        {/* Audit Logs */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Audit Logs</h2>

          {stats?.recentLogs?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentLogs.map((log: AuditLog) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.user?.name} · {log.entity}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent activity
            </p>
          )}

          <Link
            href="/dashboard/admin/audit"
            className="text-xs text-red-600 hover:text-red-700 font-medium mt-3 block"
          >
            View full audit trail →
          </Link>
        </div>
      </div>
    </div>
  )
}
