# WhatsApp & Email Bot API

Sistema de bot para WhatsApp y envío de correos electrónicos con sistema de facturación automática.

## 🚀 Características

- ✅ Envío de mensajes por WhatsApp usando Baileys
- ✅ Envío de correos electrónicos con soporte HTML
- ✅ Sistema de facturación automática
- ✅ Bloqueo automático por pagos vencidos
- ✅ Rate limiting
- ✅ Validación de datos con Zod
- ✅ Reintentos automáticos en caso de fallo
- ✅ Documentación con Swagger
- ✅ Verificación periódica de conexión WhatsApp
- ✅ Health check endpoint
- ✅ Docker support

## 📋 Requisitos

- Node.js 20+
- MongoDB 7+
- Cuenta de Gmail con contraseña de aplicación

## 🛠️ Instalación

### Opción 1: Instalación local

1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd bot-template
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus valores:
```env
PORT=3000
API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-bot
API_KEY=tu_api_key_super_secreta_aqui

# Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_FROM=tu_correo@gmail.com
EMAIL_TO=admin@empresa.com

# Facturación
PRICE_PLAN=100
WHATSAPP_MESSAGE_LIMIT=1000
EMAIL_LIMIT=500
PRICE_WHATSAPP_EXTRA_MESSAGE=0.10
PRICE_EMAIL_EXTRA=0.15
```

4. Iniciar el servidor
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

### Opción 2: Docker

1. Construir y ejecutar con Docker Compose
```bash
docker-compose up -d
```

## 📱 Uso de la API

### Autenticación

Todas las rutas bajo `/api` requieren el header `x-api-key`:

```bash
x-api-key: tu_api_key_super_secreta_aqui
```

### Endpoints

#### 1. Health Check (sin autenticación)
```bash
GET /health
```

#### 2. Obtener estado de WhatsApp y QR
```bash
GET /api/whatsapp/status
```

Respuesta cuando hay QR disponible:
```json
{
  "success": true,
  "data": {
    "status": "qr_ready",
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
    "connected": false
  }
}
```

#### 3. Enviar mensaje de WhatsApp
```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "573001234567",
  "message": "Hola, este es un mensaje de prueba"
}
```

#### 4. Enviar correo (un destinatario)
```bash
POST /api/email/send
Content-Type: application/json

{
  "to": "usuario@example.com",
  "subject": "Asunto del correo",
  "html": "<h1>Hola</h1><p>Este es el contenido</p>"
}
```

#### 5. Enviar correo (múltiples destinatarios)
```bash
POST /api/email/send-multiple
Content-Type: application/json

{
  "to": ["usuario1@example.com", "usuario2@example.com"],
  "subject": "Newsletter mensual",
  "html": "<h1>Newsletter</h1><p>Contenido del mes</p>"
}
```

## 📊 Sistema de Facturación

### Funcionamiento

1. **Generación automática**: El primer día de cada mes a las 00:00, se genera automáticamente la factura del mes anterior
2. **Factura subida**: La administradora sube la factura al sistema
3. **Plazo de pago**: 3 días hábiles (excluyendo sábados y domingos)
4. **Bloqueo**: Si no se paga en el plazo, la cuenta se bloquea automáticamente
5. **Desbloqueo**: Al registrar el pago, la cuenta se desbloquea automáticamente

### Límites y costos

Configurables en `.env`:
- `PRICE_PLAN`: Precio base del plan mensual
- `WHATSAPP_MESSAGE_LIMIT`: Mensajes de WhatsApp incluidos
- `EMAIL_LIMIT`: Correos incluidos
- `PRICE_WHATSAPP_EXTRA_MESSAGE`: Precio por mensaje extra
- `PRICE_EMAIL_EXTRA`: Precio por correo extra

## 🔧 Administración

### Generar factura manualmente

Conéctate a MongoDB y ejecuta:
```javascript
// Usando MongoDB Shell o MongoDB Compass
db.getCollection('billings').insertOne({...})
```

O crea un script administrativo.

### Marcar factura como subida

```javascript
// Actualizar en MongoDB
db.getCollection('billings').updateOne(
  { month: "2026-01" },
  { 
    $set: { 
      invoiceUploaded: true,
      invoiceUploadedAt: new Date(),
      paymentDue: new Date("2026-02-05") // 3 días hábiles después
    }
  }
)
```

### Registrar pago

```javascript
// Actualizar en MongoDB
db.getCollection('billings').updateOne(
  { month: "2026-01" },
  { 
    $set: { 
      paymentReceived: true,
      paymentReceivedAt: new Date(),
      status: "paid"
    }
  }
)

// Desbloquear cuenta
db.getCollection('accountstatuses').updateOne(
  {},
  { 
    $set: { 
      isActive: true,
      blockedReason: null
    }
  }
)
```

## 📚 Documentación

La documentación interactiva de la API está disponible en:
```
http://localhost:3000/api-docs
```

## 🔍 Monitoreo

### Logs

Los logs se muestran en la consola con emojis para facilitar la lectura:
- ✅ Operaciones exitosas
- ❌ Errores
- ⚠️ Advertencias
- 🔄 Operaciones en proceso
- 📱 WhatsApp
- 📧 Email
- 💰 Facturación

### Health Check

Monitorea el estado de todos los servicios:
```bash
curl http://localhost:3000/health
```

## 🔒 Seguridad

- API Key obligatoria para todas las rutas protegidas
- Rate limiting: 60 requests por minuto por IP
- Validación estricta de inputs con Zod
- Variables sensibles en `.env`

## ⚙️ Configuración de Gmail

Para usar Gmail como servidor SMTP:

1. Habilitar verificación en dos pasos
2. Generar contraseña de aplicación: https://myaccount.google.com/apppasswords
3. Usar la contraseña generada en `EMAIL_PASSWORD`

## 🐳 Docker

El proyecto incluye:
- `Dockerfile`: Imagen de Node.js Alpine
- `docker-compose.yml`: Orquestación con MongoDB

Comandos útiles:
```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down

# Reconstruir
docker-compose up -d --build
```

## 📝 Estructura del Proyecto

```
bot-template/
├── src/
│   ├── config/           # Configuraciones
│   ├── controllers/      # Controladores
│   ├── middlewares/      # Middlewares
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de Express
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades
│   └── index.js         # Punto de entrada
├── .env.example         # Variables de entorno de ejemplo
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 🤝 Contribución

Este es un proyecto privado para uso interno.

## 📄 Licencia

ISC
