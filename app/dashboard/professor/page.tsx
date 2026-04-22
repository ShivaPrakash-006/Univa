'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfessorDashboard() {
  const [courses, setCourses] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/professors/courses').then(r => r.json()),
    ]).then(([userData, courseData]) => {
      setUser(userData.user)
      setCourses(courseData.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const totalStudents = courses.reduce((s: number, c: any) => s + (c._count?.enrollments || 0), 0)

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-sm text-gray-500">Professor Dashboard</p>
    </div>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Courses Teaching</p>
      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Total Students</p>
      <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Locked Grades</p>
      <p className="text-2xl font-bold text-amber-600">{courses.filter(c => c.gradeLocked).length}</p>
    </div>
  </div>

  {/* Quick Action Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    {[
      { href: '/dashboard/professor/attendance', label: 'Mark Attendance', desc: 'Record class attendance', icon: '✓', color: 'bg-green-500' },
      { href: '/dashboard/professor/grades', label: 'Manage Grades', desc: 'Enter and lock grades', icon: '📊', color: 'bg-red-500' },
    ].map(item => (
      <Link key={item.href} href={item.href}
        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-red-200 flex items-center gap-4">
        <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-xl text-white flex-shrink-0`}>
          {item.icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{item.label}</p>
          <p className="text-xs text-gray-500">{item.desc}</p>
        </div>
        <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    ))}
  </div>

  {/* My Courses Section */}
  <h2 className="text-lg font-semibold text-gray-900 mb-3">My Courses</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {courses.map((course: any) => (
      <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-red-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">{course.name}</p>
            <p className="text-xs text-gray-500">{course.code} · {course.credits} credits · {course.department}</p>
          </div>
          {course.gradeLocked && (
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
              🔒 Locked
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{course._count?.enrollments || 0} students enrolled</span>
          <span className="text-xs text-gray-500">{course.term?.name}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
          <Link href={`/dashboard/professor/attendance?course=${course.id}`}
            className="flex-1 text-center text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Attendance
          </Link>
          <Link href={`/dashboard/professor/grades?course=${course.id}`}
            className="flex-1 text-center text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Grades
          </Link>
        </div>
      </div>
    ))}
    {courses.length === 0 && (
      <div className="col-span-2 text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-xl">
        No courses assigned for this term
      </div>
    )}
  </div>
</div>
  )
}
