'use client'

import { useEffect, useState } from 'react'

export default function AuditPage() {
  type AuditLog = {
    id: string;
    action: string;
    entity: string;
    createdAt: string | Date;
    ipAddress?: string;
    user?: {
      name?: string;
      collegeId?: string;
    };
  };

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterEntity, setFilterEntity] = useState('')

  const fetchLogs = async (p = 1, entity = filterEntity) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '30' })
    if (entity) params.set('entity', entity)
    const res = await fetch(`/api/admin/audit?${params}`)
    const data = await res.json()
    setLogs(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const handleFilter = () => { setPage(1); fetchLogs(1) }

  return (
      <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500">
            Full system activity log — {total} entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All entities</option>
          {['User', 'Attendance', 'Grade', 'BookLoan', 'CanteenOrder'].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

          <table className="w-full text-sm">

            {/* Header */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Timestamp</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100">
              {(logs ?? []).map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>

                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {log.user?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.user?.collegeId}
                    </p>
                  </td>

                  <td className="px-5 py-3 text-xs font-mono text-gray-800">
                    {log.action}
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-700">
                      {log.entity}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.ipAddress || '—'}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} of {total}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  fetchLogs(p);
                }}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-all"
              >
                ← Prev
              </button>

              <button
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  fetchLogs(p);
                }}
                disabled={page * 30 >= total}
                className="px-3 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-all"
              >
                Next →
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )

}
