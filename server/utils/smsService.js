require('dotenv').config();

/**
 * Send OTP Verification SMS via Semaphore API / Twilio or Console Audit Fallback
 * @param {string} mobileNumber - Philippine mobile number (e.g. +639171234567 or 09171234567)
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} firstName - User's first name
 */
const sendSmsOtp = async (mobileNumber, otpCode, firstName = 'User') => {
  if (!mobileNumber) {
    return { success: false, message: 'Mobile number not provided' };
  }

  // Format mobile number to 09XXXXXXXXX or +639XXXXXXXXX
  let cleanMobile = mobileNumber.trim();
  if (cleanMobile.startsWith('+63')) {
    cleanMobile = `0${cleanMobile.substring(3)}`;
  }

  const messageText = `[SafeMarket] Hello ${firstName}! Your 6-digit OTP verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;

  console.log(`\n======================================================`);
  console.log(`[SafeMarket SMS Service]`);
  console.log(`Recipient Mobile: ${mobileNumber} (${cleanMobile})`);
  console.log(`Message: ${messageText}`);
  console.log(`======================================================\n`);

  const apiKey = process.env.SEMAPHORE_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  // 1. Send via Semaphore API (Philippine Local SMS Gateway) if API key is provided
  if (apiKey) {
    try {
      const response = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: apiKey,
          number: cleanMobile,
          message: messageText,
          sendername: process.env.SEMAPHORE_SENDER_NAME || 'SafeMarket'
        })
      });
      const data = await response.json();
      console.log(`[SMS Service - Semaphore] Dispatched SMS response:`, data);
      return { success: true, delivered: true, provider: 'semaphore', data };
    } catch (err) {
      console.error(`[SMS Service Error - Semaphore]:`, err.message);
    }
  }

  // 2. Send via Twilio SMS API if Twilio credentials are set
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const twilio = require('twilio')(twilioSid, twilioToken);
      const res = await twilio.messages.create({
        body: messageText,
        from: twilioPhone,
        to: mobileNumber.startsWith('+') ? mobileNumber : `+63${cleanMobile.substring(1)}`
      });
      console.log(`[SMS Service - Twilio] Sent SMS message SID: ${res.sid}`);
      return { success: true, delivered: true, provider: 'twilio', sid: res.sid };
    } catch (err) {
      console.error(`[SMS Service Error - Twilio]:`, err.message);
    }
  }

  // Fallback audit response
  return {
    success: true,
    delivered: false,
    mode: 'terminal_audit',
    message: 'SMS logged to audit log. To enable real cellular SMS sending, configure SEMAPHORE_API_KEY or TWILIO_ACCOUNT_SID.'
  };
};

module.exports = { sendSmsOtp };
