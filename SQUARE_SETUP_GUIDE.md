# Square Payment Integration Setup Guide

## Overview
This ordering system now includes secure payment processing through Square. The implementation includes:
- ✅ Checkout page with delivery/pickup address collection
- ✅ Square payment form integration
- ✅ Secure payment processing with PCI-DSS compliance
- ✅ Data hashing for sensitive information
- ✅ Order confirmation page with tracking
- ✅ Database integration for orders and payment transactions

## Getting Started with Square

### 1. Create a Square Developer Account
1. Go to https://developer.squareup.com/
2. Sign up for a developer account (free)
3. Create a new application

### 2. Get Your Square Credentials

#### For Testing (Sandbox):
1. Go to https://developer.squareup.com/apps
2. Select your application
3. Navigate to "Credentials" tab
4. Copy these values:
   - **Sandbox Application ID** (starts with `sandbox-sq0idb-`)
   - **Sandbox Access Token** (starts with `EAA`)
   - **Sandbox Location ID**

#### For Production:
- Switch to "Production" tab in credentials
- Copy Production Application ID, Access Token, and Location ID
- **NEVER commit production credentials to git**

### 3. Configure Backend Environment

Create or update `/backend/.env` file:

```env
# Square Payment Configuration
SQUARE_APP_ID=sandbox-sq0idb-YOUR_SANDBOX_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_SANDBOX_ACCESS_TOKEN
SQUARE_LOCATION_ID=YOUR_SANDBOX_LOCATION_ID
SQUARE_ENVIRONMENT=sandbox

# Security
HASH_SECRET=your-random-secret-key-for-hashing
JWT_SECRET=your-jwt-secret-key

# Database (TiDB Cloud)
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ordering_system
```

### 4. Configure Frontend Environment

Create or update `/frontend/.env` file:

```env
# Square Configuration (Public keys - safe for frontend)
REACT_APP_SQUARE_APP_ID=sandbox-sq0idb-YOUR_SANDBOX_APP_ID
REACT_APP_SQUARE_LOCATION_ID=YOUR_SANDBOX_LOCATION_ID
REACT_APP_SQUARE_ENVIRONMENT=sandbox

# Backend API
REACT_APP_API_URL=http://localhost:3000
```

### 5. Update Database Schema

Run the schema update script to add payment-related fields:

```bash
# If using MySQL client:
mysql -h gateway01.us-west-2.prod.aws.tidbcloud.com -P 4000 -u your_user -p your_database < db/update_orders_schema.sql

# Or execute the SQL manually in your database client
```

The update adds:
- `order_type` (delivery/pickup)
- Delivery address fields
- Payment processor information
- Payment transaction tracking

### 6. Test Payment Flow

#### Using Sandbox Test Cards:

Square provides test card numbers for sandbox testing:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: `111`
- Expiration: Any future date (e.g., `12/25`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**
- Card Number: `4000 0000 0000 0002`
- (Use same CVV, expiration, ZIP as above)

**See more test cards:** https://developer.squareup.com/docs/testing/test-values

### 7. Test the Complete Flow

1. **Start the backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Test ordering:**
   - Browse menu and add items to cart
   - Choose delivery or pickup
   - Apply promo code (optional)
   - Click "Proceed to Checkout"
   - Fill in customer information
   - Enter delivery address (if delivery)
   - Enter test card information
   - Click "Place Order"
   - Verify redirect to confirmation page

## Security Features

### 1. Data Hashing
All sensitive payment data is hashed using HMAC-SHA256:
- Payment transaction IDs
- Amounts and timestamps
- Stored as irreversible hashes in database

### 2. PCI DSS Compliance
- Card data never touches our servers
- Square.js handles card tokenization
- Only payment nonces are sent to backend
- Last 4 digits and card brand stored (allowed by PCI DSS)

### 3. Input Validation
- XSS sanitization on all inputs
- Server-side validation with express-validator
- Phone and email format validation
- Address validation for delivery orders

### 4. Secure Storage
- Sensitive environment variables in .env files
- .env files in .gitignore (never committed)
- Database credentials encrypted in transit (TLS/SSL)

## Database Schema

### Updated Orders Table
```sql
order_id, customer_id, order_type (delivery/pickup),
status, total_amount, payment_method, payment_processor,
payment_transaction_id, delivery_street, delivery_city,
delivery_state, delivery_zip, delivery_phone, special_instructions
```

### Payment_Transactions Table
```sql
transaction_id, order_id, amount, payment_status,
payment_method, payment_processor, processor_transaction_id,
last_four_digits, card_brand, payment_response_hash
```

## API Endpoints

### POST /api/payment/process
Processes payment and creates order.

**Request Body:**
```json
{
  "orderType": "delivery",
  "customerInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  },
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "items": [...],
  "subtotal": 25.00,
  "tax": 2.00,
  "deliveryFee": 2.99,
  "discount": 0,
  "totalAmount": 29.99,
  "specialInstructions": "Ring doorbell",
  "paymentNonce": "cnon:card-nonce-from-square"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 1234,
  "orderDetails": {
    "orderId": 1234,
    "orderType": "delivery",
    "totalAmount": 29.99,
    "estimatedTime": "30-45 minutes"
  }
}
```

### GET /api/payment/square-config
Returns Square configuration for frontend.

## Going to Production

### 1. Get Production Credentials
- Log into Square Dashboard: https://squareup.com/dashboard
- Go to Apps & integrations
- Get Production credentials

### 2. Update Environment Variables
```env
SQUARE_ENVIRONMENT=production
SQUARE_APP_ID=sq0idp-YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
```

### 3. SSL/HTTPS Required
Square requires HTTPS in production:
- Set up SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Update CORS settings
- Update frontend API URL to https://

### 4. Additional Security
- Enable rate limiting (already configured)
- Set up monitoring for payment failures
- Configure webhook notifications from Square
- Implement refund handling
- Add order receipt email system

## Troubleshooting

### Payment Form Not Loading
- Check browser console for errors
- Verify SQUARE_APP_ID in frontend .env
- Ensure Square.js script loads from CDN
- Check for CSP (Content Security Policy) blocking scripts

### Payment Fails
- Verify SQUARE_ACCESS_TOKEN in backend .env
- Check backend logs for Square API errors
- Ensure using correct environment (sandbox vs production)
- Verify test card numbers if in sandbox

### Database Errors
- Check database connection in backend logs
- Verify schema updates were applied
- Test database connectivity with /api/test-db endpoint

### Order Not Saving
- Check backend console for errors
- Verify all required fields are provided
- Test with database available (not mock mode)
- Check Payment_Transactions table for entries

## Support Resources

- **Square Documentation:** https://developer.squareup.com/docs
- **Square Support:** https://developer.squareup.com/support
- **Test Cards:** https://developer.squareup.com/docs/testing/test-values
- **PCI Compliance:** https://developer.squareup.com/docs/payments-api/take-payments

## Notes

- In test mode (when database unavailable or using TEST_ nonce), orders will process but not save
- Square sandbox is completely separate from production
- Never use production credentials in development
- Rotate secrets regularly
- Monitor for suspicious payment activity
