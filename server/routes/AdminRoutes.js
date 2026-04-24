const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  getAllOrders,
} = require('../controllers/OrderController');
const {
  getAllUsers,
  getPendingVerifications,
  approveUserVerification,
  rejectUserVerification,
  getPendingItemApprovals,
  approveItem,
  rejectItem,
  getDashboardStats
} = require('../controllers/AdminController');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// User verification routes
router.get('/users', getAllUsers);
router.get('/verifications/pending', getPendingVerifications);
router.put('/users/:userId/approve', approveUserVerification);
router.put('/users/:userId/reject', rejectUserVerification);

// Item approval routes
router.get('/items/pending', getPendingItemApprovals);
router.put('/items/:itemId/approve', approveItem);
router.put('/items/:itemId/reject', rejectItem);

router.get('/orders', getAllOrders);

// Dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router;
