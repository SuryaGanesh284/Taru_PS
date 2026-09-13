import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Store, Package, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import StatsCard from '../../components/seller/StatsCard.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminAPI.getUsers({ limit: 1 }),
      adminAPI.getPendingSellers(),
      adminAPI.getPendingProducts(),
    ])
      .then(([usersRes, sellersRes, productsRes]) => {
        setStats({
          pendingSellers: sellersRes.data.sellers?.length || 0,
          pendingProducts: productsRes.data.products?.length || 0,
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const quickLinks = [
    { to: '/admin/sellers', label: 'Review Seller Verifications', icon: Store, badge: stats?.pendingSellers },
    { to: '/admin/products', label: 'Moderate Pending Products', icon: Package, badge: stats?.pendingProducts },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/orders', label: 'View All Orders', icon: ShoppingBag },
    { to: '/admin/audit', label: 'Audit Logs', icon: AlertTriangle },
  ]

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Alert cards */}
          {(stats?.pendingSellers > 0 || stats?.pendingProducts > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.pendingSellers > 0 && (
                <Link to="/admin/sellers" className="card border-l-4 border-amber-400 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingSellers}</p>
                    <p className="text-sm text-gray-500">Sellers awaiting verification</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              )}
              {stats.pendingProducts > 0 && (
                <Link to="/admin/products" className="card border-l-4 border-blue-400 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingProducts}</p>
                    <p className="text-sm text-gray-500">Products awaiting moderation</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              )}
            </div>
          )}

          {/* Quick links */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Quick Access</h2>
            <div className="space-y-2">
              {quickLinks.map(({ to, label, icon: Icon, badge }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="bg-primary-50 p-2 rounded-lg">
                    <Icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
