const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chatbot = require('../models/Chatbot');

// Knowledge base for common questions
const knowledgeBase = {
  'period': {
    keywords: ['period', 'menstruation', 'menstrual cycle', 'monthly cycle'],
    response: 'A menstrual period is the shedding of the uterine lining that occurs approximately every 28 days. It\'s a normal part of the reproductive cycle.'
  },
  'pms': {
    keywords: ['pms', 'premenstrual syndrome', 'pre menstrual'],
    response: 'Premenstrual Syndrome (PMS) includes physical and emotional symptoms that occur before your period. Common symptoms include mood swings, bloating, and breast tenderness.'
  },
  'pain': {
    keywords: ['pain', 'cramps', 'discomfort', 'hurt'],
    response: 'Menstrual cramps are common but can be managed. Try heat therapy, gentle exercise, or over-the-counter pain relievers. If pain is severe, consult your healthcare provider.'
  },
  'cycle': {
    keywords: ['cycle length', 'cycle duration', 'how long'],
    response: 'A typical menstrual cycle lasts 21-35 days, with the period itself lasting 3-7 days. However, cycle length can vary between individuals.'
  },
  'hygiene': {
    keywords: ['hygiene', 'sanitary', 'pad', 'tampon', 'cup'],
    response: 'Good menstrual hygiene is important. Change sanitary products regularly (every 4-8 hours), wash hands before and after changing, and maintain proper genital hygiene.'
  },
  'irregular': {
    keywords: ['irregular', 'unpredictable', 'missed period', 'late period'],
    response: 'Irregular periods can be caused by stress, diet, exercise, or medical conditions. If irregularity persists, consult your healthcare provider.'
  }
};

// Helper function to find the best matching response
function findResponse(message) {
  const lowerMessage = message.toLowerCase();
  let bestMatch = null;
  let maxKeywords = 0;

  for (const [key, data] of Object.entries(knowledgeBase)) {
    const matchingKeywords = data.keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (matchingKeywords.length > maxKeywords) {
      maxKeywords = matchingKeywords.length;
      bestMatch = data.response;
    }
  }

  return bestMatch || "I'm sorry, I don't have information about that. Please consult your healthcare provider for specific medical advice.";
}

// @route   POST api/chatbot
// @desc    Send a message to the chatbot
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find or create a chat session for the user
    let chatSession = await Chatbot.findOne({ user: req.user.id });
    if (!chatSession) {
      chatSession = new Chatbot({ user: req.user.id });
    }

    // Add user message
    chatSession.messages.push({
      role: 'user',
      content: message
    });

    // Get bot response
    const response = findResponse(message);

    // Add bot response
    chatSession.messages.push({
      role: 'assistant',
      content: response
    });

    await chatSession.save();

    res.json({
      response,
      messages: chatSession.messages
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/chatbot
// @desc    Get chat history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chatSession = await Chatbot.findOne({ user: req.user.id });
    if (!chatSession) {
      return res.json({ messages: [] });
    }
    res.json({ messages: chatSession.messages });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 