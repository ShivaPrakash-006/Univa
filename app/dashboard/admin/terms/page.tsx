'use client'

import { useEffect, useState } from 'react'

const defaultForm = { name: '', startDate: '', endDate: '', isActive: false }

export default function AcademicTermsPage() {
type Term = {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;

  _count?: {
    courses?: number;
    timetables?: number;
  };
};
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchTerms = async () => {
    const res = await fetch('/api/admin/terms')
    const data = await res.json()
    setTerms(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTerms() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError('All fields are required')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setShowAdd(false)
      setForm(defaultForm)
      fetchTerms()
    } else {
      setError(data.error)
    }
    setSaving(false)
  }

  const setActiveTerm = async (termId: string) => {
    await fetch('/api/admin/terms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: termId, isActive: true }),
    })
    fetchTerms()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
<div className="max-w-3xl mx-auto">

  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Academic Terms</h1>
      <p className="text-sm text-gray-500">
        Manage semesters and academic periods
      </p>
    </div>

    <button
      onClick={() => setShowAdd(true)}
      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Term
    </button>
  </div>

  {/* Modal */}
  {showAdd && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-lg">

        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Create Academic Term
        </h2>

        <div className="space-y-3">

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Term Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Odd Semester 2024-25"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-red-600"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Set as active term
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setShowAdd(false); setError('') }}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {saving ? 'Creating...' : 'Create Term'}
          </button>
        </div>

      </div>
    </div>
  )}

  {/* Terms List */}
  <div className="space-y-3">

    {terms.length === 0 && (
      <div className="text-center py-16 text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl">
        <p className="text-3xl mb-2">📅</p>
        <p>No academic terms defined yet</p>
      </div>
    )}

    {terms.map((term: Term) => (
      <div
        key={term.id}
        className={`bg-white border rounded-xl p-5 shadow-sm transition-all
          ${term.isActive
            ? 'border-red-500 ring-1 ring-red-200'
            : 'border-gray-200'
          }`}
      >
        <div className="flex items-start justify-between">

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {term.name}
              </h3>

              {term.isActive && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-red-100 text-red-700">
                  Active
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500">
              {new Date(term.startDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {' → '}
              {new Date(term.endDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {term._count?.courses ?? 0} courses · {term._count?.timetables ?? 0} timetable entries
            </p>
          </div>

          {!term.isActive && (
            <button
              onClick={() => setActiveTerm(term.id)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              Set Active
            </button>
          )}

        </div>
      </div>
    ))}

  </div>
</div>
  )

}
