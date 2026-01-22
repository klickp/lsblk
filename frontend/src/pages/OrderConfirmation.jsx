import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import './OrderConfirmation.css'

export default function OrderConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orderDetails, setOrderDetails] = useState(null)

  useEffect(() => {
    if (!location.state?.orderId) {
      // Redirect if no order ID
      navigate('/menu')
      return
    }

    setOrderDetails(location.state.orderDetails || {
      orderId: location.state.orderId,
      orderType: location.state.orderType || 'delivery',
      totalAmount: location.state.totalAmount || 0,
      estimatedTime: location.state.estimatedTime || '30-45 minutes'
    })
  }, [location, navigate])

  if (!orderDetails) {
    return null
  }

  const formatOrderId = (id) => {
    return String(id).padStart(6, '0')
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        {/* Success Icon */}
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>

        {/* Main Message */}
        <h1>Order Confirmed!</h1>
        <p className="confirmation-subtitle">
          Thank you for your order. We're preparing it now!
        </p>

        {/* Order Details Box */}
        <div className="order-info-box">
          <div className="order-number">
            <span className="label">Order Number</span>
            <span className="value">#{formatOrderId(orderDetails.orderId)}</span>
          </div>

          <div className="order-type-badge">
            {orderDetails.orderType === 'delivery' ? (
              <>
                <span className="icon">🚚</span>
                <span>Delivery</span>
              </>
            ) : (
              <>
                <span className="icon">🏪</span>
                <span>Pickup</span>
              </>
            )}
          </div>

          <div className="estimated-time">
            <span className="icon">⏱️</span>
            <div>
              <div className="time-label">Estimated Time</div>
              <div className="time-value">{orderDetails.estimatedTime}</div>
            </div>
          </div>

          {orderDetails.orderType === 'delivery' && (
            <div className="delivery-note">
              <span className="icon">📍</span>
              <p>Your order will be delivered to the address provided</p>
            </div>
          )}

          {orderDetails.orderType === 'pickup' && (
            <div className="pickup-note">
              <span className="icon">📍</span>
              <div>
                <p className="pickup-address">
                  <strong>Pickup Location:</strong><br />
                  123 Pizza Street<br />
                  New York, NY 10001
                </p>
                <p className="pickup-instructions">
                  Please show your order number when you arrive
                </p>
              </div>
            </div>
          )}

          <div className="total-amount">
            <span>Total Paid</span>
            <span className="amount">${orderDetails.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div className="email-note">
          📧 A confirmation email has been sent to your email address
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link to="/history" className="btn-secondary">
            View Order History
          </Link>
          <Link to="/menu" className="btn-primary">
            Order Again
          </Link>
        </div>

        {/* Order Status Track */}
        <div className="status-track">
          <h3>Order Status</h3>
          <div className="status-steps">
            <div className="step active">
              <div className="step-circle">✓</div>
              <div className="step-label">Order Placed</div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-circle">2</div>
              <div className="step-label">Preparing</div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-circle">3</div>
              <div className="step-label">
                {orderDetails.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
              </div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-circle">4</div>
              <div className="step-label">Completed</div>
            </div>
          </div>
          <p className="track-note">
            Track your order status in <Link to="/history">Order History</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
