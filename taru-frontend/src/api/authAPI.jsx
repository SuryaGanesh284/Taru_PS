import axiosInstance from './axiosInstance.jsx'

export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),

  login: (data) => axiosInstance.post('/auth/login', data),

  logout: () => axiosInstance.post('/auth/logout'),

  refresh: () => axiosInstance.post('/auth/refresh'),

  getMe: () => axiosInstance.get('/auth/me'),

  updateProfile: (data) => axiosInstance.patch('/users/me', data),

  changePassword: (data) => axiosInstance.patch('/users/me/password', data),

  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),

  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
}
