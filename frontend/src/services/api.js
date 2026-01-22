import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Simplified auth and security - avoid circular dependencies
const getAuthToken = () => {
  try {
    const encrypted = localStorage.getItem('pizza_auth_token')
    return encrypted ? atob(encrypted) : null
  } catch {
    return null
  }
}

const getCSRFToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content || ''
}

// Simple rate limiter
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 900000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs)
    if (this.requests.length >= this.maxRequests) return false
    this.requests.push(now)
    return true
  }
}

// Rate limiter instance
const rateLimiter = new RateLimiter(100, 900000) // 100 requests per 15 minutes

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Rate limiting check
    if (!rateLimiter.canMakeRequest()) {
      return Promise.reject(new Error('Rate limit exceeded. Please try again later.'))
    }

    // Add auth token
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token if available
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    // Handle 401 - just redirect to login if needed
    if (error.response?.status === 401) {
      // Optional: redirect to login
      // window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// API endpoints with error handling
export const menuApi = {
  getMenu: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/menu', { params })
      return response
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      throw error
    }
  },
  
  getMenuItem: async (id) => {
    try {
      const response = await apiClient.get(`/api/menu/${id}`)
      return response
    } catch (error) {
      console.error('Failed to fetch menu item:', error)
      throw error
    }
  },
}

export const categoryApi = {
  getCategories: async () => {
    try {
      const response = await apiClient.get('/api/categories')
      return response
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      throw error
    }
  },
}

export const orderApi = {
  getOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/orders', { params })
      return response
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      throw error
    }
  },
  
  getOrder: async (id) => {
    try {
      const response = await apiClient.get(`/api/orders/${id}`)
      return response
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw error
    }
  },
  
  createOrder: async (data) => {
    try {
      const response = await apiClient.post('/api/orders', data)
      return response
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  },
  
  updateOrder: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/orders/${id}`, data)
      return response
    } catch (error) {
      console.error('Failed to update order:', error)
      throw error
    }
  },
  
  updateOrderStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/api/orders/${id}/status`, { status })
      return response
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  },
  
  deleteOrder: async (id) => {
    try {
      const response = await apiClient.delete(`/api/orders/${id}`)
      return response
    } catch (error) {
      console.error('Failed to delete order:', error)
      throw error
    }
  },
}

export const analyticsApi = {
  getAnalytics: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/analytics', { params })
      return response
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      throw error
    }
  },
}

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials)
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData)
      return response
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  },
  
  logout: () => {
    // Clear auth tokens
    localStorage.removeItem('pizza_auth_token')
    localStorage.removeItem('pizza_refresh_token')
    localStorage.removeItem('pizza_user')
    return Promise.resolve()
  },
}

export const healthApi = {
  check: async () => {
    try {
      const response = await apiClient.get('/api/health')
      return response
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  },
}

export const promoApi = {
  validate: async (code, orderTotal) => {
    try {
      const response = await apiClient.post('/api/promo/validate', { code, orderTotal })
      return response
    } catch (error) {
      console.error('Promo validation failed:', error)
      throw error
    }
  },
}

export const paymentApi = {
  process: async (orderData) => {
    try {
      const response = await apiClient.post('/api/payment/process', orderData)
      return response
    } catch (error) {
      console.error('Payment processing failed:', error)
      throw error
    }
  },
}

// Export default for backward compatibility
export default apiClient

