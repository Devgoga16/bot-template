import cron from 'node-cron';
import { billingService } from '../services/billing.service.js';

export const setupCronJobs = () => {
  // Generar factura automáticamente el primer día de cada mes a las 00:00
  cron.schedule('0 0 1 * *', async () => {
    try {
      console.log('🔄 Ejecutando generación automática de factura...');
      const result = await billingService.generateMonthlyInvoice();
      console.log('✅ Factura generada:', result);
    } catch (error) {
      console.error('❌ Error generando factura automática:', error);
    }
  });

  // Verificar pagos vencidos cada día a las 08:00
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('🔄 Verificando pagos vencidos...');
      const result = await billingService.checkOverduePayments();
      
      if (result.hasOverdue) {
        console.log(`⚠️ ${result.count} factura(s) vencida(s) detectada(s)`);
      } else {
        console.log('✅ No hay pagos vencidos');
      }
    } catch (error) {
      console.error('❌ Error verificando pagos vencidos:', error);
    }
  });

  console.log('⏰ Tareas programadas configuradas');
};
