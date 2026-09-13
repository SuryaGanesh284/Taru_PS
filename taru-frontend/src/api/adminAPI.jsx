import axiosInstance from './axiosInstance.jsx'

export const adminAPI = {
  // Users
  getUsers: (params) => axiosInstance.get('/admin/users', { params }),

  updateUserStatus: (userId, data) =>
    axiosInstance.patch(`/admin/users/${userId}/status`, data),

  // Sellers
  getPendingSellers: () => axiosInstance.get('/admin/sellers/pending'),

  updateSellerVerification: (sellerId, data) =>
    axiosInstance.patch(`/admin/sellers/${sellerId}/verification`, data),

  // Products
  getPendingProducts: () => axiosInstance.get('/admin/products/pending'),

  moderateProduct: (productId, data) =>
    axiosInstance.patch(`/admin/products/${productId}/moderation`, data),

  // Orders
  getAllOrders: (params) => axiosInstance.get('/admin/orders', { params }),

  processRefund: (data) => axiosInstance.post('/admin/refunds', data),

  // Audit logs
  getAuditLogs: (params) => axiosInstance.get('/admin/audit-logs', { params }),
}
