# 📚 Documentación Frontend - API de Búsqueda por Empleado

## 🎯 Introducción

Esta documentación describe cómo integrar las nuevas rutas de búsqueda por UUID de empleado desde el frontend. Estas rutas permiten obtener y buscar documentos específicos de cada empleado sin mezclar resultados de otros usuarios.

---

## 🌐 Base URL

```javascript
const API_BASE_URL = 'https://demo-facilwhatsappapi.facilcreditos.co';
// o para desarrollo local:
// const API_BASE_URL = 'http://localhost:6133';
```

---

## 📋 Rutas Disponibles

### 1. Obtener Documentos del Empleado
**Endpoint:** `GET /api/documents/employee/:employeeUuid`

### 2. Buscar en Documentos del Empleado  
**Endpoint:** `GET /api/retrieval/employee/:employeeUuid/search`

### 3. Ruta Alternativa (Retrieval)
**Endpoint:** `GET /api/retrieval/employee/:employeeUuid`

---

## 🔧 Configuración Inicial

### Headers Requeridos
```javascript
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // Opcional: si tienes autenticación
  // 'Authorization': 'Bearer your-token',
  // 'x-finova-api-key': 'your-api-key'
};
```

### Función Base para Fetch
```javascript
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: defaultHeaders,
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};
```

---

## 📖 Funciones de API

### 1. Obtener Todos los Documentos del Empleado

```javascript
/**
 * Obtiene todos los documentos de un empleado específico
 * @param {string} employeeUuid - UUID del empleado
 * @param {Object} options - Opciones de paginación y ordenamiento
 * @returns {Promise<Object>} Respuesta con documentos y metadatos
 */
const getEmployeeDocuments = async (employeeUuid, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'uploadDate',
    sortOrder = 'desc'
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  return await apiRequest(`/api/documents/employee/${employeeUuid}?${params}`);
};

// Ejemplo de uso:
const documents = await getEmployeeDocuments('3389ecbe-a18c-11f0-99f3-0242ac120002', {
  page: 1,
  limit: 10,
  sortBy: 'title',
  sortOrder: 'asc'
});
```

### 2. Buscar en Documentos del Empleado

```javascript
/**
 * Busca documentos específicos dentro de los documentos del empleado
 * @param {string} employeeUuid - UUID del empleado
 * @param {Object} searchParams - Parámetros de búsqueda
 * @returns {Promise<Object>} Resultados de búsqueda con scores
 */
const searchEmployeeDocuments = async (employeeUuid, searchParams = {}) => {
  const {
    text,
    category,
    documentType,
    tags,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = 'relevance'
  } = searchParams;

  // Construir parámetros de query
  const params = new URLSearchParams();
  
  if (text) params.append('text', text);
  if (category) params.append('category', category);
  if (documentType) params.append('documentType', documentType);
  if (tags) {
    if (Array.isArray(tags)) {
      tags.forEach(tag => params.append('tags', tag));
    } else {
      params.append('tags', tags);
    }
  }
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);

  return await apiRequest(`/api/retrieval/employee/${employeeUuid}/search?${params}`);
};

// Ejemplos de uso:
// Búsqueda simple por texto
const textResults = await searchEmployeeDocuments('3389ecbe-a18c-11f0-99f3-0242ac120002', {
  text: 'contrato'
});

// Búsqueda por tipo de documento
const contractResults = await searchEmployeeDocuments('3389ecbe-a18c-11f0-99f3-0242ac120002', {
  documentType: 'contratos'
});

// Búsqueda avanzada con múltiples filtros
const advancedResults = await searchEmployeeDocuments('3389ecbe-a18c-11f0-99f3-0242ac120002', {
  text: 'salario',
  documentType: 'contratos',
  dateFrom: '2025-01-01',
  dateTo: '2025-12-31',
  tags: ['empleado', 'activo']
});
```

### 3. Validar UUID de Empleado

```javascript
/**
 * Valida si un UUID de empleado es correcto
 * @param {string} employeeUuid - UUID a validar
 * @returns {Promise<Object>} Información de validación
 */
const validateEmployeeUuid = async (employeeUuid) => {
  return await apiRequest(`/validate-uuid/${employeeUuid}`);
};

// Ejemplo de uso:
const validation = await validateEmployeeUuid('3389ecbe-a18c-11f0-99f3-0242ac120002');
console.log('UUID válido:', validation.validation.isValid);
```

---

## ⚛️ React Hooks

### Hook para Documentos del Empleado

```javascript
import { useState, useEffect } from 'react';

const useEmployeeDocuments = (employeeUuid) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchDocuments = async (options = {}) => {
    if (!employeeUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getEmployeeDocuments(employeeUuid, options);
      setDocuments(response.documents);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching employee documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeUuid]);

  return {
    documents,
    loading,
    error,
    pagination,
    refetch: fetchDocuments
  };
};

// Uso en componente:
const EmployeeDocuments = ({ employeeUuid }) => {
  const { documents, loading, error, pagination, refetch } = useEmployeeDocuments(employeeUuid);

  if (loading) return <div>Cargando documentos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Documentos del Empleado</h2>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <p>Tipo: {doc.documentType}</p>
          <p>Fecha: {new Date(doc.uploadDate).toLocaleDateString()}</p>
          <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
            Descargar
          </a>
        </div>
      ))}
    </div>
  );
};
```

### Hook para Búsqueda

```javascript
const useEmployeeSearch = (employeeUuid) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const searchDocuments = async (searchParams) => {
    if (!employeeUuid) return;
    
    setSearching(true);
    setSearchError(null);
    
    try {
      const response = await searchEmployeeDocuments(employeeUuid, searchParams);
      setSearchResults(response.documents);
      return response;
    } catch (err) {
      setSearchError(err.message);
      console.error('Error searching employee documents:', err);
      throw err;
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchError(null);
  };

  return {
    searchResults,
    searching,
    searchError,
    searchDocuments,
    clearSearch
  };
};
```

---

## 📱 Componentes de Ejemplo

### Buscador Simple

```javascript
import React, { useState } from 'react';

const EmployeeDocumentSearch = ({ employeeUuid }) => {
  const [searchText, setSearchText] = useState('');
  const [documentType, setDocumentType] = useState('');
  const { searchResults, searching, searchDocuments, clearSearch } = useEmployeeSearch(employeeUuid);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchText.trim() && !documentType) {
      alert('Ingrese un texto de búsqueda o seleccione un tipo de documento');
      return;
    }

    try {
      await searchDocuments({
        text: searchText.trim() || undefined,
        documentType: documentType || undefined
      });
    } catch (error) {
      alert('Error en la búsqueda: ' + error.message);
    }
  };

  return (
    <div className="employee-search">
      <form onSubmit={handleSearch}>
        <div>
          <input
            type="text"
            placeholder="Buscar en documentos..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
        <div>
          <select 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="contratos">Contratos</option>
            <option value="hojas">Hojas de Vida</option>
            <option value="reportes">Reportes</option>
            <option value="facturas">Facturas</option>
            <option value="certificados">Certificados</option>
          </select>
        </div>
        
        <button type="submit" disabled={searching}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
        
        <button type="button" onClick={clearSearch}>
          Limpiar
        </button>
      </form>

      <div className="search-results">
        {searchResults.map(doc => (
          <div key={doc.id} className="document-item">
            <h4>{doc.title}</h4>
            <p>Tipo: {doc.documentType}</p>
            <p>Relevancia: {doc.score ? (doc.score * 100).toFixed(1) + '%' : 'N/A'}</p>
            {doc.highlights && (
              <div className="highlights">
                <strong>Contenido relacionado:</strong>
                <div dangerouslySetInnerHTML={{ 
                  __html: doc.highlights.content?.[0] || ''
                }} />
              </div>
            )}
            <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
              Descargar
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Buscador Avanzado

```javascript
const AdvancedEmployeeSearch = ({ employeeUuid }) => {
  const [filters, setFilters] = useState({
    text: '',
    category: '',
    documentType: '',
    tags: '',
    dateFrom: '',
    dateTo: ''
  });

  const { searchResults, searching, searchDocuments } = useEmployeeSearch(employeeUuid);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const searchParams = {};
    
    if (filters.text.trim()) searchParams.text = filters.text.trim();
    if (filters.category) searchParams.category = filters.category;
    if (filters.documentType) searchParams.documentType = filters.documentType;
    if (filters.tags.trim()) {
      searchParams.tags = filters.tags.split(',').map(tag => tag.trim());
    }
    if (filters.dateFrom) searchParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) searchParams.dateTo = filters.dateTo;

    if (Object.keys(searchParams).length === 0) {
      alert('Configure al menos un filtro de búsqueda');
      return;
    }

    try {
      await searchDocuments(searchParams);
    } catch (error) {
      alert('Error en la búsqueda: ' + error.message);
    }
  };

  return (
    <div className="advanced-search">
      <h3>Búsqueda Avanzada</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Texto:
            <input
              type="text"
              placeholder="Buscar en títulos y contenido..."
              value={filters.text}
              onChange={(e) => handleFilterChange('text', e.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Categoría:
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todas las categorías</option>
              <option value="curriculum-vitae">Curriculum Vitae</option>
              <option value="contratos">Contratos</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Tipo de Documento:
            <select
              value={filters.documentType}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="contratos">Contratos</option>
              <option value="hojas">Hojas de Vida</option>
              <option value="reportes">Reportes</option>
              <option value="facturas">Facturas</option>
              <option value="certificados">Certificados</option>
              <option value="documentos">Documentos Generales</option>
              <option value="imagenes">Imágenes</option>
              <option value="formularios">Formularios</option>
              <option value="correspondencia">Correspondencia</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Tags (separados por comas):
            <input
              type="text"
              placeholder="empleado, activo, contrato..."
              value={filters.tags}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Fecha Desde:
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </label>
          
          <label>
            Fecha Hasta:
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={searching}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="results-count">
        {searchResults.length > 0 && (
          <p>Encontrados {searchResults.length} documentos</p>
        )}
      </div>
    </div>
  );
};
```

---

## 🎨 CSS de Ejemplo

```css
.employee-search {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-row {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.form-row label {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.form-row input,
.form-row select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.document-item {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: #f9f9f9;
}

.document-item h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.highlights {
  background: #fff3cd;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.highlights em {
  background-color: yellow;
  font-style: normal;
  font-weight: bold;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}
```

---

## 🔍 Casos de Uso Comunes

### 1. Listar Documentos de un Empleado
```javascript
// Obtener todos los documentos ordenados por fecha
const documents = await getEmployeeDocuments(employeeUuid, {
  sortBy: 'uploadDate',
  sortOrder: 'desc'
});
```

### 2. Buscar Contratos del Empleado
```javascript
// Buscar solo contratos
const contracts = await searchEmployeeDocuments(employeeUuid, {
  documentType: 'contratos'
});
```

### 3. Buscar por Palabra Clave
```javascript
// Buscar documentos que contengan "salario"
const salaryDocs = await searchEmployeeDocuments(employeeUuid, {
  text: 'salario'
});
```

### 4. Buscar por Rango de Fechas
```javascript
// Documentos del último año
const recentDocs = await searchEmployeeDocuments(employeeUuid, {
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});
```

---

## ⚠️ Manejo de Errores

```javascript
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('400')) {
    return 'Parámetros de búsqueda inválidos';
  } else if (error.message.includes('404')) {
    return 'Empleado no encontrado';
  } else if (error.message.includes('500')) {
    return 'Error interno del servidor';
  } else {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
};

// Uso en componente:
try {
  const results = await searchEmployeeDocuments(employeeUuid, searchParams);
} catch (error) {
  const userMessage = handleApiError(error);
  setErrorMessage(userMessage);
}
```

---

## 🚀 Tips de Optimización

1. **Debounce en búsquedas**: Implementa debounce para evitar requests excesivos
2. **Cache local**: Guarda resultados frecuentes en localStorage
3. **Paginación inteligente**: Carga más resultados según necesidad
4. **Loading states**: Siempre muestra estado de carga
5. **Error boundaries**: Implementa manejo de errores global

Esta documentación te proporciona todo lo necesario para integrar las nuevas rutas de búsqueda por empleado en tu frontend. ¡Listo para implementar! 🎉