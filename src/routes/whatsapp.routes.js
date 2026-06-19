import express from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';
import {
  validate,
  sendWhatsappSchema,
  sendImageWhatsappSchema,
  createGroupSchema,
  addParticipantsSchema,
  sendGroupMessageSchema
} from '../middlewares/validation.middleware.js';
import { accountStatusMiddleware } from '../middlewares/accountStatus.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

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

/**
 * @swagger
 * /whatsapp/send-image:
 *   post:
 *     summary: Enviar imagen por WhatsApp
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
 *               - image
 *             properties:
 *               to:
 *                 type: string
 *                 description: Número de teléfono (con código de país, sin +)
 *                 example: "573001234567"
 *               image:
 *                 type: string
 *                 description: Imagen en base64 (con o sin prefijo data:image) o URL de la imagen
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *               caption:
 *                 type: string
 *                 description: Texto opcional que acompaña la imagen
 *                 example: "Esta es una imagen de ejemplo"
 *     responses:
 *       200:
 *         description: Imagen enviada correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error enviando imagen
 */
router.post('/send-image', accountStatusMiddleware, validate(sendImageWhatsappSchema), whatsappController.sendImage);

/**
 * @swagger
 * /whatsapp/send-image-upload:
 *   post:
 *     summary: Enviar imagen por WhatsApp mediante upload de archivo
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - image
 *             properties:
 *               to:
 *                 type: string
 *                 description: Número de teléfono (9 dígitos, sin código de país)
 *                 example: "966384230"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (jpg, png, gif, webp - máx 10MB)
 *               caption:
 *                 type: string
 *                 description: Texto opcional que acompaña la imagen
 *                 example: "Esta es una imagen de ejemplo"
 *     responses:
 *       200:
 *         description: Imagen enviada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     to:
 *                       type: string
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                     hasCaption:
 *                       type: boolean
 *                     fileName:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *       400:
 *         description: Datos inválidos o archivo no proporcionado
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error enviando imagen
 */
router.post('/send-image-upload', accountStatusMiddleware, upload.single('image'), whatsappController.sendImageUpload);

/**
 * @swagger
 * /whatsapp/messages:
 *   get:
 *     summary: Listar mensajes enviados
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Mensajes por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, retry]
 *         description: Filtrar por estado
 *       - in: query
 *         name: billingMonth
 *         schema:
 *           type: string
 *         description: Filtrar por mes de facturación (formato YYYY-MM)
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [text, image, document, video, audio]
 *         description: Filtrar por tipo de medio
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *       500:
 *         description: Error listando mensajes
 */
router.get('/messages', whatsappController.listMessages);

/**
 * @swagger
 * /whatsapp/messages/{id}:
 *   get:
 *     summary: Obtener un mensaje específico
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje encontrado
 *       404:
 *         description: Mensaje no encontrado
 *       500:
 *         description: Error obteniendo mensaje
 */
router.get('/messages/:id', whatsappController.getMessage);

/**
 * @swagger
 * /whatsapp/messages/{id}/image:
 *   get:
 *     summary: Obtener la imagen de un mensaje
 *     description: Devuelve la imagen enviada en un mensaje. Puede visualizarse directamente en el navegador
 *     tags: [WhatsApp]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Imagen encontrada
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Mensaje no encontrado o no contiene imagen
 *       500:
 *         description: Error obteniendo imagen
 */
router.get('/messages/:id/image', whatsappController.getMessageImage);

/**
 * @swagger
 * /whatsapp/groups:
 *   post:
 *     summary: Crear un grupo de WhatsApp
 *     description: Crea un grupo nuevo. El bot (dueño) siempre queda incluido. Los participantes son opcionales.
 *     tags: [WhatsApp Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del grupo
 *                 example: "Mi grupo de prueba"
 *               participants:
 *                 type: array
 *                 description: Números de teléfono (9 dígitos, sin código de país)
 *                 items:
 *                   type: string
 *                 example: ["966384230"]
 *     responses:
 *       200:
 *         description: Grupo creado correctamente, incluye toda la información guardada (groupId, etc.)
 *       403:
 *         description: Cuenta bloqueada
 *       500:
 *         description: Error creando el grupo
 */
router.post('/groups', accountStatusMiddleware, validate(createGroupSchema), whatsappController.createGroup);

/**
 * @swagger
 * /whatsapp/groups/{groupId}/participants:
 *   post:
 *     summary: Agregar participantes a un grupo de WhatsApp
 *     tags: [WhatsApp Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo (JID), devuelto al crear el grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 description: Números de teléfono (9 dígitos, sin código de país)
 *                 items:
 *                   type: string
 *                 example: ["966384230"]
 *     responses:
 *       200:
 *         description: Participantes agregados correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       404:
 *         description: Grupo no encontrado
 *       500:
 *         description: Error agregando participantes
 */
router.post('/groups/:groupId/participants', accountStatusMiddleware, validate(addParticipantsSchema), whatsappController.addGroupParticipants);

/**
 * @swagger
 * /whatsapp/groups/{groupId}/send:
 *   post:
 *     summary: Enviar un mensaje a un grupo de WhatsApp
 *     tags: [WhatsApp Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo (JID), devuelto al crear el grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Mensaje a enviar
 *                 example: "Hola a todos"
 *     responses:
 *       200:
 *         description: Mensaje enviado correctamente
 *       403:
 *         description: Cuenta bloqueada
 *       404:
 *         description: Grupo no encontrado
 *       500:
 *         description: Error enviando el mensaje
 */
router.post('/groups/:groupId/send', accountStatusMiddleware, validate(sendGroupMessageSchema), whatsappController.sendGroupMessage);

export default router;
