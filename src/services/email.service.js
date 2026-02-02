import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendEmail(to, subject, html, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html
      });

      return {
        success: true,
        messageId: info.messageId,
        sentAt: new Date()
      };
    } catch (error) {
      console.error(`Error enviando correo (intento ${retryCount + 1}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Esperar 3 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.sendEmail(to, subject, html, retryCount + 1);
      }
      
      throw error;
    }
  }

  async sendMultipleEmails(recipients, subject, html) {
    // Enviar a múltiples destinatarios en un solo correo
    return this.sendEmail(recipients, subject, html);
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Error verificando conexión de correo:', error);
      return false;
    }
  }
}

// Singleton
export const emailService = new EmailService();
