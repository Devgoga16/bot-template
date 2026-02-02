import express from 'express';
import { emailController } from '../controllers/email.controller.js';
import { validate, sendEmailSchema, sendMultipleEmailSchema } from '../middlewares/validation.middleware.js';
import { accountStatusMiddleware } from '../middlewares/accountStatus.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /email/send:
 *   post:
 *     summary: Enviar correo electrónico a un destinatario
 *     tags: [Email]
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
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Dirección de correo del destinatario
 *                 example: "usuario@example.com"
 *               subject:
 *                 type: string
 *                 description: Asunto del correo
 *                 example: "Bienvenido a nuestra plataforma"
 *               html:
 *                 type: string
 *                 description: Contenido HTML del correo
 *                 example: "<h1>Hola</h1><p>Este es un correo de prueba</p>"
 *     responses:
 *       200:
 *         description: Correo enviado correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error enviando correo
 */
router.post('/send', accountStatusMiddleware, validate(sendEmailSchema), emailController.sendEmail);

/**
 * @swagger
 * /email/send-multiple:
 *   post:
 *     summary: Enviar correo electrónico a múltiples destinatarios
 *     tags: [Email]
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
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array de direcciones de correo
 *                 example: ["usuario1@example.com", "usuario2@example.com"]
 *               subject:
 *                 type: string
 *                 description: Asunto del correo
 *                 example: "Newsletter mensual"
 *               html:
 *                 type: string
 *                 description: Contenido HTML del correo
 *                 example: "<h1>Newsletter</h1><p>Contenido del mes</p>"
 *     responses:
 *       200:
 *         description: Correo enviado a múltiples destinatarios correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error enviando correos
 */
router.post('/send-multiple', accountStatusMiddleware, validate(sendMultipleEmailSchema), emailController.sendMultipleEmails);

export default router;
