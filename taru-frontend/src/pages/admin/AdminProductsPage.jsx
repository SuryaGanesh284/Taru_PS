import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchProducts = () => {
    setIsLoading(true)
    adminAPI
      .getPendingProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleModerate = async (decision) => {
    setIsProcessing(true)
    try {
      await adminAPI.moderateProduct(selected._id, { decision, reason })
      toast.success(`Product ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`)
      setSelected(null)
      fetchProducts()
    } catch { toast.error('Action failed.') }
    finally { setIsProcessing(false) }
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Product Moderation</h1>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Product', 'Seller', 'Price', 'Type', 'Submitted', 'Action'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map((i) => <TableRowSkeleton key={i} cols={6} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No products pending moderation.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          className="w-9 h-9 rounded-lg object-cover bg-gray-100"
                          alt={product.title}
                        />
                        <span className="font-medium text-gray-800 max-w-[160px] truncate">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {product.seller?.shgName || product.seller?.name || '—'}
                    </td>
                    <td className="py-3 px-3 font-semibold">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-3">
                      <Badge variant="gray">{product.type}</Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(product.createdAt)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => { setSelected(product); setReason('') }}
                        className="text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Review Product: ${selected?.title}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {selected.images?.[0] && (
                <img
                  src={selected.images[0].url}
                  alt={selected.title}
                  className="w-32 h-32 object-cover rounded-xl"
                />
              )}
              <div className="space-y-1.5 text-sm">
                <p><span className="font-medium">Category:</span> {selected.category?.name}</p>
                <p><span className="font-medium">Price:</span> {formatCurrency(selected.price)}</p>
                <p><span className="font-medium">Type:</span> {selected.type}</p>
                <p><span className="font-medium">Seller:</span> {selected.seller?.shgName}</p>
              </div>
            </div>
            {selected.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                {selected.description}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (required for rejection)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Reason for rejection..."
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleModerate('APPROVED')}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleModerate('REJECTED')}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
