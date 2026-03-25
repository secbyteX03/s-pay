# S-Pay API Endpoints

## Authentication

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/verify-otp` - Verify OTP code

## Transactions

- `POST /api/transaction` - Create transaction
- `GET /api/transactions` - Get user transactions
- `GET /api/transaction/:id` - Get transaction by ID

## Fraud Detection

- `POST /api/analyze-transaction` - Analyze transaction before commit
- `GET /api/flagged-transactions` - Get flagged transactions

## User

- `GET /api/profile` - Get user profile
- `POST /api/block-user` - Block user (admin)
- `POST /api/unblock-user` - Unblock user (admin)

## Wallet (NEW)

- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet/:id` - Get wallet details
- `POST /api/wallet/deposit` - Deposit funds
- `POST /api/wallet/withdraw` - Withdraw funds

## Escrow (NEW)

- `POST /api/escrow/create` - Create escrow
- `POST /api/escrow/release` - Release escrow funds
- `POST /api/escrow/cancel` - Cancel escrow
- `GET /api/escrow/:id` - Get escrow status
