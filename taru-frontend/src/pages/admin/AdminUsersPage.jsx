import { useState, useEffect } from 'react'
import { Search, UserX, UserCheck } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Badge from '../../components/common/Badge.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatDate, getInitials } from '../../utils/formatters.jsx'
import { useDebounce } from '../../hooks/useDebounce.jsx'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const fetchUsers = (q = '') => {
    setIsLoading(true)
    adminAPI
      .getUsers(q ? { search: q } : {})
      .then((res) => setUsers(res.data.users || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchUsers(debouncedSearch) }, [debouncedSearch])

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      await adminAPI.updateUserStatus(user._id, { status: newStatus })
      toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`)
      fetchUsers(debouncedSearch)
    } catch { toast.error('Could not update user status.') }
  }

  const roleColors = { buyer: 'blue', seller: 'primary', admin: 'purple' }
  const statusColors = { ACTIVE: 'green', SUSPENDED: 'red' }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input-field pl-9 w-64"
            />
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Email', 'Role', 'Joined', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={6} />)
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{user.email}</td>
                    <td className="py-3 px-3">
                      <Badge variant={roleColors[user.role] || 'gray'}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={statusColors[user.status] || 'gray'}>{user.status}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                          user.status === 'ACTIVE'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? (
                          <><UserX className="h-3 w-3" /> Suspend</>
                        ) : (
                          <><UserCheck className="h-3 w-3" /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
