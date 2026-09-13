import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import OrderStatusBadge from '../../components/buyer/OrderStatusBadge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Modal from '../../components/common/Modal.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchOrders = () => {
    setIsLoading(true)
    sellerAPI
      .getMyOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const openModal = (order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setTrackingNumber('')
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      if (newStatus === 'SHIPPED' && trackingNumber) {
        await sellerAPI.shipOrder(selectedOrder._id, { trackingNumber })
      } else {
        await sellerAPI.updateOrderStatus(selectedOrder._id, { status: newStatus })
      }
      toast.success('Order updated!')
      setSelectedOrder(null)
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order', 'Buyer', 'Items', 'Date', 'Amount', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3, 4].map((i) => <TableRowSkeleton key={i} cols={7} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10">
                      <EmptyState icon={Package} title="No orders yet" />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {order.buyer?.name || '—'}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {order.items?.length || 0}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {formatCurrency(order.totals?.total || 0)}
                      </td>
                      <td className="py-3 px-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => openModal(order)}
                          className="text-xs text-primary-600 hover:underline font-semibold"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Update Order #${selectedOrder?._id.slice(-6).toUpperCase()}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-field"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {newStatus === 'SHIPPED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Number
              </label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="input-field"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="btn-primary flex-1"
            >
              {isUpdating ? 'Updating...' : 'Update Order'}
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
