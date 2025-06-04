const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/cycle
// @desc    Get user's cycle data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.json({ message: 'Cycle data endpoint' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 