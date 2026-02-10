import express from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';
import { validate, sendWhatsappSchema } from '../middlewares/validation.middleware.js';
import { accountStatusMiddleware } from '../middlewares/accountStatus.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /whatsapp/status:
 *   get:
 *     summary: Obtener estado de WhatsApp y QR code
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estado de WhatsApp obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [disconnected, qr_ready, connected, reconnecting, error]
 *                     qr:
 *                       type: string
 *                       description: QR code en formato base64 (solo cuando status es qr_ready)
 *                     connected:
 *                       type: boolean
 *                     phone:
 *                       type: object
 *                       description: Información del teléfono logeado (solo cuando status es connected)
 *                       properties:
 *                         number:
 *                           type: string
 *                           description: Número de teléfono completo con código de país
 *                         name:
 *                           type: string
 *                           description: Nombre del perfil de WhatsApp
 */
router.get('/status', whatsappController.getStatus);

/**
 * @swagger
 * /whatsapp/send:
 *   post:
 *     summary: Enviar mensaje de WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Número de teléfono (con código de país, sin +)
 *                 example: "573001234567"
 *               message:
 *                 type: string
 *                 description: Mensaje a enviar
 *                 example: "Hola, este es un mensaje de prueba"
 *     responses:
 *       200:
 *         description: Mensaje enviado correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error enviando mensaje
 */
router.post('/send', accountStatusMiddleware, validate(sendWhatsappSchema), whatsappController.sendMessage);

export default router;
