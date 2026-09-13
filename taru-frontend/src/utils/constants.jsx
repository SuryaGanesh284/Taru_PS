// User roles
export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
}

// Product types
export const PRODUCT_TYPES = {
  STANDARD: 'STANDARD',
  UNIQUE: 'UNIQUE',
  MADE_TO_ORDER: 'MADE_TO_ORDER',
}

// Order statuses
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  CANCELLED: 'CANCELLED',
}

// Order status color map for badges
export const ORDER_STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

// Seller verification statuses
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

// Product sort options
export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt:desc' },
  { label: 'Price: Low to High', value: 'price:asc' },
  { label: 'Price: High to Low', value: 'price:desc' },
  { label: 'Most Popular', value: 'popularity:desc' },
  { label: 'Best Rated', value: 'rating:desc' },
]

// Pagination default
export const DEFAULT_PAGE_SIZE = 12

// AI chat intents
export const AI_INTENTS = {
  PRODUCT_SEARCH: 'PRODUCT_SEARCH',
  PRODUCT_RECOMMEND: 'PRODUCT_RECOMMEND',
  ORDER_STATUS: 'ORDER_STATUS',
  ORDER_CANCEL: 'ORDER_CANCEL',
  SELLER_PRODUCT_CREATE: 'SELLER_PRODUCT_CREATE',
  SELLER_ANALYTICS: 'SELLER_ANALYTICS',
  FAQ: 'FAQ',
  HUMAN_SUPPORT: 'HUMAN_SUPPORT',
}

// Nav links per role
export const BUYER_NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
  { label: 'Wishlist', path: '/wishlist' },
  { label: 'Orders', path: '/orders' },
]

export const SELLER_NAV_LINKS = [
  { label: 'Dashboard', path: '/seller/dashboard' },
  { label: 'Products', path: '/seller/products' },
  { label: 'Orders', path: '/seller/orders' },
  { label: 'Analytics', path: '/seller/analytics' },
]

export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Sellers', path: '/admin/sellers' },
  { label: 'Products', path: '/admin/products' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Audit Logs', path: '/admin/audit' },
]
