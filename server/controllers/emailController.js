/**
 * emailController.js - Express Controller for Brevo Email Dispatch & Webhooks
 * Provides robust error handling (catching HTTP 429 rate limits, network failures)
 * with structured logging.
 */
const emailService = require('../services/emailService');
const { getClientUrl } = require('../utils/clientUrl');

/**
 * POST /api/email/test
 * Quick endpoint to verify Brevo email dispatch
 */
const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const recipient = email || process.env.SENDER_EMAIL || 'en24cs3010942@medicaps.ac.in';

    const result = await emailService.sendEmail({
      to: recipient,
      subject: 'iMovies Brevo Email Service Verification',
      htmlContent: `
        <h2 style="color:#00E5FF;">Brevo Transactional Email Service Connected! 🚀</h2>
        <p>This is a verification email confirming your Brevo (Sendinblue) API integration in iMovies backend is fully operational.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      textContent: 'Brevo Transactional Email Service Connected! Verification email from iMovies.',
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Test email dispatched successfully to ${recipient}`,
        result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        details: result.details,
      });
    }
  } catch (err) {
    console.error('[emailController.sendTestEmail]', err.message);
    res.status(500).json({ success: false, message: 'Server error sending test email.' });
  }
};

/**
 * POST /api/email/verification
 * Triggers verification email dispatch
 */
const triggerVerificationEmail = async (req, res) => {
  try {
    const { email, token, username } = req.body;
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'email and token are required.',
      });
    }

    const clientBaseUrl = getClientUrl(req);
    const result = await emailService.sendVerificationEmail(email, token, username, '', clientBaseUrl);
    return res.json({
      success: result.success,
      message: result.success ? 'Verification email dispatched.' : 'Failed to dispatch verification email.',
      result,
    });
  } catch (err) {
    console.error('[emailController.triggerVerificationEmail]', err.message);
    res.status(500).json({ success: false, message: 'Error triggering verification email.' });
  }
};

/**
 * POST /api/email/password-reset
 * Triggers password reset email dispatch
 */
const triggerPasswordResetEmail = async (req, res) => {
  try {
    const { email, token, username } = req.body;
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'email and token are required.',
      });
    }

    const clientBaseUrl = getClientUrl(req);
    const result = await emailService.sendPasswordResetEmail(email, token, username, clientBaseUrl);
    return res.json({
      success: result.success,
      message: result.success ? 'Password reset email dispatched.' : 'Failed to dispatch password reset email.',
      result,
    });
  } catch (err) {
    console.error('[emailController.triggerPasswordResetEmail]', err.message);
    res.status(500).json({ success: false, message: 'Error triggering password reset email.' });
  }
};

/**
 * POST /api/email/booking-confirmation
 * Triggers booking confirmation email dispatch
 */
const triggerBookingConfirmationEmail = async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;
    if (!email || !bookingDetails) {
      return res.status(400).json({
        success: false,
        message: 'email and bookingDetails are required.',
      });
    }

    const result = await emailService.sendBookingConfirmationEmail(email, bookingDetails);
    return res.json({
      success: result.success,
      message: result.success ? 'Booking confirmation email dispatched.' : 'Failed to dispatch booking confirmation email.',
      result,
    });
  } catch (err) {
    console.error('[emailController.triggerBookingConfirmationEmail]', err.message);
    res.status(500).json({ success: false, message: 'Error triggering booking confirmation email.' });
  }
};

/**
 * POST /api/email/status-update
 * Triggers status update email dispatch
 */
const triggerStatusUpdateEmail = async (req, res) => {
  try {
    const { email, statusDetails } = req.body;
    if (!email || !statusDetails) {
      return res.status(400).json({
        success: false,
        message: 'email and statusDetails are required.',
      });
    }

    const result = await emailService.sendBookingStatusUpdateEmail(email, statusDetails);
    return res.json({
      success: result.success,
      message: result.success ? 'Status update email dispatched.' : 'Failed to dispatch status update email.',
      result,
    });
  } catch (err) {
    console.error('[emailController.triggerStatusUpdateEmail]', err.message);
    res.status(500).json({ success: false, message: 'Error triggering status update email.' });
  }
};

module.exports = {
  sendTestEmail,
  triggerVerificationEmail,
  triggerPasswordResetEmail,
  triggerBookingConfirmationEmail,
  triggerStatusUpdateEmail,
};
