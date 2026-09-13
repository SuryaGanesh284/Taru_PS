import { createContext, useContext, useReducer, useCallback } from 'react'
import { cartAPI } from '../api/cartAPI.jsx'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_CART': {
      const items = action.payload || []
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
      )
      return { ...state, items, totalItems, totalPrice, isLoading: false }
    }

    case 'CLEAR_CART':
      return { ...initialState }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { isAuthenticated, role } = useAuth()

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || role !== 'buyer') return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await cartAPI.getCart()
      dispatch({ type: 'SET_CART', payload: res.data.items })
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [isAuthenticated, role])

  // Add item to cart
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        toast.error('Please log in to add items to your cart.')
        return
      }
      try {
        const res = await cartAPI.addItem({ productId, quantity })
        dispatch({ type: 'SET_CART', payload: res.data.items })
        toast.success('Added to cart!')
      } catch (err) {
        const message = err.response?.data?.error?.message || 'Failed to add to cart.'
        toast.error(message)
      }
    },
    [isAuthenticated]
  )

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const res = await cartAPI.updateItem(productId, { quantity })
      dispatch({ type: 'SET_CART', payload: res.data.items })
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to update quantity.'
      toast.error(message)
    }
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      const res = await cartAPI.removeItem(productId)
      dispatch({ type: 'SET_CART', payload: res.data.items })
      toast.success('Item removed from cart.')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to remove item.'
      toast.error(message)
    }
  }, [])

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clearCart()
      dispatch({ type: 'CLEAR_CART' })
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to clear cart.'
      toast.error(message)
    }
  }, [])

  // Clear cart locally (after order placed)
  const clearCartLocal = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const value = {
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartLocal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider')
  }
  return context
}
