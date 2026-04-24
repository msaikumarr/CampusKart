const Chat = require('../models/Chat');
const Item = require('../models/Item');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ message: 'Payment not configured' });
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    const { amount, itemId } = req.body; // amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // or 'inr' for India
      metadata: { itemId },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: 'Payment error' });
  }
};

// Confirm payment (webhook or after success)
exports.confirmPayment = async (req, res) => {
  // Handle webhook or confirmation
  res.json({ message: 'Payment confirmed' });
};