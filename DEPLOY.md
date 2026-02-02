# Guía de Despliegue al Servidor de Producción

## Paso 1: Conectarse al servidor

Conéctate a tu servidor donde está desplegado `iglesia360-bot-api.unify-tec.com`:

```bash
ssh usuario@tu-servidor.com
```

## Paso 2: Navegar al directorio del proyecto

```bash
cd /ruta/al/proyecto/bot-template
```

## Paso 3: Hacer backup del archivo .env actual

```bash
cp .env .env.backup
```

## Paso 4: Actualizar el código

```bash
# Opción A: Si usas Git
git pull origin main

# Opción B: Si no usas Git, sube los archivos manualmente vía SFTP/SCP
# Archivos que cambiaron:
# - src/index.js
# - src/config/config.js
# - package.json
```

## Paso 5: Agregar CORS_ORIGINS al .env del servidor

Edita el archivo `.env` en el servidor y agrega:

```bash
nano .env
```

Agregar esta línea después de API_KEY:
```env
CORS_ORIGINS=http://localhost:8080,https://tu-dominio-frontend.com
```

**Importante:** Cambia `http://localhost:8080` por la URL real de tu frontend si no es localhost.

## Paso 6: Instalar dependencias

```bash
npm install
```

## Paso 7: Reiniciar el servidor

### Si usas Docker:
```bash
docker-compose down
docker-compose up -d --build
```

### Si usas PM2:
```bash
pm2 restart all
# o
pm2 restart nombre-de-tu-app
```

### Si usas systemd:
```bash
sudo systemctl restart tu-servicio-bot
```

### Si solo corriste con npm:
```bash
# Matar el proceso actual
pkill -f "node.*index.js"
# Reiniciar
npm start
```

## Paso 8: Verificar que funciona

```bash
# Ver los logs
docker-compose logs -f app  # Si usas Docker
# o
pm2 logs  # Si usas PM2
# o
tail -f /ruta/a/logs/app.log
```

## Verificación desde el navegador

Abre la consola del navegador y prueba:

```javascript
fetch('https://iglesia360-bot-api.unify-tec.com/api/whatsapp/status', {
  headers: {
    'x-api-key': 'uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4'
  }
})
.then(r => r.json())
.then(console.log)
```

Deberías ver la respuesta JSON sin errores de CORS.

---

## Alternativa: Script de despliegue rápido

Puedes crear este script en tu servidor local y ejecutarlo:

```bash
#!/bin/bash
# deploy.sh

echo "Conectando al servidor..."
ssh usuario@tu-servidor.com << 'ENDSSH'
  cd /ruta/al/proyecto/bot-template
  echo "Haciendo backup..."
  cp .env .env.backup
  
  echo "Actualizando código..."
  git pull origin main
  
  echo "Instalando dependencias..."
  npm install
  
  echo "Reiniciando servicio..."
  docker-compose down
  docker-compose up -d --build
  
  echo "¡Despliegue completo!"
  docker-compose logs --tail=50 app
ENDSSH
```

Ejecuta con:
```bash
chmod +x deploy.sh
./deploy.sh
```
