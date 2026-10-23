/**
 * emailService.js - Production-ready Brevo (Sendinblue) Transactional Email Service
 * Uses the official @getbrevo/brevo SDK to send rich HTML transactional emails.
 */
const { BrevoClient } = require('@getbrevo/brevo');
const emailConfig = require('../config/emailConfig');

// Initialize Brevo Client
let brevo = null;
if (emailConfig.isValid) {
  try {
    brevo = new BrevoClient({
      apiKey: emailConfig.apiKey,
      timeoutInSeconds: 30,
      maxRetries: 3,
    });
  } catch (err) {
    console.error('❌ [emailService] Failed to initialize BrevoClient:', err.message);
  }
}

/**
 * Common HTML email header styling (Jet Black #050505, Royal Amethyst #3B0A6B, Electric Cyan #00E5FF)
 */
const getEmailWrapper = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2D9F3;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #050505;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(145deg, #160728 0%, #0c0416 100%);
      border: 1px solid rgba(0, 229, 255, 0.25);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 10, 107, 0.35);
    }
    .header {
      background: linear-gradient(135deg, #1f073d 0%, #3B0A6B 50%, #050505 100%);
      padding: 30px 25px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 229, 255, 0.2);
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      text-decoration: none;
      display: inline-block;
    }
    .logo-cyan { color: #00E5FF; }
    .tagline {
      color: #C4B5FD;
      font-size: 13px;
      margin-top: 5px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .content {
      padding: 35px 30px;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #00E5FF 0%, #00B4D8 100%);
      color: #050505 !important;
      font-weight: 800;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 229, 255, 0.4);
      margin: 25px 0 15px 0;
      text-align: center;
    }
    .ticket-card {
      background: rgba(5, 5, 5, 0.65);
      border: 1px dashed rgba(0, 229, 255, 0.4);
      border-radius: 14px;
      padding: 20px;
      margin: 25px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(196, 181, 253, 0.1);
      font-size: 14px;
    }
    .info-label {
      color: #8E7BB0;
      font-weight: 600;
    }
    .info-val {
      color: #FFFFFF;
      font-weight: 700;
      text-align: right;
    }
    .footer {
      background-color: #07020d;
      padding: 25px 20px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #7A699B;
    }
    .footer a {
      color: #00E5FF;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header">
        <div class="logo">
          <span class="logo-cyan">i</span>Movies
        </div>
        <div class="tagline">Next-Gen Cinema Experience</div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">This email was sent by <strong>iMovies Cinemas</strong>.</p>
        <p style="margin: 0 0 8px 0;">If you have questions, please reach out to our support team.</p>
        <p style="margin: 12px 0 0 0; color: #53456D;">&copy; ${new Date().getFullYear()} iMovies Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Base method: sendEmail
 * Sends a transactional email through Brevo with error handling and retry support.
 */
const sendEmail = async ({ to, subject, htmlContent, textContent, replyTo }) => {
  if (!emailConfig.isValid || !brevo) {
    console.warn(`[emailService] ⚠️ Brevo API key not configured. Simulated dispatch to: ${to}`);
    return {
      success: false,
      simulated: true,
      message: 'Brevo API key not configured.',
    };
  }

  const recipientEmail = typeof to === 'string' ? to : to?.email;
  const recipientName = typeof to === 'object' ? to?.name : '';

  try {
    const payload = {
      sender: {
        name: emailConfig.senderName,
        email: emailConfig.senderEmail,
      },
      to: [{ email: recipientEmail, ...(recipientName ? { name: recipientName } : {}) }],
      subject,
      htmlContent,
      ...(textContent ? { textContent } : {}),
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    };

    const response = await brevo.transactionalEmails.sendTransacEmail(payload);

    console.log(`[emailService] ✅ Email sent to ${recipientEmail} | Subject: "${subject}" | MessageId: ${response.messageId || 'OK'}`);
    return {
      success: true,
      messageId: response.messageId,
      recipient: recipientEmail,
    };
  } catch (error) {
    // Structured error handling (catching HTTP 429, 401, network timeouts)
    const statusCode = error.statusCode || error.status || error.response?.status;
    const errorDetails = error.body || error.response?.data || error.message;

    if (statusCode === 429) {
      console.error(`[emailService] 🚨 Brevo Rate Limit Exceeded (HTTP 429) while sending to ${recipientEmail}:`, errorDetails);
    } else if (statusCode === 401) {
      console.error(`[emailService] 🚨 Brevo Authentication Failed (HTTP 401) - Please verify BREVO_API_KEY:`, errorDetails);
    } else {
      console.error(`[emailService] ❌ Failed to dispatch email to ${recipientEmail}:`, error.message || errorDetails);
    }

    return {
      success: false,
      error: error.message || 'Email delivery failed',
      statusCode,
      details: errorDetails,
    };
  }
};

/**
 * Base method: sendTemplateEmail
 * Sends an email using a registered Brevo template ID.
 */
const sendTemplateEmail = async ({ to, templateId, params }) => {
  if (!emailConfig.isValid || !brevo) {
    console.warn(`[emailService] ⚠️ Simulated template email (${templateId}) to ${to}`);
    return { success: false, simulated: true };
  }

  const recipientEmail = typeof to === 'string' ? to : to?.email;
  const recipientName = typeof to === 'object' ? to?.name : '';

  try {
    const payload = {
      templateId: Number(templateId),
      to: [{ email: recipientEmail, ...(recipientName ? { name: recipientName } : {}) }],
      params: params || {},
    };

    const response = await brevo.transactionalEmails.sendTransacEmail(payload);
    console.log(`[emailService] ✅ Template email #${templateId} sent to ${recipientEmail}`);
    return {
      success: true,
      messageId: response.messageId,
      recipient: recipientEmail,
    };
  } catch (error) {
    console.error(`[emailService] ❌ Error sending template #${templateId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/* ═══════════════════════════════════════════════════════════════════
   Core Feature Wrappers
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 1. sendVerificationEmail
 * Sends an account activation/verification email containing BOTH:
 *   - A prominent 6-digit One-Time Password (OTP) for manual verification
 *   - A secure direct one-click activation link
 *
 * @param {string} email - Recipient email.
 * @param {string} verificationToken - Hex token or full verification link.
 * @param {string} [username] - User's name.
 * @param {string} [verificationOtp] - 6-digit one-time password.
 */
const sendVerificationEmail = async (email, verificationToken, username = 'Movie Lover', verificationOtp = '', clientBaseUrl = '') => {
  const baseUrl = (clientBaseUrl || process.env.CLIENT_URL || emailConfig.clientUrl || 'http://localhost:3000').replace(/\/$/, '');
  const verificationLink = verificationToken.startsWith('http')
    ? verificationToken
    : `${baseUrl}/verify-email?token=${verificationToken}`;

  const subject = `🎬 Verify Your iMovies Account ${verificationOtp ? `— OTP: ${verificationOtp}` : ''}`;

  const bodyContent = `
    <h2 style="color: #FFFFFF; font-size: 24px; margin-top: 0; font-weight: 800; text-align: center;">
      Welcome to <span style="color: #00E5FF;">iMovies</span>, ${username}! 🍿
    </h2>
    <p style="color: #C4B5FD; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
      Thank you for creating an account with us. To complete your registration and unlock seamless movie ticket bookings across top theatres, please verify your email address.
    </p>

    <!-- OPTION 1: One-Time Password (OTP) Box -->
    ${
      verificationOtp
        ? `
      <div style="text-align: center; margin: 25px 0 20px 0;">
        <div style="color: #C4B5FD; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px;">
          🔐 YOUR 6-DIGIT VERIFICATION OTP
        </div>
        <div style="background: rgba(0, 229, 255, 0.08); border: 2px dashed #00E5FF; border-radius: 16px; padding: 18px 24px; display: inline-block; box-shadow: 0 0 25px rgba(0, 229, 255, 0.25);">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #00E5FF; text-shadow: 0 0 15px rgba(0, 229, 255, 0.7); display: inline-block; padding-left: 10px;">
            ${verificationOtp}
          </span>
        </div>
        <p style="color: #8E7BB0; font-size: 13px; margin-top: 10px;">
          Enter this 6-digit code on your screen to activate your account.
        </p>
      </div>
    `
        : ''
    }

    <!-- Divider -->
    <div style="text-align: center; margin: 25px 0 15px 0;">
      <div style="color: #62507e; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px;">
        — OR VERIFY WITH ONE CLICK —
      </div>
      <a href="${verificationLink}" class="btn-primary" target="_blank" style="margin: 0;">
        Activate Account Directly
      </a>
    </div>

    <p style="color: #8E7BB0; font-size: 13px; line-height: 1.5; margin-top: 25px; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:
      <br />
      <a href="${verificationLink}" style="color: #00E5FF; word-break: break-all; font-size: 12px;">${verificationLink}</a>
    </p>
    <p style="color: #62507e; font-size: 12px; margin-top: 20px; text-align: center;">
      This verification code and link are valid for 24 hours. If you did not create an account on iMovies, please ignore this email.
    </p>
  `;

  return sendEmail({
    to: { email, name: username },
    subject,
    htmlContent: getEmailWrapper(subject, bodyContent),
    textContent: `Welcome to iMovies, ${username}! Your verification OTP is: ${verificationOtp || ''}. Or click: ${verificationLink}`,
  });
};

/**
 * 2. sendPasswordResetEmail
 * Sends a secure password recovery link with expiration notice.
 *
 * @param {string} email - Recipient email.
 * @param {string} resetToken - Crypto reset token or full reset link.
 * @param {string} [username] - User's name.
 */
const sendPasswordResetEmail = async (email, resetToken, username = 'User', clientBaseUrl = '') => {
  const baseUrl = (clientBaseUrl || process.env.CLIENT_URL || emailConfig.clientUrl || 'http://localhost:3000').replace(/\/$/, '');
  const resetLink = resetToken.startsWith('http')
    ? resetToken
    : `${baseUrl}/reset-password?token=${resetToken}`;

  const subject = '🔒 Reset Your iMovies Password';

  const bodyContent = `
    <h2 style="color: #FFFFFF; font-size: 22px; margin-top: 0; font-weight: 800;">
      Password Reset Request
    </h2>
    <p style="color: #C4B5FD; font-size: 15px; line-height: 1.6;">
      Hello ${username}, we received a request to reset your password for your iMovies account.
    </p>
    <p style="color: #C4B5FD; font-size: 15px; line-height: 1.6;">
      Click the button below to choose a new password. This link is secure and valid for <strong>30 minutes</strong> only.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" class="btn-primary" target="_blank" style="background: linear-gradient(135deg, #00E5FF 0%, #3B0A6B 100%); color: #fff !important;">
        Reset My Password
      </a>
    </div>

    <p style="color: #8E7BB0; font-size: 13px; line-height: 1.5; margin-top: 25px;">
      Or paste this URL in your browser:
      <br />
      <a href="${resetLink}" style="color: #00E5FF; word-break: break-all;">${resetLink}</a>
    </p>
    <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #EF4444; padding: 12px 16px; border-radius: 6px; margin-top: 25px;">
      <p style="color: #FCA5A5; font-size: 12px; margin: 0;">
        ⚠️ If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  return sendEmail({
    to: { email, name: username },
    subject,
    htmlContent: getEmailWrapper(subject, bodyContent),
    textContent: `Reset your iMovies password by clicking: ${resetLink} (Link valid for 30 minutes).`,
  });
};

/**
 * 3. sendBookingConfirmationEmail
 * Sends an electronic ticket and booking confirmation receipt.
 *
 * @param {string} email - Recipient email.
 * @param {object} bookingDetails - Complete booking and ticket data.
 */
const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  const {
    bookingId = 'BK-' + Math.floor(100000 + Math.random() * 900000),
    movieName = 'Movie Screening',
    theatreName = 'iMovies Cinemas',
    showDate = 'Today',
    showTime = 'Screening Time',
    selectedSeats = [],
    totalAmount = 0,
    razorpayPaymentId = 'N/A',
  } = bookingDetails;

  const seatsList = Array.isArray(selectedSeats) ? selectedSeats.join(', ') : String(selectedSeats);
  const subject = `🎟️ Booking Confirmed: ${movieName} (${bookingId})`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="background: rgba(16, 185, 129, 0.2); color: #10B981; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; letter-spacing: 1px; border: 1px solid rgba(16, 185, 129, 0.4);">
        ● BOOKING CONFIRMED & PAID
      </span>
      <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 900; margin: 15px 0 5px 0;">
        You're Going to the Movies! 🍿
      </h1>
      <p style="color: #C4B5FD; font-size: 14px; margin: 0;">
        Present this digital ticket at the theatre entrance.
      </p>
    </div>

    {/* Digital Ticket Representation */}
    <div class="ticket-card">
      <div style="border-bottom: 1px solid rgba(0, 229, 255, 0.2); padding-bottom: 15px; margin-bottom: 15px;">
        <span style="color: #8E7BB0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Movie</span>
        <div style="color: #00E5FF; font-size: 20px; font-weight: 800; margin-top: 2px;">
          ${movieName}
        </div>
      </div>

      <div class="info-row">
        <span class="info-label">Booking Reference</span>
        <span class="info-val" style="color: #00E5FF; font-family: monospace; font-size: 15px;">${bookingId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cinema / Theatre</span>
        <span class="info-val">${theatreName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date & Show Time</span>
        <span class="info-val">${showDate} • ${showTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Seats Reserved</span>
        <span class="info-val" style="background: rgba(0, 229, 255, 0.15); color: #00E5FF; padding: 3px 8px; border-radius: 6px;">${seatsList}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment ID (Razorpay)</span>
        <span class="info-val" style="font-family: monospace; font-size: 12px; color: #A78BFA;">${razorpayPaymentId}</span>
      </div>
      <div class="info-row" style="border-bottom: none; padding-top: 15px; margin-top: 5px;">
        <span class="info-label" style="font-size: 16px; color: #FFFFFF;">Total Paid</span>
        <span class="info-val" style="font-size: 22px; color: #00E5FF; font-weight: 900;">₹${totalAmount}</span>
      </div>
    </div>

    <div style="background: rgba(59, 10, 107, 0.25); border: 1px solid rgba(157, 78, 221, 0.3); border-radius: 12px; padding: 15px; text-align: center; margin-top: 20px;">
      <p style="color: #C4B5FD; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">
        ⚡ Fast Entry with Digital Ticket
      </p>
      <p style="color: #8E7BB0; font-size: 12px; margin: 0;">
        Please arrive 15 minutes before showtime. No physical printout is required.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    htmlContent: getEmailWrapper(subject, bodyContent),
    textContent: `Booking Confirmed! Booking ID: ${bookingId} for ${movieName} at ${theatreName} on ${showDate} ${showTime}. Seats: ${seatsList}. Amount Paid: ₹${totalAmount}.`,
  });
};

/**
 * 4. sendBookingStatusUpdateEmail
 * Sends status notification changes (Confirmed, Cancelled, Refunded, Updated).
 *
 * @param {string} email - Recipient email.
 * @param {object} statusDetails - Details including status, bookingId, refund info.
 */
const sendBookingStatusUpdateEmail = async (email, statusDetails) => {
  const {
    bookingId = 'BK-000000',
    movieName = 'Movie',
    status = 'Updated',
    refundAmount = null,
    reason = '',
  } = statusDetails;

  const isRefunded = status.toLowerCase() === 'refunded';
  const isCancelled = status.toLowerCase() === 'cancelled';
  const statusColor = isRefunded ? '#3B82F6' : isCancelled ? '#EF4444' : '#10B981';

  const subject = `Update on Booking ${bookingId}: Status is now ${status}`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="background: rgba(255, 255, 255, 0.08); color: ${statusColor}; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 20px; border: 1px solid ${statusColor};">
        ● STATUS: ${status.toUpperCase()}
      </span>
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 15px 0 5px 0;">
        Booking Status Update
      </h2>
      <p style="color: #C4B5FD; font-size: 14px; margin: 0;">
        There has been an update regarding your booking for <strong>${movieName}</strong>.
      </p>
    </div>

    <div class="ticket-card">
      <div class="info-row">
        <span class="info-label">Booking Reference</span>
        <span class="info-val" style="font-family: monospace;">${bookingId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Movie</span>
        <span class="info-val">${movieName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Current Status</span>
        <span class="info-val" style="color: ${statusColor}; font-weight: 800;">${status}</span>
      </div>
      ${
        refundAmount !== null
          ? `
        <div class="info-row">
          <span class="info-label">Refund Amount</span>
          <span class="info-val" style="color: #00E5FF; font-weight: 800;">₹${refundAmount}</span>
        </div>
      `
          : ''
      }
      ${
        reason
          ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Reason / Notes</span>
          <span class="info-val">${reason}</span>
        </div>
      `
          : ''
      }
    </div>

    ${
      isRefunded
        ? `
      <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3B82F6; padding: 14px; border-radius: 8px; margin-top: 20px;">
        <p style="color: #93C5FD; font-size: 13px; margin: 0;">
          💳 <strong>Refund Information:</strong> Your refund of ₹${refundAmount} has been initiated via Razorpay and will credit to your original payment method in 3–5 business days.
        </p>
      </div>
    `
        : ''
    }
  `;

  return sendEmail({
    to: email,
    subject,
    htmlContent: getEmailWrapper(subject, bodyContent),
    textContent: `Booking ${bookingId} status updated to: ${status}. ${reason ? 'Reason: ' + reason : ''}`,
  });
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
};
