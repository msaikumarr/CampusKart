const express = require('express');
const router = express.Router();
const { addToWishlist, getWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const requireAuth = require('../middleware/requireAuth'); // your JWT auth middleware

router.use(requireAuth);

router.post('/', addToWishlist);
router.get('/', getWishlist);
router.delete('/:itemId', removeFromWishlist);

module.exports = router;
