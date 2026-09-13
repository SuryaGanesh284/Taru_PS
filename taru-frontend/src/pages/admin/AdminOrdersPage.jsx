import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import OrderStatusBadge from '../../components/buyer/OrderStatusBadge.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import Modal from '../../components/common/Modal.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'
import { useDebounce } from '../../hooks/useDebounce.jsx'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    setIsLoading(true)
    adminAPI
      .getAllOrders(debouncedSearch ? { search: debouncedSearch } : {})
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [debouncedSearch])

  const handleRefund = async () => {
    setIsRefunding(true)
    try {
      await adminAPI.processRefund({
        orderId: selectedOrder._id,
        amount: Number(refundAmount),
        reason: refundReason,
      })
      toast.success('Refund processed successfully.')
      setSelectedOrder(null)
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Refund failed.')
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="input-field pl-9 w-64"
            />
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order ID', 'Buyer', 'Seller', 'Date', 'Amount', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={7} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-3 text-gray-600">{order.buyer?.name || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {order.items?.[0]?.seller?.shgName || '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-3 font-semibold">{formatCurrency(order.totals?.total || 0)}</td>
                    <td className="py-3 px-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-3 px-3">
                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => { setSelectedOrder(order); setRefundAmount(''); setRefundReason('') }}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Process Refund — #${selectedOrder?._id.slice(-6).toUpperCase()}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Order Total: <span className="font-bold">{formatCurrency(selectedOrder?.totals?.total || 0)}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefund}
              disabled={isRefunding || !refundAmount || !refundReason}
              className="btn-danger flex-1"
            >
              {isRefunding ? 'Processing...' : 'Process Refund'}
            </button>
            <button onClick={() => setSelectedOrder(null)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
