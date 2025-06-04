const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @route   GET api/chat
// @desc    Get chat history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({ message: 'Chat endpoint' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/chat
// @desc    Get all chats for a user
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'name email')
      .populate('messages.sender', 'name')
      .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/chat
// @desc    Create a new chat
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { participants, isGroupChat, groupName } = req.body;

    // Add current user to participants
    const allParticipants = [...participants, req.user.id];

    const chat = new Chat({
      participants: allParticipants,
      isGroupChat,
      groupName: isGroupChat ? groupName : undefined
    });

    await chat.save();
    await chat.populate('participants', 'name email');

    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/chat/:chatId/messages
// @desc    Add a message to a chat
// @access  Private
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    chat.messages.push({
      sender: req.user.id,
      content
    });

    chat.lastMessage = Date.now();
    await chat.save();

    await chat.populate('messages.sender', 'name');
    res.json(chat.messages[chat.messages.length - 1]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/chat/:chatId/messages
// @desc    Get all messages in a chat
// @access  Private
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(chat.messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 