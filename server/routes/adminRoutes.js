const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRevenueAnalytics,
  getAllUsers,
  addSubAdmin,
  getAllTransactions,
  issueRefund,
} = require('../controllers/adminController');
const fetchAdmin = require('../middlewares/fetchAdmin');

// GET /api/admin/stats
router.get('/stats', fetchAdmin, getDashboardStats);

// GET /api/admin/revenue
router.get('/revenue', fetchAdmin, getRevenueAnalytics);

// GET /api/admin/users
router.get('/users', fetchAdmin, getAllUsers);

// POST /api/admin/subadmin
router.post('/subadmin', fetchAdmin, addSubAdmin);

// GET /api/admin/transactions - All booking and payment records
router.get('/transactions', fetchAdmin, getAllTransactions);

// POST /api/admin/refund/:paymentId - Issue Razorpay refund & release seats
router.post('/refund/:paymentId', fetchAdmin, issueRefund);

module.exports = router;
