import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import './History.css'
import apiClient from '../services/api'
import { AuthContext } from '../App'

export default function History() {
  const { user, openAuth } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    // Check if admin (logged into business/kitchen)
    const isAdminAuth = sessionStorage.getItem('adminAuth') === 'true'
    
    if (isAdminAuth) {
      // Admin view: fetch all orders with limit
      fetchOrders(null, 20)
    } else if (user?.email) {
      // Customer view: fetch only their orders
      fetchOrders(user.email)
    }
  }, [user])

  const fetchOrders = async (email = null, limit = null) => {
    setLoading(true)
    try {
      const params = {}
      if (email) {
        params.customer_email = email
      }
      if (limit) {
        params.limit = limit
      }
      const response = await apiClient.get('/orders', { params })
      // Ensure orders are sorted by most recent first
      const sorted = (response.data.data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setOrders(sorted)
    } catch (err) {
      setError('Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getOrderDetails = async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`)
      setSelectedOrder(response.data.data)
    } catch (err) {
      console.error('Failed to load order details:', err)
      setError('Failed to load order details')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      preparing: '#ff9800',
      ready: '#8bc34a',
      completed: '#4caf50',
      cancelled: '#f44336',
    }
    return colors[status] || '#6c757d'
  }

  const isAdminView = sessionStorage.getItem('adminAuth') === 'true'

  if (loading) return <div className="history-container"><p>Loading orders...</p></div>
  if (error) return <div className="history-container error"><p>{error}</p></div>

  return (
    <div className="history-container">
      <h1>{isAdminView ? '📊 All Orders' : '📊 Order History'}</h1>
      {isAdminView && <p className="admin-note">Showing last 20 orders</p>}

      <div className="history-layout">
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>{isAdminView ? 'No orders yet' : 'No orders yet'}</p>
              {!isAdminView && (
                <>
                  <Link to="/" className="start-ordering-btn">Start Ordering</Link>
                  {!user && (
                    <button className="start-ordering-btn" onClick={openAuth}>Log In</button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    {isAdminView && <th>Customer</th>}
                    {!isAdminView && <th>Customer</th>}
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.order_id} className="order-row">
                      <td className="order-id">#{order.order_id}</td>
                      <td>{order.customer_name}</td>
                      <td className="price">${order.total_price.toFixed(2)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="date">
                        {new Date(order.created_at).toLocaleDateString()} 
                        {' '}
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <button
                          onClick={() => getOrderDetails(order.order_id)}
                          className="view-btn"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="order-details-panel">
            <div className="panel-header">
              <h3>Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="detail-section">
              <label>Order ID:</label>
              <p>#{selectedOrder.order_id}</p>
            </div>

            <div className="detail-section">
              <label>Customer:</label>
              <p>{selectedOrder.customer_name}</p>
            </div>

            <div className="detail-section">
              <label>Status:</label>
              <p>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                >
                  {selectedOrder.status}
                </span>
              </p>
            </div>

            <div className="detail-section">
              <label>Items:</label>
              <div className="items-list">
                {selectedOrder.items?.map(item => (
                  <div key={item.item_id} className="item-detail">
                    <span>{item.name}</span>
                    <span className="qty">x{item.quantity}</span>
                    <span className="price">${(item.price_at_order * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <label>Total:</label>
              <p className="total-price">
                ${selectedOrder.total_price.toFixed(2)}
              </p>
            </div>

            {selectedOrder.notes && (
              <div className="detail-section">
                <label>Notes:</label>
                <p className="notes">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="detail-section date">
              <label>Ordered:</label>
              <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
