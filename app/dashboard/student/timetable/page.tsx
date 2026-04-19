'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COLOR_PALETTE = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
]

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(new Date().getDay()) // 0=Sun,1=Mon,...

  useEffect(() => {
    fetch('/api/students/timetable')
      .then(r => r.json())
      .then(data => {
        setTimetable(data.data || [])
        setLoading(false)
      })
  }, [])

  // Build course → color map
  const courseColors: Record<string, string> = {}
  const uniqueCourses = [...new Set(timetable.map(t => t.courseId))]
  uniqueCourses.forEach((id, i) => {
    courseColors[id as string] = COLOR_PALETTE[i % COLOR_PALETTE.length]
  })

  // Group by day (0=Mon … 6=Sun in schema)
  const byDay: Record<number, any[]> = {}
  for (let i = 0; i <= 5; i++) byDay[i] = []
  timetable.forEach(slot => {
    if (byDay[slot.dayOfWeek] !== undefined) byDay[slot.dayOfWeek].push(slot)
  })

  // Today's index in our 0=Mon scheme
  const todayIdx = today === 0 ? 6 : today - 1

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )

  return(
<div className="max-w-5xl mx-auto">

  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
      <p className="text-sm text-gray-500">
        Current semester class schedule
      </p>
    </div>

    <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
      Today: {DAYS[todayIdx] || 'Weekend'}
    </span>
  </div>

  {/* Course legend */}
  {uniqueCourses.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-6">
      {uniqueCourses.map((courseId: any) => {
        const slot = timetable.find(t => t.courseId === courseId)

        return (
          <span
            key={courseId}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${courseColors[courseId]}`}
          >
            {slot?.course?.code} — {slot?.course?.name}
          </span>
        )
      })}
    </div>
  )}

  {/* Days */}
  <div className="space-y-4">
    {DAYS.map((day, dayIdx) => {
      const slots = byDay[dayIdx] || []
      const isToday = dayIdx === todayIdx

      return (
        <div
          key={day}
          className={`bg-white border rounded-xl overflow-hidden ${
            isToday
              ? 'border-red-300 shadow-sm'
              : 'border-gray-200'
          }`}
        >

          {/* Day header */}
          <div
            className={`px-5 py-3 flex items-center justify-between ${
              isToday ? 'bg-red-50' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  isToday ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {day}
              </span>

              {isToday && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            <span className="text-xs text-gray-500">
              {slots.length} class{slots.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {/* Slots */}
          {slots.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-500">
              No classes scheduled
            </div>
          ) : (
            <div className="p-3 flex flex-wrap gap-3">

              {slots
                .sort((a: any, b: any) =>
                  a.startTime.localeCompare(b.startTime)
                )
                .map((slot: any) => (
                  <div
                    key={slot.id}
                    className={`flex-shrink-0 border rounded-xl p-3 min-w-48 ${courseColors[slot.courseId]}`}
                  >

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">
                        {slot.startTime} – {slot.endTime}
                      </span>

                      {slot.room && (
                        <span className="text-xs text-gray-600">
                          {slot.room}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {slot.course?.name}
                    </p>

                    <p className="text-xs text-gray-600 mt-0.5">
                      {slot.course?.code}
                    </p>

                    <p className="text-xs text-gray-500">
                      {slot.course?.professor?.user?.name}
                    </p>

                  </div>
                ))}

            </div>
          )}
        </div>
      )
    })}
  </div>

  {/* Empty */}
  {timetable.length === 0 && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl mt-4">
      <p>No timetable entries found for this semester</p>
    </div>
  )}

</div>
  )

}
