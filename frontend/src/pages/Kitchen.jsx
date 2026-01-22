import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Kitchen.css'
import apiClient from '../services/api'
import AdminLogin from '../components/AdminLogin'

function KitchenContent() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchOrders()
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders', {
        params: { status: 'pending,preparing,ready' }
      })
      
      const ordersData = response.data.data || []
      // Sort by created_at, newest first
      const sorted = ordersData.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setOrders(sorted)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true)
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus })
      await fetchOrders()
    } catch (err) {
      console.error('Failed to update order status:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      preparing: '#ff9800',
      ready: '#8bc34a',
      completed: '#4caf50'
    }
    return colors[status] || '#999'
  }

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    }
    return flow[currentStatus]
  }

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Complete'
    }
    return labels[currentStatus]
  }

  const getTimeElapsed = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m ago`
  }

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <div className="header-left">
          <h1>🍳 Kitchen Display</h1>
          <Link to="/history" className="history-link">📊 Order History</Link>
        </div>
        <div className="header-actions">
          <button 
            onClick={fetchOrders} 
            className="refresh-btn"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <div className="order-count">
            {orders.length} Active Order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="empty-kitchen">
            <p>No active orders</p>
            <p className="empty-subtitle">Orders will appear here automatically</p>
          </div>
        ) : (
          orders.map(order => (
            <div 
              key={order.order_id} 
              className={`order-card status-${order.status}`}
              style={{ borderLeftColor: getStatusColor(order.status) }}
            >
              <div className="order-card-header">
                <div className="order-number">Order #{order.order_id}</div>
                <div className="order-time">{getTimeElapsed(order.created_at)}</div>
              </div>

              <div className="order-customer">
                <strong>{order.customer_name}</strong>
                {order.customer_phone && <span className="phone">{order.customer_phone}</span>}
              </div>

              <div 
                className="order-status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status.toUpperCase()}
              </div>

              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="item-line">
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-name">{item.item_name || item.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="item-line">No items listed</div>
                )}
              </div>

              {order.notes && (
                <div className="order-notes">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}

              <div className="order-total">
                Total: ${order.total_price.toFixed(2)}
              </div>

              {order.status !== 'completed' && (
                <button
                  onClick={() => updateOrderStatus(order.order_id, getNextStatus(order.status))}
                  className="status-action-btn"
                  disabled={loading}
                >
                  {getNextStatusLabel(order.status)}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Kitchen() {
  return (
    <AdminLogin pageName="Kitchen Display">
      <KitchenContent />
    </AdminLogin>
  )
}
