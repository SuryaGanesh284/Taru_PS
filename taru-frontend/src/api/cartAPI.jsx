import axiosInstance from './axiosInstance.jsx'

export const cartAPI = {
  getCart: () => axiosInstance.get('/cart'),

  addItem: (data) => axiosInstance.post('/cart/items', data),

  updateItem: (productId, data) =>
    axiosInstance.patch(`/cart/items/${productId}`, data),

  removeItem: (productId) => axiosInstance.delete(`/cart/items/${productId}`),

  clearCart: () => axiosInstance.delete('/cart'),

  validateCart: () => axiosInstance.post('/cart/validate'),
}
