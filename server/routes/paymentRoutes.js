/**
 * paymentRoutes.js - Razorpay Payment API Routes
 */
const express = require('express');
const router = express.Router();
const {
  getRazorpayKey,
  createOrder,
  verifyPayment,
} = require('../controllers/paymentController');
const fetchUser = require('../middlewares/fetchUser');

// GET /api/payment/key - Retrieve public key
router.get('/key', getRazorpayKey);

// POST /api/payment/create-order - Step 2: Initialize Razorpay order
router.post('/create-order', fetchUser, createOrder);

// POST /api/payment/verify - Step 4: Cryptographic HMAC SHA256 verification
router.post('/verify', fetchUser, verifyPayment);

module.exports = router;
