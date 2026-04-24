const Chat = require('../models/Chat');
const Item = require('../models/Item');
const User = require('../models/User');
const { SERVER_URL } = require('../config/env');

const io = () => require('../server').io;

const isChatParticipant = (chat, userId) =>
  chat.buyer.equals(userId) || chat.seller.equals(userId);

const otherUserIdFromChat = (chat, userId) =>
  chat.buyer.equals(userId) ? chat.seller : chat.buyer;

const hasUserInReceipt = (receiptEntries, userId) =>
  Array.isArray(receiptEntries) && receiptEntries.some((entry) => {
    const entryUser = entry?.user?._id || entry?.user;
    if (!entryUser) return false;
    if (typeof entryUser.equals === 'function') return entryUser.equals(userId);
    return String(entryUser) === String(userId);
  });

const senderMatches = (sender, userId) => {
  const senderId = sender?._id || sender;
  if (!senderId) return false;
  if (typeof senderId.equals === 'function') return senderId.equals(userId);
  return String(senderId) === String(userId);
};

const buildAttachmentPayload = (file) => {
  if (!file) return null;

  const url = `${SERVER_URL}/uploads/${file.filename}`;
  const isImage = Boolean(file.mimetype && file.mimetype.startsWith('image/'));

  return {
    url,
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    isImage,
  };
};

const addDeliveredForUser = (chat, userId) => {
  let changed = false;
  chat.messages.forEach((msg) => {
    if (senderMatches(msg.sender, userId)) return;
    if (!hasUserInReceipt(msg.deliveredTo, userId)) {
      msg.deliveredTo.push({ user: userId, deliveredAt: new Date() });
      changed = true;
    }
  });
  return changed;
};

const addReadForUser = (chat, userId) => {
  let changed = false;
  chat.messages.forEach((msg) => {
    if (senderMatches(msg.sender, userId)) return;
    if (!hasUserInReceipt(msg.deliveredTo, userId)) {
      msg.deliveredTo.push({ user: userId, deliveredAt: new Date() });
      changed = true;
    }
    if (!hasUserInReceipt(msg.readBy, userId)) {
      msg.readBy.push({ user: userId, readAt: new Date() });
      changed = true;
    }
  });
  return changed;
};

const unreadCountForUser = (chat, userId) =>
  chat.messages.reduce((count, msg) => {
    if (senderMatches(msg.sender, userId)) return count;
    if (hasUserInReceipt(msg.readBy, userId)) return count;
    return count + 1;
  }, 0);

const canUsersChat = async (userId, otherUserId) => {
  const [user, otherUser] = await Promise.all([
    User.findById(userId).select('blockedUsers'),
    User.findById(otherUserId).select('blockedUsers'),
  ]);

  if (!user || !otherUser) {
    return { allowed: false, message: 'User not found' };
  }

  const userBlockedOther = user.blockedUsers?.some((blockedId) => String(blockedId) === String(otherUserId));
  const otherBlockedUser = otherUser.blockedUsers?.some((blockedId) => String(blockedId) === String(userId));

  if (userBlockedOther || otherBlockedUser) {
    return { allowed: false, message: 'Messaging is blocked between these users' };
  }

  return { allowed: true };
};

// Get chats for a user
exports.getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({
      $or: [{ buyer: userId }, { seller: userId }]
    }).populate('item', 'title image').populate('buyer', 'username _id').populate('seller', 'username _id').sort({ updatedAt: -1 });

    let hasChanges = false;
    chats.forEach((chat) => {
      const changed = addDeliveredForUser(chat, userId);
      if (changed) hasChanges = true;
    });
    if (hasChanges) {
      await Promise.all(chats.filter((chat) => chat.isModified()).map((chat) => chat.save()));
    }

    const chatsWithUnread = chats.map((chat) => {
      const plainChat = chat.toObject();
      plainChat.unreadCount = unreadCountForUser(chat, userId);
      return plainChat;
    });

    res.json(chatsWithUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const chat = await Chat.findById(chatId).populate('messages.sender', 'username _id');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!isChatParticipant(chat, userId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }

    const changed = addReadForUser(chat, userId);
    if (changed) {
      await chat.save();
      const otherUserId = otherUserIdFromChat(chat, userId);
      io().to(`user_${otherUserId}`).emit('messagesUpdated', { chatId: chat._id.toString() });
    }

    res.json(chat.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or get chat without sending a message
exports.createOrGetChat = async (req, res) => {
  try {
    const { itemId } = req.body;
    const senderId = req.user._id;

    if (!itemId) return res.status(400).json({ message: 'Item ID is required' });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const sellerId = item.createdBy;
    const safetyCheck = await canUsersChat(senderId, sellerId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }
    const isBuyer = senderId.toString() !== sellerId.toString();

    if (!isBuyer) {
      return res.status(400).json({ message: 'Sellers cannot initiate chats' });
    }

    let chat = await Chat.findOne({
      item: itemId,
      buyer: senderId,
      seller: sellerId,
    });

    if (!chat) {
      chat = new Chat({
        item: itemId,
        buyer: senderId,
        seller: sellerId,
        messages: [],
      });
      await chat.save();

      const io = require('../server').io;
      io.to(`user_${sellerId}`).emit('chatCreated', {
        chatId: chat._id,
        buyer: senderId,
        item: itemId,
      });
    }

    res.json({ message: 'Chat ready', chatId: chat._id, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { itemId, chatId, message } = req.body;
    const senderId = req.user._id;
    const attachment = buildAttachmentPayload(req.file);
    const trimmedMessage = String(message || '').trim();

    let chat;
    let item;

    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ message: 'Chat not found' });

      if (!chat.buyer.equals(senderId) && !chat.seller.equals(senderId)) {
        return res.status(403).json({ message: 'You are not part of this chat' });
      }

      item = await Item.findById(chat.item);
      if (!item) return res.status(404).json({ message: 'Item not found' });
      const otherUserId = chat.buyer.equals(senderId) ? chat.seller : chat.buyer;
      const safetyCheck = await canUsersChat(senderId, otherUserId);
      if (!safetyCheck.allowed) {
        return res.status(403).json({ message: safetyCheck.message });
      }
    } else {
      if (!itemId) return res.status(400).json({ message: 'Item ID is required' });

      item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ message: 'Item not found' });

      const sellerId = item.createdBy;
      const safetyCheck = await canUsersChat(senderId, sellerId);
      if (!safetyCheck.allowed) {
        return res.status(403).json({ message: safetyCheck.message });
      }
      const isBuyer = senderId.toString() !== sellerId.toString();

      if (!isBuyer) {
        return res.status(400).json({ message: 'Sellers cannot initiate chats' });
      }

      chat = await Chat.findOne({
        item: itemId,
        buyer: senderId,
        seller: sellerId
      });

      if (!chat) {
        chat = new Chat({
          item: itemId,
          buyer: senderId,
          seller: sellerId,
          messages: []
        });
        await chat.save();
        console.log(`🆕 New chat created: ${chat._id} between buyer ${senderId} and seller ${sellerId}`);

        const io = require('../server').io;
        io.to(`user_${sellerId}`).emit('chatCreated', {
          chatId: chat._id,
          buyer: senderId,
          item: itemId
        });
      }
    }

    if (!trimmedMessage && !attachment) {
      return res.status(400).json({ message: 'Message or attachment is required' });
    }

    const isImageAttachment = Boolean(attachment?.isImage);

    chat.messages.push({
      sender: senderId,
      type: 'text',
      message: trimmedMessage,
      image: isImageAttachment ? attachment.url : null,
      attachment,
      deliveredTo: [{ user: senderId, deliveredAt: new Date() }],
      readBy: [{ user: senderId, readAt: new Date() }],
    });
    await chat.save();
    await chat.populate('messages.sender', 'username _id');

    const io = require('../server').io;
    const latestMessage = chat.messages[chat.messages.length - 1];
    const outgoingMessage = {
      chatId: chat._id.toString(),
      _id: latestMessage._id,
      type: latestMessage.type,
      message: latestMessage.message,
      image: latestMessage.image,
      attachment: latestMessage.attachment,
      sender: latestMessage.sender,
      timestamp: latestMessage.timestamp,
      deliveredTo: latestMessage.deliveredTo,
      readBy: latestMessage.readBy,
      offer: latestMessage.offer,
      meetup: latestMessage.meetup,
    };

    const otherUserId = chat.buyer.equals(senderId) ? chat.seller : chat.buyer;

    io.to(chat._id.toString()).emit('newMessage', outgoingMessage);
    io.to(`user_${otherUserId}`).emit('messageReceived', {
      chatId: chat._id.toString(),
      lastMessage: outgoingMessage,
      item: chat.item,
    });

    res.json({ message: 'Message sent', chatId: chat._id, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!isChatParticipant(chat, userId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }
    const otherUserId = otherUserIdFromChat(chat, userId);
    const safetyCheck = await canUsersChat(userId, otherUserId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }

    const changed = addReadForUser(chat, userId);
    if (changed) {
      await chat.save();
      const otherUserId = otherUserIdFromChat(chat, userId);
      io().to(`user_${otherUserId}`).emit('messagesUpdated', { chatId: chat._id.toString() });
    }

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendOffer = async (req, res) => {
  try {
    const { chatId, amount } = req.body;
    const senderId = req.user._id;
    if (!chatId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid chatId and amount are required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!isChatParticipant(chat, senderId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }
    const otherUserId = otherUserIdFromChat(chat, senderId);
    const safetyCheck = await canUsersChat(senderId, otherUserId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }

    chat.messages.push({
      sender: senderId,
      type: 'offer',
      message: `Offered ₹${Number(amount)}`,
      offer: { amount: Number(amount), status: 'pending' },
      deliveredTo: [{ user: senderId, deliveredAt: new Date() }],
      readBy: [{ user: senderId, readAt: new Date() }],
    });

    await chat.save();
    await chat.populate('messages.sender', 'username _id');

    const latestMessage = chat.messages[chat.messages.length - 1];
    const payload = {
      chatId: chat._id.toString(),
      _id: latestMessage._id,
      type: latestMessage.type,
      message: latestMessage.message,
      image: latestMessage.image,
      sender: latestMessage.sender,
      timestamp: latestMessage.timestamp,
      deliveredTo: latestMessage.deliveredTo,
      readBy: latestMessage.readBy,
      offer: latestMessage.offer,
      meetup: latestMessage.meetup,
    };

    io().to(chat._id.toString()).emit('newMessage', payload);
    io().to(`user_${otherUserId}`).emit('messageReceived', {
      chatId: chat._id.toString(),
      lastMessage: payload,
      item: chat.item,
    });

    res.json({ message: 'Offer sent', chatId: chat._id, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.respondToOffer = async (req, res) => {
  try {
    const { chatId, messageId, status, counterAmount } = req.body;
    const userId = req.user._id;
    if (!chatId || !messageId || !status) {
      return res.status(400).json({ message: 'chatId, messageId and status are required' });
    }
    if (!['accepted', 'declined', 'countered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid offer status' });
    }

    const chat = await Chat.findById(chatId).populate('messages.sender', 'username _id');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!isChatParticipant(chat, userId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }
    const otherUserId = otherUserIdFromChat(chat, userId);
    const safetyCheck = await canUsersChat(userId, otherUserId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }

    const message = chat.messages.id(messageId);
    if (!message || message.type !== 'offer' || !message.offer) {
      return res.status(404).json({ message: 'Offer message not found' });
    }
    if (senderMatches(message.sender, userId)) {
      return res.status(400).json({ message: 'You cannot respond to your own offer' });
    }

    message.offer.status = status;
    message.offer.respondedBy = userId;
    message.offer.respondedAt = new Date();
    if (status === 'countered') {
      if (!counterAmount || Number(counterAmount) <= 0) {
        return res.status(400).json({ message: 'Valid counterAmount is required for counter offer' });
      }
      message.offer.counterAmount = Number(counterAmount);
      message.message = `Counter offered ₹${Number(counterAmount)} (from ₹${message.offer.amount})`;
    }

    if (!hasUserInReceipt(message.deliveredTo, userId)) {
      message.deliveredTo.push({ user: userId, deliveredAt: new Date() });
    }
    if (!hasUserInReceipt(message.readBy, userId)) {
      message.readBy.push({ user: userId, readAt: new Date() });
    }

    await chat.save();
    io().to(chat._id.toString()).emit('messagesUpdated', { chatId: chat._id.toString() });
    io().to(`user_${otherUserId}`).emit('messageReceived', { chatId: chat._id.toString(), item: chat.item });

    res.json({ message: 'Offer response updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.proposeMeetup = async (req, res) => {
  try {
    const { chatId, location, scheduledFor } = req.body;
    const userId = req.user._id;
    if (!chatId || !location || !scheduledFor) {
      return res.status(400).json({ message: 'chatId, location and scheduledFor are required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!isChatParticipant(chat, userId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }
    const otherUserId = otherUserIdFromChat(chat, userId);
    const safetyCheck = await canUsersChat(userId, otherUserId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }

    const when = new Date(scheduledFor);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduledFor date' });
    }

    chat.messages.push({
      sender: userId,
      type: 'meetup',
      message: `Meetup proposed at ${location} on ${when.toLocaleString('en-IN')}`,
      meetup: { location, scheduledFor: when, status: 'proposed' },
      deliveredTo: [{ user: userId, deliveredAt: new Date() }],
      readBy: [{ user: userId, readAt: new Date() }],
    });

    await chat.save();
    await chat.populate('messages.sender', 'username _id');

    const latestMessage = chat.messages[chat.messages.length - 1];
    const payload = {
      chatId: chat._id.toString(),
      _id: latestMessage._id,
      type: latestMessage.type,
      message: latestMessage.message,
      image: latestMessage.image,
      sender: latestMessage.sender,
      timestamp: latestMessage.timestamp,
      deliveredTo: latestMessage.deliveredTo,
      readBy: latestMessage.readBy,
      offer: latestMessage.offer,
      meetup: latestMessage.meetup,
    };

    io().to(chat._id.toString()).emit('newMessage', payload);
    io().to(`user_${otherUserId}`).emit('messageReceived', {
      chatId: chat._id.toString(),
      lastMessage: payload,
      item: chat.item,
    });

    res.json({ message: 'Meetup proposed', chatId: chat._id, chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.respondToMeetup = async (req, res) => {
  try {
    const { chatId, messageId, status } = req.body;
    const userId = req.user._id;
    if (!chatId || !messageId || !status) {
      return res.status(400).json({ message: 'chatId, messageId and status are required' });
    }
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid meetup status' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!isChatParticipant(chat, userId)) {
      return res.status(403).json({ message: 'You are not part of this chat' });
    }
    const otherUserId = otherUserIdFromChat(chat, userId);
    const safetyCheck = await canUsersChat(userId, otherUserId);
    if (!safetyCheck.allowed) {
      return res.status(403).json({ message: safetyCheck.message });
    }

    const message = chat.messages.id(messageId);
    if (!message || message.type !== 'meetup' || !message.meetup) {
      return res.status(404).json({ message: 'Meetup message not found' });
    }
    if (senderMatches(message.sender, userId)) {
      return res.status(400).json({ message: 'You cannot respond to your own meetup request' });
    }

    message.meetup.status = status;
    message.meetup.respondedBy = userId;
    message.meetup.respondedAt = new Date();
    message.message = `Meetup ${status} at ${message.meetup.location}`;

    if (!hasUserInReceipt(message.deliveredTo, userId)) {
      message.deliveredTo.push({ user: userId, deliveredAt: new Date() });
    }
    if (!hasUserInReceipt(message.readBy, userId)) {
      message.readBy.push({ user: userId, readAt: new Date() });
    }

    await chat.save();
    io().to(chat._id.toString()).emit('messagesUpdated', { chatId: chat._id.toString() });
    io().to(`user_${otherUserId}`).emit('messageReceived', { chatId: chat._id.toString(), item: chat.item });

    res.json({ message: 'Meetup response updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};