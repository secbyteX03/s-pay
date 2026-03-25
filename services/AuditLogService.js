// services/AuditLogService.js
// Audit logging service for security and compliance

class AuditLogService {
  constructor() {
    this.logs = [];
    this.maxLogs = 50000;
  }

  /**
   * Log an audit event
   */
  static log(action, userId, details = {}) {
    const log = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId,
      details,
      timestamp: new Date(),
      ipAddress: details.ip || "unknown",
      userAgent: details.userAgent || "unknown",
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return log;
  }

  /**
   * Log authentication event
   */
  static logAuth(userId, action, success, details = {}) {
    return this.log(`auth_${action}`, userId, {
      success,
      ...details,
    });
  }

  /**
   * Log transaction event
   */
  static logTransaction(userId, transactionId, action, details = {}) {
    return this.log(`transaction_${action}`, userId, {
      transactionId,
      ...details,
    });
  }

  /**
   * Log admin action
   */
  static logAdmin(adminUserId, action, targetUserId, details = {}) {
    return this.log(`admin_${action}`, adminUserId, {
      targetUserId,
      ...details,
    });
  }

  /**
   * Get audit logs with filters
   */
  static getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.userId) {
      filtered = filtered.filter((l) => l.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter((l) => l.action.startsWith(filters.action));
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) <= new Date(filters.endDate)
      );
    }

    return filtered.slice(-1000);
  }

  /**
   * Export audit logs
   */
  static export(startDate, endDate, format = "json") {
    const logs = this.getLogs({ startDate, endDate });

    if (format === "csv") {
      const headers = ["ID", "Action", "UserID", "Timestamp", "IP"];
      const rows = logs.map((l) => [
        l.id,
        l.action,
        l.userId,
        l.timestamp,
        l.ipAddress,
      ]);
      return [headers, ...rows].map((r) => r.join(",")).join("\n");
    }

    return logs;
  }
}

module.exports = AuditLogService;
