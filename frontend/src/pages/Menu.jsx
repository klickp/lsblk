import React, { useState, useEffect } from 'react'
import './Menu.css'
import apiClient from '../services/api'

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [menu, setMenu] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchMenu()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories')
      setCategories(response.data.data)
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    }
  }

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/menu')
      setMenu(response.data.data)
    } catch (err) {
      setError('Failed to load menu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getItemsByCategory = (categoryId) => {
    return menu.filter(item => item.category_id === categoryId)
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
    alert(`${item.name} added to cart!`)
    window.dispatchEvent(new Event('storage'))
  }

  const renderMenuItem = (item) => (
    <div key={item.item_id} className="menu-item-card">
      <div className="item-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} />
        ) : (
          <div className="placeholder">🍕</div>
        )}
      </div>
      <h4>{item.name}</h4>
      <p className="description">{item.description}</p>
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
  )

  const renderItems = () => {
    if (selectedCategory === null) {
      // Show all categories
      return categories.map(category => {
        const items = getItemsByCategory(category.category_id)
        if (items.length === 0) return null
        
        return (
          <div key={category.category_id} className="category-section">
            <h2 className="category-title">{category.name}</h2>
            <div className="items-grid">
              {items.map(item => renderMenuItem(item))}
            </div>
          </div>
        )
      })
    } else {
      // Show selected category only
      const category = categories.find(c => c.category_id === selectedCategory)
      const items = getItemsByCategory(selectedCategory)
      
      if (!category || items.length === 0) {
        return <p className="loading">No items in this category</p>
      }
      
      return (
        <div className="category-section">
          <h2 className="category-title">{category.name}</h2>
          <div className="items-grid">
            {items.map(item => renderMenuItem(item))}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="menu-container">
      <h1>🍽️ Our Menu</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.category_id}
            className={`category-tab ${selectedCategory === cat.category_id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.category_id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading">Loading menu...</p>
      ) : menu.length === 0 ? (
        <p className="loading">No menu items available</p>
      ) : (
        <div className="menu-sections">
          {renderItems()}
        </div>
      )}
    </div>
  )
}
}
