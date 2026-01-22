import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import { menuApi, categoryApi } from '../services/api'

export default function Menu() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [menu, setMenu] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [categoriesData, menuData] = await Promise.all([
        categoryApi.getCategories(),
        menuApi.getMenu()
      ])
      
      setCategories(categoriesData.data || [])
      setMenu(menuData.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load menu. Please refresh the page.')
      console.error('Menu loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  const getFilteredItems = () => {
    if (selectedCategory === null) {
      return menu
    }
    return menu.filter(item => item.category_id === selectedCategory)
  }

  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find(i => i.item_id === item.item_id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ ...item, quantity: 1 })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
    
    // Show toast notification
    const event = new CustomEvent('showToast', {
      detail: { message: `${item.name} added to cart!`, type: 'success' }
    })
    window.dispatchEvent(event)
  }

  const renderCategorySection = (category) => {
    const items = menu.filter(item => item.category_id === category.category_id)
    
    if (items.length === 0) return null

    return (
      <div key={category.category_id} className="category-section">
        <h2 className="category-title">{category.name}</h2>
        <div className="items-grid">
          {items.map(item => (
            <div key={item.item_id} className="menu-item-card">
              <div className="item-image">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="placeholder">🍕</div>
                )}
              </div>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="description">{item.description}</p>
              </div>
              <div className="item-footer">
                <span className="price">${item.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="add-btn"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMenuContent = () => {
    if (loading) {
      return <div className="loading">Loading menu...</div>
    }

    if (error) {
      return <div className="error-message">{error}</div>
    }

    if (menu.length === 0) {
      return <div className="loading">No menu items available</div>
    }

    // Show all categories when "All Items" is selected
    if (selectedCategory === null) {
      return (
        <div className="menu-sections">
          {categories.map(category => renderCategorySection(category))}
        </div>
      )
    }

    // Show selected category only
    const category = categories.find(c => c.category_id === selectedCategory)
    const filteredItems = getFilteredItems()

    if (!category) {
      return <div className="loading">Category not found</div>
    }

    if (filteredItems.length === 0) {
      return <div className="loading">No items in this category</div>
    }

    return (
      <div className="menu-sections">
        <div className="category-section">
          <h2 className="category-title">{category.name}</h2>
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.item_id} className="menu-item-card">
                <div className="item-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="placeholder">🍕</div>
                  )}
                </div>
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="description">{item.description}</p>
                </div>
                <div className="item-footer">
                  <span className="price">${item.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="add-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getFeaturedItems = () => {
    // Get first 3 items from the Pizza category or first 3 overall
    return menu.slice(0, 3)
  }

  return (
    <div className="menu-container">
      <div className="menu-hero">
        <h1>🍽️ Our Menu</h1>
        <p className="menu-subtitle">Fresh ingredients, authentic flavors, delivered to your door</p>
      </div>

      {/* Special Offers Banner */}
      {!loading && !error && menu.length > 0 && (
        <div className="offers-banner" onClick={() => navigate('/cart', { state: { promoCode: 'PIZZA2FOR1' } })}>
          <div className="offer-badge">🎉 SPECIAL</div>
          <div className="offer-text">
            <strong>Buy 2 Large Pizzas, Get 1 Medium Free!</strong>
            <span className="offer-details">Valid on online orders • Limited time • Click to apply</span>
          </div>
        </div>
      )}

      {/* Featured Best Sellers */}
      {!loading && !error && menu.length > 0 && (
        <div className="featured-section">
          <h2 className="section-heading">⭐ Customer Favorites</h2>
          <div className="featured-grid">
            {getFeaturedItems().map(item => (
              <div key={item.item_id} className="featured-item">
                <div className="featured-badge">POPULAR</div>
                <div className="item-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="placeholder">🍕</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                </div>
                <div className="item-footer">
                  <span className="price">${item.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="add-btn featured-add-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <>
          <h2 className="section-heading">Browse Full Menu</h2>
          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => handleCategoryChange(null)}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category.category_id}
                className={`category-tab ${selectedCategory === category.category_id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.category_id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </>
      )}

      {renderMenuContent()}

      {/* Footer with contact info */}
      {!loading && !error && (
        <footer className="menu-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>📍 Location</h4>
              <p>123 Pizza Street<br/>Downtown, CA 90210</p>
            </div>
            <div className="footer-section">
              <h4>📞 Contact</h4>
              <p>Phone: (555) 123-4567<br/>Email: orders@pizzeria.com</p>
            </div>
            <div className="footer-section">
              <h4>🕐 Hours</h4>
              <p>Mon-Thu: 11am - 10pm<br/>Fri-Sun: 11am - 11pm</p>
            </div>
            <div className="footer-section">
              <h4>🚚 Delivery Area</h4>
              <p>We deliver within 5 miles<br/>Free delivery over $25</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
