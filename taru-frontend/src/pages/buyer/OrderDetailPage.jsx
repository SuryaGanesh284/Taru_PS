import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, RotateCcw, XCircle } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import OrderStatusBadge from '../../components/buyer/OrderStatusBadge.jsx'
import TrackingTimeline from '../../components/buyer/TrackingTimeline.jsx'
import { orderAPI } from '../../api/orderAPI.jsx'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.jsx'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [tracking, setTracking] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      orderAPI.getOrder(orderId),
      orderAPI.getTracking(orderId),
    ])
      .then(([orderRes, trackRes]) => {
        setOrder(orderRes.data.order)
        setTracking(trackRes.data.events || [])
      })
      .catch(() => navigate('/orders'))
      .finally(() => setIsLoading(false))
  }, [orderId])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setIsCancelling(true)
    try {
      const res = await orderAPI.cancelOrder(orderId)
      setOrder(res.data.order)
      toast.success('Order cancelled successfully.')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Cannot cancel this order.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const res = await orderAPI.getInvoice(orderId)
      if (res.data.pdfUrl) {
        window.open(res.data.pdfUrl, '_blank')
      } else {
        toast.error('Invoice not available yet.')
      }
    } catch { toast.error('Could not download invoice.') }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center min-h-[40vh]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  if (!order) return null

  const canCancel = ['PENDING_PAYMENT', 'CONFIRMED'].includes(order.status)
  const isDelivered = order.status === 'DELIVERED'

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Orders
        </button>

        {/* Header */}
        <div className="card mb-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {isDelivered && (
              <button
                onClick={handleDownloadInvoice}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </button>
            )}
            {isDelivered && (
              <button
                onClick={() => orderAPI.reorder(orderId).then(() => toast.success('Items added to cart!'))}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reorder
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="btn-danger text-sm flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Tracking */}
          <div className="lg:col-span-2 card">
            <h2 className="font-semibold text-gray-800 mb-4">Tracking</h2>
            <TrackingTimeline order={order} events={tracking} />
          </div>

          {/* Items + Summary */}
          <div className="lg:col-span-3 space-y-5">
            {/* Items */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.product?._id} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product?.title}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.product?.title}
                      </p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.totals?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatCurrency(order.totals?.deliveryCharge || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes</span>
                  <span>{formatCurrency(order.totals?.taxes || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(order.totals?.total || 0)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Payment status:{' '}
                  <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-gray-700'}`}>
                    {order.paymentStatus || '—'}
                  </span>
                </p>
              </div>
            </div>

            {/* Delivery address */}
            {order.address && (
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Delivery Address</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {order.address.line1}
                  {order.address.line2 && `, ${order.address.line2}`}
                  <br />
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
