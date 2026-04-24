'use client'

import { useEffect, useState } from 'react'

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  ON_LOAN: 'bg-amber-100 text-amber-700',
  REFERENCE_ONLY: 'bg-blue-100 text-blue-700',
  LOST: 'bg-red-100 text-red-700',
  DAMAGED: 'bg-orange-100 text-orange-700',
}

const defaultForm = { title: '', isbn: '', authors: '', publisher: '', edition: '', subject: '' }

export default function CatalogPage() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [editBook, setEditBook] = useState<any>(null)
  const [bulkCsv, setBulkCsv] = useState<File | null>(null)

  const searchBooks = async (q = searchQuery) => {
    setLoading(true)
    const res = await fetch(`/api/librarian/books?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setBooks(data.data || [])
    setLoading(false)
  }

  useEffect(() => { searchBooks('') }, [])

  const handleAdd = async () => {
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/librarian/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        authors: form.authors.split(',').map(a => a.trim()).filter(Boolean),
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setShowAdd(false)
      setForm(defaultForm)
      searchBooks('')
    } else {
      setAddError(data.error)
    }
    setAdding(false)
  }

  const handleStatusUpdate = async (bookId: string, status: string) => {
    await fetch('/api/librarian/books', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookId, status }),
    })
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status } : b))
  }

  const handleArchive = async (bookId: string) => {
    if (!confirm('Archive this book? It will be removed from active catalog.')) return
    await fetch('/api/librarian/books', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookId, isArchived: true }),
    })
    setBooks(prev => prev.filter(b => b.id !== bookId))
  }

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Book Catalog</h1>
      <p className="text-sm text-gray-500">Manage library collection</p>
    </div>
    <button onClick={() => setShowAdd(true)}
      className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Book
    </button>
  </div>

  {/* Search */}
  <div className="flex gap-3 mb-6">
    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && searchBooks()}
      placeholder="Search by title, author, ISBN, or subject..."
      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900" />
    <button onClick={() => searchBooks()} disabled={loading}
      className="px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
      {loading ? 'Searching...' : 'Search'}
    </button>
    <button onClick={() => searchBooks('')}
      className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
      Clear
    </button>
  </div>

  {/* Add Book Modal */}
  {showAdd && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Book</h2>
        <div className="space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Book title' },
            { key: 'isbn', label: 'ISBN *', placeholder: '9780123456789' },
            { key: 'authors', label: 'Author(s)', placeholder: 'Comma-separated authors' },
            { key: 'publisher', label: 'Publisher', placeholder: 'Publisher name' },
            { key: 'edition', label: 'Edition', placeholder: '3rd' },
            { key: 'subject', label: 'Subject', placeholder: 'e.g. Computer Science' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input type="text" value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
            </div>
          ))}
          {addError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => { setShowAdd(false); setAddError('') }}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={adding || !form.title || !form.isbn}
            className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
            {adding ? 'Adding...' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Books table */}
  {loading ? (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
    </div>
  ) : (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-500">{books.length} book{books.length !== 1 ? 's' : ''} found</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Book</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ISBN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {books.map((book: any) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.authors?.join(', ')}</p>
                  {book.edition && <p className="text-xs text-gray-500">{book.edition} ed.</p>}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{book.isbn}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{book.subject || '—'}</td>
                <td className="text-center px-4 py-3">
                  <select value={book.status}
                    onChange={e => handleStatusUpdate(book.id, e.target.value)}
                    disabled={book.status === 'ON_LOAN'}
                    className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500 disabled:cursor-default ${statusColors[book.status] || 'bg-gray-100 text-gray-600'}`}>
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="REFERENCE_ONLY">REFERENCE_ONLY</option>
                    <option value="LOST">LOST</option>
                    <option value="DAMAGED">DAMAGED</option>
                    {book.status === 'ON_LOAN' && <option value="ON_LOAN">ON_LOAN</option>}
                  </select>
                </td>
                <td className="text-center px-4 py-3">
                  <button onClick={() => handleArchive(book.id)}
                    disabled={book.status === 'ON_LOAN'}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Archive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {books.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-3xl mb-2">📚</p>
            <p>No books found</p>
          </div>
        )}
      </div>
    </div>
  )}
</div>
  )
}
