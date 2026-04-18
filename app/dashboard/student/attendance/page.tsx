'use client'

import { useEffect, useState } from 'react'

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-green-500',
  ABSENT: 'bg-red-500',
  LATE: 'bg-amber-400',
}

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/students/attendance')
      .then(r => r.json())
      .then(data => {
        setAttendance(data.data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const selected = selectedCourse ? attendance.find(a => a.courseId === selectedCourse) : null

  return (
<div className="max-w-5xl mx-auto">
  <div className="page-header">
    <div>
      <h1 className="page-title text-gray-900">Attendance</h1>
      <p className="text-sm text-gray-500">
        Your attendance across all enrolled courses
      </p>
    </div>
  </div>

  {/* Summary cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-2">
    {attendance.map((item: any) => {
      const isSelected = selectedCourse === item.courseId
      const pct = item.percentage
      const barColor =
        pct >= 75
          ? 'bg-green-500'
          : pct >= 60
          ? 'bg-amber-500'
          : 'bg-red-500'

      return (
        <button
          key={item.courseId}
          onClick={() => setSelectedCourse(isSelected ? null : item.courseId)}
          className={`text-left bg-white border rounded-xl p-4 card-hover transition-all
            ${
              isSelected
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-gray-200'
            }
            ${item.isBelowThreshold ? 'bg-red-50/40' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {item.courseName}
              </p>
              <p className="text-xs text-gray-500">{item.courseCode}</p>
            </div>

            <span
              className={`text-lg font-bold ml-2 flex-shrink-0
                ${
                  pct >= 75
                    ? 'text-green-600'
                    : pct >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
            >
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {item.attended} / {item.totalClasses} classes
            </span>

            {item.isBelowThreshold && (
              <span className="text-red-600 font-medium">
                Below 75%
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Prof: {item.professorName}
          </div>
        </button>
      )
    })}
  </div>

  {attendance.length === 0 && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p>No attendance records available</p>
    </div>
  )}

  {/* Detail panel */}
  {selected && (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">
            {selected.courseName}
          </h2>
          <p className="text-xs text-gray-500">
            {selected.courseCode} · Detailed record
          </p>
        </div>

        <button
          onClick={() => setSelectedCourse(null)}
          className="text-gray-500 hover:text-gray-900"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-gray-200 border-b border-gray-200">
        {[
          {
            label: 'Present',
            count: selected.records.filter((r: any) => r.status === 'PRESENT')
              .length,
            color: 'text-green-600',
          },
          {
            label: 'Absent',
            count: selected.records.filter((r: any) => r.status === 'ABSENT')
              .length,
            color: 'text-red-600',
          },
          {
            label: 'Late',
            count: selected.records.filter((r: any) => r.status === 'LATE')
              .length,
            color: 'text-amber-600',
          },
          {
            label: 'Total',
            count: selected.totalClasses,
            color: 'text-gray-900',
          },
        ].map((s) => (
          <div key={s.label} className="px-5 py-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Record list */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {selected.records.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">
            No records yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {[...selected.records]
              .sort(
                (a: any, b: any) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((record: any, idx: number) => {
                const date = new Date(record.date)

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          STATUS_STYLES[record.status]
                        }`}
                      />
                      <span className="text-sm text-gray-900">
                        {date.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {record.timeSlot}
                      </span>

                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          record.status === 'PRESENT'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'ABSENT'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )}
</div>
  )

}
