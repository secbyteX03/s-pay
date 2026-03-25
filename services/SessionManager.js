// services/SessionManager.js
// Session management for user authentication tracking

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.maxSessionsPerUser = 5;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

    // Cleanup expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  createSession(userId, deviceInfo = {}) {
    // Check max sessions limit
    const userSessions = this.getUserSessions(userId);
    if (userSessions.length >= this.maxSessionsPerUser) {
      // Remove oldest session
      const oldestSession = userSessions[0];
      this.destroySession(oldestSession.sessionId);
    }

    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      deviceInfo,
      expiresAt: new Date(Date.now() + this.sessionTimeout),
      active: true,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.expiresAt = new Date(Date.now() + this.sessionTimeout);
    }
    return session;
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  destroyUserSessions(userId) {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.active = false;
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  getUserSessions(userId) {
    const sessions = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.active) {
        sessions.push(session);
      }
    }
    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  }

  cleanupExpiredSessions() {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        session.active = false;
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  generateSessionId() {
    return (
      "sess_" +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  }

  validateSession(sessionId, userId) {
    const session = this.getSession(sessionId);
    if (!session) return false;
    if (session.userId !== userId) return false;
    if (!session.active) return false;

    this.updateActivity(sessionId);
    return true;
  }
}

module.exports = new SessionManager();
