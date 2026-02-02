import { config } from '../config/config.js';

export const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key requerida. Incluya el header x-api-key'
    });
  }

  if (apiKey !== config.apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key inválida'
    });
  }

  next();
};
