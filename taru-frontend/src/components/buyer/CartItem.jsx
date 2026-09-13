import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart()
  const { product, quantity } = item
  const primaryImage = product.images?.[0]?.url || '/placeholder-product.jpg'

  const handleIncrease = () => updateQuantity(product._id, quantity + 1)
  const handleDecrease = () => {
    if (quantity <= 1) {
      removeFromCart(product._id)
    } else {
      updateQuantity(product._id, quantity - 1)
    }
  }

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link to={`/products/${product._id}`} className="shrink-0">
        <img
          src={primaryImage}
          alt={product.title}
          className="w-20 h-20 object-cover rounded-lg bg-gray-100"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${product._id}`}
          className="text-sm font-semibold text-gray-800 hover:text-primary-600 line-clamp-2"
        >
          {product.title}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">
          {product.seller?.name || 'SHG Seller'}
        </p>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
            <button
              onClick={handleDecrease}
              className="p-0.5 hover:text-primary-600 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
            <button
              onClick={handleIncrease}
              className="p-0.5 hover:text-primary-600 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(product.price * quantity)}
            </span>
            <button
              onClick={() => removeFromCart(product._id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
