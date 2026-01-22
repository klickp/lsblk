import React, { useState, useEffect } from 'react'
import './Menu.css'
import apiClient from '../services/api'

export default function Menu() {
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
    try {
      const [categoriesRes, menuRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/menu')
      ])
      
      setCategories(categoriesRes.data.data || [])
      setMenu(menuRes.data.data || [])
      setError(null)
    } catch (err) {
      setError('Failed to load menu. Please refresh the page.')
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

  return (
    <div className="menu-container">
      <h1>🍽️ Our Menu</h1>

      {!loading && categories.length > 0 && (
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
      )}

      {renderMenuContent()}
    </div>
  )
}
