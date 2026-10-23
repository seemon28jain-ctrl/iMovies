/**
 * testEmail.js - Verification & Diagnostic Test Script for Brevo Email Service
 * Usage: node server/scripts/testEmail.js [optional_recipient_email]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const emailService = require('../services/emailService');

const targetEmail = process.argv[2] || process.env.SENDER_EMAIL || 'en24cs3010942@medicaps.ac.in';

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 Running Brevo (Sendinblue) Transactional Email Test Suite');
  console.log(`🎯 Target recipient: ${targetEmail}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Test Base sendEmail
  console.log('1️⃣  Testing Base sendEmail...');
  const baseResult = await emailService.sendEmail({
    to: targetEmail,
    subject: '🧪 [Test 1/4] iMovies Brevo Base Service Ping',
    htmlContent: '<p>Base email transmission check successful! ✨</p>',
    textContent: 'Base email transmission check successful!',
  });
  console.log('   Result:', baseResult.success ? `✅ SUCCESS (Message ID: ${baseResult.messageId})` : `❌ FAILED: ${baseResult.error}`);

  // 2. Test Verification Email Wrapper
  console.log('\n2️⃣  Testing sendVerificationEmail wrapper...');
  const verifyResult = await emailService.sendVerificationEmail(
    targetEmail,
    'test_mock_verification_token_123456',
    'Tester'
  );
  console.log('   Result:', verifyResult.success ? `✅ SUCCESS (Message ID: ${verifyResult.messageId})` : `❌ FAILED: ${verifyResult.error}`);

  // 3. Test Password Reset Email Wrapper
  console.log('\n3️⃣  Testing sendPasswordResetEmail wrapper...');
  const resetResult = await emailService.sendPasswordResetEmail(
    targetEmail,
    'test_mock_reset_token_654321',
    'Tester'
  );
  console.log('   Result:', resetResult.success ? `✅ SUCCESS (Message ID: ${resetResult.messageId})` : `❌ FAILED: ${resetResult.error}`);

  // 4. Test Booking Confirmation Email Wrapper
  console.log('\n4️⃣  Testing sendBookingConfirmationEmail wrapper...');
  const bookingResult = await emailService.sendBookingConfirmationEmail(targetEmail, {
    bookingId: 'IMV-2026-TEST',
    movieName: 'Avatar: Fire and Ash',
    theatreName: 'PVR IMAX Metropolis',
    showDate: '2026-10-25',
    showTime: '07:30 PM',
    selectedSeats: ['D4', 'D5'],
    totalAmount: 640,
    razorpayPaymentId: 'pay_test_brevo123456',
  });
  console.log('   Result:', bookingResult.success ? `✅ SUCCESS (Message ID: ${bookingResult.messageId})` : `❌ FAILED: ${bookingResult.error}`);

  // 5. Test Booking Status Update Email Wrapper
  console.log('\n5️⃣  Testing sendBookingStatusUpdateEmail wrapper...');
  const statusResult = await emailService.sendBookingStatusUpdateEmail(targetEmail, {
    bookingId: 'IMV-2026-TEST',
    movieName: 'Avatar: Fire and Ash',
    status: 'Refunded',
    refundAmount: 640,
    reason: 'Admin cancelled per user request',
  });
  console.log('   Result:', statusResult.success ? `✅ SUCCESS (Message ID: ${statusResult.messageId})` : `❌ FAILED: ${statusResult.error}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🏁 Brevo Test Suite Finished');
  console.log('═══════════════════════════════════════════════════════════════');
}

runTests().catch(console.error);
