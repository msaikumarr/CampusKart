const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { createReview, getMyReviews } = require('../controllers/ReviewController');

router.use(requireAuth);
router.get('/me', getMyReviews);
router.post('/', createReview);

module.exports = router;