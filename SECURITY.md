# Security Implementation Guide

## Overview
This document outlines the security measures implemented to protect against common web vulnerabilities including SQL injection, XSS (Cross-Site Scripting), CSRF, and other attacks.

## Backend Security Measures

### 1. Input Validation & Sanitization
**Location**: `/backend/middleware/validator.js`

#### Features:
- **express-validator**: Comprehensive input validation for all API endpoints
- **XSS Prevention**: Input sanitization using the `xss` package to remove malicious HTML/JavaScript
- **Type Validation**: Ensures data types match expected formats (integers, floats, strings, etc.)
- **Length Limits**: Prevents buffer overflow and DoS attacks by limiting input sizes
- **Format Validation**: Validates emails, phone numbers, names using regex patterns
- **Whitelist Validation**: Only allows specific values for status fields and other enums

#### Protected Endpoints:
- **Authentication Routes** (`/api/auth/*`):
  - Register: Validates name (2-100 chars, letters only), email format, password strength
  - Login: Validates email format and password presence
  
- **Order Routes** (`/api/orders/*`):
  - Create Order: Validates customer info, item quantities (1-99), prices, addresses
  - Update Status: Validates order ID and status enum values
  - List Orders: Validates filter parameters and pagination limits
  
- **Menu Routes** (`/api/menu/*`):
  - Get by Category: Validates category ID is a positive integer

### 2. SQL Injection Protection
**Implementation**: 
- All database queries use **parameterized queries** with `?` placeholders
- The mysql2 library automatically escapes parameters
- No string concatenation used in SQL queries
- Input validation prevents malformed data from reaching the database

**Example**:
```javascript
// SECURE - Parameterized query
await connection.query('SELECT * FROM Users WHERE email = ?', [email]);

// NEVER DO THIS - String concatenation
// await connection.query(`SELECT * FROM Users WHERE email = '${email}'`);
```

### 3. Security Headers
**Package**: `helmet` middleware

#### Configured Headers:
- **Content-Security-Policy (CSP)**: 
  - Restricts sources for scripts, styles, images, etc.
  - Prevents inline script execution from untrusted sources
  - Blocks embedding in iframes
  
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser's XSS filter
- **Strict-Transport-Security**: Forces HTTPS connections

### 4. Rate Limiting
**Package**: `express-rate-limit`

**Configuration**:
- Window: 15 minutes
- Max Requests: 100 per IP per window
- Prevents brute force and DoS attacks

### 5. Authentication Security
**Features**:
- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication with 7-day expiration
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 lowercase letter
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character

### 6. Request Size Limiting
**Configuration**:
- Body size limit: 10MB for JSON and URL-encoded data
- Prevents memory exhaustion attacks

### 7. CORS Configuration
**Package**: `cors` middleware
- Configured to allow specific origins in production
- Currently allows all origins for development

### 8. Logging & Monitoring
**Packages**: `winston` + `morgan`
- HTTP request logging
- Error logging to files
- Helps detect and investigate security incidents

## Frontend Security Measures

### 1. Input Sanitization Utilities
**Location**: `/frontend/src/utils/sanitize.js`

#### Functions:
- `sanitizeHTML()`: Escapes HTML special characters
- `sanitizeObject()`: Recursively sanitizes object properties
- `isValidEmail()`: Validates email format
- `isValidPhone()`: Validates phone number format
- `isValidName()`: Validates name format (letters, spaces, hyphens, apostrophes only)
- `escapeForDisplay()`: Safe display of user-generated content

### 2. React Built-in XSS Protection
- React automatically escapes JSX expressions
- User input is never inserted using `dangerouslySetInnerHTML`
- All user-generated content is displayed through JSX variables

### 3. Secure Token Storage
- JWT tokens stored in `localStorage`
- Tokens sent in Authorization headers (not in URLs)

## UI Changes

### Removed Icons
Per requirements, the following icons have been removed from customer navigation:
- ❌ Shopping cart icon (🛒) - now shows "Cart"
- ❌ History icon (📊) - now shows "History"
- ✅ Menu icon (🍕) - kept for brand identity

## Additional Security Best Practices

### 1. Environment Variables
- Sensitive configuration in `.env` file
- Never commit `.env` to version control
- Use strong, unique values in production:
  - `JWT_SECRET`: At least 32 random characters
  - `DB_PASSWORD`: Strong database password

### 2. Database Security
- Use least-privilege principle for database users
- Enable SSL/TLS for database connections in production
- Regular backups and audit logs

### 3. HTTPS in Production
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use valid SSL/TLS certificates

### 4. Regular Updates
- Keep all npm packages updated
- Monitor security advisories
- Run `npm audit` regularly and fix vulnerabilities

### 5. Error Handling
- Don't expose stack traces or sensitive error details to clients
- Log detailed errors server-side only
- Return generic error messages to users

## Testing Security Measures

### 1. Test SQL Injection
Try these in email/name fields (should all be rejected):
```
admin' OR '1'='1
'; DROP TABLE Users; --
<script>alert('xss')</script>
```

### 2. Test XSS
Try these in text inputs (should be escaped):
```
<img src=x onerror=alert('xss')>
<script>document.cookie</script>
javascript:alert('xss')
```

### 3. Test Rate Limiting
Make 100+ requests quickly to any endpoint - should get 429 error

### 4. Test Input Validation
- Try empty fields (should get validation errors)
- Try invalid email formats (should be rejected)
- Try weak passwords (should be rejected)
- Try invalid phone numbers (should be rejected)

## Compliance & Standards

This implementation follows:
- **OWASP Top 10** security guidelines
- **OWASP API Security Top 10**
- Industry best practices for web application security

## Security Checklist

- ✅ SQL Injection Protection (parameterized queries)
- ✅ XSS Prevention (input sanitization + escaping)
- ✅ CSRF Protection (JWT tokens, no cookies)
- ✅ Authentication Security (bcrypt + JWT)
- ✅ Input Validation (express-validator)
- ✅ Rate Limiting (prevents brute force)
- ✅ Security Headers (helmet)
- ✅ Request Size Limits
- ✅ Error Handling (no sensitive info leakage)
- ✅ Logging & Monitoring
- ⚠️  HTTPS (required for production)
- ⚠️  Database SSL (required for production)

## Future Enhancements

Consider implementing:
1. **Two-Factor Authentication (2FA)** for admin accounts
2. **API Key Authentication** for business integrations
3. **Account Lockout** after failed login attempts
4. **Session Management** with refresh tokens
5. **IP Whitelisting** for admin endpoints
6. **Database Encryption** for sensitive data
7. **Security Audit Logging** for compliance
8. **Automated Security Scanning** in CI/CD pipeline

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Email security concerns to [your-security-email]
3. Include detailed steps to reproduce
4. Allow reasonable time for fixes before disclosure
