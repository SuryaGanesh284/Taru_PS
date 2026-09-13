import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import PageWrapper from '../../components/common/PageWrapper.jsx'
import CartItem from '../../components/buyer/CartItem.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { formatCurrency } from '../../utils/formatters.jsx'

export default function CartPage() {
  const { items, totalItems, totalPrice, isLoading, fetchCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center min-h-[40vh]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          My Cart{' '}
          {totalItems > 0 && (
            <span className="text-base font-normal text-gray-400">({totalItems} items)</span>
          )}
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add items from the marketplace to get started."
            action={
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 card">
              {items.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <div className="card space-y-4">
                <h2 className="font-semibold text-gray-800 text-lg">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <Link
                to="/products"
                className="block text-center text-sm text-primary-600 hover:underline"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
