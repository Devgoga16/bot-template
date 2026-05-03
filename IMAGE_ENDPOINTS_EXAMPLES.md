# 📸 Endpoints para Envío de Imágenes por WhatsApp

El sistema ahora soporta **3 métodos diferentes** para enviar imágenes. Puedes elegir el que mejor se adapte a tu caso de uso:

## 🔑 Autenticación

Todos los endpoints requieren el header:
```
x-api-key: uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4
```

---

## 1️⃣ Método 1: Base64 (JSON)

**Endpoint:** `POST /api/whatsapp/send-image`

**Content-Type:** `application/json`

### ✅ Ventajas
- Simple de implementar
- Ideal para apps móviles que ya tienen la imagen en memoria
- No requiere archivos temporales

### ⚠️ Desventajas
- Aumenta el tamaño del payload ~33%
- Limitado por el tamaño máximo de JSON (50MB configurado)

### Ejemplo con base64 puro:
```json
{
  "to": "966384230",
  "image": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDA...",
  "caption": "Imagen enviada desde base64"
}
```

### Ejemplo con data URI:
```json
{
  "to": "966384230",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDA...",
  "caption": "Imagen con prefijo data:image"
}
```

### Código JavaScript (ejemplo):
```javascript
// Convertir archivo a base64
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const reader = new FileReader();
reader.onloadend = async () => {
  const base64String = reader.result; // Ya incluye el prefijo data:image...
  
  const response = await fetch('http://localhost:3000/api/whatsapp/send-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4'
    },
    body: JSON.stringify({
      to: '966384230',
      image: base64String,
      caption: 'Mi imagen'
    })
  });
  
  const result = await response.json();
  console.log(result);
};
reader.readAsDataURL(file);
```

---

## 2️⃣ Método 2: URL Directa (JSON)

**Endpoint:** `POST /api/whatsapp/send-image`

**Content-Type:** `application/json`

### ✅ Ventajas
- Muy eficiente (no consume memoria/ancho de banda de tu servidor)
- Payload muy pequeño
- Ideal para imágenes que ya están públicas en internet

### ⚠️ Desventajas
- La imagen debe estar públicamente accesible
- Depende de la disponibilidad del servidor externo

### Ejemplo:
```json
{
  "to": "966384230",
  "image": "https://example.com/images/photo.jpg",
  "caption": "Imagen desde URL pública"
}
```

### Código JavaScript (ejemplo):
```javascript
const response = await fetch('http://localhost:3000/api/whatsapp/send-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4'
  },
  body: JSON.stringify({
    to: '966384230',
    image: 'https://picsum.photos/800/600',
    caption: 'Imagen desde URL'
  })
});

const result = await response.json();
console.log(result);
```

---

## 3️⃣ Método 3: Upload Multipart (Archivo)

**Endpoint:** `POST /api/whatsapp/send-image-upload`

**Content-Type:** `multipart/form-data`

### ✅ Ventajas
- Estándar web para uploads de archivos
- No infla el tamaño (más eficiente que base64)
- Validación automática de tipo de archivo
- Límite de 10MB por imagen

### ⚠️ Desventajas
- Requiere FormData en el cliente
- Más complejo que JSON simple

### Formatos aceptados:
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)
- `image/webp` (.webp)

### Ejemplo con HTML Form:
```html
<form id="uploadForm" enctype="multipart/form-data">
  <input type="text" name="to" value="966384230" placeholder="Número de teléfono">
  <input type="file" name="image" accept="image/*" required>
  <input type="text" name="caption" placeholder="Texto opcional">
  <button type="submit">Enviar</button>
</form>

<script>
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('to', document.querySelector('input[name="to"]').value);
  formData.append('image', document.querySelector('input[name="image"]').files[0]);
  formData.append('caption', document.querySelector('input[name="caption"]').value);
  
  const response = await fetch('http://localhost:3000/api/whatsapp/send-image-upload', {
    method: 'POST',
    headers: {
      'x-api-key': 'uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4'
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

### Ejemplo con cURL:
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-image-upload \
  -H "x-api-key: uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4" \
  -F "to=966384230" \
  -F "image=@/path/to/image.jpg" \
  -F "caption=Mi imagen desde cURL"
```

### Ejemplo con JavaScript/Fetch:
```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('to', '966384230');
formData.append('image', file);
formData.append('caption', 'Imagen subida con multipart');

const response = await fetch('http://localhost:3000/api/whatsapp/send-image-upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'uapp_9f3c7a21b4e84d0fb52a6c19e7f2a8d4'
    // NO incluir Content-Type, el navegador lo configura automáticamente
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

---

## 📊 Comparación Rápida

| Método | Tamaño Payload | Complejidad | Mejor Para |
|--------|----------------|-------------|------------|
| **Base64** | Grande (+33%) | Baja | Apps móviles, procesamiento en memoria |
| **URL** | Muy pequeño | Muy baja | Imágenes ya públicas en internet |
| **Upload** | Normal | Media | Formularios web, uploads tradicionales |

---

## 🔍 Respuestas del API

### Respuesta exitosa (Método 1 y 2):
```json
{
  "success": true,
  "message": "Imagen enviada correctamente",
  "data": {
    "to": "51966384230",
    "sentAt": "2026-05-02T10:30:00.000Z",
    "hasCaption": true
  }
}
```

### Respuesta exitosa (Método 3 - Upload):
```json
{
  "success": true,
  "message": "Imagen enviada correctamente",
  "data": {
    "to": "51966384230",
    "sentAt": "2026-05-02T10:30:00.000Z",
    "hasCaption": true,
    "fileName": "photo.jpg",
    "fileSize": 245678,
    "mimeType": "image/jpeg"
  }
}
```

### Error - No autenticado:
```json
{
  "success": false,
  "error": "API key no proporcionada"
}
```

### Error - Cuenta bloqueada:
```json
{
  "success": false,
  "error": "Cuenta bloqueada por impago o límite excedido"
}
```

### Error - WhatsApp desconectado:
```json
{
  "success": false,
  "error": "Error enviando imagen de WhatsApp",
  "details": "WhatsApp no está conectado"
}
```

### Error - Archivo inválido (solo método 3):
```json
{
  "success": false,
  "error": "Tipo de archivo no permitido. Solo se aceptan imágenes (jpg, png, gif, webp)"
}
```

---

## 📝 Notas Importantes

1. **Formato del número:** Debe tener 9 dígitos y empezar con 9 (formato Perú). El sistema agrega automáticamente el código de país 51.

2. **Límites:**
   - Base64/URL: 50MB (configurado en Express)
   - Upload: 10MB (configurado en Multer)

3. **Caption opcional:** En los 3 métodos, el `caption` es opcional. Si no se proporciona, se registra como "[Imagen enviada]" en la base de datos.

4. **Facturación:** Todos los envíos se registran en la base de datos para el sistema de facturación automático.

5. **Reintentos:** El sistema intenta enviar hasta 3 veces automáticamente en caso de fallo.

---

## 🚀 Recomendaciones de Uso

- **Para aplicaciones web:** Usa el **Método 3 (Upload)**
- **Para aplicaciones móviles:** Usa el **Método 1 (Base64)**
- **Para compartir imágenes de internet:** Usa el **Método 2 (URL)**
- **Para imágenes grandes (>5MB):** Usa el **Método 3 (Upload)** o **Método 2 (URL)**
