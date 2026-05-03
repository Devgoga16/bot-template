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

      // Extraer información de la imagen (si viene en formato data:image/...;base64,...)
      let mimeType = 'image/jpeg';
      let base64Data = image;
      
      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to: phoneNumber,
        message: caption || '[Imagen enviada]',
        billingMonth,
        status: 'pending',
        mediaData: {
          type: 'image',
          mimeType: mimeType,
          base64Data: base64Data,
          fileSize: Buffer.from(base64Data, 'base64').length
        }
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

      // Convertir buffer a base64
      const base64Image = req.file.buffer.toString('base64');

      // Crear registro en base de datos
      const messageRecord = new WhatsappMessage({
        to: phoneNumber,
        message: caption || '[Imagen enviada]',
        billingMonth,
        status: 'pending',
        mediaData: {
          type: 'image',
          mimeType: req.file.mimetype,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          base64Data: base64Image
        }
      });

      try {
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
  },

  async getMessage(req, res) {
    try {
      const { id } = req.params;
      
      const message = await WhatsappMessage.findById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Mensaje no encontrado'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error obteniendo mensaje:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo mensaje',
        details: error.message
      });
    }
  },

  async getMessageImage(req, res) {
    try {
      const { id } = req.params;
      
      const message = await WhatsappMessage.findById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Mensaje no encontrado'
        });
      }

      if (!message.mediaData || message.mediaData.type !== 'image' || !message.mediaData.base64Data) {
        return res.status(404).json({
          success: false,
          error: 'Este mensaje no contiene una imagen'
        });
      }

      // Convertir base64 a buffer
      const imageBuffer = Buffer.from(message.mediaData.base64Data, 'base64');
      
      // Establecer el tipo de contenido apropiado
      res.setHeader('Content-Type', message.mediaData.mimeType || 'image/jpeg');
      res.setHeader('Content-Length', imageBuffer.length);
      
      // Si tiene nombre de archivo, sugerirlo para descarga
      if (message.mediaData.fileName) {
        res.setHeader('Content-Disposition', `inline; filename="${message.mediaData.fileName}"`);
      }

      res.send(imageBuffer);
    } catch (error) {
      console.error('Error obteniendo imagen:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo imagen',
        details: error.message
      });
    }
  },

  async listMessages(req, res) {
    try {
      const { page = 1, limit = 20, status, billingMonth, mediaType } = req.query;
      
      // Construir filtros
      const filters = {};
      if (status) filters.status = status;
      if (billingMonth) filters.billingMonth = billingMonth;
      if (mediaType) filters['mediaData.type'] = mediaType;

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        WhatsappMessage.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-mediaData.base64Data'), // Excluir el base64 del listado para no enviar mucha data
        WhatsappMessage.countDocuments(filters)
      ]);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error listando mensajes:', error);
      res.status(500).json({
        success: false,
        error: 'Error listando mensajes',
        details: error.message
      });
    }
  }
};
