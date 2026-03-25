require("dotenv").config();
// S-Pay Backend with Fraud Detection
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Transaction = require("./models/Transaction");
const FraudDetectionService = require("./services/FraudDetection");
const speakeasy = require("speakeasy");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "S-Pay Fraud Detection API",
    version: "1.0.0",
    description: "Secure fraud detection backend for payment applications",
    endpoints: {
      auth: {
        register: "POST /api/register",
        login: "POST /api/login",
        verifyOtp: "POST /api/verify-otp",
      },
      transactions: {
        create: "POST /api/transaction",
        list: "GET /api/transactions",
        getById: "GET /api/transaction/:id",
      },
      fraudDetection: {
        analyze: "POST /api/analyze-transaction",
        flagged: "GET /api/flagged-transactions",
      },
      user: {
        profile: "GET /api/profile",
        block: "POST /api/block-user",
        unblock: "POST /api/unblock-user",
      },
    },
    documentation: "See POSTMAN_TESTING.md for detailed API testing guide",
  });
});

// MongoDB connection with in-memory fallback for testing
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.log(
      "Local MongoDB not available, using in-memory MongoDB for testing..."
    );
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("In-memory MongoDB Connected");
    } catch (memErr) {
      console.error("Failed to start in-memory MongoDB:", memErr.message);
      process.exit(1);
    }
  }
};

connectDB();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTHENTICATION ENDPOINTS ====================

// User registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, phoneNumber, email } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      phoneNumber,
      email,
      accountBalance: 1000, // Starting balance for testing
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", username });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

// User login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;

    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account is blocked",
        reason: user.blockReason,
      });
    }

    // Verify password
    if (!(await bcrypt.compare(password, user.password))) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      user.lastLoginAttempt = new Date();
      await user.save();

      // Block after too many failed attempts
      if (user.failedLoginAttempts >= 3) {
        user.isBlocked = true;
        user.blockReason = "Too many failed login attempts";
        await user.save();
        return res.status(403).json({
          message: "Account blocked due to multiple failed login attempts",
          blocked: true,
        });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;

    // Check if this is a trusted device - skip OTP
    if (user.isTrustedDevice && deviceId && user.deviceId === deviceId) {
      // Trusted device - skip OTP
      const token = jwt.sign({ username }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.status(200).json({
        message: "Login successful (trusted device)",
        token,
        skipOtp: true,
        user: {
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          accountBalance: user.accountBalance,
          dailyLimit: user.dailyLimit,
        },
      });
    }

    // Not a trusted device - require OTP
    // Save device ID for potential trusted device setup
    if (deviceId && !user.deviceId) {
      user.deviceId = deviceId;
    }
    await user.save();

    // Generate OTP
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
    });

    // Save secret to user
    user.secret = secret.base32;
    await user.save();

    res.status(200).json({
      message: "OTP sent",
      otp,
      requiresOtp: true,
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accountBalance: user.accountBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// OTP verification
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { username, otp } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token: otp,
      window: 1, // Allow 1 step tolerance
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Generate JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accountBalance: user.accountBalance,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

// Create transaction (with fraud detection)
app.post("/api/transaction", authenticateToken, async (req, res) => {
  try {
    const { type, amount, description, recipient, location, deviceId } =
      req.body;
    const username = req.user.username;

    // Get user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    // Check sufficient balance for withdrawals
    if (
      (type === "withdrawal" || type === "payment" || type === "transfer") &&
      user.accountBalance < amount
    ) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Create transaction record
    const transaction = new Transaction({
      username,
      type,
      amount,
      description,
      recipient,
      location,
      deviceId,
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    // Run fraud detection
    const fraudAnalysis = await FraudDetectionService.analyzeTransaction({
      username,
      type,
      amount,
      timestamp: new Date(),
      location,
      dailyLimit: user.dailyLimit,
    });

    // Apply fraud detection results
    transaction.riskScore = fraudAnalysis.riskScore;
    transaction.riskFlags = fraudAnalysis.riskFlags;
    transaction.isSuspicious = fraudAnalysis.isSuspicious;

    if (fraudAnalysis.shouldBlock) {
      transaction.status = "blocked";
      transaction.fraudReason = fraudAnalysis.fraudReason;
      await transaction.save();

      // Block the user
      await FraudDetectionService.blockUser(
        username,
        fraudAnalysis.fraudReason
      );

      return res.status(403).json({
        message: "Transaction blocked due to suspicious activity",
        transaction: transaction,
        fraudAnalysis,
      });
    }

    if (fraudAnalysis.shouldFlag) {
      transaction.status = "flagged";
      transaction.fraudReason = fraudAnalysis.fraudReason;
    } else {
      transaction.status = "completed";

      // Update balance
      if (type === "deposit") {
        user.accountBalance += amount;
      } else if (
        type === "withdrawal" ||
        type === "payment" ||
        type === "transfer"
      ) {
        user.accountBalance -= amount;
      }
      await user.save();
    }

    await transaction.save();

    res.status(201).json({
      message:
        transaction.status === "flagged"
          ? "Transaction flagged for review"
          : "Transaction completed",
      transaction,
      fraudAnalysis,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Transaction failed", error: error.message });
  }
});

// Get user transactions
app.get("/api/transactions", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const limit = parseInt(req.query.limit) || 50;

    const transactions = await FraudDetectionService.getUserTransactions(
      username,
      limit
    );

    res.status(200).json({ transactions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch transactions", error: error.message });
  }
});

// Get transaction by ID
app.get("/api/transaction/:id", authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Only allow user to view their own transactions
    if (transaction.username !== req.user.username) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch transaction", error: error.message });
  }
});

// ==================== FRAUD DETECTION ENDPOINTS ====================

// Get flagged/blocked transactions
app.get("/api/flagged-transactions", authenticateToken, async (req, res) => {
  try {
    const transactions = await FraudDetectionService.getFlaggedTransactions(
      req.user.username
    );
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch flagged transactions",
      error: error.message,
    });
  }
});

// Analyze a potential transaction (preview before committing)
app.post("/api/analyze-transaction", authenticateToken, async (req, res) => {
  try {
    const { type, amount, location } = req.body;
    const username = req.user.username;

    const user = await User.findOne({ username });

    const analysis = await FraudDetectionService.analyzeTransaction({
      username,
      type,
      amount,
      timestamp: new Date(),
      location,
      dailyLimit: user.dailyLimit,
    });

    res.status(200).json({ analysis });
  } catch (error) {
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
});

// Get user profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      accountBalance: user.accountBalance,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
});

// Block user (admin endpoint)
app.post("/api/block-user", authenticateToken, async (req, res) => {
  try {
    const { username, reason } = req.body;

    const result = await FraudDetectionService.blockUser(username, reason);
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to block user", error: error.message });
  }
});

// Unblock user
app.post("/api/unblock-user", authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;

    await User.updateOne(
      { username },
      { $set: { isBlocked: false, blockReason: null } }
    );
    res.status(200).json({ message: `User ${username} has been unblocked` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to unblock user", error: error.message });
  }
});

// ==================== TRUSTED DEVICE & LIMITS ====================

// Trust current device after OTP verification
app.post("/api/trust-device", authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const username = req.user.username;

    await User.updateOne(
      { username },
      { $set: { isTrustedDevice: true, deviceId: deviceId } }
    );

    res
      .status(200)
      .json({ message: "Device trusted. OTP will be skipped on next login." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to trust device", error: error.message });
  }
});

// Request to change daily limit
app.post("/api/request-limit-change", authenticateToken, async (req, res) => {
  try {
    const { newLimit, email } = req.body;
    const username = req.user.username;

    const user = await User.findOne({ username });

    // Generate OTP for verification
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
    });

    // Store pending limit change
    user.pendingLimitChange = {
      newLimit: newLimit,
      requestedAt: new Date(),
      approved: false,
      otpVerified: false,
    };
    await user.save();

    res.status(200).json({
      message:
        "Limit change request pending. OTP sent to your email for verification.",
      otp: otp,
      email: email || user.email,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to request limit change",
      error: error.message,
    });
  }
});

// Verify limit change with OTP
app.post("/api/verify-limit-change", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const username = req.user.username;

    const user = await User.findOne({ username });

    if (!user.pendingLimitChange || !user.pendingLimitChange.requestedAt) {
      return res
        .status(400)
        .json({ message: "No pending limit change request" });
    }

    // Verify OTP - using the same secret from login
    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Apply the limit change
    user.dailyLimit = user.pendingLimitChange.newLimit;
    user.pendingLimitChange = {
      newLimit: user.pendingLimitChange.newLimit,
      requestedAt: user.pendingLimitChange.requestedAt,
      approved: true,
      approvedAt: new Date(),
      otpVerified: true,
    };
    await user.save();

    res.status(200).json({
      message: "Daily limit updated successfully",
      newLimit: user.dailyLimit,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to verify limit change", error: error.message });
  }
});

// Get current daily limit
app.get("/api/daily-limit", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });

    res.status(200).json({
      dailyLimit: user.dailyLimit,
      hasPendingRequest:
        !!user.pendingLimitChange && !user.pendingLimitChange.approved,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get daily limit", error: error.message });
  }
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(
    `S-Pay Server with Fraud Detection running on http://localhost:${PORT}`
  );
  console.log("Available endpoints:");
  console.log("  POST /api/register - Register new user");
  console.log("  POST /api/login - Login (returns OTP)");
  console.log("  POST /api/verify-otp - Verify OTP and get JWT");
  console.log("  POST /api/transaction - Create transaction (requires auth)");
  console.log(
    "  GET /api/transactions - Get user transactions (requires auth)"
  );
  console.log("  GET /api/profile - Get user profile (requires auth)");
  console.log(
    "  POST /api/analyze-transaction - Preview fraud analysis (requires auth)"
  );
  console.log(
    "  GET /api/flagged-transactions - Get flagged transactions (requires auth)"
  );
  console.log("  POST /api/block-user - Block a user (requires auth)");
  console.log("  POST /api/unblock-user - Unblock a user (requires auth)");
});
