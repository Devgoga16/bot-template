import { whatsappService } from '../services/whatsapp.service.js';
import { WhatsappMessage } from '../models/WhatsappMessage.js';

export const whatsappController = {
  async getStatus(req, res) {
    try {
      const status = whatsappService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error obteniendo estado:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estado de WhatsApp'
      });
    }
  },

  async sendMessage(req, res) {
    try {
      const { to, message } = req.body;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to,
        message,
        billingMonth,
        status: 'pending'
      });

      try {
        // Enviar mensaje
        const result = await whatsappService.sendMessage(to, message);
        
        messageRecord.status = 'sent';
        messageRecord.sentAt = result.sentAt;
        await messageRecord.save();

        console.log(`📤 WhatsApp enviado → ${to}`);

        res.json({
          success: true,
          message: 'Mensaje enviado correctamente',
          data: {
            to,
            sentAt: result.sentAt
          }
        });
      } catch (error) {
        messageRecord.status = 'failed';
        messageRecord.error = error.message;
        await messageRecord.save();

        throw error;
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando mensaje de WhatsApp',
        details: error.message
      });
    }
  }
};
