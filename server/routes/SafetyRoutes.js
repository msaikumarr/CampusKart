const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  getSafetyStatus,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportEntity,
} = require('../controllers/SafetyController');

router.use(requireAuth);
router.get('/blocked', getBlockedUsers);
router.get('/status/:userId', getSafetyStatus);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.post('/report', reportEntity);

module.exports = router;