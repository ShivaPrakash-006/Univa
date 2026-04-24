'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LibrarianDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/librarian/stats')
      .then(r => r.json())
      .then(data => { setStats(data.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Library Dashboard</h1>
    </div>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {[
      { label: 'Total Books', value: stats?.totalBooks || 0, color: 'text-blue-600' },
      { label: 'Available', value: stats?.available || 0, color: 'text-green-600' },
      { label: 'On Loan', value: stats?.onLoan || 0, color: 'text-amber-600' },
      { label: 'Overdue', value: stats?.overdue || 0, color: 'text-red-600' },
    ].map(s => (
      <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
        <p className="text-xs text-gray-500 mt-1">{s.label}</p>
      </div>
    ))}
  </div>

  {/* Quick Action Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {[
      { href: '/dashboard/librarian/circulation', label: 'Circulation Desk', desc: 'Check books in and out', icon: '📖', color: 'bg-amber-500' },
      { href: '/dashboard/librarian/catalog', label: 'Book Catalog', desc: 'Add and manage books', icon: '📚', color: 'bg-red-500' },
      { href: '/dashboard/librarian/patrons', label: 'Patron Accounts', desc: 'View student library records', icon: '👤', color: 'bg-red-600' },
    ].map(item => (
      <Link key={item.href} href={item.href}
        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-red-200 flex items-center gap-4">
        <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0 text-white`}>
          {item.icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
          <p className="text-xs text-gray-500">{item.desc}</p>
        </div>
      </Link>
    ))}
  </div>

  {/* Overdue Books Section */}
  {stats?.overdueList?.length > 0 && (
    <div>
      <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
        <span>⚠</span> Overdue Books
      </h2>
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50">
                <th className="text-left px-5 py-3 font-medium text-red-700">Book</th>
                <th className="text-left px-5 py-3 font-medium text-red-700">Student</th>
                <th className="text-center px-4 py-3 font-medium text-red-700">Due Date</th>
                <th className="text-center px-4 py-3 font-medium text-red-700">Days Overdue</th>
                <th className="text-center px-4 py-3 font-medium text-red-700">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {stats.overdueList.map((loan: any) => {
                const daysOverdue = Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={loan.id} className="hover:bg-red-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{loan.book?.title}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{loan.student?.user?.name}</p>
                      <p className="text-xs text-gray-500">{loan.student?.user?.collegeId}</p>
                     </td>
                    <td className="text-center px-4 py-3 text-red-600 font-medium">
                      {new Date(loan.dueDate).toLocaleDateString('en-IN')}
                     </td>
                    <td className="text-center px-4 py-3 text-red-600 font-bold">{daysOverdue}</td>
                    <td className="text-center px-4 py-3 text-red-600 font-semibold">₹{daysOverdue * 2}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
</div>
  )
}
