const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Grabs the user's profile info
// TODO: Need to add more profile fields like cycle length, symptoms, etc.
router.get('/', auth, async (req, res) => {
  try {
    // TODO: Add actual profile data fetching
    res.json({ message: 'Profile endpoint' });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Updates user's basic info like name, age, etc.
// Might add more fields later for better tracking
router.put('/', auth, async (req, res) => {
  try {
    const { name, age, weight, height } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'No user found' });
    }

    // Only update what's provided - keeps things clean
    const updates = {};
    if (name) updates.name = name;
    if (age) updates.age = age;
    if (weight) updates.weight = weight;
    if (height) updates.height = height;

    Object.assign(user, updates);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Handles password changes
// Made sure to double-check current password for security
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'No user found' });
    }

    // Gotta make sure they know their current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    // All good, let's update the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router; 