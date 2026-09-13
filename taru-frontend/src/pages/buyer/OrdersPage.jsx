import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import OrderStatusBadge from '../../components/buyer/OrderStatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { OrderCardSkeleton } from '../../components/common/Skeleton.jsx'
import { orderAPI } from '../../api/orderAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'

const STATUS_TABS = ['All', 'Active', 'Delivered', 'Cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    orderAPI
      .getOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
    if (activeTab === 'Delivered') return o.status === 'DELIVERED'
    if (activeTab === 'Cancelled') return ['CANCELLED', 'PAYMENT_FAILED'].includes(o.status)
    return true
  })

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description={activeTab === 'All' ? "You haven't placed any orders yet." : `No ${activeTab.toLowerCase()} orders.`}
            action={
              <Link to="/products" className="btn-primary">
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Items preview */}
                <div className="flex gap-2 mb-3">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product?.title}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {formatCurrency(order.totals?.total || 0)}
                  </span>
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-sm text-primary-600 font-semibold hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
