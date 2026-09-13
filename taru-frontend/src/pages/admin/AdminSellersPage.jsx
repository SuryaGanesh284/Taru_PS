import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, MapPin } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import { TableRowSkeleton } from '../../components/common/Skeleton.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { adminAPI } from '../../api/adminAPI.jsx'
import { formatDate } from '../../utils/formatters.jsx'
import toast from 'react-hot-toast'

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchSellers = () => {
    setIsLoading(true)
    adminAPI
      .getPendingSellers()
      .then((res) => setSellers(res.data.sellers || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchSellers() }, [])

  const handleVerify = async (status) => {
    setIsProcessing(true)
    try {
      await adminAPI.updateSellerVerification(selected._id, { status, note })
      toast.success(`Seller ${status === 'APPROVED' ? 'approved' : 'rejected'}.`)
      setSelected(null)
      fetchSellers()
    } catch { toast.error('Action failed.') }
    finally { setIsProcessing(false) }
  }

  const statusColors = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red' }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Seller Verification</h1>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['SHG Name', 'Owner', 'Location', 'Applied On', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map((i) => <TableRowSkeleton key={i} cols={6} />)
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No pending verifications.
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-800">{seller.shgName}</td>
                    <td className="py-3 px-3 text-gray-600">{seller.user?.name || '—'}</td>
                    <td className="py-3 px-3 text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {seller.location || '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(seller.createdAt)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={statusColors[seller.verificationStatus] || 'gray'}>
                        {seller.verificationStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {seller.verificationStatus === 'PENDING' && (
                        <button
                          onClick={() => { setSelected(seller); setNote('') }}
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Review
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
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Review: ${selected?.shgName}`}
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="font-medium">Owner:</span> {selected.user?.name}</p>
              <p><span className="font-medium">Email:</span> {selected.user?.email}</p>
              <p><span className="font-medium">Location:</span> {selected.location || '—'}</p>
              <p><span className="font-medium">Description:</span> {selected.description || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note for the seller..."
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify('APPROVED')}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleVerify('REJECTED')}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
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
