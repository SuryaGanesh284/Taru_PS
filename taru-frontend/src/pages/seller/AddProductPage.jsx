import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import ProductForm from '../../components/seller/ProductForm.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import toast from 'react-hot-toast'

export default function AddProductPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async ({ mediaFiles, ...data }) => {
    setIsLoading(true)
    try {
      // Create product
      const res = await sellerAPI.createProduct({
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        tags: typeof data.tags === 'string'
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : Array.isArray(data.tags)
          ? data.tags
          : [],
      })
      const productId = res.data?.product?._id || res.data?.data?._id || res.data?._id

      // Upload media if any
      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData()
        mediaFiles.forEach((file) => formData.append('media', file))
        await sellerAPI.uploadMedia(productId, formData)
      }

      toast.success('Product created! You can now publish it.')
      navigate('/seller/products')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create product.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="flex gap-6">
        <SellerSidebar />
        <div className="flex-1 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
          <div className="card">
            <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
