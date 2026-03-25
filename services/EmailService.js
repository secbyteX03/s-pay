// services/EmailService.js
// Email service for sending notifications (placeholder for production)

class EmailService {
  static async sendOTP(email, otp) {
    // In production, integrate with SendGrid, AWS SES, or Nodemailer
    console.log(`Sending OTP ${otp} to ${email}`);
    return { success: true, message: "OTP sent successfully" };
  }

  static async sendLimitChangeNotification(email, newLimit) {
    console.log(
      `Sending limit change notification to ${email}: New limit is $${newLimit}`
    );
    return { success: true };
  }

  static async sendFraudAlert(email, details) {
    console.log(`Sending fraud alert to ${email}:`, details);
    return { success: true };
  }

  static async sendTransactionReceipt(email, transaction) {
    console.log(`Sending transaction receipt to ${email}:`, transaction);
    return { success: true };
  }
}

module.exports = EmailService;
