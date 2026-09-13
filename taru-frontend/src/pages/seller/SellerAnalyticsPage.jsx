import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, DollarSign, Star, Users } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import StatsCard from '../../components/seller/StatsCard.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'

export default function SellerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    sellerAPI
      .getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Revenue"
                  value={formatCurrency(analytics?.revenue?.total || 0)}
                  trend={analytics?.revenue?.monthlyGrowth}
                  subtitle="all time"
                  icon={DollarSign}
                  color="green"
                />
                <StatsCard
                  title="Orders"
                  value={analytics?.orders?.total || 0}
                  trend={analytics?.orders?.monthlyGrowth}
                  subtitle="all time"
                  icon={ShoppingBag}
                  color="blue"
                />
                <StatsCard
                  title="Unique Buyers"
                  value={analytics?.buyers?.unique || 0}
                  subtitle="all time"
                  icon={Users}
                  color="purple"
                />
                <StatsCard
                  title="Avg. Rating"
                  value={analytics?.rating?.average?.toFixed(1) || '—'}
                  subtitle={`${analytics?.rating?.total || 0} reviews`}
                  icon={Star}
                  color="amber"
                />
              </div>

              {/* Monthly revenue table */}
              {analytics?.monthlyRevenue?.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary-500" />
                    Monthly Revenue
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Month</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Revenue</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.monthlyRevenue.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2.5 px-3 text-gray-800 font-medium">{row.month}</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{formatCurrency(row.revenue)}</td>
                            <td className="py-2.5 px-3 text-gray-600">{row.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top products */}
              {analytics?.topProducts?.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products</h2>
                  <div className="space-y-3">
                    {analytics.topProducts.map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                        <img
                          src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={item.product?.title}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.product?.title}
                          </p>
                          <p className="text-xs text-gray-400">{item.soldCount} sold</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
