import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true // formato: "YYYY-MM"
  },
  whatsappMessagesSent: {
    type: Number,
    default: 0
  },
  emailsSent: {
    type: Number,
    default: 0
  },
  whatsappExtraMessages: {
    type: Number,
    default: 0
  },
  emailsExtra: {
    type: Number,
    default: 0
  },
  basePlanCost: {
    type: Number,
    required: true
  },
  extraWhatsappCost: {
    type: Number,
    default: 0
  },
  extraEmailCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceGeneratedAt: Date,
  invoiceUploaded: {
    type: Boolean,
    default: false
  },
  invoiceUploadedAt: Date,
  invoiceFilePath: {
    type: String,
    default: null
  },
  invoiceFileName: {
    type: String,
    default: null
  },
  paymentDue: Date,
  paymentReceived: {
    type: Boolean,
    default: false
  },
  paymentReceivedAt: Date,
  status: {
    type: String,
    enum: ['draft', 'invoiced', 'overdue', 'paid'],
    default: 'draft'
  }
}, {
  timestamps: true
});

export const Billing = mongoose.model('Billing', billingSchema);
