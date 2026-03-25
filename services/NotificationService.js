// services/NotificationService.js
// Push notification service for real-time alerts

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.notifications = [];
    this.maxNotifications = 1000;
  }

  /**
   * Subscribe a user to push notifications
   */
  static subscribe(userId, subscription) {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    userSubscriptions.push({
      ...subscription,
      subscribedAt: new Date(),
    });
    this.subscriptions.set(userId, userSubscriptions);
    return { success: true, subscriptionCount: userSubscriptions.length };
  }

  /**
   * Unsubscribe from push notifications
   */
  static unsubscribe(userId, endpoint) {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    const filtered = userSubscriptions.filter((s) => s.endpoint !== endpoint);
    this.subscriptions.set(userId, filtered);
    return { success: true };
  }

  /**
   * Send notification to user
   */
  static async send(userId, notification) {
    const userSubscriptions = this.subscriptions.get(userId) || [];

    if (userSubscriptions.length === 0) {
      // Store for later if no active subscriptions
      this.notifications.push({
        userId,
        ...notification,
        timestamp: new Date(),
        status: "pending",
      });
      return { success: false, reason: "No active subscriptions" };
    }

    // In production, send to push service
    const results = userSubscriptions.map((sub) => {
      return {
        endpoint: sub.endpoint,
        sent: true,
      };
    });

    // Store notification
    this.notifications.push({
      userId,
      ...notification,
      timestamp: new Date(),
      status: "sent",
    });

    // Keep only recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(-this.maxNotifications);
    }

    return { success: true, results };
  }

  /**
   * Send transaction notification
   */
  static async sendTransactionNotification(userId, transaction) {
    return this.send(userId, {
      type: "transaction",
      title: "Transaction Alert",
      body: `Your ${transaction.type} of $${transaction.amount} was ${transaction.status}`,
      data: { transactionId: transaction._id },
    });
  }

  /**
   * Send fraud alert
   */
  static async sendFraudAlert(userId, alert) {
    return this.send(userId, {
      type: "fraud",
      title: "Security Alert",
      body: alert.message,
      data: { alertType: alert.type },
    });
  }

  /**
   * Send limit change notification
   */
  static async sendLimitChangeNotification(userId, oldLimit, newLimit) {
    return this.send(userId, {
      type: "limit_change",
      title: "Limit Changed",
      body: `Your daily limit changed from $${oldLimit} to $${newLimit}`,
      data: { oldLimit, newLimit },
    });
  }

  /**
   * Get notification history for user
   */
  static getHistory(userId, limit = 50) {
    return this.notifications.filter((n) => n.userId === userId).slice(-limit);
  }

  /**
   * Mark notification as read
   */
  static markAsRead(userId, notificationId) {
    const notification = this.notifications.find(
      (n) => n.userId === userId && n.timestamp.getTime() === notificationId
    );
    if (notification) {
      notification.read = true;
      return { success: true };
    }
    return { success: false };
  }
}

module.exports = NotificationService;
