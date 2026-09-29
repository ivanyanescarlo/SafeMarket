require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Send OTP Verification Email
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} firstName - User's first name
 */
const sendOtpEmail = async (toEmail, otpCode, firstName = 'User') => {
  const user = process.env.EMAIL_USER || 'ivro.yanes.up@phinmaed.com';
  const pass = process.env.EMAIL_PASS || 'qrsfojwkonhpgehi';
  const service = process.env.EMAIL_SERVICE || 'gmail';
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);

  // Print OTP to terminal console as fallback/audit log
  console.log(`\n======================================================`);
  console.log(`[SafeMarket OTP Service]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`One-Time Password (OTP): ${otpCode}`);
  console.log(`Expires: 10 minutes`);
  console.log(`======================================================\n`);

  // If email credentials are missing in .env, log warning and return
  if (!user || !pass) {
    console.log(`[Email Service] EMAIL_USER / EMAIL_PASS not set in .env. OTP printed to terminal console only.`);
    return { success: true, delivered: false, mode: 'terminal' };
  }

  try {
    const transporter = nodemailer.createTransport(
      process.env.EMAIL_SERVICE
        ? {
            service: service,
            auth: { user, pass },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 6000
          }
        : {
            host: host,
            port: port,
            secure: port === 465,
            auth: { user, pass },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 6000
          }
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"SafeMarket Philippines" <${user}>`,
      to: toEmail,
      subject: `[SafeMarket] Your 6-Digit Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #059669;">
            <h1 style="color: #059669; margin: 0; font-size: 24px;">🛡️ SafeMarket</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Secure Local Online Marketplace</p>
          </div>

          <div style="padding: 24px 0;">
            <p style="color: #334155; font-size: 15px; margin-bottom: 16px;">Hello <strong>${firstName}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5;">
              Thank you for registering with SafeMarket. Please use the following 6-digit One-Time Password (OTP) to complete your account verification:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #047857; background-color: #ecfdf5; padding: 14px 28px; border-radius: 12px; border: 1px solid #a7f3d0;">
                ${otpCode}
              </span>
            </div>

            <p style="color: #64748b; font-size: 13px; text-align: center;">
              This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>

          <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #059669;">
            <p style="color: #334155; font-size: 12px; margin: 0; line-height: 1.4;">
              <strong>🛡️ Scam Prevention Tip:</strong> SafeMarket staff will NEVER ask for your OTP code, passwords, or upfront reservation payments.
            </p>
          </div>

          <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 11px;">
            &copy; 2026 SafeMarket Philippines. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Real OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send real email:`, err.message);
    // Return success: true so user flow isn't blocked, code remains available in terminal
    return { success: true, delivered: false, error: err.message, mode: 'terminal_fallback' };
  }
};

module.exports = { sendOtpEmail };
