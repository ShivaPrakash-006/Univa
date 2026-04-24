'use client'

import { useEffect, useState } from 'react'

export default function CirculationPage() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'return' | 'dashboard'>('dashboard')
  const [activeLoans, setActiveLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Checkout form
  const [bookId, setBookId] = useState('')
  const [studentCollegeId, setStudentCollegeId] = useState('')
  const [checkoutResult, setCheckoutResult] = useState<any>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Return form
  const [loanId, setLoanId] = useState('')
  const [returnResult, setReturnResult] = useState<any>(null)
  const [waiveFine, setWaiveFine] = useState(false)
  const [waiveReason, setWaiveReason] = useState('')
  const [returning, setReturning] = useState(false)

  const fetchActiveLoans = async () => {
    const res = await fetch('/api/librarian/circulation/active')
    const data = await res.json()
    setActiveLoans(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchActiveLoans() }, [])

  const handleCheckout = async () => {
    if (!bookId || !studentCollegeId) return
    setCheckingOut(true)
    setCheckoutError('')
    setCheckoutResult(null)
    const res = await fetch('/api/librarian/circulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, studentCollegeId }),
    })
    const data = await res.json()
    if (res.ok) {
      setCheckoutResult(data.data)
      setBookId('')
      setStudentCollegeId('')
      fetchActiveLoans()
    } else {
      setCheckoutError(data.error)
    }
    setCheckingOut(false)
  }

  const handleReturn = async () => {
    if (!loanId) return
    setReturning(true)
    setReturnResult(null)
    const res = await fetch('/api/librarian/circulation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId, waiveFine, waiveReason }),
    })
    const data = await res.json()
    if (res.ok) {
      setReturnResult(data.data)
      setLoanId('')
      setWaiveFine(false)
      setWaiveReason('')
      fetchActiveLoans()
    }
    setReturning(false)
  }

  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date())

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Circulation Desk</h1>
      <p className="text-sm text-gray-500">Manage book checkouts and returns</p>
    </div>
    <div className="flex gap-3 text-sm">
      <span className="font-medium text-gray-900">{activeLoans.length} checked out</span>
      {overdueLoans.length > 0 && (
        <span className="text-red-600 font-medium">{overdueLoans.length} overdue</span>
      )}
    </div>
  </div>

  {/* Tabs */}
  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
    {[
      { key: 'dashboard', label: 'Active Loans' },
      { key: 'checkout', label: 'Check Out' },
      { key: 'return', label: 'Check In' },
    ].map(tab => (
      <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === tab.key 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-900'
        }`}>
        {tab.label}
      </button>
    ))}
  </div>

  {/* Active loans dashboard */}
  {activeTab === 'dashboard' && (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : activeLoans.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">📚</p>
          <p>No books currently checked out</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Book</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Student</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Checked Out</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Due Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Loan ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeLoans.map((loan: any) => {
                  const isOverdue = new Date(loan.dueDate) < new Date()
                  const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                  return (
                    <tr key={loan.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{loan.book?.title}</p>
                        <p className="text-xs text-gray-500">{loan.book?.isbn}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{loan.student?.user?.name}</p>
                        <p className="text-xs text-gray-500">{loan.student?.user?.collegeId}</p>
                      </td>
                      <td className="text-center px-4 py-3 text-gray-500 text-xs">
                        {new Date(loan.checkedOutAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className={`text-center px-4 py-3 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(loan.dueDate).toLocaleDateString('en-IN')}
                        {isOverdue && <span className="block text-red-500">{daysOverdue}d overdue</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                          isOverdue 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <button onClick={() => { setLoanId(loan.id); setActiveTab('return') }}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Return →
                        </button>
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
  )}

  {/* Checkout */}
  {activeTab === 'checkout' && (
    <div className="max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-0">Check Out Book</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Book ID</label>
          <input type="text" value={bookId} onChange={e => setBookId(e.target.value)}
            placeholder="Enter Book ID"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Student College ID</label>
          <input type="text" value={studentCollegeId} onChange={e => setStudentCollegeId(e.target.value)}
            placeholder="e.g. STU001"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
        </div>
        {checkoutError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{checkoutError}</p>
        )}
        {checkoutResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-green-800">✓ Book checked out successfully!</p>
            <p className="text-xs text-green-700 mt-1">Due date: {new Date(checkoutResult.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        )}
        <button onClick={handleCheckout} disabled={checkingOut || !bookId || !studentCollegeId}
          className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
          {checkingOut ? 'Processing...' : 'Check Out Book'}
        </button>
        <p className="text-xs text-gray-500">Default loan period: 14 days</p>
      </div>
    </div>
  )}

  {/* Return */}
  {activeTab === 'return' && (
    <div className="max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-0">Check In Book</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Loan ID</label>
          <input type="text" value={loanId} onChange={e => setLoanId(e.target.value)}
            placeholder="Enter Loan ID"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="waiveFine" checked={waiveFine} onChange={e => setWaiveFine(e.target.checked)} 
            className="w-4 h-4 accent-red-500" />
          <label htmlFor="waiveFine" className="text-sm text-gray-900">Waive overdue fine</label>
        </div>
        {waiveFine && (
          <input type="text" value={waiveReason} onChange={e => setWaiveReason(e.target.value)}
            placeholder="Reason for waiving fine (required)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
        )}
        {returnResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-green-800">✓ Book returned successfully!</p>
            {returnResult.overdueDays > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {returnResult.fineAmount > 0
                  ? `Fine applied: ₹${returnResult.fineAmount} (${returnResult.overdueDays} days × ₹2/day)`
                  : `Fine waived for ${returnResult.overdueDays} overdue day${returnResult.overdueDays !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        )}
        <button onClick={handleReturn} disabled={returning || !loanId || (waiveFine && !waiveReason)}
          className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
          {returning ? 'Processing...' : 'Return Book'}
        </button>
      </div>
    </div>
  )}
</div>
  )
}
