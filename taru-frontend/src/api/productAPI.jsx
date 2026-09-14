import axiosInstance from './axiosInstance.jsx'

export const productAPI = {
  // Public catalog
  getProducts: (params) => axiosInstance.get('/products', { params }),

  getProduct: (productId) => axiosInstance.get(`/products/${productId}`),

  searchProducts: (params) => axiosInstance.get('/search/products', { params }),

  getSearchSuggestions: (params) =>
    axiosInstance.get('/search/suggestions', { params }),

  getTrending: () => axiosInstance.get('/search/trending'),

  getSampleProducts: () =>
    axiosInstance
      .get('/products/samples')
      .then((res) => {
        const raw = res?.data
        if (Array.isArray(raw)) return raw
        if (Array.isArray(raw?.data)) return raw.data
        if (Array.isArray(raw?.products)) return raw.products
        return []
      })
      .catch(() => []),

  getCategories: () =>
    axiosInstance
      .get('/categories')
      .then((res) => {
        const raw = res?.data
        let items = []
        if (Array.isArray(raw)) {
          items = raw
        } else if (Array.isArray(raw?.data)) {
          items = raw.data
        } else if (Array.isArray(raw?.categories)) {
          items = raw.categories
        } else if (Array.isArray(raw?.items)) {
          items = raw.items
        } else if (Array.isArray(res)) {
          items = res
        }
        items.data = items
        items.categories = items
        items.items = items
        return { ...res, data: items, categories: items, items }
      })
      .catch((err) => {
        console.error('Error fetching categories from backend:', err)
        const fallback = []
        fallback.data = fallback
        fallback.categories = fallback
        fallback.items = fallback
        return { data: fallback, categories: fallback, items: fallback }
      }),

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
