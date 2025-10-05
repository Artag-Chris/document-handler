# Guía de Solución de Problemas CORS

## Problema Identificado
Error: `Access to fetch at 'https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload' from origin 'https://demo.facilcreditos.co' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

## Soluciones Implementadas

### 1. Configuración CORS Mejorada en `server.ts`
- ✅ Configuración dual: middleware `cors` + headers manuales
- ✅ Manejo de preflight requests (OPTIONS)
- ✅ Headers adicionales permitidos para la API
- ✅ Logs de debugging para tracking de requests

### 2. Middleware CORS Específico para Documentos
- ✅ Creado `corsMiddleware` en `/src/documents/middlewares/cors.middleware.ts`
- ✅ Aplicado a todas las rutas de documentos
- ✅ Respuesta específica para OPTIONS requests

### 3. Headers CORS en Controllers
- ✅ Headers CORS explícitos en `uploadDocument`
- ✅ Headers CORS en responses de error

### 4. Endpoints de Diagnóstico
- ✅ Health check endpoint con CORS habilitado
- ✅ Handler de OPTIONS para todas las rutas `/api/*`

## Verificaciones Adicionales Necesarias

### 1. Configuración del Servidor Web/Proxy
Si hay un Nginx, Apache o proxy delante del servidor Node.js:

```nginx
# Configuración Nginx recomendada
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Headers CORS explícitos
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, Content-Disposition, x-finova-api-key, x-finovaClient-id" always;
    
    # Manejar preflight
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, Content-Disposition, x-finova-api-key, x-finovaClient-id";
        add_header Access-Control-Max-Age 86400;
        return 204;
    }
}
```

### 2. Headers del Frontend
Asegurar que el frontend envíe headers correctos:

```javascript
// Ejemplo de fetch correcto
const response = await fetch('https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload', {
  method: 'POST',
  headers: {
    // No incluir Content-Type para FormData, el browser lo agrega automáticamente
  },
  body: formData
});
```

### 3. Variables de Entorno
Verificar que las variables de entorno estén correctas:

```bash
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

## Tests de Verificación

### 1. Health Check
```bash
curl -v -H "Origin: https://demo.facilcreditos.co" https://demo-facilwhatsappapi.facilcreditos.co/health
```

### 2. Preflight Test
```bash
curl -v -X OPTIONS \
  -H "Origin: https://demo.facilcreditos.co" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload
```

### 3. Endpoint Documents
```bash
curl -v -H "Origin: https://demo.facilcreditos.co" \
  https://demo-facilwhatsappapi.facilcreditos.co/api/documents/
```

## Logs para Debugging

Los siguientes logs deberían aparecer en el servidor cuando el frontend hace requests:

```
🌐 Request from origin: https://demo.facilcreditos.co to OPTIONS /api/documents/upload
✅ Handling OPTIONS preflight request for /api/documents/upload
🌐 CORS Middleware - Origin: https://demo.facilcreditos.co, Method: POST, Path: /upload
```

## Troubleshooting Checklist

- [ ] ¿El servidor Node.js está corriendo en el puerto correcto?
- [ ] ¿Hay un proxy/load balancer delante del servidor?
- [ ] ¿Las variables de entorno están configuradas?
- [ ] ¿El dominio frontend está exactamente como se espera?
- [ ] ¿El endpoint `/health` responde correctamente?
- [ ] ¿Los logs de CORS aparecen en la consola del servidor?

## Contacto
Si el problema persiste después de estas verificaciones, revisar:
1. Configuración del servidor web/proxy
2. DNS y routing de red
3. Certificates SSL/TLS