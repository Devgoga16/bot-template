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
      const { month, limit = 50, page = 1, status, mediaType } = req.query;
      
      const query = {};
      if (month) query.billingMonth = month;
      if (status) query.status = status;
      if (mediaType) query['mediaData.type'] = mediaType;
      
      const skip = (page - 1) * limit;
      
      // Obtener mensajes sin el base64 completo (para no sobrecargar)
      const messages = await WhatsappMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v -mediaData.base64Data')
        .lean();
      
      // Agregar URL para ver la imagen si tiene mediaData
      const messagesWithImageUrl = messages.map(msg => ({
        ...msg,
        imageUrl: msg.mediaData?.type === 'image' ? `/api/whatsapp/messages/${msg._id}/image` : null,
        hasMedia: !!msg.mediaData?.type && msg.mediaData.type !== 'text'
      }));
      
      const total = await WhatsappMessage.countDocuments(query);
      
      // Obtener estadísticas generales
      const stats = await WhatsappMessage.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSent: { 
              $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } 
            },
            totalFailed: { 
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } 
            },
            totalPending: { 
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
            },
            totalWithImages: {
              $sum: { $cond: [{ $eq: ['$mediaData.type', 'image'] }, 1, 0] }
            },
            totalTextOnly: {
              $sum: { $cond: [{ $eq: ['$mediaData.type', 'text'] }, 1, 0] }
            }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          messages: messagesWithImageUrl,
          stats: stats[0] || {
            totalSent: 0,
            totalFailed: 0,
            totalPending: 0,
            totalWithImages: 0,
            totalTextOnly: 0
          },
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
  },

  // Obtener PDF de factura para descargar
  async downloadInvoicePDF(req, res) {
    try {
      const { billingId } = req.params;
      
      if (!billingId) {
        return res.status(400).json({
          success: false,
          error: 'El ID de facturación es requerido'
        });
      }
      
      const fileInfo = await billingService.getInvoiceFile(billingId);
      
      // Extraer base64 puro sin prefijo
      const base64Data = fileInfo.base64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Enviar archivo para descarga o previsualización
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error('Error descargando PDF de factura:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo PDF de factura',
        message: error.message
      });
    }
  },

  // Obtener PDF de factura en base64
  async getInvoicePDFBase64(req, res) {
    try {
      const { billingId } = req.params;
      
      if (!billingId) {
        return res.status(400).json({
          success: false,
          error: 'El ID de facturación es requerido'
        });
      }
      
      const result = await billingService.getInvoiceFileBase64(billingId);
      
      res.json(result);
    } catch (error) {
      console.error('Error obteniendo PDF en base64:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo PDF en base64',
        message: error.message
      });
    }
  },

  // Eliminar archivo PDF de factura
  async deleteInvoiceFile(req, res) {
    try {
      const { billingId } = req.params;
      
      if (!billingId) {
        return res.status(400).json({
          success: false,
          error: 'El ID de facturación es requerido'
        });
      }
      
      const result = await billingService.deleteInvoiceFile(billingId);
      
      res.json(result);
    } catch (error) {
      console.error('Error eliminando archivo de factura:', error);
      res.status(500).json({
        success: false,
        error: 'Error eliminando archivo de factura',
        message: error.message
      });
    }
  },

  // Ejecutar manualmente verificación de facturas vencidas
  async checkOverduePayments(req, res) {
    try {
      console.log('🔄 Ejecutando revisión manual de facturas vencidas...');
      
      const result = await billingService.checkOverduePayments();
      
      if (result.hasOverdue) {
        console.log(`⚠️ ${result.count} factura(s) vencida(s) detectada(s)`);
        return res.json({
          success: true,
          message: `Se detectaron ${result.count} factura(s) vencida(s). La cuenta ha sido bloqueada.`,
          data: {
            hasOverdue: true,
            count: result.count,
            invoices: result.invoices.map(inv => ({
              id: inv._id,
              month: inv.month,
              totalCost: inv.totalCost,
              paymentDue: inv.paymentDue,
              status: inv.status
            }))
          }
        });
      } else {
        console.log('✅ No hay pagos vencidos');
        return res.json({
          success: true,
          message: 'No se encontraron facturas vencidas',
          data: {
            hasOverdue: false,
            count: 0
          }
        });
      }
    } catch (error) {
      console.error('❌ Error verificando pagos vencidos:', error);
      res.status(500).json({
        success: false,
        error: 'Error verificando pagos vencidos',
        message: error.message
      });
    }
  },

  // Marcar pago como recibido y restaurar servicio
  async markPaymentReceived(req, res) {
    try {
      const { month } = req.body;
      
      if (!month) {
        return res.status(400).json({
          success: false,
          error: 'El mes de la factura es requerido'
        });
      }
      
      console.log(`💰 Registrando pago para factura del mes ${month}...`);
      
      const result = await billingService.markPaymentReceived(month);
      
      console.log('✅ Pago registrado y servicio restaurado');
      
      res.json({
        success: true,
        message: 'Pago registrado correctamente. Servicio restaurado.'
      });
    } catch (error) {
      console.error('❌ Error registrando pago:', error);
      res.status(500).json({
        success: false,
        error: 'Error registrando el pago',
        message: error.message
      });
    }
  },

  // Restaurar servicio manualmente
  async restoreService(req, res) {
    try {
      console.log('🔓 Restaurando servicio manualmente...');
      
      await billingService.unblockAccount();
      
      console.log('✅ Servicio restaurado correctamente');
      
      res.json({
        success: true,
        message: 'Servicio restaurado correctamente. La cuenta ha sido desbloqueada.'
      });
    } catch (error) {
      console.error('❌ Error restaurando servicio:', error);
      res.status(500).json({
        success: false,
        error: 'Error al restaurar el servicio',
        message: error.message
      });
    }
  }
};
