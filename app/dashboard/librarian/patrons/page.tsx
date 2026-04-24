'use client'

import { useEffect, useState } from 'react'

export default function PatronsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [patron, setPatron] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [showBlockForm, setShowBlockForm] = useState(false)

  const searchPatron = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setPatron(null)
    const res = await fetch(`/api/librarian/patrons?q=${encodeURIComponent(searchQuery)}`)
    const data = await res.json()
    setPatron(data.data || null)
    setLoading(false)
  }

  const toggleBlock = async () => {
    if (!patron) return
    if (!patron.libraryAccount?.isBlocked && !blockReason.trim()) {
      alert('Please enter a reason for blocking')
      return
    }
    setBlocking(true)
    const res = await fetch('/api/librarian/patrons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libraryAccountId: patron.libraryAccount.id,
        isBlocked: !patron.libraryAccount.isBlocked,
        blockReason: patron.libraryAccount.isBlocked ? null : blockReason,
      }),
    })
    if (res.ok) {
      setPatron((prev: any) => ({
        ...prev,
        libraryAccount: {
          ...prev.libraryAccount,
          isBlocked: !prev.libraryAccount.isBlocked,
          blockReason: prev.libraryAccount.isBlocked ? null : blockReason,
        },
      }))
      setShowBlockForm(false)
      setBlockReason('')
    }
    setBlocking(false)
  }

  const activeLoans = patron?.loans?.filter((l: any) => l.status === 'ACTIVE') || []
  const overdueLoans = activeLoans.filter((l: any) => new Date(l.dueDate) < new Date())
  const history = patron?.loans?.filter((l: any) => l.status === 'RETURNED') || []

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Patron Accounts</h1>
      <p className="text-sm text-gray-500">View and manage student library accounts</p>
    </div>
  </div>

  {/* Search */}
  <div className="flex gap-3 mb-6">
    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && searchPatron()}
      placeholder="Search by student name or college ID..."
      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900" />
    <button onClick={searchPatron} disabled={loading}
      className="px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
      {loading ? 'Searching...' : 'Search'}
    </button>
  </div>

  {patron && (
    <div className="space-y-5">
      {/* Account header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-2xl font-bold text-red-600">
              {patron.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{patron.name}</h2>
              <p className="text-sm text-gray-500">{patron.collegeId} · {patron.student?.department} · Sem {patron.student?.semester}</p>
              <p className="text-sm text-gray-500">{patron.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                patron.libraryAccount?.isBlocked 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {patron.libraryAccount?.isBlocked ? '⛔ Blocked' : '✓ Active'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Outstanding Fines</p>
            <p className={`text-xl font-bold ${patron.libraryAccount?.totalFines > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{patron.libraryAccount?.totalFines?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {patron.libraryAccount?.isBlocked && patron.libraryAccount?.blockReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-800">Block reason:</p>
            <p className="text-xs text-red-700">{patron.libraryAccount.blockReason}</p>
          </div>
        )}

        {/* Block/Unblock */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {patron.libraryAccount?.isBlocked ? (
            <button onClick={toggleBlock} disabled={blocking}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-all">
              {blocking ? 'Unblocking...' : 'Unblock Account'}
            </button>
          ) : (
            <>
              {showBlockForm ? (
                <div className="flex gap-3">
                  <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                    placeholder="Reason for blocking account..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
                  <button onClick={toggleBlock} disabled={blocking || !blockReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all">
                    {blocking ? 'Blocking...' : 'Confirm Block'}
                  </button>
                  <button onClick={() => setShowBlockForm(false)}
                    className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-500 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowBlockForm(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-all">
                  Block Account
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active loans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Active Loans
          <span className="ml-2 text-sm font-normal text-gray-500">({activeLoans.length})</span>
        </h2>
        {activeLoans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
            No books currently borrowed
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Book</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Checkout Date</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Due Date</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeLoans.map((loan: any) => {
                    const isOverdue = new Date(loan.dueDate) < new Date()
                    const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                    return (
                      <tr key={loan.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{loan.book?.title}</p>
                          <p className="text-xs text-gray-500">{loan.book?.isbn}</p>
                        </td>
                        <td className="text-center px-4 py-3 text-xs text-gray-500">
                          {new Date(loan.checkedOutAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className={`text-center px-4 py-3 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(loan.dueDate).toLocaleDateString('en-IN')}
                          {isOverdue && <span className="block">({daysOverdue}d overdue)</span>}
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                            isOverdue 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isOverdue ? `Overdue · ₹${daysOverdue * 2}` : 'On Time'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Borrowing history */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Borrowing History ({history.length})</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden">
            {history.map((loan: any) => (
              <div key={loan.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{loan.book?.title}</p>
                  <p className="text-xs text-gray-500">
                    Returned: {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>
                {loan.fineAmount > 0 && (
                  <span className={`text-xs font-medium ${loan.fineWaived ? 'text-green-600' : 'text-red-600'}`}>
                    {loan.fineWaived ? `Fine waived ₹${loan.fineAmount}` : `Fine: ₹${loan.fineAmount}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}

  {!patron && !loading && searchQuery && (
    <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p className="text-4xl mb-3">🔍</p>
      <p>No patron found for "{searchQuery}"</p>
    </div>
  )}

  {!searchQuery && !patron && (
    <div className="text-center py-16 text-gray-500 bg-white border border-dashed border-gray-200 rounded-xl">
      <p className="text-4xl mb-3">👤</p>
      <p>Search for a student to view their library account</p>
    </div>
  )}
</div>
  )
}
