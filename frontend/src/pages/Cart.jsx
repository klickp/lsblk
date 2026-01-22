import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Cart.css'
import { orderApi, promoApi } from '../services/api'
import { AuthContext } from '../App'

export default function Cart() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, openAuth } = useContext(AuthContext)
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState('delivery') // 'delivery' or 'pickup'

  useEffect(() => {
    loadCart()
    if (user) {
      setCustomerName((prev) => prev || user.name)
      setCustomerEmail((prev) => prev || user.email)
    }
    
    // Auto-fill promo code if passed from navigation state
    if (location.state?.promoCode && !appliedPromo) {
      setPromoCode(location.state.promoCode)
      // Auto-apply the promo code after a short delay
      setTimeout(() => {
        handleApplyPromo(location.state.promoCode)
      }, 500)
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [user, location.state])

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
    // No delivery fee for pickup
    if (deliveryMethod === 'pickup') {
      return 0
    }
    // Check if FREESHIP promo is applied
    if (appliedPromo && appliedPromo.type === 'delivery') {
      return 0
    }
    return getSubtotal() > 20 ? 0 : 2.99 // Free delivery over $20
  }

  const getDiscount = () => {
    return appliedPromo ? appliedPromo.discountAmount : 0
  }

  const getTotalPrice = () => {
    return getSubtotal() + getTax() + getDeliveryFee() - getDiscount()
  }

  const handleApplyPromo = async (codeToApply) => {
    const code = codeToApply || promoCode
    if (!code.trim()) {
      setPromoError('Please enter a promo code')
      return
    }

    setPromoLoading(true)
    setPromoError('')

    try {
      const response = await promoApi.validate(code.trim(), getSubtotal())

      if (response.data.success) {
        setAppliedPromo(response.data.data)
        setPromoError('')
        setPromoCode('')
        
        // Show success toast
        const event = new CustomEvent('showToast', {
          detail: { message: `Promo applied! -$${response.data.data.discountAmount.toFixed(2)}`, type: 'success' }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Promo error:', error)
      const errorMsg = error.response?.data?.error || 'Invalid promo code'
      setPromoError(errorMsg)
      setAppliedPromo(null)
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
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
        notes: `${deliveryMethod === 'pickup' ? '[PICKUP] ' : ''}${notes}`,
        payment_method: 'cash', // Bypass payment for now
      }

      const response = await orderApi.createOrder(orderData)

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
      console.error('Order error:', error)
      
      // Extract detailed error message
      let errorMessage = '❌ Failed to create order. '
      
      if (error.response) {
        // Backend returned an error response
        const backendError = error.response.data?.error || error.response.data?.message
        
        if (backendError) {
          errorMessage += backendError
        } else if (error.response.status === 400) {
          errorMessage += 'Invalid order data. Please check your information.'
        } else if (error.response.status === 401) {
          errorMessage += 'Authentication required. Please log in.'
        } else if (error.response.status === 500) {
          errorMessage += 'Server error. Please try again later.'
        } else {
          errorMessage += `Error ${error.response.status}. Please try again.`
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'Cannot connect to server. Please check your internet connection.'
      } else {
        // Something else went wrong
        errorMessage += error.message || 'Please try again.'
      }
      
      setMessage(errorMessage)
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

        {/* Always show checkout panel, even when cart is empty */}
        <div className="checkout-panel">
          <h3>Order Summary</h3>

          {/* Promo Code Section */}
          <div className="promo-section">
            <div className="promo-input-group">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                className="promo-input"
                disabled={appliedPromo !== null}
              />
              {appliedPromo ? (
                <button onClick={handleRemovePromo} className="promo-btn remove">
                  ✕
                </button>
              ) : (
                <button 
                  onClick={handleApplyPromo} 
                  disabled={promoLoading}
                  className="promo-btn apply"
                >
                  {promoLoading ? '...' : 'Apply'}
                </button>
              )}
            </div>
            {promoError && <div className="promo-error">❌ {promoError}</div>}
            {appliedPromo && (
              <div className="promo-success">
                ✅ {appliedPromo.description}
              </div>
            )}
          </div>

          {/* Delivery Method Selection */}
          <div className="delivery-method-section">
            <h4>Order Type</h4>
            <div className="delivery-options">
              <label className={`delivery-option ${deliveryMethod === 'delivery' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span className="option-icon">🚚</span>
                <span className="option-label">Delivery</span>
              </label>
              <label className={`delivery-option ${deliveryMethod === 'pickup' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span className="option-icon">🏪</span>
                <span className="option-label">Pickup</span>
              </label>
            </div>
          </div>

          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${getSubtotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (8%):</span>
            <span>${getTax().toFixed(2)}</span>
          </div>
          {deliveryMethod === 'delivery' && (
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
          )}
          {appliedPromo && (
            <div className="summary-row discount">
              <span>Discount ({appliedPromo.code}):</span>
              <span className="discount-amount">-${getDiscount().toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total:</span>
            <span>${getTotalPrice().toFixed(2)}</span>
          </div>

          {deliveryMethod === 'delivery' && getSubtotal() < 20 && getSubtotal() > 0 && (
            <div className="delivery-notice">
              Add ${(20 - getSubtotal()).toFixed(2)} more for free delivery!
            </div>
          )}

          {cart.length > 0 ? (
            <div className="checkout-form">
              <button
                onClick={() => {
                  // Save order type and applied promo to localStorage for checkout page
                  localStorage.setItem('orderType', deliveryMethod)
                  if (appliedPromo) {
                    localStorage.setItem('appliedPromo', JSON.stringify(appliedPromo))
                  }
                  navigate('/checkout')
                }}
                disabled={cart.length === 0}
                className="btn-checkout"
              >
                Proceed to Checkout - ${getTotalPrice().toFixed(2)}
              </button>
              {!user && (
                <button type="button" className="login-under" onClick={openAuth}>
                  Log in to save history
                </button>
              )}
            </div>
          ) : (
            <div className="empty-cart-notice">
              <p>Add items to your cart to checkout</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
