import axiosInstance from './axiosInstance.jsx'

export const sellerAPI = {
  // Seller profile
  createProfile: (data) => axiosInstance.post('/sellers/profile', data),

  getMyProfile: () => axiosInstance.get('/sellers/me'),

  updateMyProfile: (data) => axiosInstance.patch('/sellers/me', data),

  submitVerification: (data) =>
    axiosInstance.post('/sellers/me/verification', data),

  getPublicProfile: (sellerId) => axiosInstance.get(`/sellers/${sellerId}`),

  getDashboard: () => axiosInstance.get('/sellers/me/dashboard'),

  getAnalytics: () => axiosInstance.get('/sellers/me/analytics'),

  // Seller products
  getMyProducts: (params) =>
    axiosInstance.get('/sellers/me/products', { params }),

  createProduct: (data) => axiosInstance.post('/products', data),

  updateProduct: (productId, data) =>
    axiosInstance.patch(`/products/${productId}`, data),

  deleteProduct: (productId) => axiosInstance.delete(`/products/${productId}`),

  publishProduct: (productId) =>
    axiosInstance.post(`/products/${productId}/publish`),

  unpublishProduct: (productId) =>
    axiosInstance.post(`/products/${productId}/unpublish`),

  uploadMedia: (productId, formData) =>
    axiosInstance.post(`/products/${productId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (productId, mediaId) =>
    axiosInstance.delete(`/products/${productId}/media/${mediaId}`),

  updateInventory: (productId, data) =>
    axiosInstance.patch(`/products/${productId}/inventory`, data),

  registerUniqueItem: (productId, data) =>
    axiosInstance.post(`/products/${productId}/unique-item`, data),

  // Seller orders
  getMyOrders: (params) =>
    axiosInstance.get('/seller/orders', { params }),

  getMyOrder: (orderId) => axiosInstance.get(`/seller/orders/${orderId}`),

  updateOrderStatus: (orderId, data) =>
    axiosInstance.patch(`/seller/orders/${orderId}/status`, data),

  shipOrder: (orderId, data) =>
    axiosInstance.post(`/seller/orders/${orderId}/ship`, data),
}
