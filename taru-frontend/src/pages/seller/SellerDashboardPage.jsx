import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, DollarSign, Star, PlusCircle, ArrowRight } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import StatsCard from '../../components/seller/StatsCard.jsx'
import OrderStatusBadge from '../../components/buyer/OrderStatusBadge.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'

export default function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    sellerAPI
      .getDashboard()
      .then((res) => setDashboard(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Link to="/seller/products/add" className="btn-primary flex items-center gap-2 text-sm">
              <PlusCircle className="h-4 w-4" /> Add Product
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[30vh]">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  title="Total Revenue"
                  value={formatCurrency(dashboard?.revenue?.total || 0)}
                  trend={dashboard?.revenue?.trend}
                  subtitle="vs last month"
                  icon={DollarSign}
                  color="green"
                />
                <StatsCard
                  title="Total Orders"
                  value={dashboard?.orders?.total || 0}
                  trend={dashboard?.orders?.trend}
                  subtitle="vs last month"
                  icon={ShoppingBag}
                  color="blue"
                />
                <StatsCard
                  title="Active Products"
                  value={dashboard?.products?.active || 0}
                  subtitle={`${dashboard?.products?.total || 0} total`}
                  icon={Package}
                  color="primary"
                />
                <StatsCard
                  title="Avg. Rating"
                  value={dashboard?.rating?.average?.toFixed(1) || '—'}
                  subtitle={`${dashboard?.rating?.total || 0} reviews`}
                  icon={Star}
                  color="amber"
                />
              </div>

              {/* Recent orders */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                  <Link
                    to="/seller/orders"
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {!dashboard?.recentOrders?.length ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No recent orders.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Order</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Buyer</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Date</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Amount</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentOrders.map((order) => (
                          <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium text-gray-800">
                              #{order._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {order.buyer?.name || '—'}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-900">
                              {formatCurrency(order.totals?.total || 0)}
                            </td>
                            <td className="py-3 px-3">
                              <OrderStatusBadge status={order.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
