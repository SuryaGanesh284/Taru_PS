import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Share2, Gem, ChevronLeft, Truck, Shield } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import ChatWidget from '../../components/ai/ChatWidget.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.jsx'
import { PRODUCT_TYPES, ROLES } from '../../utils/constants.jsx'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated, role } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [adding, setAdding] = useState(false)

  const isBuyer = role === ROLES.BUYER || !isAuthenticated
  const isUnique = product?.type === PRODUCT_TYPES.UNIQUE

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      productAPI.getProduct(productId),
      productAPI.getReviews(productId),
    ])
      .then(([prodRes, revRes]) => {
        setProduct(prodRes.data)
        setReviews(revRes.data.reviews || [])
        setWishlisted(prodRes.data.isWishlisted || false)
        // Track view event
        productAPI.recordEvent({ type: 'product_view', entityId: productId }).catch(() => {})
      })
      .catch(() => navigate('/products'))
      .finally(() => setIsLoading(false))
  }, [productId])

  const handleAddToCart = async () => {
    setAdding(true)
    await addToCart(product._id, quantity)
    setAdding(false)
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please log in.'); return }
    try {
      if (wishlisted) {
        await productAPI.removeFromWishlist(product._id)
        setWishlisted(false)
        toast.success('Removed from wishlist.')
      } else {
        await productAPI.addToWishlist(product._id)
        setWishlisted(true)
        toast.success('Added to wishlist!')
      }
    } catch { toast.error('Could not update wishlist.') }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  if (!product) return null

  const images = product.images?.length ? product.images : [{ url: '/placeholder-product.jpg' }]
  const stockOut = product.inventory?.quantity === 0

  return (
    <PageWrapper>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            <img
              src={images[selectedImage]?.url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? 'border-primary-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img.url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          {isUnique && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-3 py-2 rounded-xl w-fit">
              <Gem className="h-4 w-4" /> One of a Kind Item
            </div>
          )}

          <div>
            <p className="text-sm text-primary-600 font-medium mb-1">
              {product.category?.name}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= Math.round(product.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {product.rating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            )}
          </div>

          <p className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>

          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

          {/* Seller */}
          <div className="p-3 bg-earth-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-0.5">Sold by</p>
            <p className="text-sm font-semibold text-gray-800">
              {product.seller?.shgName || product.seller?.name || 'SHG Seller'}
            </p>
          </div>

          {/* Quantity + Add to Cart */}
          {isBuyer && !stockOut && (
            <div className="flex items-center gap-3">
              {!isUnique && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="font-bold text-gray-600 hover:text-primary-600 w-5 text-center"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.inventory?.quantity || 99, q + 1)
                      )
                    }
                    className="font-bold text-gray-600 hover:text-primary-600 w-5 text-center"
                  >
                    +
                  </button>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {stockOut && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              This item is currently out of stock.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleWishlist}
              className="flex items-center gap-2 btn-secondary text-sm"
            >
              <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
            <button className="flex items-center gap-2 btn-secondary text-sm">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {/* Delivery + Safety */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="h-4 w-4 text-primary-500" />
              Pan-India delivery
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-primary-500" />
              Secure payment
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Customer Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {review.buyer?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {review.buyer?.name || 'Customer'}
                    </span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.text}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ChatWidget />
    </PageWrapper>
  )
}
