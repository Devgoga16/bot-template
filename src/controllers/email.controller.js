import { emailService } from '../services/email.service.js';
import { Email } from '../models/Email.js';

export const emailController = {
  async sendEmail(req, res) {
    try {
      const { to, subject, html } = req.body;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Crear registro en base de datos
      const emailRecord = new Email({
        to: [to],
        subject,
        html,
        billingMonth,
        status: 'pending',
        recipientCount: 1
      });

      try {
        // Enviar correo
        const result = await emailService.sendEmail(to, subject, html);
        
        emailRecord.status = 'sent';
        emailRecord.sentAt = result.sentAt;
        await emailRecord.save();

        console.log(`📧 Correo enviado → ${to}`);

        res.json({
          success: true,
          message: 'Correo enviado correctamente',
          data: {
            to,
            messageId: result.messageId,
            sentAt: result.sentAt
          }
        });
      } catch (error) {
        emailRecord.status = 'failed';
        emailRecord.error = error.message;
        await emailRecord.save();

        throw error;
      }
    } catch (error) {
      console.error('Error enviando correo:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando correo electrónico',
        details: error.message
      });
    }
  },

  async sendMultipleEmails(req, res) {
    try {
      const { to, subject, html } = req.body;
      
      const billingMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const recipientCount = to.length;

      // Crear registro en base de datos
      const emailRecord = new Email({
        to,
        subject,
        html,
        billingMonth,
        status: 'pending',
        recipientCount
      });

      try {
        // Enviar correo a múltiples destinatarios
        const result = await emailService.sendMultipleEmails(to, subject, html);
        
        emailRecord.status = 'sent';
        emailRecord.sentAt = result.sentAt;
        await emailRecord.save();

        console.log(`📧 Correo múltiple enviado → ${recipientCount} destinatarios`);

        res.json({
          success: true,
          message: 'Correo enviado a múltiples destinatarios correctamente',
          data: {
            recipients: to,
            recipientCount,
            messageId: result.messageId,
            sentAt: result.sentAt
          }
        });
      } catch (error) {
        emailRecord.status = 'failed';
        emailRecord.error = error.message;
        await emailRecord.save();

        throw error;
      }
    } catch (error) {
      console.error('Error enviando correos múltiples:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando correos electrónicos',
        details: error.message
      });
    }
  }
};
