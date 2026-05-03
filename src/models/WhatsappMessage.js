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
  },
  // Información de medios enviados (imágenes, documentos, etc.)
  mediaData: {
    type: {
      type: String,
      enum: ['text', 'image', 'document', 'video', 'audio'],
      default: 'text'
    },
    mimeType: String,
    fileName: String,
    fileSize: Number,
    // Guardar la imagen/documento en base64 (para poder visualizarlo después)
    base64Data: String,
    // URL si la imagen viene de una URL externa
    url: String
  }
}, {
  timestamps: true
});

// Índice para consultas de facturación
whatsappMessageSchema.index({ billingMonth: 1, status: 1 });

export const WhatsappMessage = mongoose.model('WhatsappMessage', whatsappMessageSchema);
