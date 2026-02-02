import { billingService } from '../services/billing.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { emailService } from '../services/email.service.js';
import mongoose from 'mongoose';

export const healthController = {
  async check(req, res) {
    try {
      const checks = {
        api: 'ok',
        database: 'checking',
        whatsapp: 'checking',
        email: 'checking'
      };

      // Verificar MongoDB
      try {
        if (mongoose.connection.readyState === 1) {
          checks.database = 'ok';
        } else {
          checks.database = 'error';
        }
      } catch (error) {
        checks.database = 'error';
      }

      // Verificar WhatsApp
      try {
        const whatsappStatus = whatsappService.getStatus();
        checks.whatsapp = whatsappStatus.connected ? 'connected' : whatsappStatus.status;
      } catch (error) {
        checks.whatsapp = 'error';
      }

      // Verificar Email
      try {
        const emailConnected = await emailService.verifyConnection();
        checks.email = emailConnected ? 'ok' : 'error';
      } catch (error) {
        checks.email = 'error';
      }

      // Verificar estado de cuenta
      const accountStatus = await billingService.getAccountStatus();
      const usage = await billingService.getCurrentUsage();

      const allOk = Object.values(checks).every(v => v === 'ok' || v === 'connected');

      res.status(allOk ? 200 : 503).json({
        success: allOk,
        status: allOk ? 'healthy' : 'degraded',
        checks,
        account: {
          active: accountStatus.isActive,
          blocked: !accountStatus.isActive,
          reason: accountStatus.blockedReason
        },
        usage
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        error: error.message
      });
    }
  }
};
