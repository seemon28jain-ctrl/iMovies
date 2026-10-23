const cron = require('node-cron');
const Booking = require('../models/bookingModel');
const emailService = require('../services/emailService');

/**
 * startReminderService
 *
 * Runs every hour to send upcoming show reminders.
 * Targets bookings where:
 *   - paymentStatus === 'Completed'
 *   - reminderSent === false
 *   - showDate falls within the next 24 hours
 *
 * After sending the email, marks reminderSent = true to prevent duplicates.
 */
const startReminderService = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[reminderService] Checking for upcoming shows...');

      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Format dates as 'YYYY-MM-DD' strings for comparison (matches showDate field format)
      const todayStr = now.toISOString().split('T')[0];
      const tomorrowStr = in24Hours.toISOString().split('T')[0];

      // Find eligible bookings — showDate stored as string (e.g. '2024-08-15')
      const bookings = await Booking.find({
        paymentStatus: 'Completed',
        reminderSent: false,
        showDate: { $gte: todayStr, $lte: tomorrowStr },
      });

      console.log(`[reminderService] Found ${bookings.length} booking(s) to remind.`);

      for (const booking of bookings) {
        try {
          await emailService.sendEmail({
            to: booking.userEmail,
            subject: `⏰ Reminder: Your movie starts soon! (${booking.bookingId})`,
            htmlContent: `
              <h2 style="color: #00E5FF;">Upcoming Screening Reminder! 🍿</h2>
              <p style="color: #E2D9F3; font-size: 15px;">Your screening of <strong>${booking.movieName || 'Movie'}</strong> at <strong>${booking.theatreName}</strong> is approaching!</p>
              <div style="background: rgba(25, 9, 45, 0.8); border: 1px dashed rgba(0, 229, 255, 0.4); border-radius: 12px; padding: 16px; margin: 20px 0; color: #fff;">
                <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${booking.showDate} at ${booking.showTime}</p>
                <p style="margin: 4px 0;"><strong>Seats:</strong> ${booking.selectedSeats?.join(', ')}</p>
                <p style="margin: 4px 0;"><strong>Booking Reference:</strong> ${booking.bookingId}</p>
              </div>
              <p style="color: #C4B5FD; font-size: 13px;">Please arrive at least 15 minutes before showtime to verify your digital ticket.</p>
            `,
            textContent: `Reminder: Your movie ${booking.movieName || 'Movie'} at ${booking.theatreName} is on ${booking.showDate} at ${booking.showTime}. Seats: ${booking.selectedSeats?.join(', ')}.`,
          });

          // Mark as sent so we don't email again
          booking.reminderSent = true;
          await booking.save();

          console.log(
            `[reminderService] Reminder sent for booking ${booking.bookingId} to ${booking.userEmail}`
          );
        } catch (emailErr) {
          console.error(
            `[reminderService] Failed to send reminder for ${booking.bookingId}:`,
            emailErr.message
          );
          // Continue processing other bookings even if one fails
        }
      }
    } catch (err) {
      console.error('[reminderService] Error during reminder check:', err.message);
    }
  });

  console.log('[reminderService] Show reminder service started (every hour).');
};

module.exports = { startReminderService };
