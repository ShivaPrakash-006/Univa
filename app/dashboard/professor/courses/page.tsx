'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfessorCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/professors/courses')
      .then(r => r.json())
      .then(d => { setCourses(d.data || []); setLoading(false) })
  }, [])

  const loadStudents = async (courseId: string) => {
    setLoadingStudents(true)
    setSelectedCourse(courseId)
    const res = await fetch(`/api/professors/students?courseId=${courseId}`)
    const data = await res.json()
    setStudents(data.data || [])
    setLoadingStudents(false)
  }

  const searchStudents = async () => {
    if (!studentSearch.trim()) return
    const res = await fetch(`/api/professors/students?q=${encodeURIComponent(studentSearch)}`)
    const data = await res.json()
    setStudentResults(data.data || [])
  }

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const course = courses.find(c => c.id === selectedCourse)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
      <p className="text-sm text-gray-500">Enrolled students and course details</p>
    </div>
  </div>

  {/* Student search */}
  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
    <h2 className="text-sm font-semibold text-gray-900 mb-3">Search Student Profile</h2>
    <div className="flex gap-3">
      <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && searchStudents()}
        placeholder="Search by name or college ID..."
        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
      <button onClick={searchStudents}
        className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all">
        Search
      </button>
    </div>
    {studentResults.length > 0 && (
      <div className="mt-3 space-y-2">
        {studentResults.map((s: any) => (
          <div key={s.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">{s.user.name}</p>
                <p className="text-xs text-gray-500">{s.user.collegeId} · {s.department} · Sem {s.semester}</p>
              </div>
              <span className="text-xs text-gray-500">{s.programName}</span>
            </div>
            {s.grades?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.grades.map((g: any) => (
                  <span key={g.id} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700">
                    {g.course?.code}: {g.finalGrade || 'Pending'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Course list */}
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-0 flex-1">Courses ({filtered.length})</h2>
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter courses..."
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 w-36 text-gray-900" />
      </div>
      <div className="space-y-3">
        {filtered.map((course: any) => (
          <button key={course.id} onClick={() => loadStudents(course.id)}
            className={`w-full text-left bg-white border rounded-xl p-4 hover:shadow-md transition-all hover:border-red-200 ${
              selectedCourse === course.id 
                ? 'border-red-500 ring-1 ring-red-500' 
                : 'border-gray-200'
            }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{course.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{course.code} · {course.credits} credits · {course.department}</p>
                <p className="text-xs text-gray-500">{course.term?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{course._count?.enrollments || 0}</p>
                <p className="text-xs text-gray-500">students</p>
              </div>
            </div>
            {course.gradeLocked && (
              <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">🔒 Grades Locked</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm bg-white border border-gray-200 rounded-xl">
            No courses found
          </div>
        )}
      </div>
    </div>

    {/* Student roster */}
    <div>
      {selectedCourse && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Student Roster — {course?.code}
            <span className="ml-2 text-sm font-normal text-gray-500">({students.length} enrolled)</span>
          </h2>
          {loadingStudents ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No students enrolled</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {students.map((student: any, idx: number) => (
                    <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-xs font-semibold text-red-600 flex-shrink-0">
                        {student.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{student.user.name}</p>
                        <p className="text-xs text-gray-500">{student.user.collegeId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Link href={`/dashboard/professor/attendance?course=${selectedCourse}`}
              className="flex-1 text-center text-sm py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-all">
              Mark Attendance
            </Link>
            <Link href={`/dashboard/professor/grades?course=${selectedCourse}`}
              className="flex-1 text-center text-sm py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all">
              Manage Grades
            </Link>
          </div>
        </>
      )}

      {!selectedCourse && (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl flex items-center justify-center h-48">
          <p className="text-sm text-gray-500">Select a course to view roster</p>
        </div>
      )}
    </div>
  </div>
</div>
  )
}
