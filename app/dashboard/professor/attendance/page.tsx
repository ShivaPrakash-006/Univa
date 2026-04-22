'use client'

import { useEffect, useState } from 'react'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'

export default function MarkAttendancePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/professors/courses')
      .then(r => r.json())
      .then(data => setCourses(data.data || []))
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    fetch(`/api/professors/students?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(data => {
        const studentList = data.data || []
        setStudents(studentList)
        // Default all to PRESENT
        const defaults: Record<string, AttendanceStatus> = {}
        studentList.forEach((s: any) => { defaults[s.id] = 'PRESENT' })
        setAttendance(defaults)
        setLoading(false)
      })
  }, [selectedCourse])

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {}
    students.forEach(s => { all[s.id] = status })
    setAttendance(all)
  }

  const handleSave = async () => {
    if (!selectedCourse || !selectedDate || !timeSlot) {
      alert('Please select course, date, and time slot')
      return
    }
    setSaving(true)
    const records = students.map(s => ({ studentId: s.id, status: attendance[s.id] || 'ABSENT' }))
    const res = await fetch('/api/professors/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: selectedCourse, date: selectedDate, timeSlot, records }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else alert('Failed to save attendance')
  }

  const presentCount = Object.values(attendance).filter(v => v === 'PRESENT').length
  const absentCount = Object.values(attendance).filter(v => v === 'ABSENT').length
  const lateCount = Object.values(attendance).filter(v => v === 'LATE').length

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
      <p className="text-sm text-gray-500">Record student attendance for your classes</p>
    </div>
  </div>

  {/* Controls */}
  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Course</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900">
          <option value="">Select course...</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Time Slot</label>
        <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900">
          <option value="">Select slot...</option>
          {['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'].map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
      </div>
    </div>
  </div>

  {selectedCourse && students.length > 0 && (
    <>
      {/* Summary + bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">✓ Present: {presentCount}</span>
          <span className="text-red-600 font-medium">✗ Absent: {absentCount}</span>
          <span className="text-amber-600 font-medium">~ Late: {lateCount}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll('PRESENT')} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all">All Present</button>
          <button onClick={() => markAll('ABSENT')} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">All Absent</button>
        </div>
      </div>

      {/* Student list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Student</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">ID</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student: any, idx: number) => {
                const status = attendance[student.id] || 'ABSENT'
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-xs font-semibold text-red-600">
                          {student.user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{student.user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{student.user.collegeId}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {(['PRESENT', 'ABSENT', 'LATE'] as AttendanceStatus[]).map(s => (
                          <button key={s} onClick={() => setStatus(student.id, s)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                              status === s
                                ? s === 'PRESENT' 
                                  ? 'bg-green-500 text-white border-green-500'
                                  : s === 'ABSENT' 
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-amber-500 text-white border-amber-500'
                                : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                            }`}>
                            {s === 'PRESENT' ? 'P' : s === 'ABSENT' ? 'A' : 'L'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {saved && <span className="text-sm text-green-600 flex items-center gap-1">✓ Attendance saved!</span>}
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </>
  )}

  {selectedCourse && loading && (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
    </div>
  )}

  {selectedCourse && !loading && students.length === 0 && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p>No students enrolled in this course</p>
    </div>
  )}
</div>
  )
}
