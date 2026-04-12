'use client'

import { useEffect, useState } from 'react'

const roleColors: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  PROFESSOR: 'bg-emerald-100 text-emerald-700',
  LIBRARIAN: 'bg-amber-100 text-amber-700',
  COOK: 'bg-orange-100 text-orange-700',
  CANTEEN_SERVER: 'bg-pink-100 text-pink-700',
  ADMIN: 'bg-violet-100 text-violet-700',
}

const defaultForm = {
  collegeId: '', email: '', name: '', role: 'STUDENT', password: '',
  department: '', batch: '', semester: 1, programName: '', designation: '',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRole) params.set('role', filterRole)
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleUserStatus = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setShowCreate(false)
      setForm(defaultForm)
      fetchUsers()
    } else {
      setError(data.error)
    }
    setCreating(false)
  }

  return (
<div className="max-w-5xl mx-auto">

  {/* Header */}
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
    <p className="text-sm text-gray-500">
      Create, view, and manage all user accounts
    </p>
  </div>

  <button
    onClick={() => setShowCreate(true)}
    className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-150 shadow-md shadow-red-500/30"
  >
    New User
  </button>
</div>

  {/* Filters */}
  <div className="flex gap-3 mb-6">
    <input
      type="text"
      value={search}
      onChange={e => setSearch(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && fetchUsers()}
      placeholder="Search by name, ID, or email..."
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
    />

    <select
      value={filterRole}
      onChange={e => setFilterRole(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      <option value="">All roles</option>
      {['STUDENT','PROFESSOR','LIBRARIAN','COOK','CANTEEN_SERVER','ADMIN'].map(r => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>

    <button
      onClick={fetchUsers}
      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-700 transition-all"
    >
      Search
    </button>
  </div>

  {/* Modal */}
  {showCreate && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto shadow-lg">

        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Create New User
        </h2>

        <div className="space-y-3">

          {[
            { key: 'name', label: 'Full Name', type: 'text' },
            { key: 'collegeId', label: 'College ID', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Initial Password', type: 'password' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {['STUDENT','PROFESSOR','LIBRARIAN','COOK','CANTEEN_SERVER','ADMIN'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Student fields */}
          {form.role === 'STUDENT' && (
            <>
              <input
                placeholder="Department"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Program Name"
                value={form.programName}
                onChange={e => setForm(f => ({ ...f, programName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Batch (e.g. 2022-26)"
                value={form.batch}
                onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </>
          )}

          {/* Professor fields */}
          {form.role === 'PROFESSOR' && (
            <>
              <input
                placeholder="Department"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Designation"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setShowCreate(false); setError('') }}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </div>

      </div>
    </div>
  )}

  {/* Table */}
  {loading ? (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  ) : (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
            <th className="text-center px-4 py-3 font-medium text-gray-500">Last Login</th>
            <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {users.map((user: any) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">

              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.collegeId} · {user.email}
                </p>
              </td>

              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-700">
                  {user.role}
                </span>
              </td>

              <td className="text-center px-4 py-3 text-xs text-gray-500">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString('en-IN')
                  : 'Never'}
              </td>

              <td className="text-center px-4 py-3">
                <span className={`px-2 py-1 text-xs rounded-md ${
                  user.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>

              <td className="text-center px-4 py-3">
                <button
                  onClick={() => toggleUserStatus(user.id, user.isActive)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                    user.isActive
                      ? 'text-red-600 border-red-200 hover:bg-red-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found
        </div>
      )}

    </div>
  )}
</div>
  )

}
