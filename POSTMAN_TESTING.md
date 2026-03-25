# S-Pay API Testing Guide

> **Note:** For beginners, we recommend using the **Web Interface** instead. See [TESTING_GUIDE.md](TESTING_GUIDE.md) for easier instructions.

This guide provides detailed instructions on how to test the S-Pay fraud detection API using Postman or cURL.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Testing Authentication](#testing-authentication)
- [Testing Transactions](#testing-transactions)
- [Testing Fraud Detection](#testing-fraud-detection)
- [Testing User Management](#testing-user-management)
- [Example Test Scenarios](#example-test-scenarios)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Postman** (or any API testing tool like Insomnia, HTTP Client, etc.)

   - Download from: https://www.postman.com/downloads/

2. **The S-Pay Server must be running**
   ```bash
   npm start
   ```
   - Server runs on: http://localhost:5000

---

## Getting Started

### Base URL

All API requests should be directed to:

```
http://localhost:5000
```

### Content-Type

Include the following header in all requests:

```
Content-Type: application/json
```

### Authentication Header

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Testing Authentication

### 1. Register a New User

**Endpoint:** `POST /api/register`

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "securePassword123",
  "email": "johndoe@example.com",
  "phoneNumber": "+1234567890"
}
```

**Expected Response (201):**

```json
{
  "message": "User registered successfully",
  "username": "johndoe"
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"securePassword123","email":"johndoe@example.com","phoneNumber":"+1234567890"}'
```

---

### 2. Login (Get OTP)

**Endpoint:** `POST /api/login`

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Expected Response (200):**

```json
{
  "message": "OTP sent",
  "otp": "123456",
  "user": {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "phoneNumber": "+1234567890",
    "accountBalance": 1000
  }
}
```

**Note:** The OTP is returned in the response for testing purposes. In production, this would be sent via SMS or email.

**cURL:**

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"securePassword123"}'
```

---

### 3. Verify OTP (Get JWT Token)

**Endpoint:** `POST /api/verify-otp`

**Request Body:**

```json
{
  "username": "johndoe",
  "otp": "123456"
}
```

**Expected Response (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "phoneNumber": "+1234567890",
    "accountBalance": 1000,
    "isBlocked": false
  }
}
```

**Important:** Save the `token` value - you'll need it for all authenticated requests.

**cURL:**

```bash
curl -X POST http://localhost:5000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","otp":"123456"}'
```

---

## Testing Transactions

### 4. Create a Transaction

**Endpoint:** `POST /api/transaction`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body (Deposit):**

```json
{
  "type": "deposit",
  "amount": 50000,
  "description": "Salary deposit"
}
```

**Request Body (Withdrawal):**

```json
{
  "type": "withdrawal",
  "amount": 5000,
  "description": "ATM withdrawal",
  "location": "ATM Machine"
}
```

**Request Body (Transfer):**

```json
{
  "type": "transfer",
  "amount": 1000,
  "recipient": "jane doe",
  "description": "Monthly rent"
}
```

**Expected Response (201 - Normal Transaction):**

```json
{
  "message": "Transaction completed",
  "transaction": {
    "username": "johndoe",
    "type": "deposit",
    "amount": 50000,
    "currency": "USD",
    "status": "completed",
    "riskScore": 40,
    "riskFlags": ["HIGH_AMOUNT"],
    "isSuspicious": false
  },
  "fraudAnalysis": {
    "isSuspicious": false,
    "riskScore": 40,
    "riskFlags": ["HIGH_AMOUNT"],
    "shouldBlock": false,
    "shouldFlag": false
  },
  "newBalance": 51000
}
```

**Expected Response (403 - Blocked Transaction):**

```json
{
  "message": "Transaction blocked due to suspicious activity",
  "transaction": {
    "status": "blocked",
    "fraudReason": "Multiple risk factors detected"
  },
  "fraudAnalysis": {
    "shouldBlock": true,
    "riskScore": 75
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/transaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"type":"deposit","amount":50000,"description":"Salary deposit"}'
```

---

### 5. Get User Transactions

**Endpoint:** `GET /api/transactions`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (Optional):**

- `limit` - Number of transactions to return (default: 50)

**Expected Response (200):**

```json
{
  "transactions": [
    {
      "_id": "...",
      "username": "johndoe",
      "type": "deposit",
      "amount": 50000,
      "status": "completed",
      "timestamp": "2026-03-24T12:00:00.000Z",
      "riskScore": 40
    }
  ]
}
```

**cURL:**

```bash
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <your_token>"
```

---

### 6. Get Transaction by ID

**Endpoint:** `GET /api/transaction/:id`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Expected Response (200):**

```json
{
  "transaction": {
    "_id": "...",
    "username": "johndoe",
    "type": "withdrawal",
    "amount": 5000,
    "status": "completed"
  }
}
```

---

## Testing Fraud Detection

### 7. Preview Transaction Analysis

**Endpoint:** `POST /api/analyze-transaction`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "type": "withdrawal",
  "amount": 50000,
  "location": "Unknown"
}
```

**Expected Response (200):**

```json
{
  "analysis": {
    "isSuspicious": true,
    "riskScore": 70,
    "riskFlags": ["HIGH_AMOUNT", "UNUSUAL_TIME"],
    "shouldBlock": true,
    "shouldFlag": false
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5000/api/analyze-transaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"type":"withdrawal","amount":50000,"location":"Unknown"}'
```

---

### 8. Get Flagged Transactions

**Endpoint:** `GET /api/flagged-transactions`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Expected Response (200):**

```json
{
  "transactions": [
    {
      "_id": "...",
      "username": "johndoe",
      "type": "withdrawal",
      "amount": 50000,
      "status": "blocked",
      "fraudReason": "High-value transaction during unusual hours",
      "riskScore": 75
    }
  ]
}
```

---

## Testing User Management

### 9. Get User Profile

**Endpoint:** `GET /api/profile`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Expected Response (200):**

```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "phoneNumber": "+1234567890",
  "accountBalance": 45000,
  "isBlocked": false,
  "createdAt": "2026-03-24T10:00:00.000Z"
}
```

**cURL:**

```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer <your_token>"
```

---

### 10. Block a User

**Endpoint:** `POST /api/block-user`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "username": "johndoe",
  "reason": "Suspicious activity detected"
}
```

**Expected Response (200):**

```json
{
  "message": "User johndoe blocked for: Suspicious activity detected"
}
```

---

### 11. Unblock a User

**Endpoint:** `POST /api/unblock-user`

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "username": "johndoe"
}
```

**Expected Response (200):**

```json
{
  "message": "User johndoe has been unblocked"
}
```

---

## Example Test Scenarios

### Scenario 1: Normal Transaction

1. Register a new user
2. Login to get OTP
3. Verify OTP to get JWT token
4. Create a deposit of $1,000
5. Verify transaction is completed with low risk score

### Scenario 2: High Amount Transaction

1. Login and get JWT token
2. Create a deposit of $50,000 (high amount)
3. Verify it gets flagged (riskScore: 40, riskFlags: ["HIGH_AMOUNT"])

### Scenario 3: Multiple Rapid Transactions (Frequency Detection)

1. Login and get JWT token
2. Create 10+ transactions within 15 minutes
3. Verify high frequency flag is triggered

### Scenario 4: Blocked Transaction

1. Login and get JWT token
2. Create a transaction that combines multiple risk factors:
   - High amount ($50,000+)
   - Unusual time (midnight - 5 AM)
   - Unknown location
3. Verify transaction is blocked (shouldBlock: true)

### Scenario 5: Account Lockout

1. Attempt to login with wrong password 3 times
2. Verify account is automatically blocked

---

## Troubleshooting

### 401 Unauthorized

- **Cause:** Missing or invalid JWT token
- **Solution:** Make sure you're including the `Authorization: Bearer <token>` header

### 403 Forbidden

- **Cause:** Account is blocked
- **Solution:** Use the `/api/unblock-user` endpoint to unblock the account

### 400 Bad Request

- **Cause:** Invalid request body or missing required fields
- **Solution:** Check the request body format and required fields

### 404 Not Found

- **Cause:** Incorrect endpoint URL
- **Solution:** Verify the endpoint URL is correct

### Insufficient Balance

- **Cause:** Trying to withdraw more than account balance
- **Solution:** Make a deposit first to increase account balance

---

## Risk Score Reference

| Risk Level | Score Range | Action            |
| ---------- | ----------- | ----------------- |
| Low        | 0-49        | Allow transaction |
| Medium     | 50-69       | Flag for review   |
| High       | 70-100      | Block transaction |

### Risk Factors

| Factor                 | Score | Description                          |
| ---------------------- | ----- | ------------------------------------ |
| UNUSUAL_TIME           | 30    | Transaction during midnight - 5 AM   |
| HIGH_AMOUNT            | 40    | Amount >= $10,000                    |
| MEDIUM_AMOUNT          | 20    | Amount >= $5,000                     |
| HIGH_FREQUENCY         | 35    | 10+ transactions in 15 minutes       |
| EXCESSIVE_WITHDRAWALS  | 45    | 20+ withdrawals per day              |
| UNUSUAL_AMOUNT_PATTERN | 45    | Amount 3x higher than user's average |

---

## Notes

- The OTP in the login response is for testing purposes only. In production, it would be sent via SMS.
- The in-memory MongoDB resets when the server restarts.
- All amounts are in USD by default.
- JWT tokens expire after 24 hours.
