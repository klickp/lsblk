import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const orderApi = {
  getOrders: () => apiClient.get('/api/orders'),
  getOrder: (id) => apiClient.get(`/api/orders/${id}`),
  createOrder: (data) => apiClient.post('/api/orders', data),
  updateOrder: (id, data) => apiClient.put(`/api/orders/${id}`, data),
  deleteOrder: (id) => apiClient.delete(`/api/orders/${id}`),
}

export const menuApi = {
  getMenu: () => apiClient.get('/api/menu'),
  getMenuItem: (id) => apiClient.get(`/api/menu/${id}`),
}

export const authApi = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token')
  },
}

export const healthApi = {
  check: () => apiClient.get('/api/health'),
}

export default apiClient
