# 📤 RESUMEN EJECUTIVO - Integración con API Storage (Promesa 2)

## 🎯 Para el Equipo de Frontend

### ¿Qué necesitas hacer?

Después de crear la suplencia (Promesa 1), debes llamar a nuestra API para subir los archivos:

```javascript
// 1. Crear FormData
const formData = new FormData();
formData.append('suplencia_id', suplenciaId);              // Del resultado de Promesa 1
formData.append('docente_ausente_id', docenteAusenteId);   // Del formulario
formData.append('docente_reemplazo_id', docenteReemplazoId); // Del formulario

// 2. Agregar archivos
archivos.forEach(archivo => {
  formData.append('files', archivo);  // ⚠️ Importante: usar 'files'
});

// 3. Llamar a nuestra API
const response = await fetch('https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // NO incluir Content-Type, se agrega automáticamente
  },
  body: formData
});

const resultado = await response.json();

// 4. Usar resultado para Promesa 3
const datosParaPromesa3 = resultado.data.archivos_procesados.map(archivo => ({
  suplencia_id: resultado.data.suplencia_id,
  nombre: archivo.nombre_original,
  ruta_relativa: archivo.ruta_relativa
}));
```

### ¿Qué recibirás de nosotros?

```json
{
  "success": true,
  "message": "3 archivos procesados exitosamente",
  "data": {
    "suplencia_id": "550e8400-...",
    "total_archivos": 3,
    "archivos_procesados": [
      {
        "nombre_original": "certificado_medico.pdf",
        "ruta_relativa": "uploads/2025/.../certificado_medico.pdf",
        "size": 245678,
        "mimetype": "application/pdf",
        "elasticsearch_id": "doc-123-abc-456"
      }
    ]
  }
}
```

---

## 🎯 Para el Equipo de Backend Suplencias (Promesa 3)

### ¿Qué hacemos nosotros?

✅ Ya guardamos los archivos en el filesystem  
✅ Ya copiamos los archivos a las carpetas de ambos docentes  
✅ Ya indexamos los archivos en Elasticsearch  

### ¿Qué necesitan hacer ustedes?

Solo registrar la **referencia** del archivo en su base de datos:

```typescript
// De nuestra respuesta (Promesa 2), por cada archivo:
{
  suplencia_id: "550e8400-...",
  nombre: "certificado_medico.pdf",
  ruta_relativa: "uploads/2025/.../certificado_medico.pdf"
}

// Registrar en su BD:
INSERT INTO documentos_suplencia (
  suplencia_id,
  nombre,
  ruta_relativa,
  created_at
) VALUES (?, ?, ?, NOW())
```

**⚠️ IMPORTANTE:** 
- NO intenten guardar archivos ustedes
- NO intenten copiar archivos
- Solo guarden la referencia (ruta_relativa) en su BD

---

## 🔗 URLs de Nuestra API

| Ambiente | URL |
|----------|-----|
| **Producción** | `https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias` |
| **Desarrollo** | `http://localhost:6133/api/documents/upload/suplencias` |

---

## 📋 Campos Requeridos

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `suplencia_id` | UUID | ID de la suplencia creada en Promesa 1 | ✅ Sí |
| `docente_ausente_id` | UUID | ID del docente ausente | ✅ Sí |
| `docente_reemplazo_id` | UUID | ID del docente de reemplazo | ✅ Sí |
| `tipo_documento` | string | Tipo de documento (default: 'suplencias') | ⚪ No |
| `files` | File[] | ⚠️ **Nombre exacto:** `files` (plural) | ✅ Sí |

**⚠️ IMPORTANTE - Nombre del campo:**
- El campo de archivos DEBE llamarse `files` (plural)
- NO usar `file`, `document`, `documents`, etc.
- Ejemplo correcto: `formData.append('files', archivo)`

---

## ✅ Validaciones que Hacemos

- ✅ Validar que lleguen archivos
- ✅ Validar suplencia_id
- ✅ Validar docente_ausente_id y docente_reemplazo_id
- ✅ Validar tipos de archivo permitidos (PDF, DOC, DOCX, JPG, PNG, XLS, XLSX)
- ✅ Validar tamaño máximo (1GB por archivo)

---

## 🗂️ Estructura de Carpetas que Creamos

```
uploads/
└── 2025/                                        # Año actual
    ├── {docente_ausente_id}/                    # Carpeta del docente ausente
    │   └── suplencias/
    │       └── 2025_suplencia_{id}_{timestamp}_{nombre}.pdf
    │
    └── {docente_reemplazo_id}/                  # Carpeta del docente reemplazo
        └── suplencias/
            └── 2025_suplencia_{id}_{timestamp}_{nombre}.pdf
```

**Nota:** El archivo se copia a AMBAS carpetas para que cada docente tenga acceso.

---

## 🔍 Búsqueda en Elasticsearch

Indexamos cada documento con esta estructura:

```json
{
  "id": "doc-123-abc-456",
  "title": "certificado_medico.pdf",
  "content": "texto extraído del PDF...",
  "keywords": ["certificado", "medico", "incapacidad"],
  "tags": ["suplencia", "suplencias"],
  "category": "suplencias",
  "employeeUuid": "3389ecbe-...",
  "metadata": {
    "suplencia_id": "550e8400-...",
    "docente_ausente_id": "3389ecbe-...",
    "docente_reemplazo_id": "3389ecbe-...",
    "tipo": "suplencia"
  }
}
```

Esto permite búsquedas por:
- Contenido del documento
- Docente ausente
- Docente reemplazo
- Suplencia específica
- Palabras clave

---

## 🧪 Testing

### Test Rápido con cURL

```bash
curl -X POST https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "suplencia_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "docente_ausente_id=3389ecbe-a18c-11f0-99f3-0242ac120002" \
  -F "docente_reemplazo_id=3389ecbe-a18c-11f0-99f3-0242ac120003" \
  -F "files=@/path/to/documento.pdf"
```

---

## ❌ Errores Comunes

### 1. "No se han proporcionado archivos" / MulterError: Unexpected field

**Causa:** No se enviaron archivos o se usó nombre de campo incorrecto  
**Solución:** El campo DEBE llamarse `files` (plural):
```javascript
// ✅ CORRECTO
formData.append('files', archivo);

// ❌ INCORRECTO
formData.append('file', archivo);      // Singular
formData.append('documents', archivo); // Nombre diferente
formData.append('archivo', archivo);   // Español
```

### 2. "suplencia_id es requerido"

**Causa:** Falta el campo suplencia_id en el FormData  
**Solución:** Agregar `formData.append('suplencia_id', id)`

### 3. "docente_ausente_id y docente_reemplazo_id son requeridos"

**Causa:** Faltan los IDs de los docentes  
**Solución:** Agregar ambos campos al FormData

### 4. Error 401: Unauthorized

**Causa:** Token inválido o expirado  
**Solución:** Verificar que el token JWT sea válido

---

## 📚 Documentación Completa

Para más detalles, consultar:

- **`PROMESA_2_SUPLENCIAS_STORAGE_API.md`** - Documentación técnica completa
- **`PROMESA_2_README.md`** - Guía de implementación interna
- **`test-promesa-2-suplencias.sh`** - Script de testing

---

## 🚀 Estado

**✅ IMPLEMENTADO Y EN PRODUCCIÓN**

- Endpoint activo
- Documentación completa
- Tests disponibles
- Elasticsearch integrado

---

## 📞 Contacto

Para dudas sobre la integración:
- **API:** Document Handler API
- **Puerto:** 6133
- **Repositorio:** SIGED/DOCUMENT_HANDLER_API

---

## 🎯 Checklist de Integración

### Frontend:
- [ ] Actualizar URL del endpoint
- [ ] Enviar FormData correctamente (con 'files' plural)
- [ ] Incluir token de autorización
- [ ] Manejar respuesta y pasar datos a Promesa 3

### Backend Suplencias (Promesa 3):
- [ ] Crear endpoint para recibir referencias
- [ ] Crear tabla documentos_suplencia
- [ ] Registrar nombre y ruta_relativa en BD
- [ ] NO intentar guardar archivos (ya están guardados)

**¡Listo para integrar! 🎉**
