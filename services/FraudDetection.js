// services/FraudDetection.js
const Transaction = require("../models/Transaction");

class FraudDetectionService {
  // Configuration thresholds
  static config = {
    // Time-based thresholds
    unusualHourStart: 0, // Midnight
    unusualHourEnd: 5, // 5 AM
    maxTransactionsPerHour: 10,

    // Amount thresholds
    highValueThreshold: 10000,
    mediumValueThreshold: 5000,
    lowValueThreshold: 100,

    // Behavioral thresholds
    maxDailyWithdrawals: 20,
    maxFailedAttempts: 3,
    unusualFrequencyWindow: 15, // minutes

    // Risk scores
    riskScores: {
      unusualTime: 30,
      highAmount: 40,
      veryHighAmount: 60,
      unusualFrequency: 35,
      unusualLocation: 25,
      unusualDevice: 20,
      multipleFailedAttempts: 50,
      unusualPattern: 45,
      exceedsDailyLimit: 50,
    },
  };

  /**
   * Analyze a transaction for potential fraud
   * @param {Object} transactionData - The transaction to analyze
   * @returns {Object} Analysis result with risk score and flags
   */
  static async analyzeTransaction(transactionData) {
    const riskFlags = [];
    let riskScore = 0;
    let isSuspicious = false;
    let fraudReason = null;

    try {
      // 1. Check for unusual time (late night / early morning)
      const transactionTime = new Date(transactionData.timestamp || Date.now());
      const hour = transactionTime.getHours();

      if (
        hour >= this.config.unusualHourStart &&
        hour <= this.config.unusualHourEnd
      ) {
        riskScore += this.config.riskScores.unusualTime;
        riskFlags.push("UNUSUAL_TIME");
      }

      // 2. Check for high amount transactions
      if (transactionData.amount >= this.config.highValueThreshold) {
        riskScore += this.config.riskScores.highAmount;
        riskFlags.push("HIGH_AMOUNT");
      } else if (transactionData.amount >= this.config.mediumValueThreshold) {
        riskScore += this.config.riskScores.highAmount / 2;
        riskFlags.push("MEDIUM_AMOUNT");
      }

      // 2.5. Check for very high amount (over $50k)
      if (transactionData.amount >= 50000) {
        riskScore += this.config.riskScores.veryHighAmount;
        riskFlags.push("VERY_HIGH_AMOUNT");
      }

      // 2.6. Check daily limit
      if (
        transactionData.dailyLimit &&
        transactionData.amount > transactionData.dailyLimit
      ) {
        riskScore += this.config.riskScores.exceedsDailyLimit;
        riskFlags.push("EXCEEDS_DAILY_LIMIT");
        fraudReason =
          "Transaction exceeds your daily limit of $" +
          transactionData.dailyLimit;
      }

      // 3. Check transaction frequency
      const frequencyCheck = await this.checkTransactionFrequency(
        transactionData.username
      );
      if (frequencyCheck.isSuspicious) {
        riskScore += this.config.riskScores.unusualFrequency;
        riskFlags.push(...frequencyCheck.flags);
      }

      // 4. Check for unusual withdrawal patterns
      if (transactionData.type === "withdrawal") {
        const withdrawalCheck = await this.checkWithdrawalPattern(
          transactionData.username
        );
        if (withdrawalCheck.isSuspicious) {
          riskScore += this.config.riskScores.unusualPattern;
          riskFlags.push(...withdrawalCheck.flags);
        }
      }

      // 5. Check user's typical transaction patterns
      const patternCheck = await this.checkUserPattern(transactionData);
      if (patternCheck.isSuspicious) {
        riskScore += this.config.riskScores.unusualPattern;
        riskFlags.push(...patternCheck.flags);
      }

      // Determine if transaction should be blocked
      isSuspicious = riskScore >= 50;

      if (isSuspicious) {
        fraudReason = this.generateFraudReason(riskFlags);
      }

      return {
        isSuspicious,
        riskScore: Math.min(riskScore, 100),
        riskFlags,
        fraudReason,
        shouldBlock: riskScore >= 70,
        shouldFlag: riskScore >= 50 && riskScore < 70,
      };
    } catch (error) {
      console.error("Fraud detection error:", error);
      // In case of error, flag for review
      return {
        isSuspicious: true,
        riskScore: 50,
        riskFlags: ["SYSTEM_ERROR"],
        fraudReason: "System error during fraud check",
        shouldBlock: false,
        shouldFlag: true,
      };
    }
  }

  /**
   * Check transaction frequency for the user
   */
  static async checkTransactionFrequency(username) {
    const windowMinutes = this.config.unusualFrequencyWindow;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const recentCount = await Transaction.countDocuments({
      username,
      timestamp: { $gte: windowStart },
    });

    return {
      isSuspicious: recentCount >= this.config.maxTransactionsPerHour,
      flags:
        recentCount >= this.config.maxTransactionsPerHour
          ? ["HIGH_FREQUENCY"]
          : [],
    };
  }

  /**
   * Check withdrawal patterns
   */
  static async checkWithdrawalPattern(username) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawals = await Transaction.countDocuments({
      username,
      type: "withdrawal",
      timestamp: { $gte: today },
    });

    return {
      isSuspicious: dailyWithdrawals >= this.config.maxDailyWithdrawals,
      flags:
        dailyWithdrawals >= this.config.maxDailyWithdrawals
          ? ["EXCESSIVE_WITHDRAWALS"]
          : [],
    };
  }

  /**
   * Check user's typical transaction patterns
   */
  static async checkUserPattern(transactionData) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get user's average transaction amount
    const avgTransaction = await Transaction.aggregate([
      {
        $match: {
          username: transactionData.username,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (avgTransaction.length > 0) {
      const { avgAmount, count } = avgTransaction[0];

      // If this transaction is more than 3x the average
      if (count >= 5 && transactionData.amount > avgAmount * 3) {
        return {
          isSuspicious: true,
          flags: ["UNUSUAL_AMOUNT_PATTERN"],
        };
      }
    }

    return { isSuspicious: false, flags: [] };
  }

  /**
   * Generate human-readable fraud reason
   */
  static generateFraudReason(flags) {
    if (flags.includes("UNUSUAL_TIME") && flags.includes("HIGH_AMOUNT")) {
      return "High-value transaction during unusual hours";
    }
    if (flags.includes("HIGH_FREQUENCY")) {
      return "Unusually high transaction frequency detected";
    }
    if (flags.includes("EXCESSIVE_WITHDRAWALS")) {
      return "Daily withdrawal limit exceeded";
    }
    if (flags.includes("HIGH_AMOUNT")) {
      return "Transaction amount exceeds normal limits";
    }
    if (flags.includes("UNUSUAL_AMOUNT_PATTERN")) {
      return "Transaction amount deviates significantly from user pattern";
    }
    return "Multiple risk factors detected";
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(username, limit = 50) {
    return Transaction.find({ username }).sort({ timestamp: -1 }).limit(limit);
  }

  /**
   * Get blocked/flagged transactions
   */
  static async getFlaggedTransactions(username = null) {
    const query = {
      status: { $in: ["blocked", "flagged"] },
    };
    if (username) {
      query.username = username;
    }
    return Transaction.find(query).sort({ timestamp: -1 });
  }

  /**
   * Block a user's account
   */
  static async blockUser(username, reason) {
    const user = require("../models/User");
    await user.updateOne(
      { username },
      { $set: { isBlocked: true, blockReason: reason } }
    );
    return {
      success: true,
      message: `User ${username} blocked for: ${reason}`,
    };
  }
}

module.exports = FraudDetectionService;
