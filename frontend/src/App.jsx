import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import History from './pages/History'

function App() {
  const [cartCount, setCartCount] = useState(0)

  React.useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(count)
    }

    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    return () => window.removeEventListener('storage', updateCartCount)
  }, [])

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              🍽️ Ordering System
            </Link>
            <div className="nav-menu">
              <Link to="/" className="nav-link">
                🍕 Menu
              </Link>
              <Link to="/cart" className="nav-link cart-link">
                🛒 Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/history" className="nav-link">
                📊 History
              </Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2026 Ordering System | Full-Stack Restaurant Order Management</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
