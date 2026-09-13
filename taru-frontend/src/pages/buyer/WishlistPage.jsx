import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import ProductGrid from '../../components/buyer/ProductGrid.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { productAPI } from '../../api/productAPI.jsx'

export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    productAPI
      .getWishlist()
      .then((res) => setProducts(res.data.items?.map((i) => ({ ...i.product, isWishlisted: true })) || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-400 fill-red-400" />
        My Wishlist
      </h1>

      {!isLoading && products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love by clicking the heart icon."
          action={
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products} isLoading={isLoading} />
      )}
    </PageWrapper>
  )
}
