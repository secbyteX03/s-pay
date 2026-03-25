// middleware/rateLimiter.js
// Rate limiting middleware to prevent brute force attacks

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100;
    this.store = new Map();

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now - data.windowStart > this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  isRateLimited(key) {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      this.store.set(key, { windowStart: now, count: 1 });
      return false;
    }

    if (record.count >= this.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;

      if (this.isRateLimited(key)) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
      }

      next();
    };
  }
}

// Pre-configured limiters
const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});
const transactionLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});
const apiLimiter = new RateLimiter({ windowMs: 60 * 1000, maxRequests: 100 });

module.exports = { RateLimiter, authLimiter, transactionLimiter, apiLimiter };
