import express from 'express';
import { statsController } from '../controllers/stats.controller.js';

const router = express.Router();

/**
 * @swagger
 * /stats/summary:
 *   get:
 *     summary: Obtener resumen completo de uso y estado
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Resumen obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/summary', statsController.getSummary);

/**
 * @swagger
 * /stats/usage:
 *   get:
 *     summary: Obtener uso actual del mes
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Uso actual obtenido correctamente
 */
router.get('/usage', statsController.getCurrentUsage);

/**
 * @swagger
 * /stats/whatsapp:
 *   get:
 *     summary: Obtener historial de mensajes de WhatsApp
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filtrar por mes (formato YYYY-MM)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, retry]
 *         description: Filtrar por estado
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de resultados por página
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Historial obtenido correctamente
 */
router.get('/whatsapp', statsController.getWhatsappHistory);

/**
 * @swagger
 * /stats/emails:
 *   get:
 *     summary: Obtener historial de correos enviados
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filtrar por mes (formato YYYY-MM)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, retry]
 *         description: Filtrar por estado
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de resultados por página
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Historial obtenido correctamente
 */
router.get('/emails', statsController.getEmailHistory);

/**
 * @swagger
 * /stats/billing:
 *   get:
 *     summary: Obtener historial de facturación
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Historial de facturación obtenido correctamente
 */
router.get('/billing', statsController.getBillingHistory);

/**
 * @swagger
 * /stats/month/{month}:
 *   get:
 *     summary: Obtener estadísticas de un mes específico
 *     tags: [Estadísticas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Mes en formato YYYY-MM
 *         example: "2026-01"
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *       400:
 *         description: Formato de mes inválido
 */
router.get('/month/:month', statsController.getMonthStats);

/**
 * @swagger
 * /stats/invoice/generate:
 *   post:
 *     summary: Generar factura manualmente
 *     tags: [Facturación]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 description: Mes a facturar (formato YYYY-MM). Si no se especifica, se genera para el mes anterior.
 *                 example: "2026-01"
 *     responses:
 *       200:
 *         description: Factura generada correctamente
 *       400:
 *         description: Factura ya existe o formato inválido
 *       500:
 *         description: Error generando factura
 */
router.post('/invoice/generate', statsController.generateInvoiceManual);

/**
 * @swagger
 * /stats/invoice/reverse/{month}:
 *   delete:
 *     summary: Revertir/eliminar factura generada
 *     description: Elimina una factura que no ha sido pagada ni subida. Útil para corregir errores en facturas generadas manualmente.
 *     tags: [Facturación]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Mes de la factura a revertir (formato YYYY-MM)
 *         example: "2026-01"
 *     responses:
 *       200:
 *         description: Factura revertida correctamente
 *       400:
 *         description: No se puede revertir (factura pagada o subida)
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error revirtiendo factura
 */
router.delete('/invoice/reverse/:month', statsController.reverseInvoice);

/**
 * @swagger
 * /stats/invoice/upload:
 *   post:
 *     summary: Subir PDF de factura en base64
 *     description: Sube el archivo PDF de una factura previamente generada. El archivo se guarda en el servidor y se actualiza el estado de la factura.
 *     tags: [Facturación]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billingId
 *               - base64
 *             properties:
 *               billingId:
 *                 type: string
 *                 description: ID de la facturación (MongoDB ObjectId)
 *                 example: "507f1f77bcf86cd799439011"
 *               base64:
 *                 type: string
 *                 description: Contenido del PDF en base64 (con o sin prefijo data:application/pdf;base64,)
 *                 example: "JVBERi0xLjQKJeLjz9MKMyAwIG9iaiA8PC9UeXBlIC9QYWdlL1..."
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo (opcional)
 *                 example: "factura_enero_2026.pdf"
 *     responses:
 *       200:
 *         description: PDF subido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 billing:
 *                   type: object
 *       400:
 *         description: Datos inválidos o faltantes
 *       500:
 *         description: Error subiendo PDF
 */
router.post('/invoice/upload', statsController.uploadInvoicePDF);

/**
 * @swagger
 * /stats/invoice/file/{billingId}:
 *   delete:
 *     summary: Eliminar archivo PDF de factura
 *     description: Elimina el archivo PDF asociado a una factura y resetea su estado a no subida. Útil para corregir errores antes de hacer el reverse de la factura.
 *     tags: [Facturación]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: billingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la facturación (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Archivo eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 billing:
 *                   type: object
 *       400:
 *         description: No se puede eliminar (factura pagada)
 *       404:
 *         description: Factura no encontrada
 *       500:
 *         description: Error eliminando archivo
 */
router.delete('/invoice/file/:billingId', statsController.deleteInvoiceFile);

export default router;
