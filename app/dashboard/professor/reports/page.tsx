'use client'

import { useEffect, useState } from 'react'

type ReportType = 'daily' | 'monthly' | 'semester'

export default function AttendanceReportsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [reportType, setReportType] = useState<ReportType>('semester')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/professors/courses').then(r => r.json()).then(d => setCourses(d.data || []))
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    fetch(`/api/professors/students?courseId=${selectedCourse}`)
      .then(r => r.json())
      .then(d => setStudents(d.data || []))
  }, [selectedCourse])

  const generateReport = async () => {
    if (!selectedCourse) return
    setLoading(true)

    const params = new URLSearchParams({ courseId: selectedCourse, type: reportType })
    if (reportType === 'daily') params.set('date', selectedDate)
    if (reportType === 'monthly') params.set('month', selectedMonth)

    const res = await fetch(`/api/professors/reports?${params}`)
    const data = await res.json()
    setReport(data.data)
    setLoading(false)
  }

  const exportCSV = () => {
    if (!report) return

    const rows = [['Student Name', 'College ID', 'Present', 'Absent', 'Late', 'Total', 'Percentage']]
    report.studentSummaries?.forEach((s: any) => {
      rows.push([s.name, s.collegeId, s.present, s.absent, s.late, s.total, `${s.percentage}%`])
    })

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${selectedCourse}_${reportType}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const course = courses.find(c => c.id === selectedCourse)

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
      <p className="text-sm text-gray-500">Generate and export attendance summaries</p>
    </div>
    {report && (
      <button onClick={exportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
    )}
  </div>

  {/* Controls */}
  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Report Type</label>
        <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900">
          <option value="semester">Semester Summary</option>
          <option value="monthly">Monthly</option>
          <option value="daily">Daily</option>
        </select>
      </div>

      {reportType === 'daily' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900" />
        </div>
      )}

      {reportType === 'monthly' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Month</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900" />
        </div>
      )}

      <div className={reportType === 'semester' ? 'md:col-start-4' : ''}>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">&nbsp;</label>
        <button onClick={generateReport} disabled={!selectedCourse || loading}
          className="w-full px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  </div>

  {/* Report output */}
  {report && (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Class Avg', value: `${report.classAverage}%`, color: report.classAverage >= 75 ? 'text-green-600' : 'text-red-600' },
          { label: 'Total Sessions', value: report.totalSessions, color: 'text-gray-900' },
          { label: 'Below 75%', value: report.belowThreshold, color: report.belowThreshold > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Students', value: report.studentSummaries?.length || 0, color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-student table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">
            {course?.name} — {reportType === 'daily' ? selectedDate : reportType === 'monthly' ? selectedMonth : 'Full Semester'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Student</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Present</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Absent</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Late</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">%</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.studentSummaries?.map((s: any) => (
                <tr key={s.studentId} className={`hover:bg-gray-50 ${s.percentage < 75 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.collegeId}</p>
                  </td>
                  <td className="text-center px-4 py-3 text-green-600 font-medium">{s.present}</td>
                  <td className="text-center px-4 py-3 text-red-600 font-medium">{s.absent}</td>
                  <td className="text-center px-4 py-3 text-amber-600 font-medium">{s.late}</td>
                  <td className="text-center px-4 py-3 text-gray-900">{s.total}</td>
                  <td className={`text-center px-4 py-3 font-bold ${s.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.percentage}%
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                      s.percentage < 75 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {s.percentage < 75 ? '⚠ Low' : '✓ Good'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* Empty/No Data State */}
  {selectedCourse && !loading && !report && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p>Click "Generate Report" to view attendance data</p>
    </div>
  )}
</div>
  )
}
