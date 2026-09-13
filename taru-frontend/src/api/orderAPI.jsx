import axiosInstance from './axiosInstance.jsx'

export const orderAPI = {
  // Addresses
  getAddresses: () => axiosInstance.get('/addresses'),

  createAddress: (data) => axiosInstance.post('/addresses', data),

  updateAddress: (addressId, data) =>
    axiosInstance.patch(`/addresses/${addressId}`, data),

  deleteAddress: (addressId) => axiosInstance.delete(`/addresses/${addressId}`),

  // Checkout
  getQuote: (data) => axiosInstance.post('/checkout/quote', data),

  createOrder: (data) => axiosInstance.post('/checkout/create-order', data),

  // Orders
  getOrders: (params) => axiosInstance.get('/orders', { params }),

  getOrder: (orderId) => axiosInstance.get(`/orders/${orderId}`),

  cancelOrder: (orderId) => axiosInstance.post(`/orders/${orderId}/cancel`),

  reorder: (orderId) => axiosInstance.post(`/orders/${orderId}/reorder`),

  // Tracking & Invoice
  getTracking: (orderId) => axiosInstance.get(`/orders/${orderId}/tracking`),

  getInvoice: (orderId) => axiosInstance.get(`/orders/${orderId}/invoice`),

  // Payments
  createPaymentIntent: (data) => axiosInstance.post('/payments/create-intent', data),

  getPayment: (paymentId) => axiosInstance.get(`/payments/${paymentId}`),
}
