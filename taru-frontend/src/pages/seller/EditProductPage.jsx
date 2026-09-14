import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import ProductForm from '../../components/seller/ProductForm.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    productAPI
      .getProduct(productId)
      .then((res) => setProduct(res.data))
      .catch(() => navigate('/seller/products'))
      .finally(() => setIsLoading(false))
  }, [productId])

  const handleSubmit = async ({ mediaFiles, ...data }) => {
    setIsSaving(true)
    try {
      await sellerAPI.updateProduct(productId, {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        tags: typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : Array.isArray(data.tags)
          ? data.tags
          : [],
      })

      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData()
        mediaFiles.forEach((file) => formData.append('media', file))
        await sellerAPI.uploadMedia(productId, formData)
      }

      toast.success('Product updated successfully!')
      navigate('/seller/products')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />
        <div className="flex-1 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="card">
              <ProductForm
                initialData={{
                  ...product,
                  categoryId: product.category?._id || product.categoryId,
                  tags: product.tags?.join(', ') || '',
                  quantity: product.inventory?.quantity ?? '',
                }}
                onSubmit={handleSubmit}
                isLoading={isSaving}
              />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
