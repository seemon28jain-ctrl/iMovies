const cron = require('node-cron');
const Show = require('../models/showModel');

/**
 * startCleanupService
 *
 * Runs every 2 minutes to release expired seat locks.
 * A seat lock expires when its lockExpiry timestamp is in the past
 * and its status is still 'locked'.
 *
 * After releasing, emits a 'seat-status-update' Socket.io event
 * to all clients in the affected show's room so the UI refreshes.
 *
 * @param {import('socket.io').Server} io - Socket.io server instance.
 */
const startCleanupService = (io) => {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = Date.now();
      console.log('[cleanupService] Running expired lock cleanup...');

      // Fetch all shows that have any tickets (avoid scanning empty shows)
      const shows = await Show.find({ tickets: { $ne: {} } });

      let totalReleased = 0;

      for (const show of shows) {
        const tickets = show.tickets;
        let modified = false;

        Object.keys(tickets).forEach((seatId) => {
          const seat = tickets[seatId];
          if (
            seat.status === 'locked' &&
            seat.lockExpiry &&
            seat.lockExpiry < now
          ) {
            // Release the lock
            tickets[seatId] = {
              ...seat,
              status: 'available',
              lockExpiry: null,
              bookedBy: null,
            };
            modified = true;
            totalReleased++;
          }
        });

        if (modified) {
          show.tickets = tickets;
          show.markModified('tickets');
          await show.save();

          // Notify all clients watching this show's room
          io.to(show.showId).emit('seat-status-update', {
            showId: show.showId,
            tickets: show.tickets,
          });

          console.log(
            `[cleanupService] Released expired locks on show ${show.showId}`
          );
        }
      }

      console.log(
        `[cleanupService] Cleanup complete. Released ${totalReleased} expired lock(s).`
      );
    } catch (err) {
      console.error('[cleanupService] Error during cleanup:', err.message);
    }
  });

  console.log('[cleanupService] Seat lock cleanup service started (every 2 minutes).');
};

module.exports = { startCleanupService };
