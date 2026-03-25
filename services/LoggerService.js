// services/LoggerService.js
// Logging service for application events and security incidents

class LoggerService {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000;
  }

  log(level, category, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on level
    const prefix = `[${
      logEntry.timestamp
    }] [${level.toUpperCase()}] [${category}]`;
    switch (level) {
      case "error":
        console.error(prefix, message, data);
        break;
      case "warn":
        console.warn(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }

    return logEntry;
  }

  info(category, message, data) {
    return this.log("info", category, message, data);
  }

  warn(category, message, data) {
    return this.log("warn", category, message, data);
  }

  error(category, message, data) {
    return this.log("error", category, message, data);
  }

  security(category, message, data) {
    return this.log("security", category, message, data);
  }

  getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters.category) {
      filtered = filtered.filter((log) => log.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    return filtered.slice(-100); // Return last 100 matching logs
  }

  // Security-specific logging methods
  logLogin(userId, success, ip, details = {}) {
    return this.security(
      "auth",
      success ? "User login successful" : "User login failed",
      {
        userId,
        ip,
        ...details,
      }
    );
  }

  logTransaction(userId, transactionId, amount, riskScore, details = {}) {
    return this.security("transaction", "Transaction processed", {
      userId,
      transactionId,
      amount,
      riskScore,
      ...details,
    });
  }

  logFraudAlert(userId, alertType, details = {}) {
    return this.security("fraud", `Fraud alert: ${alertType}`, {
      userId,
      alertType,
      ...details,
    });
  }

  logLimitChange(userId, oldLimit, newLimit, approved) {
    return this.security("limits", "Daily limit change requested", {
      userId,
      oldLimit,
      newLimit,
      approved,
    });
  }

  clearLogs() {
    this.logs = [];
  }
}

module.exports = new LoggerService();
