import { useState, useEffect } from 'react'
import { Shield, Search, RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Badge from '../../components/common/Badge.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatDateTime } from '../../utils/formatters.jsx'
import { useDebounce } from '../../hooks/useDebounce.jsx'

const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'gray',
  LOGOUT: 'gray',
  APPROVE: 'green',
  REJECT: 'red',
  SUSPEND: 'red',
  REFUND: 'purple',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const fetchLogs = (q = '') => {
    setIsLoading(true)
    adminAPI
      .getAuditLogs(q ? { search: q } : { limit: 50 })
      .then((res) => setLogs(res.data.logs || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchLogs(debouncedSearch) }, [debouncedSearch])

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-500" />
            Audit Logs
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="input-field pl-9 w-56"
              />
            </div>
            <button
              onClick={() => fetchLogs(debouncedSearch)}
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Timestamp', 'Actor', 'Action', 'Resource', 'Details'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => <TableRowSkeleton key={i} cols={5} />)
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 text-gray-700 max-w-[140px] truncate">
                      {log.actor?.name || log.actorId || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={ACTION_COLORS[log.action] || 'gray'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-600 max-w-[120px] truncate">
                      {log.resource}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs max-w-[200px] truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {logs.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing {logs.length} most recent log entries
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
