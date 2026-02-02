import express from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado de salud de la API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, error]
 *                 checks:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                     database:
 *                       type: string
 *                     whatsapp:
 *                       type: string
 *                     email:
 *                       type: string
 *                 account:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                     blocked:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *                 usage:
 *                   type: object
 *       503:
 *         description: Sistema con problemas
 */
router.get('/', healthController.check);

export default router;
