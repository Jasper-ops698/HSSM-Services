const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
});

module.exports = mongoose.model('Service', serviceSchema);