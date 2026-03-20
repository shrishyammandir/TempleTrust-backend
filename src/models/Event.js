const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Festival', 'Pooja', 'Special Event', 'Regular Service'],
    default: 'Regular Service'
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  image: {
    type: String
  },
  bookingEnabled: {
    type: Boolean,
    default: false
  },
  maxBookings: {
    type: Number,
    default: 0
  },
  currentBookings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', eventSchema);
