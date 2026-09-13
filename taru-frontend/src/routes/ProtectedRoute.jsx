import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/common/Spinner.jsx'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  // Still checking session on app load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Not logged in — redirect to login, remember where they were
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const redirectMap = {
      buyer: '/',
      seller: '/seller/dashboard',
      admin: '/admin/dashboard',
    }
    return <Navigate to={redirectMap[role] || '/'} replace />
  }

  return children
}
