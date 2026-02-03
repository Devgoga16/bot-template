import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config.js';
import { swaggerSpec } from './config/swagger.js';
import { connectDB } from './utils/database.js';
import { setupCronJobs } from './utils/cron.js';
import { whatsappService } from './services/whatsapp.service.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { rateLimiter } from './middlewares/rateLimit.middleware.js';

// Routes
import whatsappRoutes from './routes/whatsapp.routes.js';
import emailRoutes from './routes/email.routes.js';
import healthRoutes from './routes/health.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();

// Middlewares globales
app.use(cors({
  origin: true, // Permite cualquier origen y refleja el origen del request
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'x-api-key']
}));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para PDFs en base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Swagger documentation (sin autenticación)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check (sin autenticación) - disponible en ambas rutas
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Rate limiting para todas las rutas protegidas
app.use('/api', rateLimiter);

// Autenticación para todas las rutas de API (excepto health)
app.use('/api/health', (req, res, next) => next());
app.use('/api', authMiddleware);

// Routes protegidas
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/stats', statsRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp & Email Bot API',
    version: '1.0.0',
    docs: `${config.apiUrl}/api-docs`
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicialización
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Inicializar WhatsApp
    console.log('🔄 Inicializando WhatsApp...');
    await whatsappService.initialize();

    // Configurar tareas programadas
    setupCronJobs();

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en puerto ${config.port}`);
      console.log(`📚 Documentación disponible en: ${config.apiUrl}/api-docs`);
      console.log(`🏥 Health check disponible en: ${config.apiUrl}/health`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n⏹️ Cerrando servidor...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Cerrando servidor...');
  await whatsappService.disconnect();
  process.exit(0);
});

startServer();
