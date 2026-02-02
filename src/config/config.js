import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiKey: process.env.API_KEY,
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:8080')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  },
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-bot'
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
  },
  
  billing: {
    pricePlan: parseFloat(process.env.PRICE_PLAN) || 100,
    whatsappMessageLimit: parseInt(process.env.WHATSAPP_MESSAGE_LIMIT) || 1000,
    emailLimit: parseInt(process.env.EMAIL_LIMIT) || 500,
    priceWhatsappExtraMessage: parseFloat(process.env.PRICE_WHATSAPP_EXTRA_MESSAGE) || 0.10,
    priceEmailExtra: parseFloat(process.env.PRICE_EMAIL_EXTRA) || 0.15
  },
  
  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    max: 60 // 60 requests por minuto
  }
};
