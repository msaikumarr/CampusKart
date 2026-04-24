const User = require('../models/User');
const Item = require('../models/Item');

// Get all users with verification status
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id username email phone verificationStatus isVerified createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending verification requests
exports.getPendingVerifications = async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: 'pending' })
      .select('_id username email phone verificationDocuments createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Pending verifications retrieved',
      pendingUsers: pendingUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve user verification
exports.approveUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'approved',
        isVerified: true,
        verificationDate: new Date()
      },
      { new: true }
    ).select('_id username email verificationStatus isVerified');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User verified successfully',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject user verification
exports.rejectUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'rejected',
        isVerified: false,
        rejectionReason: rejectionReason || 'Not verified'
      },
      { new: true }
    ).select('_id username email verificationStatus rejectionReason');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User verification rejected',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending item approvals
exports.getPendingItemApprovals = async (req, res) => {
  try {
    const pendingItems = await Item.find({ approvalStatus: 'pending' })
      .populate('createdBy', '_id username email phone verificationStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Pending item approvals retrieved',
      pendingItems: pendingItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve item
exports.approveItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findByIdAndUpdate(
      itemId,
      {
        approvalStatus: 'approved',
        isApproved: true,
        approvedBy: req.user._id,
        approvalDate: new Date()
      },
      { new: true }
    ).populate('createdBy', '_id username email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item approved successfully',
      item: item
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject item
exports.rejectItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { rejectionReason } = req.body;

    const item = await Item.findByIdAndUpdate(
      itemId,
      {
        approvalStatus: 'rejected',
        isApproved: false,
        approvedBy: req.user._id,
        rejectionReason: rejectionReason || 'Item rejected by admin',
        approvalDate: new Date()
      },
      { new: true }
    ).populate('createdBy', '_id username email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item rejected successfully',
      item: item
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });
    const totalItems = await Item.countDocuments();
    const approvedItems = await Item.countDocuments({ isApproved: true });
    const pendingItems = await Item.countDocuments({ approvalStatus: 'pending' });
    const Order = require('../models/Order');
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const activeOrders = await Order.countDocuments({ status: { $nin: ['delivered', 'cancelled'] } });

    res.status(200).json({
      message: 'Dashboard statistics',
      stats: {
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        totalItems,
        approvedItems,
        pendingItems
        ,totalOrders,
        deliveredOrders,
        activeOrders
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
