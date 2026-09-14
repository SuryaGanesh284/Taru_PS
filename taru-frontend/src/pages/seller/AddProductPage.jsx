import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import SellerSidebar from '../../components/seller/SellerSidebar.jsx'
import ProductForm from '../../components/seller/ProductForm.jsx'
import { sellerAPI } from '../../api/sellerAPI.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import toast from 'react-hot-toast'

export default function AddProductPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true)
        const res = await productAPI.getCategories()
        const raw = res?.data ?? res
        const cats = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.categories)
          ? raw.categories
          : Array.isArray(raw?.items)
          ? raw.items
          : []
        const safeCats = Array.isArray(cats) ? cats : []
        if (isMounted) {
          setCategories(safeCats)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
        if (isMounted) {
          setCategories([])
          toast.error('Unable to load categories. Please check your connection.')
        }
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false)
        }
      }
    }

    fetchCategories()
    return () => {
      isMounted = false
    }
  }, [])

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
            <ProductForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              categories={categories}
              isCategoriesLoading={isCategoriesLoading}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
