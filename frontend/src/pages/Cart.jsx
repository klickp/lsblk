import React, { useState, useEffect } from 'react'
import './Cart.css'
import apiClient from '../services/api'

export default function Cart() {
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    const updatedCart = cart.map(item =>
      item.item_id === itemId ? { ...item, quantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.item_id !== itemId)
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setMessage('Please enter your name')
      return
    }

    if (cart.length === 0) {
      setMessage('Your cart is empty')
      return
    }

    setIsLoading(true)
    try {
      const orderData = {
        customer_name: customerName,
        items: cart.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_price: getTotalPrice(),
        notes,
      }

      const response = await apiClient.post('/orders', orderData)

      if (response.data.success) {
        setMessage(`✅ Order #${response.data.orderId} created successfully!`)
        setCart([])
        localStorage.removeItem('cart')
        setCustomerName('')
        setNotes('')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('❌ Failed to create order: ' + error.message)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    if (window.confirm('Clear your cart?')) {
      setCart([])
      localStorage.removeItem('cart')
    }
  }

  return (
    <div className="cart-container">
      <h1>🛒 Shopping Cart</h1>

      {message && (
        <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <a href="/">Browse menu</a>
            </div>
          ) : (
            <>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.item_id}>
                      <td className="item-name">{item.name}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.item_id, parseInt(e.target.value))
                          }
                          className="quantity-input"
                        />
                      </td>
                      <td className="subtotal">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeItem(item.item_id)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="cart-actions">
                <button onClick={clearCart} className="btn-secondary">
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="checkout-panel">
            <h3>Order Summary</h3>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%):</span>
              <span>${(getTotalPrice() * 0.1).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${(getTotalPrice() * 1.1).toFixed(2)}</span>
            </div>

            <div className="checkout-form">
              <input
                type="text"
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
              />

              <textarea
                placeholder="Special instructions (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
              />

              <button
                onClick={handleCheckout}
                disabled={isLoading || cart.length === 0}
                className="btn-checkout"
              >
                {isLoading ? '⏳ Processing...' : '✓ Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
