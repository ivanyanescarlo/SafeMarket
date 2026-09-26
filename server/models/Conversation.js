const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
