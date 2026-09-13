import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// We store a reference to the auth context setter so the interceptor can update the token
let _setAccessToken = null
let _accessToken = null

export function injectAuthHelpers(setAccessToken, getAccessToken) {
  _setAccessToken = setAccessToken
  _accessToken = getAccessToken
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly refresh-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    let token = typeof _accessToken === 'function' ? _accessToken() : _accessToken
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('taru_access_token')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 by refreshing token once
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => {
    // If backend returns { data: ..., meta: ... }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      const payload = response.data.data

      // If payload is an array, attach common collection aliases to response.data
      if (Array.isArray(payload)) {
        response.data.items = payload
        response.data.products = payload
        response.data.orders = payload
        response.data.users = payload
        response.data.sellers = payload
        response.data.categories = payload
        response.data.reviews = payload
        response.data.auditLogs = payload
        response.data.logs = payload
        response.data.events = payload
      } else if (payload && typeof payload === 'object') {
        // If payload is an object, merge its keys onto response.data
        Object.keys(payload).forEach((key) => {
          if (response.data[key] === undefined) {
            response.data[key] = payload[key]
          }
        })

        // Provide common single-entity aliases if appropriate
        if (payload._id) {
          if (payload.orderNumber || payload.shippingAddress) response.data.order = payload
          if (payload.title && (payload.price !== undefined || payload.categoryId)) response.data.product = payload
          if (payload.shgName) response.data.seller = payload
          if (payload.email && payload.role) response.data.user = payload
          if (payload.line1 && payload.city) response.data.address = payload
        }
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data?.accessToken || res.data?.data?.accessToken
        if (_setAccessToken && newToken) _setAccessToken(newToken)
        _accessToken = newToken
        if (newToken) {
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`
          localStorage.setItem('taru_access_token', newToken)
        }
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
