/**
 * emailConfig.js - Centralized Brevo (Sendinblue) Email Configuration & Validation
 * Safely loads and validates required environment variables for transactional emails.
 */
require('dotenv').config();

const validateEmailConfig = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME || 'iMovies';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const errors = [];

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('PASTE YOUR')) {
    errors.push('BREVO_API_KEY is missing or invalid in environment variables.');
  }

  if (!senderEmail || !senderEmail.includes('@')) {
    errors.push('SENDER_EMAIL is missing or invalid in environment variables.');
  }

  if (errors.length > 0) {
    console.error('❌ [emailConfig] Configuration validation errors:');
    errors.forEach((err) => console.error(`   - ${err}`));
  } else {
    console.log('✅ [emailConfig] Brevo email service configured for sender:', `${senderName} <${senderEmail}>`);
  }

  return {
    apiKey,
    senderEmail,
    senderName,
    clientUrl,
    isValid: errors.length === 0,
    errors,
  };
};

const emailConfig = validateEmailConfig();

module.exports = emailConfig;
