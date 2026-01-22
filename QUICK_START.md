# Quick Start Guide - Real-Time Analytics

## ⚡ Quick Commands

### Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Check Database Connection
```bash
cd backend
node clear-fake-data.js
# Should show current order count
```

### Clear All Test Data (CAREFUL!)
```bash
cd backend
CONFIRM_DELETE=true node clear-fake-data.js
```

## 🎯 Key URLs

- **Main App:** http://localhost:5175
- **Analytics:** http://localhost:5175/business/analytics
- **Backend API:** http://localhost:3000/api

## 🔐 Analytics Login

Password: `admin123` or `business`

## 📊 What You'll See

**When Database is Empty:**
- All metrics show 0
- Charts display "No data"
- Still updates every 30 seconds

**When Orders Exist:**
- Real order counts
- Actual revenue totals
- Live trends and charts
- Top-selling items
- Peak hour analysis

## 🔴 Real-Time Features

✅ Auto-refresh: Every 30 seconds
✅ Manual refresh: Click "Refresh Now" button
✅ Live indicator: Pulsing red dot
✅ Last updated: Shows exact time

## ⚠️ Important Notes

1. **No Mock Data** - System will NOT show fake numbers
2. **Database Required** - Analytics needs working DB connection
3. **SSL Enabled** - Database uses secure connection
4. **Real Orders Only** - Only displays actual order data

## 🐛 Troubleshooting

### "Database connection required for analytics"
- Check .env file has correct credentials
- Verify DB_HOST and DB_USER format
- Ensure SSL is supported

### Analytics shows all zeros
- Either no orders in database (correct!)
- Or database connection failed (check backend logs)

### Page not refreshing
- Check browser console for errors
- Verify backend is running on port 3000
- Check network tab for API calls

## 📝 Database Schema

Orders → Contains delivery/pickup info
Order_Items → Individual pizza/item details  
Payment_Transactions → Square payment records
Customers → Customer information

## 🚀 Production Checklist

- [ ] Update DB credentials in .env
- [ ] Change analytics password (BusinessAnalytics.jsx line 40)
- [ ] Clear all test orders
- [ ] Configure Square production keys
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Set up proper authentication

---

**Remember:** This system is designed to show REAL data only. If you see zeros, that's correct - it means no real orders have been placed yet!
