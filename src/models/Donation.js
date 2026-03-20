const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Donor Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // Donation Details
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true,
    enum: [
      'General Donation',
      'Annadanam',
      'Temple Construction',
      'Festival Sponsorship',
      'Gaushala',
      'Education Fund',
      'Other'
    ]
  },
  dedication: {
    type: String,
    trim: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ['razorpay', 'upi']
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  upiTransactionId: String,
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'verified'],
    default: 'pending'
  },
  
  // Receipt Information
  receiptNumber: {
    type: String,
    unique: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptSent: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate receipt number before saving
donationSchema.pre('save', async function(next) {
  if (!this.receiptNumber && this.status === 'success') {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ 
      status: 'success',
      createdAt: { 
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.receiptNumber = `TT/${year}/${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Update timestamp on update
donationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Indexes for better query performance
donationSchema.index({ email: 1 });
donationSchema.index({ phone: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ receiptNumber: 1 });

module.exports = mongoose.model('Donation', donationSchema);
