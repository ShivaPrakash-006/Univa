'use client'

import { useEffect, useState } from 'react'

export default function ProfessorGradesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [locking, setLocking] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/professors/courses').then(r => r.json()).then(d => setCourses(d.data || []))
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    Promise.all([
      fetch(`/api/professors/students?courseId=${selectedCourse}`).then(r => r.json()),
      fetch(`/api/professors/grades/list?courseId=${selectedCourse}`).then(r => r.json()),
    ]).then(([stuData, gradeData]) => {
      setStudents(stuData.data || [])
      const gradeMap: Record<string, any> = {}
      ;(gradeData.data || []).forEach((g: any) => { gradeMap[g.studentId] = g })
      setGrades(gradeMap)
      setLoading(false)
    })
  }, [selectedCourse])

  const updateGrade = (studentId: string, field: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value === '' ? null : parseFloat(value) || value },
    }))
  }

  const saveGrade = async (studentId: string) => {
    setSaving(studentId)
    const g = grades[studentId] || {}
    await fetch('/api/professors/grades', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        courseId: selectedCourse,
        internalMarks: g.internalMarks,
        midtermMarks: g.midtermMarks,
        practicalMarks: g.practicalMarks,
        endSemMarks: g.endSemMarks,
        finalGrade: g.finalGrade,
      }),
    })
    setSaving(null)
  }

  const lockGrades = async () => {
    if (!confirm('Lock grades for this course? Students will be able to see their results. This cannot be undone without admin approval.')) return
    setLocking(true)
    const res = await fetch('/api/professors/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: selectedCourse }),
    })
    if (res.ok) {
      setCourses(prev => prev.map(c => c.id === selectedCourse ? { ...c, gradeLocked: true } : c))
    }
    setLocking(false)
  }

  const course = courses.find(c => c.id === selectedCourse)
  const isLocked = course?.gradeLocked

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
      <p className="text-sm text-gray-500">Enter and manage student grades</p>
    </div>
    {selectedCourse && !isLocked && students.length > 0 && (
      <button onClick={lockGrades} disabled={locking}
        className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-all flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {locking ? 'Locking...' : 'Lock & Publish Grades'}
      </button>
    )}
  </div>

  {/* Course Selection */}
  <div className="mb-6">
    <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Course</label>
    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
      className="w-full md:w-80 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900">
      <option value="">Choose a course...</option>
      {courses.map((c: any) => (
        <option key={c.id} value={c.id}>
          {c.code} — {c.name} {c.gradeLocked ? '(Locked)' : ''}
        </option>
      ))}
    </select>
  </div>

  {/* Locked Warning Banner */}
  {isLocked && (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <p className="text-sm font-semibold text-amber-800">🔒 Grades are locked and published</p>
      <p className="text-xs text-amber-700 mt-1">Students can now see their results. Contact an administrator to make changes.</p>
    </div>
  )}

  {/* Grades Table */}
  {selectedCourse && !loading && students.length > 0 && (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500 min-w-48">Student</th>
              <th className="text-center px-3 py-3 font-medium text-gray-500 w-24">Internal<br/><span className="text-xs font-normal">/50</span></th>
              <th className="text-center px-3 py-3 font-medium text-gray-500 w-24">Midterm<br/><span className="text-xs font-normal">/50</span></th>
              <th className="text-center px-3 py-3 font-medium text-gray-500 w-24">Practical<br/><span className="text-xs font-normal">/50</span></th>
              <th className="text-center px-3 py-3 font-medium text-gray-500 w-24">End Sem<br/><span className="text-xs font-normal">/100</span></th>
              <th className="text-center px-3 py-3 font-medium text-gray-500 w-20">Grade</th>
              {!isLocked && <th className="text-center px-3 py-3 font-medium text-gray-500 w-20">Save</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student: any) => {
              const g = grades[student.id] || {}
              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{student.user.name}</p>
                    <p className="text-xs text-gray-500">{student.user.collegeId}</p>
                  </td>
                  {['internalMarks', 'midtermMarks', 'practicalMarks', 'endSemMarks'].map(field => (
                    <td key={field} className="px-3 py-3 text-center">
                      <input
                        type="number"
                        value={g[field] ?? ''}
                        onChange={e => updateGrade(student.id, field, e.target.value)}
                        disabled={isLocked}
                        min="0"
                        max={field === 'endSemMarks' ? 100 : 50}
                        className="w-20 text-center px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <select
                      value={g.finalGrade || ''}
                      onChange={e => updateGrade(student.id, 'finalGrade', e.target.value)}
                      disabled={isLocked}
                      className="w-20 text-center px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900">
                      <option value="">—</option>
                      {['O', 'A+', 'A', 'B+', 'B', 'C', 'F'].map(gr => (
                        <option key={gr} value={gr}>{gr}</option>
                      ))}
                    </select>
                  </td>
                  {!isLocked && (
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => saveGrade(student.id)} disabled={saving === student.id}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
                        {saving === student.id ? '...' : 'Save'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Loading State */}
  {loading && (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
    </div>
  )}

  {/* Empty State */}
  {selectedCourse && !loading && students.length === 0 && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p>No students enrolled in this course</p>
    </div>
  )}
</div>
  )
}
