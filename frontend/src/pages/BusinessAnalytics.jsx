import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BusinessAnalytics.css'
import { analyticsApi } from '../services/api'

export default function BusinessAnalytics() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersToday: 0,
    revenueToday: 0,
    ordersThisWeek: 0,
    revenueThisWeek: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    topItems: [],
    ordersByDay: [],
    revenueByDay: [],
    ordersByStatus: {},
    peakHours: []
  })

  useEffect(() => {
    const auth = sessionStorage.getItem('businessAuth')
    if (auth === 'true') {
      setAuthenticated(true)
      fetchAnalytics()
    }
  }, [])

  // Real-time updates - refresh every 30 seconds
  useEffect(() => {
    if (!authenticated) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing analytics data...')
      fetchAnalytics()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [authenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple password check - in production, use proper authentication
    if (password === 'admin123' || password === 'business') {
      setAuthenticated(true)
      sessionStorage.setItem('businessAuth', 'true')
      setError('')
      fetchAnalytics()
    } else {
      setError('Invalid password')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    sessionStorage.removeItem('businessAuth')
    setPassword('')
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await analyticsApi.getAnalytics()
      console.log('Analytics response:', response.data)
      if (response.data.success) {
        setAnalytics(response.data.data)
        setLastUpdated(new Date())
        console.log('Analytics data set:', response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      // Don't show mock data - show zeros
      setAnalytics({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersToday: 0,
        revenueToday: 0,
        ordersThisWeek: 0,
        revenueThisWeek: 0,
        ordersThisMonth: 0,
        revenueThisMonth: 0,
        topItems: [],
        ordersByDay: [],
        revenueByDay: [],
        ordersByStatus: {},
        peakHours: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="analytics-login-container">
        <div className="analytics-login-card">
          <h1>🏢 Business Analytics</h1>
          <p className="login-subtitle">Administrator Access Required</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoFocus
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">
              Access Dashboard
            </button>
          </form>
          
          <div className="login-footer">
            <button onClick={() => navigate('/')} className="back-link">
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-left">
          <h1>📊 Business Analytics Dashboard</h1>
          <p className="last-updated">
            {lastUpdated ? (
              <>
                Last updated: {lastUpdated.toLocaleTimeString()} • 
                <span className="live-indicator"> 🔴 LIVE</span> (refreshes every 30s)
              </>
            ) : (
              'Loading...'
            )}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAnalytics} className="refresh-btn" disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">${(analytics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{(analytics.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <div className="metric-label">Average Order Value</div>
            <div className="metric-value">${(analytics.averageOrderValue || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Orders Today</div>
            <div className="metric-value">{analytics.ordersToday || 0}</div>
            <div className="metric-sub">${(analytics.revenueToday || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="period-stats">
        <div className="period-card">
          <h3>📅 This Week</h3>
          <div className="period-metrics">
            <div className="period-metric">
              <span className="label">Orders:</span>
              <span className="value">{analytics.ordersThisWeek || 0}</span>
            </div>
            <div className="period-metric">
              <span className="label">Revenue:</span>
              <span className="value">${(analytics.revenueThisWeek || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="period-card">
          <h3>📆 This Month</h3>
          <div className="period-metrics">
            <div className="period-metric">
              <span className="label">Orders:</span>
              <span className="value">{analytics.ordersThisMonth || 0}</span>
            </div>
            <div className="period-metric">
              <span className="label">Revenue:</span>
              <span className="value">${(analytics.revenueThisMonth || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Orders Over Time */}
        <div className="chart-card">
          <h2>📊 Orders Over Time (Last 7 Days)</h2>
          <div className="chart-container">
            <div className="bar-chart">
              {(analytics.ordersByDay && analytics.ordersByDay.length > 0) ? (
                analytics.ordersByDay.map((day, index) => (
                  <div key={index} className="bar-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(day.count / Math.max(...analytics.ordersByDay.map(d => d.count))) * 100}%` 
                        }}
                      >
                        <span className="bar-label">{day.count}</span>
                      </div>
                    </div>
                    <div className="bar-date">{day.date}</div>
                  </div>
                ))
              ) : (
                <div className="no-data">No order data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="chart-card">
          <h2>💰 Revenue Over Time (Last 7 Days)</h2>
          <div className="chart-container">
            <div className="bar-chart revenue">
              {(analytics.revenueByDay && analytics.revenueByDay.length > 0) ? (
                analytics.revenueByDay.map((day, index) => (
                  <div key={index} className="bar-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(day.amount / Math.max(...analytics.revenueByDay.map(d => d.amount))) * 100}%` 
                        }}
                      >
                        <span className="bar-label">${day.amount.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="bar-date">{day.date}</div>
                  </div>
                ))
              ) : (
                <div className="no-data">No revenue data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Items & Order Status */}
      <div className="details-section">
        <div className="detail-card">
          <h2>🏆 Top Selling Items</h2>
          <div className="top-items-list">
            {(analytics.topItems && analytics.topItems.length > 0) ? (
              analytics.topItems.map((item, index) => (
                <div key={index} className="top-item">
                  <div className="item-rank">#{index + 1}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-stats">
                      {item.quantity} sold · ${item.revenue.toFixed(2)} revenue
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No sales data available</div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h2>📋 Orders by Status</h2>
          <div className="status-list">
            {(analytics.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0) ? (
              Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-label">
                    <span className={`status-badge ${status}`}>{status}</span>
                  </div>
                  <div className="status-count">{count}</div>
                </div>
              ))
            ) : (
              <div className="no-data">No status data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="peak-hours-card">
        <h2>⏰ Peak Order Hours</h2>
        <div className="peak-hours-grid">
          {(analytics.peakHours && analytics.peakHours.length > 0) ? (
            analytics.peakHours.map((hour, index) => (
              <div key={index} className="hour-item">
                <div className="hour-label">{hour.hour}:00</div>
                <div className="hour-bar-wrapper">
                  <div 
                    className="hour-bar" 
                    style={{ 
                      width: `${(hour.orders / Math.max(...analytics.peakHours.map(h => h.orders))) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="hour-count">{hour.orders} orders</div>
              </div>
            ))
          ) : (
            <div className="no-data">No hourly data available</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => navigate('/business')} className="action-btn">
          🏪 Business Dashboard
        </button>
        <button onClick={() => navigate('/kitchen')} className="action-btn">
          👨‍🍳 Kitchen View
        </button>
        <button onClick={() => navigate('/business/history')} className="action-btn">
          📜 Order History
        </button>
      </div>
    </div>
  )
}
