const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter using Gmail credentials from .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ──────────────────────────────────────────────────────────────────
 * sendBookingConfirmation
 * Sends an HTML booking confirmation email to the user.
 * ────────────────────────────────────────────────────────────────── */

/**
 * @param {string} userEmail - Recipient email address.
 * @param {object} bookingDetails - Booking summary object.
 * @param {string} bookingDetails.bookingId
 * @param {string} bookingDetails.movieId
 * @param {string} bookingDetails.theatreName
 * @param {string} bookingDetails.showDate
 * @param {string} bookingDetails.showTime
 * @param {string[]} bookingDetails.selectedSeats
 * @param {number} bookingDetails.totalAmount
 */
const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_email')) {
    console.log(`[mailer] (Dev Mode) Booking confirmation simulated for ${userEmail}`);
    return;
  }
  const {
    bookingId,
    movieId,
    theatreName,
    showDate,
    showTime,
    selectedSeats,
    totalAmount,
  } = bookingDetails;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #e50914; color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .body { padding: 24px; }
        .body h2 { color: #e50914; margin-top: 0; }
        .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; }
        .seats { background: #f9f9f9; border-radius: 4px; padding: 8px 12px; margin-top: 8px; }
        .total { font-size: 20px; font-weight: bold; color: #e50914; text-align: right; margin-top: 16px; }
        .footer { background: #222; color: #aaa; text-align: center; padding: 16px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 iMovies</h1>
          <p style="margin:0;">Booking Confirmation</p>
        </div>
        <div class="body">
          <h2>Your tickets are confirmed! 🎉</h2>
          <div class="detail-row"><span class="label">Booking ID</span><span>${bookingId}</span></div>
          <div class="detail-row"><span class="label">Movie ID</span><span>${movieId}</span></div>
          <div class="detail-row"><span class="label">Theatre</span><span>${theatreName}</span></div>
          <div class="detail-row"><span class="label">Date</span><span>${showDate}</span></div>
          <div class="detail-row"><span class="label">Time</span><span>${showTime}</span></div>
          <div class="detail-row">
            <span class="label">Seats</span>
            <div class="seats">${selectedSeats.join(', ')}</div>
          </div>
          <div class="total">Total Paid: ₹${totalAmount}</div>
        </div>
        <div class="footer">
          <p>Thank you for booking with iMovies! Enjoy the show.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"iMovies" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `✅ Booking Confirmed — ${bookingId}`,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[mailer] Booking confirmation sent to ${userEmail}`);
};

/* ──────────────────────────────────────────────────────────────────
 * sendReminder
 * Sends an upcoming show reminder email.
 * ────────────────────────────────────────────────────────────────── */

/**
 * @param {string} userEmail - Recipient email address.
 * @param {object} showDetails - Show details for the reminder.
 * @param {string} showDetails.bookingId
 * @param {string} showDetails.theatreName
 * @param {string} showDetails.showDate
 * @param {string} showDetails.showTime
 * @param {string[]} showDetails.selectedSeats
 */
const sendReminder = async (userEmail, showDetails) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_email')) {
    console.log(`[mailer] (Dev Mode) Show reminder simulated for ${userEmail}`);
    return;
  }
  const { bookingId, theatreName, showDate, showTime, selectedSeats } = showDetails;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; }
        .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #e50914; color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .body { padding: 24px; }
        .body h2 { color: #e50914; }
        .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; }
        .label { font-weight: bold; }
        .footer { background: #222; color: #aaa; text-align: center; padding: 16px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 iMovies</h1>
          <p style="margin:0;">Show Reminder</p>
        </div>
        <div class="body">
          <h2>⏰ Your show is in less than 24 hours!</h2>
          <div class="detail-row"><span class="label">Booking ID</span><span>${bookingId}</span></div>
          <div class="detail-row"><span class="label">Theatre</span><span>${theatreName}</span></div>
          <div class="detail-row"><span class="label">Date</span><span>${showDate}</span></div>
          <div class="detail-row"><span class="label">Time</span><span>${showTime}</span></div>
          <div class="detail-row"><span class="label">Seats</span><span>${selectedSeats.join(', ')}</span></div>
          <p style="margin-top:20px;">Don't forget to arrive 15 minutes early. Enjoy the movie! 🍿</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder from iMovies.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"iMovies" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `⏰ Reminder: Your show is tomorrow — ${bookingId}`,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[mailer] Reminder sent to ${userEmail}`);
};

module.exports = { sendBookingConfirmation, sendReminder };
