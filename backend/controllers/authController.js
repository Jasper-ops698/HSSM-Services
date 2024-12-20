const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// Register User
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Log the received data
    console.log('Received data:', { name, email, password, role });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    // Log the created user
    console.log('User saved:', user);

    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};
