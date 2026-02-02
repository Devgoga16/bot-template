import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Por favor, intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
