// utils/generateToken.js
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");



const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = generateToken;
