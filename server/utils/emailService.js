require('dotenv').config();
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

/**
 * Send OTP Verification Email (Supports Direct SSL Gmail SMTP & Resend API)
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} firstName - User's first name
 */
const sendOtpEmail = async (toEmail, otpCode, firstName = 'User') => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  // Print OTP to terminal console as fallback/audit log
  console.log(`\n======================================================`);
  console.log(`[SafeMarket OTP Service]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`One-Time Password (OTP): ${otpCode}`);
  console.log(`Expires: 10 minutes`);
  console.log(`======================================================\n`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
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
  `;

  // 1. Primary: Direct Gmail SSL Transporter (Port 465 - Unblocked on Render Cloud Data Centers)
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL port 465 for Cloud Servers
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"SafeMarket Philippines" <${emailUser}>`,
        to: toEmail,
        subject: `[SafeMarket] Your 6-Digit Verification Code: ${otpCode}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service - Direct Gmail SSL] OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, delivered: true, messageId: info.messageId, provider: 'gmail_ssl' };
    } catch (gmailErr) {
      console.error(`[Email Service - Direct Gmail SSL Error] ${gmailErr.message}`);
      console.log(`[Email Service] Retrying via Resend API / Secondary Transport...`);
    }
  }

  // 2. Secondary Backup: Resend API if configured
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const resend = new Resend(resendApiKey);
      const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'SafeMarket <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: resendFromEmail,
        to: [toEmail],
        subject: `[SafeMarket] Your 6-Digit Verification Code: ${otpCode}`,
        html: htmlContent
      });

      if (!error) {
        console.log(`[Email Service - Resend] OTP email sent successfully to ${toEmail}. Message ID: ${data?.id}`);
        return { success: true, delivered: true, messageId: data?.id, provider: 'resend' };
      } else {
        console.error(`[Email Service - Resend API Error] ${error.message || JSON.stringify(error)}`);
      }
    } catch (resendErr) {
      console.error(`[Email Service - Resend Exception] ${resendErr.message}`);
    }
  }

  return { success: true, delivered: false, mode: 'terminal_fallback' };
};

module.exports = { sendOtpEmail };
