import mongoose from 'mongoose';

const whatsappGroupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true // JID del grupo, ej: "123456789-1234567890@g.us"
  },
  name: {
    type: String,
    required: true
  },
  owner: {
    type: String // JID del dueño del bot
  },
  participants: [{
    jid: String,
    isAdmin: {
      type: Boolean,
      default: false
    }
  }],
  inviteCode: String,
  status: {
    type: String,
    enum: ['active', 'failed'],
    default: 'active'
  },
  error: String
}, {
  timestamps: true
});

export const WhatsappGroup = mongoose.model('WhatsappGroup', whatsappGroupSchema);
