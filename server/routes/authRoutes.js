const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  validateToken,
  verifyEmail,
  verifyOtp,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  registerAdmin,
  loginAdmin,
  validateAdminToken,
} = require('../controllers/authController');
const fetchUser = require('../middlewares/fetchUser');
const fetchAdmin = require('../middlewares/fetchAdmin');

/* ═══════════════════════════════════════════════════════════════════
   User Auth Routes
═══════════════════════════════════════════════════════════════════ */

// POST /api/auth/register
router.post('/register', registerUser);

// GET & POST /api/auth/verify-email
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', resendVerificationEmail);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/validate (protected)
router.get('/validate', fetchUser, validateToken);

/* ═══════════════════════════════════════════════════════════════════
   Admin Auth Routes
═══════════════════════════════════════════════════════════════════ */

// POST /api/auth/admin/register - RESTRICTED: Only existing authenticated admins can register new admins
router.post('/admin/register', fetchAdmin, (req, res, next) => {
  return registerAdmin(req, res, next);
});

// POST /api/auth/admin/login
router.post('/admin/login', loginAdmin);

// GET /api/auth/admin/validate (protected)
router.get('/admin/validate', fetchAdmin, validateAdminToken);

module.exports = router;
