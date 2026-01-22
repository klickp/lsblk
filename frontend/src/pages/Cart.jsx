import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Cart.css'
import apiClient from '../services/api'
import { AuthContext } from '../App'

export default function Cart() {
  const navigate = useNavigate()
  const { user, openAuth } = useContext(AuthContext)
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCart()
    if (user) {
      setCustomerName((prev) => prev || user.name)
      setCustomerEmail((prev) => prev || user.email)
    }
  }, [user])

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
    window.dispatchEvent(new Event('storage'))
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTax = () => {
    return getSubtotal() * 0.08 // 8% tax
  }

  const getDeliveryFee = () => {
    return getSubtotal() > 20 ? 0 : 2.99 // Free delivery over $20
  }

  const getTotalPrice = () => {
    return getSubtotal() + getTax() + getDeliveryFee()
  }

  const handleCheckout = async () => {
    const finalName = customerName.trim() || user?.name || ''
    const finalEmail = customerEmail.trim() || user?.email || ''

    if (!finalName) {
      setMessage('Please enter your name')
      return
    }

    if (cart.length === 0) {
      setMessage('Your cart is empty')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const subtotal = getSubtotal()
      const tax = getTax()
      const deliveryFee = getDeliveryFee()
      const total = getTotalPrice()

      const orderData = {
        customer_name: finalName,
        customer_email: finalEmail || null,
        items: cart.map(item => ({
          item_id: item.item_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: subtotal,
        tax_amount: tax,
        delivery_fee: deliveryFee,
        total_price: total,
        notes: notes,
        payment_method: 'cash', // Bypass payment for now
      }

      const response = await apiClient.post('/orders', orderData)

      if (response.data.success) {
        setMessage(`✅ Order #${response.data.orderId} placed successfully! Your order is being prepared.`)
        setCart([])
        localStorage.removeItem('cart')
        localStorage.setItem('cart', JSON.stringify([])) // Clear cart
        window.dispatchEvent(new Event('storage'))
        setCustomerName(user?.name || '')
        setCustomerEmail(user?.email || '')
        setNotes('')
        
        // Show success toast
        const event = new CustomEvent('showToast', {
          detail: { message: `Order #${response.data.orderId} confirmed!`, type: 'success' }
        })
        window.dispatchEvent(event)
        
        setTimeout(() => {
          setMessage('')
          navigate('/history')
        }, 2000)
      }
    } catch (error) {
      setMessage('❌ Failed to create order. Please try again.')
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
      <div className="cart-header">
        <h1>🛒 Shopping Cart</h1>
      </div>

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
              <Link to="/" className="browse-menu-btn">Browse Menu</Link>
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
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%):</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee:</span>
              <span>
                {getDeliveryFee() === 0 ? (
                  <span className="free-delivery">FREE</span>
                ) : (
                  `$${getDeliveryFee().toFixed(2)}`
                )}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>

            {getSubtotal() < 20 && getSubtotal() > 0 && (
              <div className="delivery-notice">
                Add ${(20 - getSubtotal()).toFixed(2)} more for free delivery!
              </div>
            )}

            <div className="checkout-form">
              <input
                type="text"
                placeholder="Your Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
                required
              />
              <input
                type="email"
                placeholder="Email (for history)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="form-input"
              />
              <textarea
                placeholder="Special instructions (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
                rows="3"
              />
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="btn-checkout"
              >
                {isLoading ? 'Processing...' : `Place Order - $${getTotalPrice().toFixed(2)}`}
              </button>
              {!user && (
                <button type="button" className="login-under" onClick={openAuth}>
                  Log in to save history
                </button>
              )}
              <p className="payment-note">💵 Pay with cash on delivery</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
