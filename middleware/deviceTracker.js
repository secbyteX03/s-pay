// middleware/deviceTracker.js
// Device tracking middleware for security and trusted devices

class DeviceTracker {
  constructor() {
    this.devices = new Map();
  }

  getDeviceFingerprint(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    return {
      ip,
      userAgent,
      platform: this.extractPlatform(userAgent),
      browser: this.extractBrowser(userAgent),
      fingerprint: this.generateFingerprint(ip, userAgent),
    };
  }

  extractPlatform(userAgent) {
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
      return "iOS";
    return "Unknown";
  }

  extractBrowser(userAgent) {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    return "Unknown";
  }

  generateFingerprint(ip, userAgent) {
    const str = ip + userAgent;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  trackDevice(userId, deviceInfo) {
    const key = `${userId}:${deviceInfo.fingerprint}`;

    if (!this.devices.has(key)) {
      this.devices.set(key, {
        userId,
        ...deviceInfo,
        firstSeen: new Date(),
        lastSeen: new Date(),
        loginCount: 0,
      });
    }

    const device = this.devices.get(key);
    device.lastSeen = new Date();
    device.loginCount++;

    return device;
  }

  getUserDevices(userId) {
    const devices = [];
    for (const device of this.devices.values()) {
      if (device.userId === userId) {
        devices.push(device);
      }
    }
    return devices;
  }

  isKnownDevice(userId, fingerprint) {
    const key = `${userId}:${fingerprint}`;
    return this.devices.has(key);
  }

  removeDevice(userId, fingerprint) {
    const key = `${userId}:${fingerprint}`;
    return this.devices.delete(key);
  }

  middleware() {
    return (req, res, next) => {
      req.deviceInfo = this.getDeviceFingerprint(req);
      next();
    };
  }
}

module.exports = new DeviceTracker();
