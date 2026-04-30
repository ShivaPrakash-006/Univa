'use client'

import { useEffect, useState } from 'react'

const defaultForm = { code: '', name: '', credits: '4', department: '', termId: '', professorId: '' }

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterTerm, setFilterTerm] = useState('')

  // Enrollment panel
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollResults, setEnrollResults] = useState<any[]>([])
  const [enrolling, setEnrolling] = useState(false)

  const fetchAll = async () => {
    const [coursesRes, termsRes, profsRes] = await Promise.all([
      fetch('/api/admin/courses').then(r => r.json()),
      fetch('/api/admin/terms').then(r => r.json()),
      fetch('/api/admin/users?role=PROFESSOR').then(r => r.json()),
    ])
    setCourses(coursesRes.data || [])
    setTerms(termsRes.data || [])
    setProfessors(profsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setShowAdd(false)
      setForm(defaultForm)
      fetchAll()
    } else {
      setError(data.error)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? This will also remove all enrollments, attendance, and grades.')) return
    await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' })
    setCourses(prev => prev.filter(c => c.id !== id))
    if (selectedCourse?.id === id) setSelectedCourse(null)
  }

  const openEnrollments = async (course: any) => {
    setSelectedCourse(course)
    const res = await fetch(`/api/professors/students?courseId=${course.id}`)
    const data = await res.json()
    setEnrolledStudents(data.data || [])
  }

  const searchStudents = async () => {
    if (!enrollSearch.trim()) return
    const res = await fetch(`/api/admin/users?role=STUDENT&q=${encodeURIComponent(enrollSearch)}`)
    const data = await res.json()
    // We need student records, not user records — fetch student IDs
    const studentsRes = await fetch(`/api/professors/students?q=${encodeURIComponent(enrollSearch)}`)
    const studentsData = await studentsRes.json()
    setEnrollResults(studentsData.data || [])
  }

  const enrollStudent = async (student: any) => {
    setEnrolling(true)
    await fetch('/api/admin/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, courseId: selectedCourse.id }),
    })
    setEnrolledStudents(prev => [...prev, student])
    setEnrolling(false)
  }

  const unenrollStudent = async (student: any) => {
    await fetch(`/api/admin/enrollments?studentId=${student.id}&courseId=${selectedCourse.id}`, { method: 'DELETE' })
    setEnrolledStudents(prev => prev.filter(s => s.id !== student.id))
  }

  const filtered = filterTerm ? courses.filter(c => c.termId === filterTerm) : courses

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-500">Create courses and manage student enrollments</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Course
        </button>
      </div>

      {/* Create modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Course</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Course Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. CS601"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Credits *</label>
                  <input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
                    min="1" max="6"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Course Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Database Management Systems"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Department *</label>
                <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Academic Term *</label>
                <select value={form.termId} onChange={e => setForm(f => ({ ...f, termId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white">
                  <option value="">Select term...</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isActive ? ' (Active)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assign Professor *</label>
                <select value={form.professorId} onChange={e => setForm(f => ({ ...f, professorId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white">
                  <option value="">Select professor...</option>
                  {professors.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.collegeId})</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAdd(false); setError('') }}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving || !form.code || !form.name || !form.termId || !form.professorId}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all">
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course list */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex-1">Courses ({filtered.length})</h2>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-500">
              <option value="">All terms</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map((course: any) => (
              <div key={course.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:border-red-200 ${selectedCourse?.id === course.id ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}
                onClick={() => openEnrollments(course)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{course.name}</p>
                      {course.gradeLocked && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">🔒</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{course.code} · {course.credits} credits · {course.department}</p>
                    <p className="text-xs text-gray-400">{course.professor?.user?.name} · {course.term?.name}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-lg font-bold text-red-600">{course._count?.enrollments || 0}</p>
                    <p className="text-xs text-gray-400">students</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={e => { e.stopPropagation(); handleDelete(course.id) }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white border border-dashed border-gray-200 rounded-xl text-sm">
                No courses found
              </div>
            )}
          </div>
        </div>

        {/* Enrollment panel */}
        <div>
          {selectedCourse ? (
            <>
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Enrollments — {selectedCourse.code}
                <span className="ml-2 text-sm font-normal text-gray-500">({enrolledStudents.length} students)</span>
              </h2>

              {/* Search to enroll */}
              <div className="flex gap-2 mb-4">
                <input type="text" value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchStudents()}
                  placeholder="Search student by name or ID..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                <button onClick={searchStudents}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all">
                  Search
                </button>
              </div>

              {/* Search results */}
              {enrollResults.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4 overflow-hidden">
                  {enrollResults.map((s: any) => {
                    const alreadyEnrolled = enrolledStudents.some(e => e.id === s.id)
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.user.name}</p>
                          <p className="text-xs text-gray-500">{s.user.collegeId}</p>
                        </div>
                        {alreadyEnrolled ? (
                          <span className="text-xs text-green-600 font-medium">Enrolled</span>
                        ) : 
                          <button onClick={() => enrollStudent(s)} disabled={enrolling}
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all">
                            Enroll
                          </button>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Enrolled students list */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {enrolledStudents.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No students enrolled yet</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {enrolledStudents.map((s: any, idx: number) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-xs font-semibold text-red-700 flex-shrink-0">
                          {s.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.user.name}</p>
                          <p className="text-xs text-gray-500">{s.user.collegeId}</p>
                        </div>
                        <button onClick={() => unenrollStudent(s)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl flex items-center justify-center h-48">
              <p className="text-sm text-gray-500">Click a course to manage enrollments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
