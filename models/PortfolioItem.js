const mongoose = require('mongoose');

const PortfolioItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PortfolioItem', PortfolioItemSchema);
