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
      
      // Agregar código de país 51 (Perú)
      const phoneNumber = `51${to}`;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to: phoneNumber,
        message,
        billingMonth,
        status: 'pending'
      });

      try {
        // Enviar mensaje
        const result = await whatsappService.sendMessage(phoneNumber, message);
        
        messageRecord.status = 'sent';
        messageRecord.sentAt = result.sentAt;
        await messageRecord.save();

        console.log(`📤 WhatsApp enviado → ${phoneNumber}`);

        res.json({
          success: true,
          message: 'Mensaje enviado correctamente',
          data: {
            to: phoneNumber,
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
  },

  async sendImage(req, res) {
    try {
      const { to, image, caption } = req.body;
      
      // Agregar código de país 51 (Perú)
      const phoneNumber = `51${to}`;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to: phoneNumber,
        message: caption || '[Imagen enviada]',
        billingMonth,
        status: 'pending'
      });

      try {
        // Enviar imagen
        const result = await whatsappService.sendImage(phoneNumber, image, caption);
        
        messageRecord.status = 'sent';
        messageRecord.sentAt = result.sentAt;
        await messageRecord.save();

        console.log(`📤 Imagen de WhatsApp enviada → ${phoneNumber}`);

        res.json({
          success: true,
          message: 'Imagen enviada correctamente',
          data: {
            to: phoneNumber,
            sentAt: result.sentAt,
            hasCaption: !!caption
          }
        });
      } catch (error) {
        messageRecord.status = 'failed';
        messageRecord.error = error.message;
        await messageRecord.save();

        throw error;
      }
    } catch (error) {
      console.error('Error enviando imagen:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando imagen de WhatsApp',
        details: error.message
      });
    }
  },

  async sendImageUpload(req, res) {
    try {
      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo de imagen'
        });
      }

      const { to, caption } = req.body;
      
      // Validar número de teléfono
      if (!to || !/^9\d{8}$/.test(to)) {
        return res.status(400).json({
          success: false,
          error: 'Número de teléfono inválido. Debe tener 9 dígitos y empezar con 9'
        });
      }

      // Agregar código de país 51 (Perú)
      const phoneNumber = `51${to}`;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to: phoneNumber,
        message: caption || '[Imagen enviada]',
        billingMonth,
        status: 'pending'
      });

      try {
        // Convertir buffer a base64 para usar el método existente
        const base64Image = req.file.buffer.toString('base64');
        const imageWithPrefix = `data:${req.file.mimetype};base64,${base64Image}`;

        // Enviar imagen usando el método existente
        const result = await whatsappService.sendImage(phoneNumber, imageWithPrefix, caption);
        
        messageRecord.status = 'sent';
        messageRecord.sentAt = result.sentAt;
        await messageRecord.save();

        console.log(`📤 Imagen de WhatsApp enviada (upload) → ${phoneNumber} (${req.file.originalname}, ${(req.file.size / 1024).toFixed(2)}KB)`);

        res.json({
          success: true,
          message: 'Imagen enviada correctamente',
          data: {
            to: phoneNumber,
            sentAt: result.sentAt,
            hasCaption: !!caption,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
          }
        });
      } catch (error) {
        messageRecord.status = 'failed';
        messageRecord.error = error.message;
        await messageRecord.save();

        throw error;
      }
    } catch (error) {
      console.error('Error enviando imagen (upload):', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando imagen de WhatsApp',
        details: error.message
      });
    }
  }
};
