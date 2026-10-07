require('dotenv').config();
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const deliverEmail = async (toEmail, subject, htmlContent, emailType) => {
  const brevoUser = process.env.BREVO_USER || process.env.BREVO_LOGIN;
  const brevoKey = process.env.BREVO_KEY || process.env.BREVO_API_KEY || process.env.BREVO_PASS;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (brevoUser && brevoKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: false,
        auth: { user: brevoUser, pass: brevoKey },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"SafeMarket Philippines" <${brevoUser}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      console.log(`[Email Service - Brevo SMTP] ${emailType} email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, delivered: true, messageId: info.messageId, provider: 'brevo_smtp' };
    } catch (error) {
      console.error(`[Email Service - Brevo SMTP Error] ${error.message}`);
    }
  }

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"SafeMarket Philippines" <${emailUser}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      console.log(`[Email Service - Direct Gmail SSL] ${emailType} email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, delivered: true, messageId: info.messageId, provider: 'gmail_ssl' };
    } catch (error) {
      console.error(`[Email Service - Direct Gmail SSL Error] ${error.message}`);
    }
  }

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const resend = new Resend(resendApiKey);
      const from = process.env.RESEND_FROM_EMAIL || 'SafeMarket <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from,
        to: [toEmail],
        subject,
        html: htmlContent
      });
      if (!error) {
        console.log(`[Email Service - Resend] ${emailType} email sent to ${toEmail}. Message ID: ${data?.id}`);
        return { success: true, delivered: true, messageId: data?.id, provider: 'resend' };
      }
      console.error(`[Email Service - Resend API Error] ${error.message || JSON.stringify(error)}`);
    } catch (error) {
      console.error(`[Email Service - Resend Exception] ${error.message}`);
    }
  }

  const hasConfiguredProvider = (brevoUser && brevoKey) ||
    (emailUser && emailPass) ||
    (resendApiKey && resendApiKey.startsWith('re_'));
  if (!hasConfiguredProvider) {
    console.error(`[Email Service] ${emailType} email was not sent: no email provider credentials are configured.`);
  }
  return { success: true, delivered: false, mode: 'terminal_fallback' };
};

const sendOtpEmail = async (toEmail, otpCode, firstName = 'User', purpose = 'verification') => {
  const isPasswordReset = purpose === 'password-reset';
  const subject = isPasswordReset
    ? '[SafeMarket] Your 6-Digit Password Reset Code'
    : `[SafeMarket] Your 6-Digit Verification Code: ${otpCode}`;
  const instructions = isPasswordReset
    ? 'We received a request to reset your SafeMarket password. Use this 6-digit One-Time Password to continue:'
    : 'Thank you for registering with SafeMarket. Use this 6-digit One-Time Password to verify your account:';
  const emailType = isPasswordReset ? 'Password reset OTP' : 'OTP';

  console.log(`\n======================================================`);
  console.log(`[SafeMarket ${emailType} Service]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`One-Time Password (OTP): ${otpCode}`);
  console.log(`Expires: 10 minutes`);
  console.log(`======================================================\n`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #059669;">
        <h1 style="color: #059669; margin: 0; font-size: 24px;">SafeMarket</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Secure Local Online Marketplace</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="color: #334155; font-size: 15px; margin-bottom: 16px;">Hello <strong>${escapeHtml(firstName)}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">${instructions}</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #047857; background-color: #ecfdf5; padding: 14px 28px; border-radius: 12px; border: 1px solid #a7f3d0;">${escapeHtml(otpCode)}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">This code expires in <strong>10 minutes</strong> and can only be used once. Do not share it with anyone.</p>
      </div>
      <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #059669;">
        <p style="color: #334155; font-size: 12px; margin: 0; line-height: 1.4;"><strong>Scam Prevention Tip:</strong> SafeMarket staff will never ask for your OTP, password, or upfront reservation payments.</p>
      </div>
      ${isPasswordReset ? '<p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 20px;">If you did not request a password reset, you can ignore this email. Your password will not change.</p>' : ''}
      <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 11px;">&copy; 2026 SafeMarket Philippines. All rights reserved.</div>
    </div>
  `;

  return deliverEmail(toEmail, subject, htmlContent, emailType);
};

const sendPasswordResetOtpEmail = async (toEmail, otpCode, firstName = 'User') => {
  return sendOtpEmail(toEmail, otpCode, firstName, 'password-reset');
};

module.exports = { sendOtpEmail, sendPasswordResetOtpEmail };
