const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
});

module.exports = mongoose.model('Request', requestSchema);