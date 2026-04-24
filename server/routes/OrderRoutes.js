const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/OrderController');

const router = express.Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);

module.exports = router;
