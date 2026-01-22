import React, { useState, useMemo, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import History from './pages/History'
import Business from './pages/Business'
import Kitchen from './pages/Kitchen'
import BusinessHistory from './pages/BusinessHistory'
import BusinessAnalytics from './pages/BusinessAnalytics'

export const AuthContext = createContext(null)

function Navigation({ cartCount, user, openAuth, handleLogout }) {
  const location = useLocation()
  const isAdminPage = location.pathname === '/business' || location.pathname === '/kitchen'

  if (isAdminPage) {
    return null // Don't show nav on admin pages
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🍽️ Ordering System
        </Link>
        <div className="nav-menu">
          <Link to="/" className="nav-link" title="Menu">
            🍕
          </Link>
          <Link to="/cart" className="nav-link cart-link" title="Cart">
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {user && (
            <Link to="/history" className="nav-link" title="Order History">
              📋
            </Link>
          )}
          {user ? (
            <div className="nav-auth-inline">
              <span className="user-chip">Hi, {user.name || user.email}</span>
              <button className="auth-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="auth-btn" onClick={openAuth}>Log In</button>
          )}
        </div>
      </div>
    </nav>
  )
}

function App() {
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('userProfile')
    return stored ? JSON.parse(stored) : null
  })
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showPasswordReqs, setShowPasswordReqs] = useState(false)

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(count)
    }

    const handleToast = (e) => {
      setToast({ show: true, message: e.detail.message, type: e.detail.type })
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
    }

    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    window.addEventListener('showToast', handleToast)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('showToast', handleToast)
    }
  }, [])

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const endpoint = authMode === 'signup' ? '/auth/register' : '/auth/login'
      const payload = authMode === 'signup' 
        ? { name: authForm.name, email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password }

      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        setAuthLoading(false)
        return
      }

      // Store user and token
      const profile = { email: data.user.email, name: data.user.name }
      setUser(profile)
      localStorage.setItem('userProfile', JSON.stringify(profile))
      localStorage.setItem('token', data.token)
      
      setAuthOpen(false)
      setAuthForm({ name: '', email: '', password: '' })
      setAuthError('')
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('Connection failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token')
  }

  const authContextValue = useMemo(() => ({
    user,
    openAuth: () => {
      setAuthOpen(true)
      setAuthMode('login')
      setAuthError('')
      setAuthForm({ name: '', email: '', password: '' })
    },
    logout: handleLogout,
    setUser
  }), [user])

  const validateEmailFormat = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  const getPasswordStrength = () => {
    const pwd = authForm.password
    return {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <div className="app">
          <Navigation 
            cartCount={cartCount} 
            user={user} 
            openAuth={() => setAuthOpen(true)}
            handleLogout={handleLogout}
          />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/history" element={<History />} />
              <Route path="/business" element={<Business />} />
              <Route path="/business/history" element={<BusinessHistory />} />
              <Route path="/business/analytics" element={<BusinessAnalytics />} />
              <Route path="/kitchen" element={<Kitchen />} />
            </Routes>
          </main>

          {toast.show && (
            <div className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          )}

          <footer className="footer">
            <p>&copy; 2026 Ordering System | Full-Stack Restaurant Order Management</p>
          </footer>

          {authOpen && (
            <div className="auth-modal">
              <div className="auth-card">
                <div className="auth-header">
                  <h3>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h3>
                  <button className="close-btn" onClick={() => setAuthOpen(false)}>✕</button>
                </div>
                <p className="auth-subtitle">
                  {authMode === 'login' 
                    ? 'Sign in to view your order history.' 
                    : 'Create an account to save your orders.'}
                </p>
                {authError && (
                  <div className="auth-error">{authError}</div>
                )}
                <form onSubmit={handleAuthSubmit} className="auth-form">
                  {authMode === 'signup' && (
                    <input
                      type="text"
                      placeholder="Full name"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      required
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className={authForm.email && !validateEmailFormat(authForm.email) ? 'input-error' : ''}
                    required
                  />
                  {authForm.email && !validateEmailFormat(authForm.email) && (
                    <div className="validation-hint error">Please enter a valid email address</div>
                  )}
                  <input
                    type="password"
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    onFocus={() => authMode === 'signup' && setShowPasswordReqs(true)}
                    required
                  />
                  {authMode === 'signup' && showPasswordReqs && (
                    <div className="password-requirements">
                      <div className="req-title">Password must contain:</div>
                      <div className={`req-item ${getPasswordStrength().length ? 'valid' : ''}`}>
                        ✓ At least 8 characters
                      </div>
                      <div className={`req-item ${getPasswordStrength().lowercase ? 'valid' : ''}`}>
                        ✓ One lowercase letter
                      </div>
                      <div className={`req-item ${getPasswordStrength().uppercase ? 'valid' : ''}`}>
                        ✓ One uppercase letter
                      </div>
                      <div className={`req-item ${getPasswordStrength().number ? 'valid' : ''}`}>
                        ✓ One number
                      </div>
                      <div className={`req-item ${getPasswordStrength().special ? 'valid' : ''}`}>
                        ✓ One special character (!@#$%...)
                      </div>
                    </div>
                  )}
                  <button type="submit" className="auth-submit" disabled={authLoading}>
                    {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}
                  </button>
                </form>
                <div className="auth-toggle">
                  {authMode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button 
                        type="button" 
                        className="toggle-link" 
                        onClick={() => {
                          setAuthMode('signup')
                          setAuthError('')
                        }}
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        className="toggle-link" 
                        onClick={() => {
                          setAuthMode('login')
                          setAuthError('')
                        }}
                      >
                        Log in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
