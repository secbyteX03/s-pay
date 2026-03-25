// middleware/inputValidator.js
// Input validation middleware for API requests

class InputValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000000;
  }

  static sanitizeString(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[<>]/g, "").trim();
  }

  static validateRegister(req, res, next) {
    const { email, password, fullName } = req.body;
    const errors = [];

    if (!email || !this.validateEmail(email)) {
      errors.push("Valid email is required");
    }

    if (!password || !this.validatePassword(password)) {
      errors.push(
        "Password must be at least 8 characters with uppercase, lowercase, and number"
      );
    }

    if (!fullName || fullName.length < 2) {
      errors.push("Full name is required");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    next();
  }

  static validateTransaction(req, res, next) {
    const { amount, recipientAccount } = req.body;
    const errors = [];

    if (!this.validateAmount(amount)) {
      errors.push("Valid amount between 0 and 1,000,000 is required");
    }

    if (!recipientAccount || recipientAccount.length < 8) {
      errors.push("Valid recipient account is required");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    next();
  }

  static validateLimitChange(req, res, next) {
    const { newLimit } = req.body;
    const errors = [];

    if (!this.validateAmount(newLimit)) {
      errors.push("Valid limit amount is required");
    }

    if (newLimit > 1000000) {
      errors.push("Limit cannot exceed 1,000,000");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    next();
  }
}

module.exports = InputValidator;
