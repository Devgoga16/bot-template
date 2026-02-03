import { Billing } from '../models/Billing.js';
import { WhatsappMessage } from '../models/WhatsappMessage.js';
import { Email } from '../models/Email.js';
import { AccountStatus } from '../models/AccountStatus.js';
import { config } from '../config/config.js';

class BillingService {
  
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getPreviousMonth() {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  async generateMonthlyInvoice(month = null) {
    const billingMonth = month || this.getPreviousMonth();
    
    try {
      // Verificar si ya existe factura para este mes
      let billing = await Billing.findOne({ month: billingMonth });
      
      if (billing && billing.invoiceGenerated) {
        return { 
          success: false, 
          message: 'La factura para este mes ya fue generada',
          billing 
        };
      }

      // Contar mensajes de WhatsApp enviados exitosamente
      const whatsappCount = await WhatsappMessage.countDocuments({
        billingMonth,
        status: 'sent'
      });

      // Contar correos enviados exitosamente (multiplicado por número de destinatarios)
      const emails = await Email.find({
        billingMonth,
        status: 'sent'
      });
      
      const emailCount = emails.reduce((sum, email) => sum + email.recipientCount, 0);

      // Calcular extras
      const whatsappExtra = Math.max(0, whatsappCount - config.billing.whatsappMessageLimit);
      const emailExtra = Math.max(0, emailCount - config.billing.emailLimit);

      // Calcular costos
      const basePlanCost = config.billing.pricePlan;
      const extraWhatsappCost = whatsappExtra * config.billing.priceWhatsappExtraMessage;
      const extraEmailCost = emailExtra * config.billing.priceEmailExtra;
      const totalCost = basePlanCost + extraWhatsappCost + extraEmailCost;

      // Crear o actualizar registro de facturación
      if (!billing) {
        billing = new Billing({
          month: billingMonth,
          whatsappMessagesSent: whatsappCount,
          emailsSent: emailCount,
          whatsappExtraMessages: whatsappExtra,
          emailsExtra: emailExtra,
          basePlanCost,
          extraWhatsappCost,
          extraEmailCost,
          totalCost
        });
      } else {
        billing.whatsappMessagesSent = whatsappCount;
        billing.emailsSent = emailCount;
        billing.whatsappExtraMessages = whatsappExtra;
        billing.emailsExtra = emailExtra;
        billing.basePlanCost = basePlanCost;
        billing.extraWhatsappCost = extraWhatsappCost;
        billing.extraEmailCost = extraEmailCost;
        billing.totalCost = totalCost;
      }

      billing.invoiceGenerated = true;
      billing.invoiceGeneratedAt = new Date();
      billing.status = 'invoiced';

      await billing.save();

      return {
        success: true,
        message: 'Factura generada correctamente',
        billing
      };
    } catch (error) {
      console.error('Error generando factura:', error);
      throw error;
    }
  }

  async markInvoiceUploaded(month) {
    try {
      const billing = await Billing.findOne({ month });
      
      if (!billing) {
        throw new Error('No se encontró factura para este mes');
      }

      billing.invoiceUploaded = true;
      billing.invoiceUploadedAt = new Date();
      
      // Calcular fecha de vencimiento (3 días hábiles)
      billing.paymentDue = this.addBusinessDays(new Date(), 3);
      
      await billing.save();

      return {
        success: true,
        message: 'Factura marcada como subida',
        paymentDue: billing.paymentDue
      };
    } catch (error) {
      console.error('Error marcando factura como subida:', error);
      throw error;
    }
  }

  async uploadInvoicePDF(billingId, base64Data, originalFilename = null) {
    try {
      const billing = await Billing.findById(billingId);
      
      if (!billing) {
        throw new Error('No se encontró la factura');
      }

      if (!billing.invoiceGenerated) {
        throw new Error('La factura debe estar generada antes de subir el archivo');
      }

      // Limpiar base64 si viene con prefijo
      let base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
      
      // Asegurar que tenga el prefijo para almacenamiento
      const base64WithPrefix = base64Clean.startsWith('data:') ? base64Clean : `data:application/pdf;base64,${base64Clean}`;

      // Generar nombre de archivo único si no se proporciona
      const timestamp = Date.now();
      const fileName = originalFilename || `invoice_${billing.month}_${timestamp}.pdf`;

      // Guardar base64 directamente en la BD
      billing.invoiceUploaded = true;
      billing.invoiceUploadedAt = new Date();
      billing.invoiceFileBase64 = base64WithPrefix;
      billing.invoiceFileName = fileName;
      
      // Calcular fecha de vencimiento (3 días hábiles)
      billing.paymentDue = this.addBusinessDays(new Date(), 3);
      
      await billing.save();

      return {
        success: true,
        message: 'Factura PDF subida correctamente',
        billing: {
          id: billing._id,
          month: billing.month,
          fileName: billing.invoiceFileName,
          uploadedAt: billing.invoiceUploadedAt,
          paymentDue: billing.paymentDue
        }
      };
    } catch (error) {
      console.error('Error subiendo factura PDF:', error);
      throw error;
    }
  }

  async markPaymentReceived(month) {
    try {
      const billing = await Billing.findOne({ month });
      
      if (!billing) {
        throw new Error('No se encontró factura para este mes');
      }

      billing.paymentReceived = true;
      billing.paymentReceivedAt = new Date();
      billing.status = 'paid';
      
      await billing.save();

      // Desbloquear cuenta si estaba bloqueada
      await this.unblockAccount();

      return {
        success: true,
        message: 'Pago registrado correctamente'
      };
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }

  async checkOverduePayments() {
    try {
      const now = new Date();
      
      // Buscar facturas vencidas sin pagar
      const overdueInvoices = await Billing.find({
        invoiceUploaded: true,
        paymentReceived: false,
        paymentDue: { $lt: now },
        status: { $ne: 'paid' }
      });

      if (overdueInvoices.length > 0) {
        // Marcar como vencidas
        for (const invoice of overdueInvoices) {
          invoice.status = 'overdue';
          await invoice.save();
        }

        // Bloquear cuenta
        await this.blockAccount('Pago vencido. Por favor regularice su situación.');
        
        return {
          hasOverdue: true,
          count: overdueInvoices.length,
          invoices: overdueInvoices
        };
      }

      return {
        hasOverdue: false,
        count: 0
      };
    } catch (error) {
      console.error('Error verificando pagos vencidos:', error);
      throw error;
    }
  }

  async blockAccount(reason) {
    try {
      let status = await AccountStatus.findOne();
      
      if (!status) {
        status = new AccountStatus();
      }

      status.isActive = false;
      status.blockedReason = reason;
      status.blockedAt = new Date();
      
      await status.save();

      console.log('🔒 Cuenta bloqueada:', reason);
    } catch (error) {
      console.error('Error bloqueando cuenta:', error);
      throw error;
    }
  }

  async unblockAccount() {
    try {
      let status = await AccountStatus.findOne();
      
      if (!status) {
        status = new AccountStatus();
      }

      status.isActive = true;
      status.blockedReason = null;
      
      await status.save();

      console.log('🔓 Cuenta desbloqueada');
    } catch (error) {
      console.error('Error desbloqueando cuenta:', error);
      throw error;
    }
  }

  async getAccountStatus() {
    let status = await AccountStatus.findOne();
    
    if (!status) {
      status = new AccountStatus({ isActive: true });
      await status.save();
    }

    return status;
  }

  async getCurrentUsage() {
    const currentMonth = this.getCurrentMonth();

    const whatsappCount = await WhatsappMessage.countDocuments({
      billingMonth: currentMonth,
      status: 'sent'
    });

    const emails = await Email.find({
      billingMonth: currentMonth,
      status: 'sent'
    });
    
    const emailCount = emails.reduce((sum, email) => sum + email.recipientCount, 0);

    return {
      month: currentMonth,
      whatsapp: {
        sent: whatsappCount,
        limit: config.billing.whatsappMessageLimit,
        remaining: Math.max(0, config.billing.whatsappMessageLimit - whatsappCount),
        extra: Math.max(0, whatsappCount - config.billing.whatsappMessageLimit)
      },
      email: {
        sent: emailCount,
        limit: config.billing.emailLimit,
        remaining: Math.max(0, config.billing.emailLimit - emailCount),
        extra: Math.max(0, emailCount - config.billing.emailLimit)
      }
    };
  }

  async getInvoiceFile(billingId) {
    try {
      const billing = await Billing.findById(billingId);
      
      if (!billing) {
        throw new Error('No se encontró la factura');
      }

      if (!billing.invoiceFileBase64 || !billing.invoiceUploaded) {
        throw new Error('Esta factura no tiene un archivo PDF asociado');
      }

      return {
        base64: billing.invoiceFileBase64,
        fileName: billing.invoiceFileName,
        month: billing.month
      };
    } catch (error) {
      console.error('Error obteniendo archivo de factura:', error);
      throw error;
    }
  }

  async getInvoiceFileBase64(billingId) {
    try {
      const billing = await Billing.findById(billingId);
      
      if (!billing) {
        throw new Error('No se encontró la factura');
      }

      if (!billing.invoiceFileBase64 || !billing.invoiceUploaded) {
        throw new Error('Esta factura no tiene un archivo PDF asociado');
      }

      return {
        success: true,
        data: {
          base64: billing.invoiceFileBase64,
          fileName: billing.invoiceFileName,
          month: billing.month,
          uploadedAt: billing.invoiceUploadedAt
        }
      };
    } catch (error) {
      console.error('Error obteniendo archivo de factura en base64:', error);
      throw error;
    }
  }

  async deleteInvoiceFile(billingId) {
    try {
      const billing = await Billing.findById(billingId);
      
      if (!billing) {
        throw new Error('No se encontró la factura');
      }

      if (billing.paymentReceived) {
        throw new Error('No se puede eliminar el archivo de una factura que ya ha sido pagada');
      }

      // Limpiar datos del archivo
      billing.invoiceUploaded = false;
      billing.invoiceUploadedAt = null;
      billing.invoiceFileBase64 = null;
      billing.invoiceFileName = null;
      billing.paymentDue = null;
      
      // Si estaba en estado invoiced, volver a draft
      if (billing.status === 'invoiced') {
        billing.status = 'draft';
      }
      
      await billing.save();

      console.log('🗑️ Archivo PDF eliminado de BD');

      return {
        success: true,
        message: 'Archivo de factura eliminado correctamente',
        billing: {
          id: billing._id,
          month: billing.month,
          status: billing.status
        }
      };
    } catch (error) {
      console.error('Error eliminando archivo de factura:', error);
      throw error;
    }
  }

  async reverseInvoice(month) {
    try {
      const billing = await Billing.findOne({ month });
      
      if (!billing) {
        throw new Error('No se encontró factura para este mes');
      }

      if (billing.paymentReceived) {
        throw new Error('No se puede revertir una factura que ya ha sido pagada');
      }

      if (billing.invoiceUploaded) {
        throw new Error('No se puede revertir una factura que ya ha sido subida. Elimine primero el archivo PDF.');
      }

      // Eliminar la factura
      await Billing.deleteOne({ _id: billing._id });

      // Si la cuenta estaba bloqueada por esta factura, desbloquear
      const hasOtherOverdue = await Billing.countDocuments({
        status: 'overdue',
        paymentReceived: false
      });

      if (hasOtherOverdue === 0) {
        await this.unblockAccount();
      }

      return {
        success: true,
        message: 'Factura revertida correctamente',
        deletedBilling: billing
      };
    } catch (error) {
      console.error('Error revirtiendo factura:', error);
      throw error;
    }
  }

  addBusinessDays(date, days) {
    let result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }
}

// Singleton
export const billingService = new BillingService();
