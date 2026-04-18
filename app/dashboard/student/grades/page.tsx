'use client'

import { useEffect, useState } from 'react'

const gradeColors: Record<string, string> = {
  'O': 'bg-emerald-100 text-emerald-800',
  'A+': 'bg-green-100 text-green-800',
  'A': 'bg-blue-100 text-blue-800',
  'B+': 'bg-indigo-100 text-indigo-800',
  'B': 'bg-violet-100 text-violet-800',
  'C': 'bg-amber-100 text-amber-800',
  'F': 'bg-red-100 text-red-800',
}

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/students/grades')
      .then(r => r.json())
      .then(data => {
        setGrades(data.data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const lockedGrades = grades.filter(g => g.isLocked)
  const pendingGrades = grades.filter(g => !g.isLocked)

  const cgpa = lockedGrades.length
    ? (lockedGrades.reduce((s: number, g: any) => {
        const points: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 }
        return s + (points[g.finalGrade] || 0)
      }, 0) / lockedGrades.length).toFixed(2)
    : 'N/A'

    return(
<div className="max-w-4xl mx-auto">

  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Grades & Marks</h1>
      <p className="text-sm text-gray-500">Your academic performance</p>
    </div>

    <div className="text-right">
      <p className="text-xs text-gray-500">Current CGPA</p>
      <p className="text-3xl font-bold text-red-500">{cgpa}</p>
    </div>
  </div>

  {/* Published Results */}
  {lockedGrades.length > 0 && (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Published Results
      </h2>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">

          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="text-left px-5 py-3">Course</th>
              <th className="text-center px-4 py-3">Internal</th>
              <th className="text-center px-4 py-3">Midterm</th>
              <th className="text-center px-4 py-3">Practical</th>
              <th className="text-center px-4 py-3">End Sem</th>
              <th className="text-center px-4 py-3">Grade</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {lockedGrades.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50">

                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">
                    {g.course.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {g.course.code} · {g.course.credits} credits
                  </p>
                </td>

                <td className="text-center px-4 py-3">{g.internalMarks ?? '—'}</td>
                <td className="text-center px-4 py-3">{g.midtermMarks ?? '—'}</td>
                <td className="text-center px-4 py-3">{g.practicalMarks ?? '—'}</td>
                <td className="text-center px-4 py-3">{g.endSemMarks ?? '—'}</td>

                <td className="text-center px-4 py-3">
                  {g.finalGrade ? (
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        gradeColors[g.finalGrade] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {g.finalGrade}
                    </span>
                  ) : '—'}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )}

  {/* Pending */}
  {pendingGrades.length > 0 && (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Internal Marks (Pending Final Results)
      </h2>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">

          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="text-left px-5 py-3">Course</th>
              <th className="text-center px-4 py-3">Internal</th>
              <th className="text-center px-4 py-3">Midterm</th>
              <th className="text-center px-4 py-3">Practical</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {pendingGrades.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50">

                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">
                    {g.course.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {g.course.code}
                  </p>
                </td>

                <td className="text-center px-4 py-3">{g.internalMarks ?? '—'}</td>
                <td className="text-center px-4 py-3">{g.midtermMarks ?? '—'}</td>
                <td className="text-center px-4 py-3">{g.practicalMarks ?? '—'}</td>

                <td className="text-center px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-700">
                    Pending
                  </span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )}

  {/* Empty */}
  {grades.length === 0 && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p>No grade records found</p>
    </div>
  )}

</div>
    )

}
