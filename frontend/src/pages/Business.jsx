import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Business.css'
import { menuApi, categoryApi, orderApi } from '../services/api'
import AdminLogin from '../components/AdminLogin'

function BusinessContent() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [quantities, setQuantities] = useState({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      const [categoriesData, menuData] = await Promise.all([
        categoryApi.getCategories(),
        menuApi.getMenu()
      ])
      setCategories(categoriesData.data || [])
      setMenu(menuData.data || [])
    } catch (err) {
      console.error('Menu loading error:', err)
    }
  }

  const handleQuantityChange = (itemId, value) => {
    const qty = parseInt(value) || 0
    const item = menu.find(i => i.item_id === itemId)
    const stock = item?.stock || 50 // Default stock if not specified
    
    if (qty > stock) {
      setMessage(`⚠️ Only ${stock} ${item.name} available in stock`)
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: qty
    }))
  }

  const incrementQuantity = (itemId) => {
    const currentQty = quantities[itemId] || 0
    const item = menu.find(i => i.item_id === itemId)
    const stock = item?.stock || 50
    
    if (currentQty >= stock) {
      setMessage(`⚠️ Only ${stock} ${item.name} available in stock`)
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    handleQuantityChange(itemId, currentQty + 1)
  }

  const decrementQuantity = (itemId) => {
    const currentQty = quantities[itemId] || 0
    if (currentQty > 0) {
      handleQuantityChange(itemId, currentQty - 1)
    }
  }

  const removeItem = (itemId) => {
    setQuantities(prev => {
      const newQuantities = { ...prev }
      delete newQuantities[itemId]
      return newQuantities
    })
  }

  const getOrderItems = () => {
    return menu
      .filter(item => quantities[item.item_id] > 0)
      .map(item => ({
        item_id: item.item_id,
        name: item.name,
        quantity: quantities[item.item_id],
        price: item.price
      }))
  }

  const calculateTotal = () => {
    const items = getOrderItems()
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.08
    // Only charge delivery fee if there are items and subtotal is not > $20
    const deliveryFee = items.length === 0 ? 0 : (subtotal > 20 ? 0 : 2.99)
    return {
      subtotal,
      tax,
      deliveryFee,
      total: subtotal + tax + deliveryFee
    }
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    
    const items = getOrderItems()
    if (items.length === 0) {
      setMessage('Please add at least one item')
      return
    }

    if (!customerName.trim()) {
      setMessage('Please enter customer name')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const totals = calculateTotal()
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone || null,
        items,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        delivery_fee: totals.deliveryFee,
        total_price: totals.total,
        notes: notes
      }

      const response = await orderApi.createOrder(orderData)

      if (response.data.success) {
        setMessage(`✓ Order #${response.data.orderId} placed successfully!`)
        setQuantities({})
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('✗ Failed to create order')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuantities({})
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setMessage('')
  }

  const totals = calculateTotal()

  return (
    <div className="business-container">
      <div className="business-header">
        <div className="header-left">
          <h1>📋 Business Ordering</h1>
        </div>
        <div className="quick-stats">
          <span className="stat">Items: {getOrderItems().length}</span>
          <span className="stat">Total: ${totals.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <Link to="/business/history" className="nav-link" title="View all orders">
          📊
        </Link>
        <Link to="/business/analytics" className="nav-link" title="Business Analytics">
          📈
        </Link>
      </div>

      {message && (
        <div className={`biz-message ${message.startsWith('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="business-layout">
        <div className="menu-section">
          {categories.map(category => {
            const categoryItems = menu.filter(item => item.category_id === category.category_id)
            if (categoryItems.length === 0) return null

            return (
              <div key={category.category_id} className="category-section">
                <h3 className="category-label">{category.name}</h3>
                <div className="items-grid">
                  {categoryItems.map(item => {
                    const qty = quantities[item.item_id] || 0
                    const stock = item.stock || 50
                    const isLowStock = stock < 10
                    
                    return (
                      <div key={item.item_id} className="item-card">
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">${item.price.toFixed(2)}</span>
                          <span className={`item-stock ${isLowStock ? 'low' : ''}`}>
                            Stock: {stock}
                          </span>
                        </div>
                        <div className="qty-controls">
                          <button 
                            onClick={() => decrementQuantity(item.item_id)}
                            className="qty-btn minus"
                            disabled={qty === 0}
                          >
                            −
                          </button>
                          <span className="qty-display">{qty}</span>
                          <button 
                            onClick={() => incrementQuantity(item.item_id)}
                            className="qty-btn plus"
                            disabled={qty >= stock}
                          >
                            +
                          </button>
                          {qty > 0 && (
                            <button 
                              onClick={() => removeItem(item.item_id)}
                              className="qty-btn delete"
                              title="Remove from order"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="order-panel">
          <h3>Order Details</h3>
          
          <form onSubmit={handleSubmitOrder}>
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="form-input"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="form-input"
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              rows="2"
            />

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax (8%):</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Delivery:</span>
                <span>{totals.deliveryFee === 0 ? 'FREE' : `$${totals.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="total-row grand">
                <span>Total:</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="action-buttons">
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Submitting...' : 'Submit Order'}
              </button>
              <button type="button" onClick={handleClear} className="btn-clear">
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Business() {
  return (
    <AdminLogin pageName="Business Ordering">
      <BusinessContent />
    </AdminLogin>
  )
}
