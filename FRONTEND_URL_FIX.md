# 🔧 CORRECCIÓN DE URLs DEL FRONTEND

## 📋 Problema Identificado

El frontend está haciendo requests a URLs duplicadas:
```
❌ INCORRECTO: /api/documents/api/documents/employee/3389ecbe-a18c-11f0-99f3-0242ac120002
```

## ✅ Solución Implementada

### 1. Reorganización de Rutas

**ANTES:**
- `/api/documents/employee/:uuid` ← 🗑️ ELIMINADO (era duplicado)
- `/api/retrieval/employee/:uuid` ← ✅ MANTENER (correcto)

**AHORA:**
- ❌ `/api/documents/*` - Solo para operaciones CRUD (upload, delete, etc.)
- ✅ `/api/retrieval/*` - Para todas las búsquedas y consultas

### 2. URLs Correctas para el Frontend

#### 🔍 Documentos por Empleado
```typescript
// ✅ CORRECTO
GET /api/retrieval/employee/{employeeUuid}
GET /api/retrieval/employee/{employeeUuid}/search

// ❌ INCORRECTO (ya no existe)
GET /api/documents/employee/{employeeUuid}
```

#### 📊 Ejemplo de Request Correcto
```javascript
// Configuración base del frontend
const API_BASE_URL = 'https://demo-facilwhatsappapi.facilcreditos.co';

// ✅ URL CORRECTA para documentos por empleado
const fetchEmployeeDocuments = async (employeeUuid, params = {}) => {
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: params.sortBy || 'uploadDate',
    sortOrder: params.sortOrder || 'desc'
  });

  const response = await axios.get(
    `${API_BASE_URL}/api/retrieval/employee/${employeeUuid}?${queryParams}`
  );
  
  return response.data;
};

// ✅ URL CORRECTA para buscar en documentos de empleado
const searchEmployeeDocuments = async (employeeUuid, searchText, params = {}) => {
  const queryParams = new URLSearchParams({
    q: searchText,
    page: params.page || 1,
    limit: params.limit || 20,
    ...params
  });

  const response = await axios.get(
    `${API_BASE_URL}/api/retrieval/employee/${employeeUuid}/search?${queryParams}`
  );
  
  return response.data;
};
```

### 3. ⚡ Verificación Rápida

Para probar que las URLs funcionan correctamente:

```bash
# ✅ Documentos por empleado (debe funcionar)
curl "https://demo-facilwhatsappapi.facilcreditos.co/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002"

# ✅ Búsqueda en documentos de empleado (debe funcionar) 
curl "https://demo-facilwhatsappapi.facilcreditos.co/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002/search?q=test"

# ❌ URL antigua (debe dar 404)
curl "https://demo-facilwhatsappapi.facilcreditos.co/api/documents/employee/3389ecbe-a18c-11f0-99f3-0242ac120002"
```

### 4. 🛠️ Cambios Necesarios en el Frontend

#### Archivo: `useEmployeeDocuments.ts`
```typescript
// ❌ CAMBIAR ESTA URL
const oldUrl = `${baseUrl}/api/documents/employee/${employeeUuid}`;

// ✅ POR ESTA URL
const newUrl = `${baseUrl}/api/retrieval/employee/${employeeUuid}`;
```

#### Archivo: `employee-document-stats.tsx`
```typescript
// ❌ CAMBIAR ESTA URL
const oldUrl = `${baseUrl}/api/documents/employee/${employeeUuid}`;

// ✅ POR ESTA URL  
const newUrl = `${baseUrl}/api/retrieval/employee/${employeeUuid}`;
```

### 5. 📋 Todas las Rutas Disponibles

#### 📁 Operaciones de Documentos (CRUD)
```
POST /api/documents/upload
POST /api/documents/upload-multiple
GET  /api/documents/
GET  /api/documents/search
GET  /api/documents/:id
PUT  /api/documents/:id
DELETE /api/documents/:id
```

#### 🔍 Búsquedas y Consultas
```
GET  /api/retrieval/search
GET  /api/retrieval/employee/:employeeUuid
GET  /api/retrieval/employee/:employeeUuid/search
GET  /api/retrieval/advanced-search
GET  /api/retrieval/search/keywords
GET  /api/retrieval/search/content
GET  /api/retrieval/suggestions
GET  /api/retrieval/similar/:id
GET  /api/retrieval/stats
GET  /api/retrieval/recent
GET  /api/retrieval/category/:category
GET  /api/retrieval/tags/:tag
```

### 6. 🎯 Resumen del Cambio

1. **Problema**: URLs duplicadas `/api/documents/api/documents/...`
2. **Causa**: Rutas de empleado duplicadas en dos controladores diferentes
3. **Solución**: Eliminar rutas de empleado de `/api/documents`, mantener solo en `/api/retrieval`
4. **Acción Frontend**: Cambiar `/api/documents/employee/` por `/api/retrieval/employee/`

### 7. ✅ Estado Actual

- ✅ Elasticsearch funcionando correctamente
- ✅ Documentos indexados para empleado `3389ecbe-a18c-11f0-99f3-0242ac120002`
- ✅ Rutas de retrieval funcionando
- ❌ Frontend usando URLs incorrectas (necesita actualización)

**Próximo paso**: Actualizar las URLs en el frontend de `/api/documents/employee/` a `/api/retrieval/employee/`