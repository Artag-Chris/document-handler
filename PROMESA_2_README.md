# 🔄 PROMESA 2 - Storage API para Suplencias

## 🎯 ¿Qué es esto?

Este módulo implementa la **Promesa 2** del flujo de creación de suplencias. Somos el servicio intermediario que:

1. ✅ Recibe archivos del frontend
2. ✅ Los guarda en el filesystem (en carpetas de ambos docentes)
3. ✅ Los indexa en Elasticsearch
4. ✅ Devuelve la información necesaria para que la Promesa 3 registre en BD

---

## 🏗️ Arquitectura

```
Frontend (Next.js)
    ↓
    ↓ Llama POST /api/documents/upload/suplencias
    ↓
┌─────────────────────────────────────────────────┐
│  PROMESA 2 - DOCUMENT HANDLER API (NOSOTROS)   │
│                                                  │
│  ✅ Recibe FormData con archivos                │
│  ✅ Valida suplencia_id y docentes IDs          │
│  ✅ Guarda en /uploads/2025/{docente_id}/...    │
│  ✅ Copia a carpeta de ambos docentes           │
│  ✅ Indexa en Elasticsearch                     │
│  ✅ Devuelve rutas_relativas                    │
└─────────────────────────────────────────────────┘
    ↓
    ↓ Devuelve {archivos_procesados[], rutas...}
    ↓
Frontend
    ↓
    ↓ Usa rutas_relativas para llamar Promesa 3
    ↓
API Suplencias (Promesa 3)
    ↓
    ↓ Registra referencias en BD
    ↓
✅ Completado
```

---

## 📁 Archivos Implementados

### Backend (Implementados)

```
src/
├── documents/
│   ├── documents.controller.ts    ✅ Método uploadSuplenciaDocuments()
│   ├── documents.service.ts       ✅ Método uploadSuplenciaDocuments()
│   ├── documents.routes.ts        ✅ Ruta POST /upload/suplencias
│   └── middlewares/
│       └── upload.middleware.ts   ✅ Multer configurado
├── domain/
│   └── dtos/
│       └── documents.dto.ts       ✅ ElasticsearchDocumentDto actualizado
└── config/
    └── elasticsearch.service.ts   ✅ Servicio de indexación
```

### Documentación (Para otros equipos)

```
PROMESA_2_SUPLENCIAS_STORAGE_API.md   ✅ Documentación completa
test-promesa-2-suplencias.sh          ✅ Script de testing
```

---

## 🚀 Endpoint Implementado

### POST `/api/documents/upload/suplencias`

**Request:**
```bash
POST https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias

Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body (FormData):
  - suplencia_id: string (UUID)
  - docente_ausente_id: string (UUID)
  - docente_reemplazo_id: string (UUID)
  - tipo_documento: string (opcional, default: 'suplencias')
  - files: File[] (múltiples archivos)
```

**Response:**
```json
{
  "success": true,
  "message": "3 archivos procesados exitosamente",
  "data": {
    "suplencia_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_archivos": 3,
    "archivos_procesados": [
      {
        "nombre_original": "certificado_medico.pdf",
        "nombre_guardado": "2025_suplencia_550e8400_1736160000000_certificado_medico.pdf",
        "ruta_relativa": "uploads/2025/3389ecbe.../suplencias/2025_suplencia_...",
        "size": 245678,
        "mimetype": "application/pdf",
        "docente_ausente": {
          "empleado_id": "3389ecbe-a18c-11f0-99f3-0242ac120002",
          "ruta_relativa": "uploads/2025/3389ecbe.../suplencias/..."
        },
        "docente_reemplazo": {
          "empleado_id": "3389ecbe-a18c-11f0-99f3-0242ac120003",
          "ruta_relativa": "uploads/2025/3389ecbe.../suplencias/..."
        },
        "elasticsearch_id": "doc-123-abc-456"
      }
    ],
    "elasticsearch_indexados": 3,
    "timestamp": "2025-01-06T10:00:00.000Z"
  }
}
```

---

## 🧪 Testing

### 1. Probar con cURL

```bash
# Dar permisos al script
chmod +x test-promesa-2-suplencias.sh

# Editar el script y agregar tu token
nano test-promesa-2-suplencias.sh

# Ejecutar tests
./test-promesa-2-suplencias.sh
```

### 2. Test Manual con cURL

```bash
curl -X POST http://localhost:6133/api/documents/upload/suplencias \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "suplencia_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "docente_ausente_id=3389ecbe-a18c-11f0-99f3-0242ac120002" \
  -F "docente_reemplazo_id=3389ecbe-a18c-11f0-99f3-0242ac120003" \
  -F "files=@/path/to/documento.pdf"
```

### 3. Verificar Archivos Guardados

```bash
# Ver estructura de carpetas creadas
tree uploads/

# Debería mostrar:
# uploads/
# └── 2025/
#     ├── 3389ecbe-a18c-11f0-99f3-0242ac120002/  (docente ausente)
#     │   └── suplencias/
#     │       └── 2025_suplencia_550e8400_...pdf
#     └── 3389ecbe-a18c-11f0-99f3-0242ac120003/  (docente reemplazo)
#         └── suplencias/
#             └── 2025_suplencia_550e8400_...pdf
```

### 4. Verificar Indexación en Elasticsearch

```bash
# Ver documentos indexados
curl -X GET "localhost:9200/documents-2025/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "metadata.suplencia_id": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  }'
```

---

## 📊 Flujo de Datos

### 1. Input (Lo que recibimos)

```typescript
{
  suplencia_id: "550e8400-e29b-41d4-a716-446655440000",
  docente_ausente_id: "3389ecbe-a18c-11f0-99f3-0242ac120002",
  docente_reemplazo_id: "3389ecbe-a18c-11f0-99f3-0242ac120003",
  files: [File, File, File]
}
```

### 2. Processing (Lo que hacemos)

```typescript
// Por cada archivo:
1. Generar nombre único: 2025_suplencia_{id}_{timestamp}_{nombre}.ext
2. Crear carpetas si no existen
3. Copiar archivo a carpeta del docente ausente
4. Copiar archivo a carpeta del docente reemplazo
5. Extraer texto si es PDF
6. Indexar en Elasticsearch con metadata de suplencia
```

### 3. Output (Lo que devolvemos)

```typescript
{
  suplencia_id: string,
  total_archivos: number,
  archivos_procesados: [
    {
      nombre_original: string,        // ⭐ Para mostrar al usuario
      ruta_relativa: string,          // ⭐ Para registrar en BD (Promesa 3)
      size: number,
      mimetype: string,
      elasticsearch_id?: string       // ⭐ Para búsquedas
    }
  ]
}
```

---

## 🔑 Datos Importantes para Promesa 3

El equipo de Backend Suplencias (Promesa 3) necesita estos campos de nuestra respuesta:

```typescript
// De cada archivo en archivos_procesados:
{
  suplencia_id: string,        // Para relacionar con la suplencia
  nombre: string,              // Usar nombre_original
  ruta_relativa: string        // Ruta para acceder al archivo
}
```

**Ejemplo de lo que deben registrar en su BD:**

```sql
INSERT INTO documentos_suplencia (
  suplencia_id,
  nombre,
  ruta_relativa,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'certificado_medico.pdf',
  'uploads/2025/3389ecbe-a18c-11f0-99f3-0242ac120002/suplencias/2025_suplencia_550e8400_1736160000000_certificado_medico.pdf',
  NOW()
);
```

---

## 📝 Checklist de Integración

### Para el equipo Frontend:

- [ ] Actualizar URL del endpoint a nuestra API
- [ ] Enviar FormData con suplencia_id, docentes IDs y archivos
- [ ] Incluir header Authorization con Bearer token
- [ ] Recibir archivos_procesados de nuestra respuesta
- [ ] Pasar nombre_original y ruta_relativa a Promesa 3

### Para el equipo Backend Suplencias (Promesa 3):

- [ ] Crear tabla documentos_suplencia con campos: suplencia_id, nombre, ruta_relativa
- [ ] Recibir datos de nuestra respuesta (Promesa 2)
- [ ] Registrar referencias en BD
- [ ] No intentar guardar archivos (ya están guardados por nosotros)

### Para nuestro equipo (Document Handler):

- [x] Implementar método uploadSuplenciaDocuments en controller
- [x] Implementar método uploadSuplenciaDocuments en service
- [x] Agregar ruta POST /upload/suplencias
- [x] Actualizar DTO para incluir metadata
- [x] Configurar Multer para archivos múltiples
- [x] Implementar copia a carpetas de ambos docentes
- [x] Implementar indexación en Elasticsearch
- [x] Crear documentación completa
- [x] Crear script de testing

---

## 🐛 Troubleshooting

### Error: "No se han proporcionado archivos"

**Solución:** Asegurarse de que el FormData tiene archivos con el nombre `files`
```javascript
formData.append('files', archivo); // Correcto
formData.append('file', archivo);  // ❌ Incorrecto
```

### Error: "suplencia_id es requerido"

**Solución:** Incluir suplencia_id en el FormData
```javascript
formData.append('suplencia_id', suplenciaId);
```

### Error: "docente_ausente_id y docente_reemplazo_id son requeridos"

**Solución:** Incluir ambos IDs en el FormData
```javascript
formData.append('docente_ausente_id', docenteAusenteId);
formData.append('docente_reemplazo_id', docenteReemplazoId);
```

### Archivos no se indexan en Elasticsearch

**Solución:** Verificar que Elasticsearch esté corriendo
```bash
curl http://localhost:9200/_cluster/health
```

---

## 📚 Documentación Adicional

- **Documentación completa:** `PROMESA_2_SUPLENCIAS_STORAGE_API.md`
- **Script de testing:** `test-promesa-2-suplencias.sh`
- **Documentación general:** Ver documentos `SUPLENCIAS_MODULE_DOCUMENTATION.md`

---

## 🎉 Estado del Proyecto

✅ **IMPLEMENTADO Y LISTO PARA USAR**

- Endpoint funcionando en producción
- Documentación completa
- Tests disponibles
- Integración con Elasticsearch activa

**URL Producción:** `https://demo-facilwhatsappapi.facilcreditos.co/api/documents/upload/suplencias`

---

## 👥 Contacto

Para dudas sobre la integración, contactar al equipo de Document Handler API.
