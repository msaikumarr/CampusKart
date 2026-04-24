const User = require('../models/User');
const Report = require('../models/Report');

const toId = (value) => String(value || '').trim();

exports.getSafetyStatus = async (req, res) => {
  try {
    const targetUserId = toId(req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const [targetUser, reportCount, reporter] = await Promise.all([
      User.findById(targetUserId).select('_id username blockedUsers'),
      Report.countDocuments({ targetUser: targetUserId }),
      User.findById(req.user._id).select('blockedUsers'),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      targetUserId,
      blockedByYou: reporter?.blockedUsers?.some((blockedId) => String(blockedId) === targetUserId) || false,
      blockedYou: targetUser?.blockedUsers?.some((blockedId) => String(blockedId) === String(req.user._id)) || false,
      reportCount,
      scamWarning: reportCount >= 3,
    });
  } catch (error) {
    console.error('Safety status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const targetUserId = toId(req.body.targetUserId);
    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.some((blockedId) => String(blockedId) === targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }

    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const targetUserId = toId(req.body.targetUserId || req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user is required' });
    }

    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((blockedId) => String(blockedId) !== targetUserId);
    await user.save();

    res.json({ message: 'User unblocked' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', '_id username email');
    res.json(user?.blockedUsers || []);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reportEntity = async (req, res) => {
  try {
    const { entityType, targetUserId, itemId, chatId, reason, note = '' } = req.body;
    if (!entityType || !reason) {
      return res.status(400).json({ message: 'Entity type and reason are required' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      entityType,
      targetUser: targetUserId || null,
      item: itemId || null,
      chat: chatId || null,
      reason,
      note,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Report entity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};