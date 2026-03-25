// middleware/securityHeaders.js
// Security headers middleware for HTTP response protection

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

const securityMiddleware = (req, res, next) => {
  for (const [header, value] of Object.entries(securityHeaders)) {
    res.setHeader(header, value);
  }
  next();
};

module.exports = securityMiddleware;
