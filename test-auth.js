const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const axios = require('axios');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/menstrualcare', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Test user data
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            age: 25,
            weight: 60,
            height: 165
        };

        // Check if user exists
        let user = await User.findOne({ email: testUser.email });
        if (user) {
            console.log('Test user already exists');
        } else {
            // Create new user
            user = new User(testUser);
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(testUser.password, salt);
            
            // Save user
            await user.save();
            console.log('Test user created successfully');
        }

        // Test login
        const { email, password } = testUser;
        user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password');
            process.exit(1);
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, 'your_secret_key_123', { expiresIn: '24h' });
        console.log('Login successful!');
        console.log('JWT Token:', token);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    // Test registration
    console.log('Testing registration...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User 3',
      email: 'test3@example.com',
      password: 'testpass123',
      age: 30,
      weight: 70,
      height: 175
    });
    console.log('Registration successful:', registerResponse.data);

    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test3@example.com',
      password: 'testpass123'
    });
    console.log('Login successful:', loginResponse.data);

    // Test protected route
    console.log('\nTesting protected route...');
    const token = loginResponse.data.token;
    const userResponse = await axios.get(`${API_URL}/auth`, {
      headers: { 'x-auth-token': token }
    });
    console.log('Protected route successful:', userResponse.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAuth(); 