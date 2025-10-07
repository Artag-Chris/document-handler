# 📚 Índice de Documentación - Promesa 2 (Storage API)

## 🎯 Documentos Principales

### Para Integración (Compartir con otros equipos)

1. **`INTEGRACION_PROMESA_2.md`** ⭐ **LEER PRIMERO**
   - Resumen ejecutivo para Frontend y Backend
   - Ejemplos de código rápidos
   - Checklist de integración
   - 📄 2 páginas - Lectura: 5 minutos

2. **`PROMESA_2_SUPLENCIAS_STORAGE_API.md`** 📖 Documentación Completa
   - Especificación técnica detallada
   - Todos los ejemplos de código
   - Casos de error y troubleshooting
   - Formato de request/response
   - 📄 15+ páginas - Referencia completa

### Para Desarrollo Interno

3. **`PROMESA_2_README.md`** 🔧 Guía Interna
   - Arquitectura del módulo
   - Archivos implementados
   - Testing y debugging
   - Troubleshooting técnico

4. **`test-promesa-2-suplencias.sh`** 🧪 Script de Testing
   - Tests automatizados
   - Validación de casos de uso
   - Ejecutable con bash

---

## 📋 Guía de Lectura por Rol

### 👨‍💻 Si eres del Frontend:

1. Lee: `INTEGRACION_PROMESA_2.md` (sección "Para el Equipo de Frontend")
2. Copia el código de ejemplo
3. Actualiza las URLs
4. Si tienes dudas, consulta: `PROMESA_2_SUPLENCIAS_STORAGE_API.md`

**Lo que necesitas:**
- URL del endpoint: `https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias`
- Cómo armar el FormData
- Qué campos enviar
- Qué recibirás de respuesta

---

### 🔧 Si eres del Backend Suplencias (Promesa 3):

1. Lee: `INTEGRACION_PROMESA_2.md` (sección "Para el Equipo de Backend")
2. Entiende qué hacemos nosotros (guardar archivos, indexar)
3. Entiende qué deben hacer ustedes (registrar referencias)
4. Consulta la estructura de datos en: `PROMESA_2_SUPLENCIAS_STORAGE_API.md`

**Lo que necesitas:**
- Formato de los datos que deben registrar en BD
- Campos: suplencia_id, nombre, ruta_relativa
- NO guardar archivos (ya lo hacemos nosotros)

---

### 🏗️ Si eres del Document Handler API (Nosotros):

1. Lee: `PROMESA_2_README.md` para entender la arquitectura
2. Revisa los archivos implementados
3. Ejecuta: `./test-promesa-2-suplencias.sh` para probar
4. Consulta: `PROMESA_2_SUPLENCIAS_STORAGE_API.md` para actualizar la documentación

**Archivos clave:**
- `src/documents/documents.controller.ts` - Método `uploadSuplenciaDocuments()`
- `src/documents/documents.service.ts` - Lógica de guardado e indexación
- `src/documents/documents.routes.ts` - Ruta `/upload/suplencias`

---

## 🚀 Quick Start

### Para Probar el Endpoint (1 minuto)

```bash
# 1. Editar token en el script
nano test-promesa-2-suplencias.sh

# 2. Ejecutar tests
./test-promesa-2-suplencias.sh
```

### Para Integrar desde Frontend (5 minutos)

```javascript
// Copiar este código y ajustar
const formData = new FormData();
formData.append('suplencia_id', suplenciaId);
formData.append('docente_ausente_id', docenteAusenteId);
formData.append('docente_reemplazo_id', docenteReemplazoId);

archivos.forEach(archivo => {
  formData.append('files', archivo);
});

const response = await fetch('https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const resultado = await response.json();
// Usar resultado.data.archivos_procesados para Promesa 3
```

---

## 📊 Resumen del Flujo

```
1. Frontend crea suplencia (Promesa 1)
   ↓
2. Frontend llama a NUESTRA API con archivos (Promesa 2)
   ↓
3. Nosotros guardamos archivos en filesystem
4. Nosotros copiamos a carpetas de ambos docentes
5. Nosotros indexamos en Elasticsearch
   ↓
6. Devolvemos rutas_relativas al Frontend
   ↓
7. Frontend llama a Backend Suplencias (Promesa 3)
   ↓
8. Backend Suplencias registra referencias en BD
   ↓
✅ Completado
```

---

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| **API Producción** | `https://demo-facilwhatsappapi.facilcreditos.co` |
| **Endpoint Upload** | `/api/documents/upload/suplencias` |
| **Puerto Local** | `6133` |
| **Elasticsearch** | `http://elasticsearch:9200` (interno Docker) |

---

## 📞 Contacto y Soporte

Para dudas sobre la integración:
- **Equipo:** Document Handler API
- **Repositorio:** SIGED/DOCUMENT_HANDLER_API
- **Puerto:** 6133

---

## ✅ Estado de Implementación

| Componente | Estado |
|------------|--------|
| Endpoint `/upload/suplencias` | ✅ Implementado |
| Guardado de archivos | ✅ Implementado |
| Copia a ambos docentes | ✅ Implementado |
| Indexación Elasticsearch | ✅ Implementado |
| Documentación | ✅ Completa |
| Tests | ✅ Disponibles |
| Producción | ✅ Activo |

---

## 📅 Última Actualización

**Fecha:** 6 de Octubre de 2025  
**Versión:** 1.0.0  
**Estado:** Producción

---

**¡Todo listo para integrar! 🎉**
