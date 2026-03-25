# S-Pay

A secure fraud detection backend for payment applications with Two-Factor Authentication (2FA), transaction monitoring, and real-time fraud detection.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Fraud Detection System](#fraud-detection-system)
- [Security](#security)
- [Running the Application](#running-the-application)
- [Testing the API](#testing-the-api)
- [Example Test Scenarios](#example-test-scenarios)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

S-Pay is a fraud detection system designed to be embedded in mobile banking applications. It provides:

- **Secure Authentication**: User registration and login with Two-Factor Authentication (2FA)
- **Transaction Processing**: Support for deposits, withdrawals, transfers, and payments
- **Real-time Fraud Detection**: Monitors transactions for suspicious patterns and anomalies
- **Account Protection**: Automatic blocking of suspicious accounts and transactions
- **JWT-based Sessions**: Secure token-based authentication

The system is built with Node.js, Express, and MongoDB, making it easy to integrate with any mobile banking application.

---

## Features

### Authentication

- **User Registration**: Securely register new users with hashed passwords (bcrypt)
- **User Login**: Authenticate users with username and password
- **Two-Factor Authentication (2FA)**: Time-based OTP using speakeasy library
- **JWT Authentication**: Secure token-based session management with 24-hour expiration

### Transaction Management

- **Multiple Transaction Types**: Support for deposits, withdrawals, transfers, and payments
- **Real-time Balance Updates**: Instant balance updates after transactions
- **Transaction History**: Complete transaction history for each user

### Fraud Detection

- **High Amount Detection**: Flags transactions above $10,000
- **Unusual Time Detection**: Monitors transactions during unusual hours (midnight - 5 AM)
- **Frequency Analysis**: Detects unusually high transaction frequency
- **Withdrawal Pattern Analysis**: Monitors daily withdrawal limits
- **Behavioral Analysis**: Learns user patterns and detects anomalies
- **Automatic Blocking**: Blocks high-risk transactions and accounts
- **Risk Scoring**: Assigns risk scores (0-100) to all transactions

### User Management

- **Account Blocking**: Manually or automatically block suspicious accounts
- **Account Unblocking**: Restore access to blocked accounts
- **Profile Management**: View and manage user profiles

---

## Project Structure

```
S-pay/
├── .env                    # Environment variables (NOT committed to version control)
├── .gitignore              # Git ignore rules
├── app.js                  # Main application entry point
├── package.json            # NPM dependencies
├── README.md               # Project documentation
├── POSTMAN_TESTING.md      # Detailed API testing guide
├── models/
│   ├── User.js             # Mongoose user model
│   └── Transaction.js      # Mongoose transaction model
├── services/
│   └── FraudDetection.js   # Fraud detection service
└── NexBankApp/
    └── NexBankApp/
        └── package.json    # React Native mobile app (separate project)
```

---

## Tech Stack

| Technology   | Purpose                          |
| ------------ | -------------------------------- |
| Node.js      | Runtime environment              |
| Express.js   | Web framework                    |
| MongoDB      | Database (with in-memory option) |
| Mongoose     | ODM for MongoDB                  |
| bcrypt       | Password hashing                 |
| speakeasy    | TOTP generation and verification |
| jsonwebtoken | JWT token management             |
| dotenv       | Environment variable management  |
| cors         | Cross-origin resource sharing    |
| body-parser  | Request body parsing             |

---

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

> **Note:** MongoDB is optional - the application will automatically use an in-memory database for testing if MongoDB is not available.

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/secbyteX03/s-pay.git
cd s-pay
```

### Install Dependencies

```bash
npm install
```

This will install all required packages including:

- express - Web framework
- mongoose - MongoDB ODM
- bcrypt - Password hashing
- speakeasy - TOTP generation
- jsonwebtoken - JWT tokens
- dotenv - Environment variables
- mongodb-memory-server - In-memory MongoDB for testing

---

## Configuration

### Environment Variables

Create or update the `.env` file in the project root:

```env
# MongoDB Connection URI (optional - will use in-memory DB if not provided)
MONGODB_URI=mongodb://localhost:27017/spay

# JWT Secret - Generate a strong random string
JWT_SECRET=your_strong_jwt_secret_here

# Server Port (optional, defaults to 5000)
PORT=5000
```

### Generating a Strong JWT Secret

You can generate a cryptographically strong secret using:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB Setup

**Option 1: Local MongoDB (Optional)**

If you have MongoDB installed locally:

```bash
mongod
```

**Option 2: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

**Option 3: No MongoDB (Automatic)**

The application will automatically use an in-memory MongoDB for testing if no MongoDB is available. This is perfect for development and testing.

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint          | Description            | Auth Required |
| ------ | ----------------- | ---------------------- | ------------- |
| POST   | `/api/register`   | Register a new user    | No            |
| POST   | `/api/login`      | Login and get OTP      | No            |
| POST   | `/api/verify-otp` | Verify OTP and get JWT | No            |

### Transaction Endpoints

| Method | Endpoint               | Description           | Auth Required |
| ------ | ---------------------- | --------------------- | ------------- |
| POST   | `/api/transaction`     | Create a transaction  | Yes           |
| GET    | `/api/transactions`    | Get user transactions | Yes           |
| GET    | `/api/transaction/:id` | Get transaction by ID | Yes           |

### Fraud Detection Endpoints

| Method | Endpoint                    | Description                      | Auth Required |
| ------ | --------------------------- | -------------------------------- | ------------- |
| POST   | `/api/analyze-transaction`  | Preview fraud analysis           | Yes           |
| GET    | `/api/flagged-transactions` | Get blocked/flagged transactions | Yes           |

### User Management Endpoints

| Method | Endpoint            | Description      | Auth Required |
| ------ | ------------------- | ---------------- | ------------- |
| GET    | `/api/profile`      | Get user profile | Yes           |
| POST   | `/api/block-user`   | Block a user     | Yes           |
| POST   | `/api/unblock-user` | Unblock a user   | Yes           |

---

## Fraud Detection System

### Risk Scoring

Each transaction is assigned a risk score (0-100):

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

### Transaction Flow with Fraud Detection

1. User initiates a transaction (deposit, withdrawal, transfer, payment)
2. System checks user balance
3. Fraud detection service analyzes the transaction:
   - Checks transaction amount
   - Checks transaction time
   - Checks transaction frequency
   - Checks user's historical patterns
4. Risk score is calculated
5. Based on risk score:
   - Low (0-49): Transaction completed normally
   - Medium (50-69): Transaction flagged for review
   - High (70-100): Transaction blocked, user account may be blocked

---

## Security

### Implemented Security Measures

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **Two-Factor Authentication**: TOTP-based OTP using speakeasy library
3. **JWT Tokens**: Secure token management with 24-hour expiration
4. **Environment Variables**: All sensitive data stored in `.env` files
5. **Automatic Account Lockout**: Accounts locked after 3 failed login attempts
6. **In-memory Database Option**: Safe testing without persistent data

### Security Best Practices

- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Implement proper error handling

---

## Running the Application

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

### Expected Output

```
> node app.js

MongoDB Connected (or In-memory MongoDB Connected)
S-Pay Server with Fraud Detection running on http://localhost:5000
Available endpoints:
  POST /api/register - Register new user
  POST /api/login - Login (returns OTP)
  POST /api/verify-otp - Verify OTP and get JWT
  POST /api/transaction - Create transaction (requires auth)
  GET /api/transactions - Get user transactions (requires auth)
  GET /api/profile - Get user profile (requires auth)
  POST /api/analyze-transaction - Preview fraud analysis (requires auth)
  GET /api/flagged-transactions - Get flagged transactions (requires auth)
  POST /api/block-user - Block a user (requires auth)
  POST /api/unblock-user - Unblock a user (requires auth)
```

---

## Testing the API

For detailed testing instructions, see:

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Complete guide with NexBank mobile app testing (recommended)
- **[nexbank-app.html](nexbank-app.html)** - Mobile banking UI connected to S-Pay backend
- **[POSTMAN_TESTING.md](POSTMAN_TESTING.md)** - Advanced Postman testing guide

### Quick Test with cURL

1. **Register a user:**

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","email":"test@example.com"}'
```

2. **Login to get OTP:**

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

3. **Verify OTP (use the OTP from step 2):**

```bash
curl -X POST http://localhost:5000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","otp":"123456"}'
```

4. **Create a deposit (replace TOKEN with JWT from step 3):**

```bash
curl -X POST http://localhost:5000/api/transaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"type":"deposit","amount":10000,"description":"Test deposit"}'
```

---

## Example Test Scenarios

### Scenario 1: Normal Transaction

1. Register a new user
2. Login to get OTP
3. Verify OTP to get JWT token
4. Create a deposit of $1,000
5. Verify transaction is completed with low risk score

### Scenario 2: High Amount Transaction (Flagged)

1. Login and get JWT token
2. Create a deposit of $50,000 (high amount)
3. Verify it gets flagged (riskScore: 40, riskFlags: ["HIGH_AMOUNT"])

### Scenario 3: Multiple Rapid Transactions

1. Login and get JWT token
2. Create 10+ transactions within 15 minutes
3. Verify high frequency flag is triggered

### Scenario 4: Blocked Transaction

1. Login and get JWT token
2. Create a transaction that combines multiple risk factors:
   - High amount ($50,000+)
   - Unusual time (midnight - 5 AM)
3. Verify transaction is blocked (shouldBlock: true)

### Scenario 5: Account Lockout

1. Attempt to login with wrong password 3 times
2. Verify account is automatically blocked

---

## Troubleshooting

### MongoDB Connection Issues

- If MongoDB is not available, the app will automatically use in-memory MongoDB
- No action needed - it works out of the box!

### JWT Token Issues

- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration (24 hours)
- Verify token is included in request headers

### OTP Issues

- Ensure system time is synchronized (TOTP is time-sensitive)
- The OTP in the response is for testing - in production it would be sent via SMS

### Insufficient Balance

- Make a deposit first to increase account balance
- New users start with $1,000 balance for testing

---

## License

ISC License

---

## Contributing

Contributions are welcome. Please ensure you follow security best practices when contributing to this project.

---

## Repository

GitHub: https://github.com/secbyteX03/s-pay.git
