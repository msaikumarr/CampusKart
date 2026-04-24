const Order = require('../models/Order');
const Item = require('../models/Item');

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const makeOrderNumber = () => `CK-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const populateOrder = (query) =>
  query
    .populate('item', 'title price image category')
    .populate('buyer', 'username email')
    .populate('seller', 'username email')
    .populate('trackingNotes.changedBy', 'username email');

exports.createOrder = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const item = await Item.findById(itemId).populate('createdBy', '_id username email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.createdBy) {
      return res.status(400).json({ message: 'Seller information is missing' });
    }

    if (item.isSold) {
      return res.status(400).json({ message: 'This item is no longer available' });
    }

    if (item.createdBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot buy your own item' });
    }

    const order = await Order.create({
      buyer: req.user._id,
      seller: item.createdBy._id,
      item: item._id,
      amount: item.price,
      orderNumber: makeOrderNumber(),
      status: 'placed',
      trackingNotes: [
        {
          status: 'placed',
          note: 'Order placed successfully',
          changedBy: req.user._id,
        },
      ],
    });

    const populatedOrder = await populateOrder(Order.findById(order._id));

    res.status(201).json({
      message: 'Order placed successfully',
      order: populatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await populateOrder(
      Order.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] }).sort({ createdAt: -1 })
    );

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const orders = await populateOrder(
      Order.find({}).sort({ createdAt: -1 })
    );

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await populateOrder(Order.findById(req.params.orderId));

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller._id.toString() === req.user._id.toString();
    const isAdmin = Boolean(req.user.isAdmin);

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();
    const canBuyerCancel = isBuyer && status === 'cancelled' && ['placed', 'confirmed'].includes(order.status);

    if (!req.user.isAdmin && !isSeller && !canBuyerCancel) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (isBuyer && status === 'cancelled' && !['placed', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order can only be cancelled before shipping starts' });
    }

    order.status = status;
    order.trackingNotes.push({
      status,
      note:
        note ||
        (status === 'cancelled'
          ? 'Order cancelled by buyer'
          : `Order marked as ${status.replaceAll('_', ' ')}`),
      changedBy: req.user._id,
    });

    if (status === 'delivered') {
      await Item.findByIdAndUpdate(order.item, {
        isSold: true,
        soldAt: new Date(),
      });
    }

    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    res.json({ message: 'Order status updated', order: populatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
