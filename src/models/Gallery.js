const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Temple', 'Festivals', 'Events', 'Deities', 'Activities'],
    default: 'Temple'
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

gallerySchema.index({ category: 1 });
gallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
