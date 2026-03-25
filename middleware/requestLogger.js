// middleware/requestLogger.js
// Request logging middleware for debugging and monitoring

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  req.requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 500) {
      console.error("Server Error:", log);
    } else if (res.statusCode >= 400) {
      console.warn("Client Error:", log);
    } else {
      console.log("Request:", log);
    }
  });

  next();
};

module.exports = requestLogger;
