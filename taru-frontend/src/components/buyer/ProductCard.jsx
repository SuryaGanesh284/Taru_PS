import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Gem } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { productAPI } from '../../api/productAPI.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'
import { PRODUCT_TYPES, ROLES } from '../../utils/constants.jsx'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isAuthenticated, role } = useAuth()
  const [wishlisted, setWishlisted] = useState(product.isWishlisted || false)
  const [adding, setAdding] = useState(false)

  const isUnique = product.type === PRODUCT_TYPES.UNIQUE
  const isBuyer = role === ROLES.BUYER
  const primaryImage = product.images?.[0]?.url || '/placeholder-product.jpg'

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    await addToCart(product._id, 1)
    setAdding(false)
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please log in to save to wishlist.')
      return
    }
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
    } catch {
      toast.error('Could not update wishlist.')
    }
  }

  return (
    <Link
      to={`/products/${product._id}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Unique badge */}
        {isUnique && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            <Gem className="h-3 w-3" />
            One of a Kind
          </div>
        )}

        {/* Wishlist button */}
        {(isBuyer || !isAuthenticated) && (
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:scale-110 transition-transform"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={`h-4 w-4 ${
                wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-primary-600 font-medium mb-1">
          {product.category?.name || 'Uncategorized'}
        </p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 flex-1">
          {product.title}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs text-gray-500">
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>

          {isBuyer && (
            <button
              onClick={handleAddToCart}
              disabled={adding || product.inventory?.quantity === 0}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {adding ? 'Adding...' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
