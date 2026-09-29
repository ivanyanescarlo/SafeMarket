const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Listing = require('../models/Listing');

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for the logged-in user
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    })
      .populate('participants', 'firstName lastName username profileImage role')
      .populate('listingId', 'title price images location status sellerId')
      .sort({ updatedAt: -1 });

    // Count unread messages for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: userId,
          read: false
        });
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations.'
    });
  }
};

/**
 * @route   POST /api/messages/start
 * @desc    Start or find existing conversation for a listing
 */
exports.startConversation = async (req, res) => {
  try {
    const { receiverId, listingId, initialMessage } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required.'
      });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself.'
      });
    }

    // Check if conversation already exists between these 2 users for this listing (or generally)
    let query = {
      participants: { $all: [senderId, receiverId] }
    };
    if (listingId) {
      query.listingId = listingId;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        listingId: listingId || null,
        lastMessage: {
          text: initialMessage || 'Started conversation',
          sender: senderId,
          createdAt: new Date()
        }
      });
    }

    // If initial message provided, save it
    if (initialMessage && initialMessage.trim()) {
      const msg = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        listingId: listingId || null,
        text: initialMessage.trim()
      });

      conversation.lastMessage = {
        text: msg.text,
        sender: senderId,
        createdAt: msg.createdAt
      };
      await conversation.save();

      // Create notification for receiver
      await Notification.create({
        recipientId: receiverId,
        senderId: senderId,
        type: 'message',
        title: `💬 New Inquiry from ${req.user.firstName}`,
        message: msg.text.length > 60 ? msg.text.slice(0, 60) + '...' : msg.text,
        link: `/messages?conversationId=${conversation._id}`
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'firstName lastName username profileImage role')
      .populate('listingId', 'title price images location status sellerId');

    res.status(200).json({
      success: true,
      conversation: populated
    });
  } catch (error) {
    console.error('startConversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate conversation.'
    });
  }
};

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages in a conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Security check: must be participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation.'
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'firstName lastName username profileImage')
      .sort({ createdAt: 1 });

    // Mark messages sent to this user as read
    await Message.updateMany(
      { conversationId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages.'
    });
  }
};

/**
 * @route   POST /api/messages/:conversationId
 * @desc    Send a message in a conversation
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Determine receiver
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation participants.'
      });
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      listingId: conversation.listingId,
      text: text.trim()
    });

    // Update conversation last message
    conversation.lastMessage = {
      text: message.text,
      sender: senderId,
      createdAt: message.createdAt
    };
    await conversation.save();

    // Create notification for receiver
    await Notification.create({
      recipientId: receiverId,
      senderId: senderId,
      type: 'message',
      title: `💬 New Message from ${req.user.firstName}`,
      message: message.text.length > 60 ? message.text.slice(0, 60) + '...' : message.text,
      link: `/messages?conversationId=${conversation._id}`
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'firstName lastName username profileImage'
    );

    res.status(201).json({
      success: true,
      message: populated
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message.'
    });
  }
};

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get total unread message count for the logged-in user
 */
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('getUnreadMessageCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to count unread messages.'
    });
  }
};
