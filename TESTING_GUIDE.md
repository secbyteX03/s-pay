# S-Pay Testing Guide

This guide explains how to test the S-Pay fraud detection system using three methods:

1. **NexBank Mobile App** (recommended - looks like a real banking app)
2. **NexBank Mobile App** (professional banking UI)
3. **Postman** (advanced API testing)

---

## Prerequisites

Before testing, make sure the server is running:

```bash
npm start
```

You should see:

```
S-Pay Server with Fraud Detection running on http://localhost:5000
```

---

## Method 1: NexBank Mobile App (Recommended!)

The NexBank app is a professional mobile banking UI that connects to S-Pay backend. It looks and feels like a real banking app!

### Step 1: Open the NexBank App

The app is in the file `nexbank-app.html` in your project folder.

**How to find and open it:**

1. **In VS Code:**

   - Look at the Explorer panel on the left side
   - You should see `nexbank-app.html` listed
   - Click on it to open, then right-click and choose "Open with Live Server" or double-click to open in browser

2. **Using Windows Explorer:**
   - Go to `C:\Users\Administrator\S-pay\`
   - Double-click on `nexbank-app.html`
   - It will open in your default web browser

### Step 2: Using the NexBank App

Once open, you'll see a beautiful mobile banking interface:

#### Login Screen

1. Click **Create Account** to register
2. Fill in username, email, and password
3. Click **Register**
4. Now login with your credentials
5. Enter the OTP (code shown in notification)
6. You're in!

#### Dashboard Features

- **Balance Card** - Shows your account balance
- **Quick Actions** - Deposit, Withdraw, Transfer buttons
- **Security Button** - View S-Pay fraud protection status
- **Transaction History** - See recent transactions

#### Making Transactions

1. Click any action button (Deposit/Withdraw/Transfer)
2. Enter amount
3. Click **Analyze Risk** - This shows S-Pay fraud detection working!
4. See the risk indicator (Low/Medium/High)
5. Click **Confirm** to complete

#### Security Center

1. Click the shield icon or "Security" tab
2. See fraud statistics:
   - Total transactions
   - Flagged transactions
   - Blocked transactions
3. View security events and alerts

### Step 3: Testing Fraud Detection

Try these scenarios to see S-Pay in action:

**Normal Transaction:**

- Deposit $100
- Risk: Low (green)

**High Amount Transaction:**

- Withdraw $15,000
- Risk: Medium - flagged for review

**Very High Amount:**

- Withdraw $50,000
- Risk: High - transaction blocked!

---

## Method 2: Simple Web Interface

### Step 1: Open the Web Interface

The web interface is in the file `test-api.html` in your project folder.

**How to find and open it:**

1. **In VS Code:**

   - Look at the Explorer panel on the left side
   - You should see `test-api.html` listed
   - Click on it to open, then right-click and choose "Open with Live Server" or just open in browser

2. **Using Windows Explorer:**

   - Go to `C:\Users\Administrator\S-pay\`
   - Double-click on `test-api.html`
   - It will open in your default web browser

3. **Using Browser Directly:**
   - Open Chrome, Firefox, or Edge
   - Navigate to: `C:\Users\Administrator\S-pay\test-api.html`

### Step 2: Using the Web Interface

Once open, you'll see a dark-themed interface with several sections:

#### Registration Section

1. Enter a **Username** (e.g., "john")
2. Enter a **Password** (e.g., "pass123")
3. Enter an **Email** (e.g., "john@test.com")
4. Click **Register**
5. You'll see "User registered successfully" in the Results section

#### Login Section

1. Enter your **Username** and **Password** again
2. Click **Login**
3. In the Results box, you'll see the OTP code (e.g., `"otp":"123456"`)
4. Copy or remember this OTP

#### OTP Verification

1. A new input field "Enter OTP" will appear
2. Enter the OTP code from the previous step
3. Click **Verify OTP**
4. You'll be logged in and see the Dashboard

#### Dashboard (After Login)

Once logged in, you can:

1. **View Account Info** - Shows your balance (starts at $1,000)
2. **Make Transactions** - Select type (Deposit/Withdrawal/Transfer/Payment), enter amount, description
3. **Transaction History** - See all your past transactions with risk scores
4. **Fraud Analysis** - Use "Analyze First" button to preview if a transaction will be flagged/blocked

### Step 3: Testing Fraud Detection

Try these scenarios:

**Scenario A: Normal Transaction**

- Type: Deposit
- Amount: 100
- Click "Submit Transaction"
- Result: Should complete with low risk (green)

**Scenario B: High Amount (Flagged)**

- Type: Withdrawal
- Amount: 15000
- Click "Submit Transaction"
- Result: Flagged with riskScore 40 (HIGH_AMOUNT)

**Scenario C: Preview Risk First**

- Type: Withdrawal
- Amount: 20000
- Click "Analyze First (Preview Risk)"
- Result: Shows risk analysis without creating transaction

---

## Method 3: Postman Testing (More Detailed)

### Step 1: Download and Install Postman

1. Go to: https://www.postman.com/downloads/
2. Click **Download** for Windows
3. Install the application
4. Open Postman

### Step 2: Create a New Request

1. In Postman, click **New** (top left)
2. Select **HTTP Request**
3. You'll see a new tab with request options

### Step 3: Test Registration

1. In the request bar, change the dropdown from "GET" to **POST**
2. Enter: `http://localhost:5000/api/register`
3. Click the **Body** tab below the URL bar
4. Select **raw** and change the dropdown to **JSON**
5. Enter this in the text box:
   ```json
   {
     "username": "john",
     "password": "pass123",
     "email": "john@test.com"
   }
   ```
6. Click **Send**
7. You should see:
   ```json
   {
     "message": "User registered successfully",
     "username": "john"
   }
   ```

### Step 4: Test Login

1. Change the method to **POST**
2. Enter: `http://localhost:5000/api/login`
3. In Body, enter:
   ```json
   {
     "username": "john",
     "password": "pass123"
   }
   ```
4. Click **Send**
5. Copy the OTP from the response (e.g., `"otp":"123456"`)

### Step 5: Verify OTP

1. Change the method to **POST**
2. Enter: `http://localhost:5000/api/verify-otp`
3. In Body, enter (use the OTP from step 4):
   ```json
   {
     "username": "john",
     "otp": "123456"
   }
   ```
4. Click **Send**
5. **IMPORTANT:** Copy the `token` from the response - you'll need it for all future requests

### Step 6: Create a Transaction (Deposit)

1. Change the method to **POST**
2. Enter: `http://localhost:5000/api/transaction`
3. Click the **Headers** tab
4. Add a new header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE` (paste the token from step 5)
5. Click the **Body** tab
6. Enter:
   ```json
   {
     "type": "deposit",
     "amount": 10000,
     "description": "Initial deposit"
   }
   ```
7. Click **Send**
8. You should see the transaction result with risk analysis

### Step 7: View Transaction History

1. Change the method to **GET**
2. Enter: `http://localhost:5000/api/transactions`
3. Make sure Headers has: `Authorization: Bearer YOUR_TOKEN`
4. Click **Send**
5. See all your transactions

### Step 8: Test Fraud Detection

Try these transactions to see fraud detection in action:

**High Amount Transaction:**

```json
{
  "type": "withdrawal",
  "amount": 15000,
  "description": "Large withdrawal"
}
```

- Expected: riskScore 40, riskFlags: ["HIGH_AMOUNT"]

**Preview Risk Before Committing:**

1. Change method to **POST**
2. Enter: `http://localhost:5000/api/analyze-transaction`
3. Add Authorization header with token
4. Enter:
   ```json
   {
     "type": "withdrawal",
     "amount": 50000,
     "location": "Unknown"
   }
   ```
5. Click Send - shows risk analysis without creating transaction

### Saving Your Requests (Optional)

To save time, you can save requests:

1. Click the **Save** button (next to Send)
2. Name your request (e.g., "Login")
3. Create or select a collection (e.g., "S-Pay Tests")
4. Click Save
5. Your saved requests appear in the left sidebar

---

## Quick Reference: All API Endpoints

| Action           | Method | URL                        | Body                                          |
| ---------------- | ------ | -------------------------- | --------------------------------------------- |
| Register         | POST   | `/api/register`            | `{"username":"x","password":"y","email":"z"}` |
| Login            | POST   | `/api/login`               | `{"username":"x","password":"y"}`             |
| Verify OTP       | POST   | `/api/verify-otp`          | `{"username":"x","otp":"123456"}`             |
| Get Profile      | GET    | `/api/profile`             | (use Authorization header)                    |
| Make Transaction | POST   | `/api/transaction`         | `{"type":"deposit","amount":100}`             |
| Get Transactions | GET    | `/api/transactions`        | (use Authorization header)                    |
| Analyze Risk     | POST   | `/api/analyze-transaction` | `{"type":"withdrawal","amount":50000}`        |

---

## Understanding Fraud Detection Results

When you make a transaction, you'll see:

```json
{
  "transaction": {
    "amount": 15000,
    "status": "completed",
    "riskScore": 40,
    "riskFlags": ["HIGH_AMOUNT"]
  },
  "fraudAnalysis": {
    "isSuspicious": false,
    "riskScore": 40,
    "shouldBlock": false,
    "shouldFlag": true
  }
}
```

### Risk Score Meanings

| Score  | Meaning     | Action                         |
| ------ | ----------- | ------------------------------ |
| 0-49   | Low Risk    | Transaction allowed            |
| 50-69  | Medium Risk | Transaction flagged for review |
| 70-100 | High Risk   | Transaction blocked            |

### Common Risk Flags

- `HIGH_AMOUNT` - Amount over $10,000
- `UNUSUAL_TIME` - Transaction between midnight and 5 AM
- `HIGH_FREQUENCY` - Many transactions in 15 minutes
- `EXCESSIVE_WITHDRAWALS` - Over 20 withdrawals per day

---

## Troubleshooting

**Problem: Connection refused**

- Make sure server is running: `npm start`
- Check terminal shows "running on http://localhost:5000"

**Problem: 401 Unauthorized**

- Your token expired or wasn't included
- Make sure to copy the token from OTP verification
- Add header: `Authorization: Bearer YOUR_TOKEN`

**Problem: 400 Bad Request**

- Check your JSON syntax
- Make sure all required fields are included

**Problem: Can't find test-api.html**

- File is at: `C:\Users\Administrator\S-pay\test-api.html`
- Open in browser or VS Code

---

## Related Documentation

- [README.md](README.md) - Project overview and features
- [POSTMAN_TESTING.md](POSTMAN_TESTING.md) - Even more detailed Postman guide
