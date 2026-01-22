import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { orderApi, paymentApi } from '../services/api'
import './Checkout.css'

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Get order type from localStorage (set in Cart)
  const [orderType, setOrderType] = useState(localStorage.getItem('orderType') || 'delivery')
  const [appliedPromo, setAppliedPromo] = useState(JSON.parse(localStorage.getItem('appliedPromo') || 'null'))

  // Customer Information
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: ''
  })

  // Delivery Address
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  // Payment Information (for Square)
  const [cardNonce, setCardNonce] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [squareLoaded, setSquareLoaded] = useState(false)
  
  // Special instructions
  const [specialInstructions, setSpecialInstructions] = useState('')

  useEffect(() => {
    loadCart()
    loadSquarePaymentForm()
  }, [])

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (savedCart.length === 0) {
      navigate('/cart')
      return
    }
    setCart(savedCart)
  }

  const loadSquarePaymentForm = async () => {
    // Load Square Payment Form SDK
    if (window.Square) {
      initializeSquarePaymentForm()
    } else {
      const script = document.createElement('script')
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'
      script.onload = () => initializeSquarePaymentForm()
      script.onerror = () => {
        setPaymentError('Failed to load payment processor. Please refresh the page.')
      }
      document.body.appendChild(script)
    }
  }

  const initializeSquarePaymentForm = async () => {
    try {
      if (!window.Square) {
        throw new Error('Square.js failed to load')
      }

      const payments = window.Square.payments(
        process.env.REACT_APP_SQUARE_APP_ID || 'sandbox-sq0idb-YOUR_APP_ID',
        process.env.REACT_APP_SQUARE_LOCATION_ID || 'YOUR_LOCATION_ID'
      )

      const card = await payments.card()
      await card.attach('#card-container')
      
      window.squareCard = card
      setSquareLoaded(true)
    } catch (e) {
      console.error('Square initialization error:', e)
      setPaymentError('Payment system not configured. Using test mode.')
      setSquareLoaded(true) // Allow test mode
    }
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTax = () => {
    return getSubtotal() * 0.08
  }

  const getDeliveryFee = () => {
    if (orderType === 'pickup') return 0
    if (appliedPromo?.type === 'delivery') return 0
    const subtotal = getSubtotal()
    return subtotal >= 20 ? 0 : 2.99
  }

  const getDiscount = () => {
    return appliedPromo ? appliedPromo.discountAmount : 0
  }

  const getTotalPrice = () => {
    return getSubtotal() + getTax() + getDeliveryFee() - getDiscount()
  }

  const handleInputChange = (section, field, value) => {
    if (section === 'customer') {
      setCustomerInfo(prev => ({ ...prev, [field]: value }))
    } else if (section === 'address') {
      setDeliveryAddress(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateForm = () => {
    // Validate customer info
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim()) {
      setError('Please enter your full name')
      return false
    }
    if (!customerInfo.email.trim() || !/\S+@\S+\.\S+/.test(customerInfo.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!customerInfo.phone.trim() || customerInfo.phone.length < 10) {
      setError('Please enter a valid phone number')
      return false
    }

    // Validate delivery address if delivery order
    if (orderType === 'delivery') {
      if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim() || 
          !deliveryAddress.state.trim() || !deliveryAddress.zipCode.trim()) {
        setError('Please complete your delivery address')
        return false
      }
      if (deliveryAddress.zipCode.length < 5) {
        setError('Please enter a valid zip code')
        return false
      }
    }

    setError('')
    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')
    setPaymentError('')

    try {
      let paymentNonce = cardNonce

      // Generate payment nonce from Square
      if (window.squareCard && !paymentNonce) {
        const tokenResult = await window.squareCard.tokenize()
        if (tokenResult.status === 'OK') {
          paymentNonce = tokenResult.token
        } else {
          throw new Error('Payment card validation failed: ' + (tokenResult.errors?.[0]?.message || 'Unknown error'))
        }
      } else if (!paymentNonce) {
        // Test mode - generate fake nonce
        paymentNonce = 'TEST_NONCE_' + Date.now()
      }

      // Prepare order data
      const orderData = {
        orderType,
        customerInfo,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
        items: cart.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.price
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        deliveryFee: getDeliveryFee(),
        discount: getDiscount(),
        totalAmount: getTotalPrice(),
        promoCode: appliedPromo?.code || null,
        specialInstructions,
        paymentNonce
      }

      // Submit order
      const response = await paymentApi.process(orderData)

      if (response.data.success) {
        // Clear cart and promo
        localStorage.removeItem('cart')
        localStorage.removeItem('appliedPromo')
        localStorage.removeItem('orderType')
        window.dispatchEvent(new Event('storage'))

        // Navigate to confirmation page
        navigate('/order-confirmation', {
          state: {
            orderId: response.data.orderId,
            orderDetails: response.data.orderDetails
          }
        })
      } else {
        throw new Error(response.data.message || 'Order placement failed')
      }
    } catch (err) {
      console.error('Order placement error:', err)
      setError(err.message || 'Failed to process order. Please try again.')
      setPaymentError(err.message || '')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-left">
          <h1>Checkout</h1>

          {error && <div className="error-banner">{error}</div>}

          {/* Order Type Display */}
          <div className="section">
            <h2>Order Type</h2>
            <div className="order-type-display">
              {orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              <button 
                className="change-btn"
                onClick={() => navigate('/cart')}
              >
                Change
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="section">
            <h2>Contact Information</h2>
            <div className="form-grid">
              <input
                type="text"
                placeholder="First Name"
                value={customerInfo.firstName}
                onChange={(e) => handleInputChange('customer', 'firstName', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={customerInfo.lastName}
                onChange={(e) => handleInputChange('customer', 'lastName', e.target.value)}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={customerInfo.email}
              onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerInfo.phone}
              onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
              required
            />
          </div>

          {/* Delivery Address - only show for delivery orders */}
          {orderType === 'delivery' && (
            <div className="section">
              <h2>Delivery Address</h2>
              <input
                type="text"
                placeholder="Street Address"
                value={deliveryAddress.street}
                onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                required
              />
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="City"
                  value={deliveryAddress.city}
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={deliveryAddress.state}
                  onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Zip Code"
                value={deliveryAddress.zipCode}
                onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                required
              />
            </div>
          )}

          {/* Special Instructions */}
          <div className="section">
            <h2>Special Instructions (Optional)</h2>
            <textarea
              placeholder="Any special requests for your order?"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows="3"
            />
          </div>

          {/* Payment Information */}
          <div className="section">
            <h2>Payment Information</h2>
            {paymentError && <div className="payment-error">{paymentError}</div>}
            <div id="card-container" className="card-container">
              {/* Square payment form will be injected here */}
            </div>
            {!squareLoaded && <div className="payment-loading">Loading payment form...</div>}
          </div>
        </div>

        {/* Order Summary - Right Side */}
        <div className="checkout-right">
          <div className="order-summary-sticky">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.item_id} className="summary-item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-line">
              <span>Subtotal</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>

            <div className="summary-line">
              <span>Tax (8%)</span>
              <span>${getTax().toFixed(2)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="summary-line">
                <span>Delivery Fee</span>
                <span>{getDeliveryFee() === 0 ? 'FREE' : `$${getDeliveryFee().toFixed(2)}`}</span>
              </div>
            )}

            {appliedPromo && (
              <div className="summary-line promo-line">
                <span>Promo: {appliedPromo.code}</span>
                <span>-${getDiscount().toFixed(2)}</span>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>

            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Place Order - $${getTotalPrice().toFixed(2)}`}
            </button>

            <button
              className="back-to-cart-btn"
              onClick={() => navigate('/cart')}
            >
              ← Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
