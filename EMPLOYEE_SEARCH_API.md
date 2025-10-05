# 📚 API de Búsqueda por UUID de Empleado

## 🎯 Nuevas Rutas Implementadas

### 1. Obtener Documentos por Empleado UUID

#### Ruta: `/api/documents/employee/:employeeUuid`
- **Método:** GET
- **Descripción:** Obtiene todos los documentos de un empleado específico
- **Parámetros de Ruta:**
  - `employeeUuid` (string, requerido): UUID del empleado (ej: `3389ecbe-a18c-11f0-99f3-0242ac120002`)

#### Parámetros de Query (opcionales):
- `page` (number, default: 1): Página de resultados
- `limit` (number, default: 20): Número de documentos por página
- `sortBy` (string, default: 'uploadDate'): Campo para ordenar
  - Opciones: `uploadDate`, `title`, `size`, `filename`
- `sortOrder` (string, default: 'desc'): Orden de clasificación
  - Opciones: `asc`, `desc`

#### Ejemplo de Uso:
```bash
# Obtener documentos del empleado
curl "http://localhost:6133/api/documents/employee/3389ecbe-a18c-11f0-99f3-0242ac120002"

# Con paginación y ordenamiento
curl "http://localhost:6133/api/documents/employee/3389ecbe-a18c-11f0-99f3-0242ac120002?page=1&limit=10&sortBy=title&sortOrder=asc"
```

#### Respuesta de Ejemplo:
```json
{
  "employeeUuid": "3389ecbe-a18c-11f0-99f3-0242ac120002",
  "documents": [
    {
      "id": "doc-uuid-1",
      "title": "Contrato de Trabajo",
      "filename": "2025_87654321_contratos_1759518269250_CHVitae.pdf",
      "originalName": "CHVitae.pdf",
      "size": 58220000,
      "mimetype": "application/pdf",
      "uploadDate": "2025-01-15T10:30:00Z",
      "description": "Contrato laboral",
      "category": "curriculum-vitae",
      "tags": ["contrato", "empleado"],
      "keywords": ["trabajo", "salario", "beneficios"],
      "employeeUuid": "3389ecbe-a18c-11f0-99f3-0242ac120002",
      "employeeName": "Carlos Alberto Rodríguez Silva",
      "employeeCedula": "87654321",
      "documentType": "contratos",
      "year": 2025,
      "downloadUrl": "http://localhost:6133/api/retrieval/download/doc-uuid-1",
      "viewUrl": "http://localhost:6133/api/retrieval/view/doc-uuid-1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "meta": {
    "employeeInfo": {
      "employeeName": "Carlos Alberto Rodríguez Silva",
      "employeeCedula": "87654321"
    },
    "sortBy": "uploadDate",
    "sortOrder": "desc"
  }
}
```

---

### 2. Buscar Dentro de Documentos de Empleado

#### Ruta: `/api/retrieval/employee/:employeeUuid/search`
- **Método:** GET
- **Descripción:** Busca documentos específicos dentro de los documentos de un empleado
- **Parámetros de Ruta:**
  - `employeeUuid` (string, requerido): UUID del empleado

#### Parámetros de Query:
- `text` (string): Texto a buscar en títulos, contenido y palabras clave
- `category` (string): Filtrar por categoría específica
- `documentType` (string): Filtrar por tipo de documento
  - Opciones: `hojas`, `contratos`, `reportes`, `facturas`, `certificados`, `documentos`, `imagenes`, `formularios`, `correspondencia`
- `tags` (string|array): Tags específicos a buscar
- `dateFrom` (ISO date): Fecha de inicio del rango
- `dateTo` (ISO date): Fecha de fin del rango
- `page` (number, default: 1): Página de resultados
- `limit` (number, default: 20): Resultados por página
- `sortBy` (string, default: 'relevance'): Campo para ordenar

#### Ejemplo de Uso:
```bash
# Buscar "contrato" en documentos del empleado
curl "http://localhost:6133/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002/search?text=contrato"

# Búsqueda avanzada con filtros
curl "http://localhost:6133/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002/search?text=salario&documentType=contratos&dateFrom=2025-01-01&dateTo=2025-12-31"

# Buscar por categoría específica
curl "http://localhost:6133/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002/search?category=curriculum-vitae"
```

#### Respuesta de Ejemplo:
```json
{
  "employeeUuid": "3389ecbe-a18c-11f0-99f3-0242ac120002",
  "searchQuery": {
    "text": "contrato",
    "category": null,
    "documentType": "contratos",
    "tags": null,
    "dateRange": {
      "from": "2025-01-01",
      "to": "2025-12-31"
    }
  },
  "documents": [
    {
      "id": "doc-uuid-1",
      "title": "Contrato de Trabajo",
      "score": 0.95,
      "highlights": {
        "content": ["Este <em>contrato</em> establece los términos..."]
      },
      // ... resto de campos igual que arriba
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "meta": {
    "took": 15,
    "employeeInfo": {
      "employeeName": "Carlos Alberto Rodríguez Silva",
      "employeeCedula": "87654321"
    }
  }
}
```

---

### 3. Ruta Alternativa Simple

#### Ruta: `/api/retrieval/employee/:employeeUuid`
- **Método:** GET
- **Descripción:** Versión simplificada para obtener documentos de empleado
- Similar a la primera ruta pero en el módulo de retrieval

---

## 🔧 Validaciones Implementadas

### UUID de Empleado
- ✅ Formato UUID válido (todas las versiones 1-5)
- ✅ Validación usando `isValidUUID()` de `uuid.utils.ts`
- ✅ Mensajes de error descriptivos

### Parámetros de Búsqueda
- ✅ Al menos un parámetro de búsqueda requerido
- ✅ Validación de fechas en formato ISO
- ✅ Validación de tipos de documento permitidos

---

## 🚀 Ejemplos de Integración Frontend

### JavaScript/TypeScript
```javascript
// Obtener documentos de un empleado
const getEmployeeDocuments = async (employeeUuid, page = 1, limit = 20) => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/employee/${employeeUuid}?page=${page}&limit=${limit}`
  );
  return await response.json();
};

// Buscar en documentos de empleado
const searchEmployeeDocuments = async (employeeUuid, searchText, filters = {}) => {
  const params = new URLSearchParams({
    text: searchText,
    ...filters
  });
  
  const response = await fetch(
    `${API_BASE_URL}/api/retrieval/employee/${employeeUuid}/search?${params}`
  );
  return await response.json();
};
```

### React Hook Example
```javascript
const useEmployeeDocuments = (employeeUuid) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchDocuments = async (searchText = '') => {
    setLoading(true);
    try {
      const endpoint = searchText 
        ? `/api/retrieval/employee/${employeeUuid}/search?text=${searchText}`
        : `/api/documents/employee/${employeeUuid}`;
        
      const response = await fetch(endpoint);
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { documents, loading, fetchDocuments };
};
```

---

## 🔍 Endpoint de Debug

### Validar UUID
```bash
curl "http://localhost:6133/validate-uuid/3389ecbe-a18c-11f0-99f3-0242ac120002"
```

Esto te ayudará a verificar que tu UUID específico sea válido antes de usarlo en las otras rutas.

---

## 📈 Características Principales

- ✅ **Filtrado por UUID**: Solo documentos del empleado específico
- ✅ **Búsqueda Contextual**: Texto, categorías, tipos de documento
- ✅ **Paginación**: Control de resultados por página
- ✅ **Ordenamiento**: Múltiples criterios de ordenación
- ✅ **Elasticsearch Integration**: Búsqueda potente cuando disponible
- ✅ **Fallback Local**: Funciona sin Elasticsearch
- ✅ **CORS Enabled**: Listo para frontend
- ✅ **Metadata Rica**: Información completa del empleado y documento