import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './BusinessHistory.css'
import { orderApi } from '../services/api'
import AdminLogin from '../components/AdminLogin'

function BusinessHistoryContent() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getOrders({ limit: 100 })
      if (response.success) {
        setOrders(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesCustomer = searchCustomer === '' || 
      order.customer_name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      order.customer_phone?.includes(searchCustomer)
    return matchesStatus && matchesCustomer
  })

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus)
      fetchOrders()
    } catch (err) {
      console.error('Error updating order:', err)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffc107',
      'preparing': '#ff9800',
      'ready': '#4caf50',
      'completed': '#2196f3',
      'cancelled': '#f44336'
    }
    return colors[status] || '#999'
  }

  const statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled']

  return (
    <div className="biz-history-container">
      <div className="biz-history-header">
        <div className="header-top">
          <h1>📊 Business Order History</h1>
          <Link to="/business" className="back-link">← Back to Ordering</Link>
        </div>
        <div className="header-stats">
          <span className="stat-box">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders.length}</span>
          </span>
          <span className="stat-box">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
          </span>
          <span className="stat-box">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{orders.filter(o => o.status === 'completed').length}</span>
          </span>
        </div>
      </div>

      <div className="biz-history-controls">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Orders</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Customer name, email, or phone..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={fetchOrders} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="biz-history-layout">
        <div className="orders-list">
          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.order_id}
                className={`order-item ${order.status} ${selectedOrder?.order_id === order.order_id ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-item-header">
                  <span className="order-id">Order #{order.order_id}</span>
                  <span className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="order-item-info">
                  <div>
                    <strong>{order.customer_name}</strong>
                    {order.customer_phone && <p>{order.customer_phone}</p>}
                  </div>
                  <div className="order-amount">
                    ${order.total_price?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="order-item-time">
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedOrder && (
          <div className="order-detail-panel">
            <div className="detail-header">
              <h2>Order #{selectedOrder.order_id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="detail-section">
              <h3>Customer</h3>
              <p><strong>{selectedOrder.customer_name}</strong></p>
              {selectedOrder.customer_email && <p>Email: {selectedOrder.customer_email}</p>}
              {selectedOrder.customer_phone && <p>Phone: {selectedOrder.customer_phone}</p>}
            </div>

            <div className="detail-section">
              <h3>Items</h3>
              <div className="items-list">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="item-line">
                    <span className="item-qty">×{item.quantity}</span>
                    <span className="item-desc">{item.name}</span>
                    <span className="item-total">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>Pricing</h3>
              <div className="pricing-breakdown">
                <div className="pricing-row">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pricing-row">
                  <span>Tax (8%):</span>
                  <span>${selectedOrder.tax_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pricing-row">
                  <span>Delivery:</span>
                  <span>${selectedOrder.delivery_fee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pricing-row total">
                  <span>Total:</span>
                  <span>${selectedOrder.total_price?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="detail-section">
                <h3>Notes</h3>
                <p className="notes-text">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="detail-section">
              <h3>Status</h3>
              <div className="status-buttons">
                {statuses.map(status => (
                  <button
                    key={status}
                    className={`status-btn ${status} ${selectedOrder.status === status ? 'active' : ''}`}
                    onClick={() => updateOrderStatus(selectedOrder.order_id, status)}
                    style={selectedOrder.status === status ? { backgroundColor: getStatusColor(status) } : {}}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <p className="order-time">
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BusinessHistory() {
  return (
    <AdminLogin pageName="Business Order History">
      <BusinessHistoryContent />
    </AdminLogin>
  )
}
