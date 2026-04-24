const Review = require('../models/Review');
const Order = require('../models/Order');

const serializeReview = (review) => ({
  ...review.toObject(),
  reviewer: review.reviewer,
  reviewee: review.reviewee,
  order: review.order,
});

exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment = '' } = req.body;
    if (!orderId || !rating) {
      return res.status(400).json({ message: 'Order and rating are required' });
    }

    const order = await Order.findById(orderId).populate('buyer seller item');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Reviews are only allowed after delivery' });
    }

    const reviewerId = String(req.user._id);
    const isBuyer = String(order.buyer?._id || order.buyer) === reviewerId;
    const isSeller = String(order.seller?._id || order.seller) === reviewerId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'You cannot review this order' });
    }

    const reviewee = isBuyer ? order.seller : order.buyer;
    const payload = {
      order: order._id,
      reviewer: req.user._id,
      reviewee: reviewee._id || reviewee,
      rating: Number(rating),
      comment: String(comment).trim(),
    };

    const review = await Review.findOneAndUpdate(
      { order: order._id, reviewer: req.user._id },
      payload,
      { new: true, upsert: true, runValidators: true }
    ).populate('reviewer reviewee order');

    res.status(201).json({ review: serializeReview(review) });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const [receivedReviews, givenReviews] = await Promise.all([
      Review.find({ reviewee: req.user._id })
        .populate('reviewer reviewee order')
        .sort({ createdAt: -1 }),
      Review.find({ reviewer: req.user._id })
        .populate('reviewer reviewee order')
        .sort({ createdAt: -1 }),
    ]);

    const ratingSummary = receivedReviews.length
      ? {
          average: Number((receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length).toFixed(1)),
          total: receivedReviews.length,
        }
      : { average: 0, total: 0 };

    res.json({
      receivedReviews: receivedReviews.map(serializeReview),
      givenReviews: givenReviews.map(serializeReview),
      ratingSummary,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};