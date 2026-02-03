import { WhatsappMessage } from '../models/WhatsappMessage.js';
import { Email } from '../models/Email.js';
import { Billing } from '../models/Billing.js';
import { billingService } from '../services/billing.service.js';

export const statsController = {
  // Resumen completo
  async getSummary(req, res) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Uso actual
      const usage = await billingService.getCurrentUsage();
      
      // Estado de cuenta
      const accountStatus = await billingService.getAccountStatus();
      
      // Última factura
      const lastBilling = await Billing.findOne().sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: {
          currentMonth,
          usage,
          account: {
            active: accountStatus.isActive,
            blocked: !accountStatus.isActive,
            blockedReason: accountStatus.blockedReason,
            whatsappConnected: accountStatus.whatsappConnected
          },
          lastBilling: lastBilling ? {
            month: lastBilling.month,
            status: lastBilling.status,
            totalCost: lastBilling.totalCost,
            whatsappMessages: lastBilling.whatsappMessagesSent,
            emails: lastBilling.emailsSent,
            paymentDue: lastBilling.paymentDue
          } : null
        }
      });
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo resumen'
      });
    }
  },

  // Historial de mensajes de WhatsApp
  async getWhatsappHistory(req, res) {
    try {
      const { month, limit = 50, page = 1, status } = req.query;
      
      const query = {};
      if (month) query.billingMonth = month;
      if (status) query.status = status;
      
      const skip = (page - 1) * limit;
      
      const messages = await WhatsappMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v');
      
      const total = await WhatsappMessage.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo historial de WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial de mensajes'
      });
    }
  },

  // Historial de correos
  async getEmailHistory(req, res) {
    try {
      const { month, limit = 50, page = 1, status } = req.query;
      
      const query = {};
      if (month) query.billingMonth = month;
      if (status) query.status = status;
      
      const skip = (page - 1) * limit;
      
      const emails = await Email.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v');
      
      const total = await Email.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          emails,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo historial de correos:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial de correos'
      });
    }
  },

  // Uso actual
  async getCurrentUsage(req, res) {
    try {
      const usage = await billingService.getCurrentUsage();
      
      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error('Error obteniendo uso actual:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo uso actual'
      });
    }
  },

  // Historial de facturación
  async getBillingHistory(req, res) {
    try {
      const billings = await Billing.find()
        .sort({ month: -1 })
        .select('-__v');
      
      res.json({
        success: true,
        data: billings
      });
    } catch (error) {
      console.error('Error obteniendo historial de facturación:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial de facturación'
      });
    }
  },

  // Estadísticas por mes
  async getMonthStats(req, res) {
    try {
      const { month } = req.params;
      
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de mes inválido. Use YYYY-MM'
        });
      }
      
      // Contar mensajes de WhatsApp
      const whatsappStats = await WhatsappMessage.aggregate([
        { $match: { billingMonth: month } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Contar correos
      const emailStats = await Email.aggregate([
        { $match: { billingMonth: month } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRecipients: { $sum: '$recipientCount' }
          }
        }
      ]);
      
      // Obtener facturación del mes
      const billing = await Billing.findOne({ month });
      
      res.json({
        success: true,
        data: {
          month,
          whatsapp: whatsappStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          email: emailStats.reduce((acc, stat) => {
            acc[stat._id] = {
              emails: stat.count,
              recipients: stat.totalRecipients
            };
            return acc;
          }, {}),
          billing
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del mes:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas'
      });
    }
  },

  // Generar factura manualmente
  async generateInvoiceManual(req, res) {
    try {
      const { month } = req.body;
      
      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de mes inválido. Use YYYY-MM'
        });
      }
      
      const result = await billingService.generateMonthlyInvoice(month);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error generando factura manual:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando factura',
        message: error.message
      });
    }
  },

  // Revertir factura
  async reverseInvoice(req, res) {
    try {
      const { month } = req.params;
      
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de mes inválido. Use YYYY-MM'
        });
      }
      
      const result = await billingService.reverseInvoice(month);
      
      res.json(result);
    } catch (error) {
      console.error('Error revirtiendo factura:', error);
      res.status(500).json({
        success: false,
        error: 'Error revirtiendo factura',
        message: error.message
      });
    }
  },

  // Subir PDF de factura
  async uploadInvoicePDF(req, res) {
    try {
      const { billingId, base64, filename } = req.body;
      
      if (!billingId) {
        return res.status(400).json({
          success: false,
          error: 'El ID de facturación es requerido'
        });
      }

      if (!base64) {
        return res.status(400).json({
          success: false,
          error: 'El archivo en base64 es requerido'
        });
      }

      // Validar que sea base64 válido
      if (!base64.match(/^data:application\/pdf;base64,/) && !base64.match(/^[A-Za-z0-9+/=]+$/)) {
        return res.status(400).json({
          success: false,
          error: 'El formato base64 no es válido'
        });
      }
      
      const result = await billingService.uploadInvoicePDF(billingId, base64, filename);
      
      res.json(result);
    } catch (error) {
      console.error('Error subiendo factura PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Error subiendo factura PDF',
        message: error.message
      });
    }
  }
};
