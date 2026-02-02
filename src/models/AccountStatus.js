import mongoose from 'mongoose';

const accountStatusSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: true
  },
  blockedReason: String,
  blockedAt: Date,
  lastPaymentCheck: Date,
  whatsappConnected: {
    type: Boolean,
    default: false
  },
  whatsappLastCheck: Date,
  whatsappDisconnectedAt: Date
}, {
  timestamps: true
});

export const AccountStatus = mongoose.model('AccountStatus', accountStatusSchema);
