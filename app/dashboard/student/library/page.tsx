'use client'

import { useEffect, useState } from 'react'

export default function StudentLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [books, setBooks] = useState<any[]>([])
  const [myLoans, setMyLoans] = useState<any[]>([])
  const [libraryAccount, setLibraryAccount] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'mybooks'>('mybooks')

  useEffect(() => {
    fetch('/api/students/library')
      .then(r => r.json())
      .then(data => {
        setMyLoans(data.loans || [])
        setLibraryAccount(data.account)
      })
  }, [])

  const searchBooks = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    const res = await fetch(`/api/librarian/books?q=${encodeURIComponent(searchQuery)}`)
    const data = await res.json()
    setBooks(data.data || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    ON_LOAN: 'bg-amber-100 text-amber-700',
    REFERENCE_ONLY: 'bg-blue-100 text-blue-700',
    LOST: 'bg-red-100 text-red-700',
    DAMAGED: 'bg-orange-100 text-orange-700',
  }

  const activeLoans = myLoans.filter((l: any) => l.status === 'ACTIVE')
  const overdueLoans = activeLoans.filter((l: any) => new Date(l.dueDate) < new Date())

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-sm text-gray-500">Search catalog and manage your borrowings</p>
        </div>
        {libraryAccount && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Outstanding Fines</p>
            <p className={`text-2xl font-bold ${libraryAccount.totalFines > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{libraryAccount.totalFines.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Blocked warning */}
      {libraryAccount?.isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800">⛔ Library Account Blocked</p>
          <p className="text-xs text-red-700 mt-1">
            {libraryAccount.blockReason || 'Please contact the librarian.'}
          </p>
        </div>
      )}

      {/* Overdue warning */}
      {overdueLoans.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800">⚠ Overdue Books</p>
          <p className="text-xs text-amber-700 mt-1">
            You have {overdueLoans.length} overdue book{overdueLoans.length > 1 ? 's' : ''}. Return them soon to avoid additional fines.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {[
          { key: 'mybooks', label: `My Books (${activeLoans.length})` },
          { key: 'search', label: 'Search Catalog' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Books */}
      {activeTab === 'mybooks' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
              <p className="text-4xl mb-3">📚</p>
              <p>No books currently borrowed</p>
            </div>
          ) : (
            activeLoans.map((loan: any) => {
              const isOverdue = new Date(loan.dueDate) < new Date()
              const daysLeft = Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div
                  key={loan.id}
                  className={`bg-white border rounded-xl p-5 ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{loan.book?.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{loan.book?.authors?.join(', ')}</p>
                      <p className="text-xs text-gray-400">ISBN: {loan.book?.isbn}</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Active'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {isOverdue
                          ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
                          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Checked out: {new Date(loan.checkedOutAt).toLocaleDateString('en-IN')}</span>
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      Due: {new Date(loan.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {isOverdue && (
                    <p className="mt-2 text-xs text-red-600">
                      Estimated fine: ₹{Math.abs(daysLeft) * 2} ({Math.abs(daysLeft)} days × ₹2/day)
                    </p>
                  )}
                </div>
              )
            })
          )}

          {myLoans.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-semibold text-gray-500 mb-3">Borrowing History</h2>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {myLoans.map((loan: any) => (
                  <div key={loan.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{loan.book?.title}</p>
                      <p className="text-xs text-gray-500">
                        Returned: {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </div>
                    {loan.fineAmount > 0 && (
                      <span className="text-xs text-red-600">Fine: ₹{loan.fineAmount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Catalog */}
      {activeTab === 'search' && (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchBooks()}
              placeholder="Search by title, author, ISBN, or subject..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={searchBooks}
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {books.length > 0 && (
            <div className="space-y-3">
              {books.map((book: any) => (
                <div key={book.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.authors?.join(', ')}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        ISBN: {book.isbn}
                        {book.publisher && ` · ${book.publisher}`}
                        {book.edition && ` · ${book.edition} ed.`}
                        {book.subject && ` · ${book.subject}`}
                      </p>
                      {book.status === 'ON_LOAN' && book.loans?.[0] && (
                        <p className="text-xs text-amber-600 mt-1">
                          Expected return: {new Date(book.loans[0].dueDate).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <span className={`ml-4 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[book.status] || 'bg-gray-100 text-gray-600'}`}>
                      {book.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {books.length === 0 && searchQuery && !loading && (
            <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
              <p className="text-4xl mb-3">🔍</p>
              <p>No books found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

    </div>
  )

}
