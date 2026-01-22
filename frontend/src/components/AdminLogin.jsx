import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

export default function AdminLogin({ children, pageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (username === 'root' && password === 'root') {
      sessionStorage.setItem('adminAuth', 'true')
      setIsAuthenticated(true)
    } else {
      setError('Invalid username or password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <h2>🔒 {pageName} Access</h2>
          <p className="login-subtitle">Staff authentication required</p>
          
          {error && <div className="login-error">{error}</div>}
          
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="login-submit">
              Sign In
            </button>
          </form>
          
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header-bar">
        <span className="admin-user">Logged in as: root</span>
        <button onClick={handleLogout} className="admin-logout">
          Logout
        </button>
      </div>
      {children}
    </div>
  )
}
