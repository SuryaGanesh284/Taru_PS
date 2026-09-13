import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit, Eye, EyeOff, Trash2, Gem } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { Skeleton } from '../../components/common/Skeleton.jsx'
import Badge from '../../components/common/Badge.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'
import { PRODUCT_TYPES } from '../../utils/constants.jsx'
import toast from 'react-hot-toast'

export default function SellerProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = () => {
    setIsLoading(true)
    sellerAPI
      .getMyProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleTogglePublish = async (product) => {
    try {
      if (product.status === 'PUBLISHED') {
        await sellerAPI.unpublishProduct(product._id)
        toast.success('Product unpublished.')
      } else {
        await sellerAPI.publishProduct(product._id)
        toast.success('Product published!')
      }
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Action failed.')
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await sellerAPI.deleteProduct(productId)
      toast.success('Product deleted.')
      fetchProducts()
    } catch { toast.error('Could not delete product.') }
  }

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <Link to="/seller/products/add" className="btn-primary flex items-center gap-2 text-sm">
              <PlusCircle className="h-4 w-4" /> Add Product
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Add your first product to start selling."
              action={
                <Link to="/seller/products/add" className="btn-primary">
                  Add Your First Product
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product._id} className="card flex items-center gap-4">
                  <img
                    src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {product.title}
                      </p>
                      {product.type === PRODUCT_TYPES.UNIQUE && (
                        <Gem className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {product.category?.name} · Added {formatDate(product.createdAt)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatCurrency(product.price)}
                      </span>
                      <Badge variant={product.status === 'PUBLISHED' ? 'green' : 'gray'}>
                        {product.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Stock: {product.inventory?.quantity ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/seller/products/${product._id}/edit`}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(product)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                      title={product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    >
                      {product.status === 'PUBLISHED' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
