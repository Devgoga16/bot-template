import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  to: {
    type: [String],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'retry'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: String,
  sentAt: Date,
  billingMonth: {
    type: String,
    required: true // formato: "YYYY-MM"
  },
  recipientCount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Índice para consultas de facturación
emailSchema.index({ billingMonth: 1, status: 1 });

export const Email = mongoose.model('Email', emailSchema);
