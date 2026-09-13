import axiosInstance from './axiosInstance.jsx'

export const productAPI = {
  // Public catalog
  getProducts: (params) => axiosInstance.get('/products', { params }),

  getProduct: (productId) => axiosInstance.get(`/products/${productId}`),

  searchProducts: (params) => axiosInstance.get('/search/products', { params }),

  getSearchSuggestions: (params) =>
    axiosInstance.get('/search/suggestions', { params }),

  getTrending: () => axiosInstance.get('/search/trending'),

  getCategories: () => axiosInstance.get('/categories'),

  getCategory: (categoryId) => axiosInstance.get(`/categories/${categoryId}`),

  getRecommendations: () => axiosInstance.get('/recommendations'),

  getHomeRecommendations: () => axiosInstance.get('/recommendations/home'),

  postFeedback: (data) => axiosInstance.post('/recommendations/feedback', data),

  // Product reviews
  getReviews: (productId) => axiosInstance.get(`/products/${productId}/reviews`),

  createReview: (productId, data) =>
    axiosInstance.post(`/products/${productId}/reviews`, data),

  // Wishlist
  getWishlist: () => axiosInstance.get('/wishlist'),

  addToWishlist: (productId) =>
    axiosInstance.post(`/wishlist/items/${productId}`),

  removeFromWishlist: (productId) =>
    axiosInstance.delete(`/wishlist/items/${productId}`),

  // Events (behavior tracking)
  recordEvent: (data) => axiosInstance.post('/events', data),
}
