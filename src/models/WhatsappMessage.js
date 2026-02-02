import mongoose from 'mongoose';

const whatsappMessageSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  message: {
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
  }
}, {
  timestamps: true
});

// Índice para consultas de facturación
whatsappMessageSchema.index({ billingMonth: 1, status: 1 });

export const WhatsappMessage = mongoose.model('WhatsappMessage', whatsappMessageSchema);
