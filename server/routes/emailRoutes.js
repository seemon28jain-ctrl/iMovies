/**
 * emailRoutes.js - Express Router for Brevo Transactional Email Endpoints
 */
const express = require('express');
const router = express.Router();
const {
  sendTestEmail,
  triggerVerificationEmail,
  triggerPasswordResetEmail,
  triggerBookingConfirmationEmail,
  triggerStatusUpdateEmail,
} = require('../controllers/emailController');

// Test email dispatch
router.post('/test', sendTestEmail);

// Feature wrappers
router.post('/verification', triggerVerificationEmail);
router.post('/password-reset', triggerPasswordResetEmail);
router.post('/booking-confirmation', triggerBookingConfirmationEmail);
router.post('/status-update', triggerStatusUpdateEmail);

module.exports = router;
