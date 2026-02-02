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

export default router;
