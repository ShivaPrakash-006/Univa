'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration Panel</h1>
          <p className="text-sm text-muted-foreground">System overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="section-title">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/admin/users', label: 'Create New User Account', icon: '➕' },
              { href: '/dashboard/admin/audit', label: 'View Audit Trail', icon: '🔍' },
              { href: '/dashboard/admin/terms', label: 'Manage Academic Terms', icon: '📅' },
            ].map(action => (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted/50 transition-all text-sm font-medium text-foreground">
                <span>{action.icon}</span>
                {action.label}
                <svg className="w-4 h-4 text-muted-foreground ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
