'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/students/attendance').then(r => r.json()),
    ]).then(([userData, attData]) => {
      setUser(userData.user)
      setAttendance(attData.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const avgAttendance = attendance.length
    ? Math.round(attendance.reduce((s: number, a: any) => s + a.percentage, 0) / attendance.length)
    : 0

  const belowThreshold = attendance.filter((a: any) => a.isBelowThreshold).length

  return (
<div className="max-w-5xl mx-auto">

  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        Here's your academic snapshot
      </p>
    </div>

    <div className="text-right">
      <p className="text-sm font-medium text-gray-700">Wallet Balance</p>
      <p className="text-2xl font-bold text-red-500">
        ₹{user?.walletBalance?.toFixed(2)}
      </p>
    </div>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500">Courses</p>
      <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500">Avg Attendance</p>
      <p className={`text-2xl font-bold ${avgAttendance < 75 ? 'text-red-600' : 'text-green-600'}`}>
        {avgAttendance}%
      </p>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500">Below 75%</p>
      <p className={`text-2xl font-bold ${belowThreshold > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
        {belowThreshold}
      </p>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500">Wallet</p>
      <p className="text-2xl font-bold text-gray-900">
        ₹{user?.walletBalance || 0}
      </p>
    </div>

  </div>

  {/* Quick Links */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {[
      { href: '/dashboard/student/canteen', label: 'Order Food', desc: 'Browse canteen menu' },
      { href: '/dashboard/student/library', label: 'Library', desc: 'Search & manage books' },
      { href: '/dashboard/student/fees', label: 'Pay Fees', desc: 'View & pay dues' },
    ].map(item => (
      <Link
        key={item.href}
        href={item.href}
        className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-all"
      >
        <div>
          <p className="font-semibold text-gray-900">{item.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
        </div>

        <span className="text-red-500 text-xl">→</span>
      </Link>
    ))}
  </div>

  {/* Warning */}
  {belowThreshold > 0 && (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <p className="text-sm font-semibold text-red-800">Attendance Warning</p>
      <p className="text-xs text-red-700 mt-1">
        You are below 75% attendance in {belowThreshold} subject{belowThreshold > 1 ? 's' : ''}.
        <Link href="/dashboard/student/attendance" className="underline ml-1">
          View details →
        </Link>
      </p>
    </div>
  )}

  {/* Table */}
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">
        Course Attendance Summary
      </h2>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        <thead>
          <tr className="bg-gray-100 text-gray-600">
            <th className="text-left px-5 py-3">Course</th>
            <th className="text-center px-4 py-3">Present</th>
            <th className="text-center px-4 py-3">Total</th>
            <th className="text-center px-4 py-3">%</th>
            <th className="text-center px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {attendance.map((item: any) => (
            <tr key={item.courseId} className="hover:bg-gray-50">

              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{item.courseName}</p>
                <p className="text-xs text-gray-500">{item.courseCode}</p>
              </td>

              <td className="text-center px-4 py-3">{item.attended}</td>
              <td className="text-center px-4 py-3">{item.totalClasses}</td>

              <td className={`text-center px-4 py-3 font-semibold ${item.isBelowThreshold ? 'text-red-600' : 'text-green-600'}`}>
                {item.percentage}%
              </td>

              <td className="text-center px-4 py-3">
                <span className={`px-2 py-1 text-xs rounded-md ${
                  item.isBelowThreshold
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {item.isBelowThreshold ? 'Low' : 'Good'}
                </span>
              </td>

            </tr>
          ))}

          {attendance.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                No attendance records found
              </td>
            </tr>
          )}

        </tbody>
      </table>
    </div>
  </div>

</div>
  )

}
