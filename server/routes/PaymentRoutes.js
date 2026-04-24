const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/PaymentController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);

module.exports = router;