// services/AnalyticsService.js
// Analytics and reporting service for transaction insights

class AnalyticsService {
  constructor() {
    this.events = [];
    this.maxEvents = 10000;
  }

  /**
   * Track an analytics event
   */
  static trackEvent(eventType, userId, data = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      userId,
      data,
      timestamp: new Date(),
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return event;
  }

  /**
   * Track user login
   */
  static trackLogin(userId, deviceInfo) {
    return this.trackEvent("user_login", userId, { device: deviceInfo });
  }

  /**
   * Track transaction
   */
  static trackTransaction(userId, transaction) {
    return this.trackEvent("transaction", userId, {
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
    });
  }

  /**
   * Get user activity summary
   */
  static getUserActivity(userId, days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const userEvents = this.events.filter(
      (e) => e.userId === userId && e.timestamp >= cutoff
    );

    const logins = userEvents.filter((e) => e.type === "user_login").length;
    const transactions = userEvents.filter(
      (e) => e.type === "transaction"
    ).length;

    return {
      period: days,
      totalEvents: userEvents.length,
      logins,
      transactions,
      lastActivity: userEvents[userEvents.length - 1]?.timestamp,
    };
  }

  /**
   * Get transaction analytics
   */
  static getTransactionAnalytics(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const txEvents = this.events.filter(
      (e) => e.type === "transaction" && e.timestamp >= cutoff
    );

    const total = txEvents.length;
    const completed = txEvents.filter(
      (e) => e.data.status === "completed"
    ).length;
    const flagged = txEvents.filter((e) => e.data.status === "flagged").length;
    const blocked = txEvents.filter((e) => e.data.status === "blocked").length;

    const amounts = txEvents.map((e) => e.data.amount || 0);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;

    return {
      period: days,
      total,
      completed,
      flagged,
      blocked,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      totalAmount: totalAmount.toFixed(2),
      averageAmount: avgAmount.toFixed(2),
    };
  }

  /**
   * Get fraud detection metrics
   */
  static getFraudMetrics(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const txEvents = this.events.filter(
      (e) => e.type === "transaction" && e.timestamp >= cutoff
    );

    const flagged = txEvents.filter((e) => e.data.status === "flagged").length;
    const blocked = txEvents.filter((e) => e.data.status === "blocked").length;
    const total = txEvents.length;

    return {
      period: days,
      flagged,
      blocked,
      total,
      fraudRate:
        total > 0 ? (((flagged + blocked) / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Get daily active users
   */
  static getDailyActiveUsers(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const loginEvents = this.events.filter(
      (e) =>
        e.type === "user_login" &&
        e.timestamp >= startOfDay &&
        e.timestamp <= endOfDay
    );

    const uniqueUsers = new Set(loginEvents.map((e) => e.userId));
    return uniqueUsers.size;
  }

  /**
   * Get top transactions by amount
   */
  static getTopTransactions(limit = 10) {
    const txEvents = this.events.filter((e) => e.type === "transaction");

    return txEvents
      .sort((a, b) => (b.data.amount || 0) - (a.data.amount || 0))
      .slice(0, limit)
      .map((e) => ({
        userId: e.userId,
        amount: e.data.amount,
        type: e.data.type,
        timestamp: e.timestamp,
      }));
  }
}

module.exports = AnalyticsService;
