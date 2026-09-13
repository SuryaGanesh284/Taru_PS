import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

import ProtectedRoute from './routes/ProtectedRoute.jsx'

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'

// Buyer pages
import HomePage from './pages/buyer/HomePage.jsx'
import ProductListPage from './pages/buyer/ProductListPage.jsx'
import ProductDetailPage from './pages/buyer/ProductDetailPage.jsx'
import CartPage from './pages/buyer/CartPage.jsx'
import CheckoutPage from './pages/buyer/CheckoutPage.jsx'
import OrdersPage from './pages/buyer/OrdersPage.jsx'
import OrderDetailPage from './pages/buyer/OrderDetailPage.jsx'
import WishlistPage from './pages/buyer/WishlistPage.jsx'

// Seller pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage.jsx'
import SellerProductsPage from './pages/seller/SellerProductsPage.jsx'
import AddProductPage from './pages/seller/AddProductPage.jsx'
import EditProductPage from './pages/seller/EditProductPage.jsx'
import SellerOrdersPage from './pages/seller/SellerOrdersPage.jsx'
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage.jsx'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminSellersPage from './pages/admin/AdminSellersPage.jsx'
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminAuditPage from './pages/admin/AdminAuditPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Buyer routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />

            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Seller routes */}
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/add"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <AddProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/:productId/edit"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <EditProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/analytics"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sellers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSellersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAuditPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  )
}
