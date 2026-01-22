import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Kitchen.css'
import { orderApi } from '../services/api'
import AdminLogin from '../components/AdminLogin'

function KitchenContent() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [filter, setFilter] = useState('all') // all, pending, preparing, ready

  useEffect(() => {
    fetchOrders()
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const playNotificationSound = () => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1/jPdykEK3vJ79+OPgsWYLLp7alWEgpBoeLwwW0hBDGP1/PSdigEKHnF8N6PQQsVXLLq7apYEQc/oe...')
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors if sound fails
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getOrders({
        status: 'pending,preparing,ready'
      })
      
      const ordersData = response.data || []
      
      // Check for new orders
      if (ordersData.length > lastOrderCount && lastOrderCount > 0) {
        playNotificationSound()
      }
      setLastOrderCount(ordersData.length)
      
      // Sort by priority: pending first, then by time
      const sorted = ordersData.sort((a, b) => {
        // Priority order: pending > preparing > ready
        const statusPriority = { pending: 3, preparing: 2, ready: 1 }
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[b.status] - statusPriority[a.status]
        }
        // Within same status, oldest first
        return new Date(a.created_at) - new Date(b.created_at)
      })
      setOrders(sorted)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true)
    try {
      await orderApi.updateOrderStatus(orderId, newStatus)
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

  const isOrderUrgent = (createdAt, status) => {
    const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000)
    if (status === 'pending' && diffMins > 5) return true
    if (status === 'preparing' && diffMins > 20) return true
    if (status === 'ready' && diffMins > 10) return true
    return false
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <div className="header-left">
          <h1>🍳 Kitchen Display</h1>
          <Link to="/history" className="history-link">📊 Order History</Link>
        </div>
        <div className="header-actions">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({orders.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
              onClick={() => setFilter('preparing')}
            >
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'ready' ? 'active' : ''}`}
              onClick={() => setFilter('ready')}
            >
              Ready ({orders.filter(o => o.status === 'ready').length})
            </button>
          </div>
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
            Auto-refresh
          </label>
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            🔔 Sound
          </label>
          <div className="order-count">
            {orders.length} Active Order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="empty-kitchen">
            <p>🍽️ No {filter !== 'all' ? filter : 'active'} orders</p>
            <p className="empty-subtitle">Orders will appear here automatically</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isUrgent = isOrderUrgent(order.created_at, order.status)
            return (
              <div 
                key={order.order_id} 
                className={`order-card status-${order.status} ${isUrgent ? 'urgent' : ''}`}
                style={{ borderLeftColor: getStatusColor(order.status) }}
              >
                <div className="order-card-header">
                  <div className="order-number">
                    Order #{order.order_id}
                    {order.order_type && (
                      <span className={`order-type-badge ${order.order_type}`}>
                        {order.order_type === 'delivery' ? '🚗' : '🛍️'} {order.order_type}
                      </span>
                    )}
                  </div>
                  <div className={`order-time ${isUrgent ? 'urgent-time' : ''}`}>
                    {isUrgent && '⚠️ '}{getTimeElapsed(order.created_at)}
                  </div>
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
          )}
        ))}
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
