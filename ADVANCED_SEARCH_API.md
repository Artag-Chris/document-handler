# 🔍 API de Búsqueda Avanzada de Documentos

## Descripción General

Esta API proporciona endpoints avanzados de búsqueda de documentos que aprovechan todas las capacidades de Elasticsearch para ofrecer:
- Búsqueda fuzzy (tolerante a errores)
- Filtros múltiples y complejos
- Agregaciones y facetas
- Highlighting de resultados
- Autocompletado
- Documentos similares
- Paginación y ordenamiento

**Base URL:** `http://localhost:12345/api/retrieval`

---

## 📋 Endpoints Disponibles

### 1. Búsqueda Avanzada
### 2. Búsqueda por Palabras Clave
### 3. Búsqueda por Contenido
### 4. Sugerencias de Autocompletado
### 5. Documentos Similares

---

## 🔧 1. Búsqueda Avanzada

**Endpoint:** `GET /advanced-search`

El endpoint más completo que permite combinaciones complejas de búsqueda con múltiples filtros.

### Parámetros de Query

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `query` | string | Texto general a buscar en título, contenido, keywords y filename | `rut` |
| `keywords` | string[] | Palabras clave específicas (puede ser array) | `identificacion`, `tributaria` |
| `content` | string | Búsqueda específica en el contenido del documento | `numero de identificacion` |
| `fuzzy` | boolean | Búsqueda tolerante a errores tipográficos | `true`, `false` |
| `boost` | boolean | Aumentar la relevancia de los resultados | `true`, `false` |
| `size` | number | Número de resultados por página (default: 10) | `5`, `20` |
| `from` | number | Offset para paginación (default: 0) | `0`, `10`, `20` |
| `category` | string | Filtrar por categoría | `impuesto`, `legal` |
| `documentType` | string | Filtrar por tipo de documento | `reportes`, `contratos` |
| `employeeUuid` | string | Filtrar por UUID del empleado | `94f78924-09ae-424e-96fa-475e8a7211b7` |
| `dateFrom` | string | Fecha inicial (ISO string) | `2025-01-01T00:00:00Z` |
| `dateTo` | string | Fecha final (ISO string) | `2025-12-31T23:59:59Z` |
| `fileType` | string | Filtrar por tipo MIME | `application/pdf`, `image/png` |
| `sortBy` | string | Campo para ordenar | `relevance`, `date`, `size`, `filename` |
| `sortOrder` | string | Orden de clasificación | `asc`, `desc` |

### Ejemplo de Uso

```javascript
// JavaScript/TypeScript Frontend
const searchAdvanced = async (params) => {
  const queryParams = new URLSearchParams();
  
  // Parámetros básicos
  if (params.query) queryParams.append('query', params.query);
  if (params.fuzzy) queryParams.append('fuzzy', 'true');
  if (params.boost) queryParams.append('boost', 'true');
  
  // Filtros
  if (params.category) queryParams.append('category', params.category);
  if (params.documentType) queryParams.append('documentType', params.documentType);
  
  // Paginación
  queryParams.append('size', params.size || '10');
  queryParams.append('from', params.from || '0');
  
  // Palabras clave múltiples
  if (params.keywords && Array.isArray(params.keywords)) {
    params.keywords.forEach(keyword => {
      queryParams.append('keywords', keyword);
    });
  }
  
  const response = await fetch(`/api/retrieval/advanced-search?${queryParams}`);
  return await response.json();
};

// Ejemplo de llamada
const result = await searchAdvanced({
  query: 'rut',
  fuzzy: true,
  boost: true,
  category: 'impuesto',
  size: 10,
  keywords: ['identificacion', 'tributaria']
});
```

### Respuesta de Ejemplo

```json
{
  "documents": [
    {
      "id": "75126590-1fe7-4b5f-9591-c15fe99b7a0c",
      "title": "rut",
      "filename": "2025_1088261288_reportes_1759499168867_rut.pdf",
      "originalName": "rut.pdf",
      "size": 454490,
      "mimetype": "application/pdf",
      "uploadDate": "2025-10-02T21:52:24.653Z",
      "category": "impuesto",
      "tags": ["pdf", "metadata"],
      "keywords": ["identificacion", "tributaria", "numero", "fecha"],
      "employeeUuid": "94f78924-09ae-424e-96fa-475e8a7211b7",
      "employeeName": "Christian Aguirre",
      "documentType": "reportes",
      "downloadUrl": "http://localhost:12345/api/retrieval/download/75126590-1fe7-4b5f-9591-c15fe99b7a0c",
      "viewUrl": "http://localhost:12345/api/retrieval/view/75126590-1fe7-4b5f-9591-c15fe99b7a0c",
      "score": 2.847,
      "highlights": {
        "content": [
          "Número de <em>Identificación</em> Tributaria (NIT)",
          "registro único <em>tributario</em> -RUT-"
        ]
      }
    }
  ],
  "total": 1,
  "took": 15,
  "facets": {
    "categories": [
      { "key": "impuesto", "count": 1 },
      { "key": "legal", "count": 3 }
    ],
    "documentTypes": [
      { "key": "reportes", "count": 1 },
      { "key": "contratos", "count": 2 }
    ],
    "employees": [
      { "key": "Christian Aguirre", "count": 1 }
    ],
    "fileTypes": [
      { "key": "application/pdf", "count": 1 }
    ]
  },
  "query": {
    "query": "rut",
    "fuzzy": true,
    "boost": true,
    "size": 10,
    "filters": {
      "category": "impuesto"
    }
  }
}
```

---

## 🏷️ 2. Búsqueda por Palabras Clave

**Endpoint:** `GET /search/keywords`

Búsqueda específica basada en las palabras clave extraídas de los documentos.

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `keywords` | string[] | Array de palabras clave a buscar (requerido) |
| `size` | number | Número de resultados (default: 10) |
| `from` | number | Offset para paginación |
| `exactMatch` | boolean | Coincidencia exacta vs parcial |
| `boost` | boolean | Aumentar relevancia |

### Ejemplo Frontend

```javascript
const searchByKeywords = async (keywords, options = {}) => {
  const queryParams = new URLSearchParams();
  
  // Agregar múltiples keywords
  keywords.forEach(keyword => {
    queryParams.append('keywords', keyword);
  });
  
  // Opciones adicionales
  if (options.size) queryParams.append('size', options.size);
  if (options.exactMatch) queryParams.append('exactMatch', 'true');
  if (options.boost) queryParams.append('boost', 'true');
  
  const response = await fetch(`/api/retrieval/search/keywords?${queryParams}`);
  return await response.json();
};

// Uso
const result = await searchByKeywords(
  ['identificacion', 'tributaria', 'numero'], 
  { size: 5, boost: true }
);
```

### Respuesta

```json
{
  "documents": [...],
  "total": 3,
  "matchedKeywords": ["identificacion", "tributaria"],
  "searchedKeywords": ["identificacion", "tributaria", "numero"]
}
```

---

## 📄 3. Búsqueda por Contenido

**Endpoint:** `GET /search/content`

Búsqueda específica en el texto completo extraído de los documentos.

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `content` | string | Texto a buscar en el contenido (requerido) |
| `size` | number | Número de resultados |
| `from` | number | Offset para paginación |
| `fuzzy` | boolean | Búsqueda tolerante a errores |
| `highlight` | boolean | Resaltar coincidencias en el texto |

### Ejemplo Frontend

```javascript
const searchByContent = async (searchText, options = {}) => {
  const queryParams = new URLSearchParams({
    content: searchText,
    size: options.size || '10',
    highlight: options.highlight ? 'true' : 'false',
    fuzzy: options.fuzzy ? 'true' : 'false'
  });
  
  const response = await fetch(`/api/retrieval/search/content?${queryParams}`);
  return await response.json();
};

// Uso
const result = await searchByContent(
  'numero de identificacion tributaria', 
  { highlight: true, fuzzy: true }
);
```

---

## 💡 4. Sugerencias de Autocompletado

**Endpoint:** `GET /suggestions`

Proporciona sugerencias mientras el usuario escribe.

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `text` | string | Texto parcial para generar sugerencias (requerido) |
| `field` | string | Campo donde buscar (`title`, `keywords`, `content`) |
| `size` | number | Número de sugerencias (default: 5) |

### Ejemplo Frontend

```javascript
const getSuggestions = async (partialText, field = 'keywords') => {
  const queryParams = new URLSearchParams({
    text: partialText,
    field: field,
    size: '5'
  });
  
  const response = await fetch(`/api/retrieval/suggestions?${queryParams}`);
  return await response.json();
};

// Implementación en input de búsqueda
const handleInputChange = async (event) => {
  const value = event.target.value;
  if (value.length >= 2) {
    const suggestions = await getSuggestions(value);
    // Mostrar sugerencias en dropdown
    displaySuggestions(suggestions.suggestions);
  }
};
```

### Respuesta

```json
{
  "suggestions": [
    "identificacion",
    "identificador",
    "identidad"
  ],
  "searchTerm": "identif"
}
```

---

## 🔗 5. Documentos Similares

**Endpoint:** `GET /similar/{documentId}`

Encuentra documentos similares usando algoritmos de "More Like This".

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID del documento de referencia (en URL) |
| `size` | number | Número de documentos similares |
| `minScore` | number | Puntuación mínima de similitud |

### Ejemplo Frontend

```javascript
const findSimilarDocuments = async (documentId, options = {}) => {
  const queryParams = new URLSearchParams({
    size: options.size || '5',
    minScore: options.minScore || '0.5'
  });
  
  const response = await fetch(
    `/api/retrieval/similar/${documentId}?${queryParams}`
  );
  return await response.json();
};

// Uso
const similar = await findSimilarDocuments(
  '75126590-1fe7-4b5f-9591-c15fe99b7a0c',
  { size: 3, minScore: 0.7 }
);
```

---

## 🎨 Implementación Frontend Completa

### React Hook Personalizado

```javascript
import { useState, useCallback } from 'react';

export const useAdvancedSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const search = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Construir parámetros de query
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(
        `/api/retrieval/advanced-search?${queryParams}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, results, error };
};
```

### Componente de Búsqueda

```jsx
import React, { useState } from 'react';
import { useAdvancedSearch } from './hooks/useAdvancedSearch';

const AdvancedSearchComponent = () => {
  const { search, loading, results, error } = useAdvancedSearch();
  const [searchParams, setSearchParams] = useState({
    query: '',
    fuzzy: false,
    boost: false,
    category: '',
    documentType: '',
    size: 10
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await search(searchParams);
  };

  return (
    <div className="advanced-search">
      <form onSubmit={handleSubmit}>
        <div className="search-field">
          <label>Búsqueda General:</label>
          <input
            type="text"
            value={searchParams.query}
            onChange={(e) => setSearchParams({
              ...searchParams,
              query: e.target.value
            })}
            placeholder="Escriba su búsqueda..."
          />
        </div>

        <div className="filters">
          <label>
            <input
              type="checkbox"
              checked={searchParams.fuzzy}
              onChange={(e) => setSearchParams({
                ...searchParams,
                fuzzy: e.target.checked
              })}
            />
            Búsqueda tolerante a errores
          </label>

          <label>
            <input
              type="checkbox"
              checked={searchParams.boost}
              onChange={(e) => setSearchParams({
                ...searchParams,
                boost: e.target.checked
              })}
            />
            Aumentar relevancia
          </label>

          <select
            value={searchParams.category}
            onChange={(e) => setSearchParams({
              ...searchParams,
              category: e.target.value
            })}
          >
            <option value="">Todas las categorías</option>
            <option value="impuesto">Impuestos</option>
            <option value="legal">Legal</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="error">Error: {error}</div>
      )}

      {results && (
        <div className="results">
          <h3>Resultados ({results.total})</h3>
          <div className="took">Búsqueda completada en {results.took}ms</div>
          
          {/* Facetas */}
          {results.facets && (
            <div className="facets">
              <h4>Filtros Disponibles:</h4>
              <div className="facet-group">
                <h5>Categorías:</h5>
                {results.facets.categories.map(cat => (
                  <span key={cat.key} className="facet-item">
                    {cat.key} ({cat.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="documents">
            {results.documents.map(doc => (
              <div key={doc.id} className="document-item">
                <h4>{doc.title}</h4>
                <p>{doc.filename}</p>
                <div className="score">Relevancia: {doc.score?.toFixed(2)}</div>
                
                {/* Highlights */}
                {doc.highlights && (
                  <div className="highlights">
                    {Object.entries(doc.highlights).map(([field, highlights]) => (
                      <div key={field}>
                        <strong>{field}:</strong>
                        {highlights.map((highlight, idx) => (
                          <div 
                            key={idx} 
                            dangerouslySetInnerHTML={{ __html: highlight }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className="actions">
                  <a href={doc.downloadUrl} download>Descargar</a>
                  <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer">
                    Ver
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchComponent;
```

---

## 📊 Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | Búsqueda exitosa |
| 400 | Parámetros inválidos |
| 404 | Documento no encontrado (para endpoints con ID) |
| 500 | Error interno del servidor |

---

## 🚀 Consejos de Implementación

### 1. **Paginación Eficiente**
```javascript
const loadMoreResults = async () => {
  const nextPage = await search({
    ...currentParams,
    from: results.documents.length
  });
  
  setResults(prevResults => ({
    ...nextPage,
    documents: [...prevResults.documents, ...nextPage.documents]
  }));
};
```

### 2. **Debouncing para Autocompletado**
```javascript
import { debounce } from 'lodash';

const debouncedGetSuggestions = debounce(async (text) => {
  const suggestions = await getSuggestions(text);
  setSuggestionsList(suggestions.suggestions);
}, 300);
```

### 3. **Cache de Resultados**
```javascript
const searchCache = new Map();

const searchWithCache = async (params) => {
  const cacheKey = JSON.stringify(params);
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }
  
  const results = await search(params);
  searchCache.set(cacheKey, results);
  
  return results;
};
```

### 4. **Manejo de Facetas Dinámicas**
```javascript
const handleFacetClick = (facetType, facetValue) => {
  const newParams = {
    ...searchParams,
    [facetType]: facetValue,
    from: 0 // Reset pagination
  };
  
  search(newParams);
};
```

---

## 🔧 Personalización Avanzada

### Configurar Elasticsearch para Necesidades Específicas

Si necesitas personalizar la búsqueda, puedes modificar los parámetros en el método `advancedSearch` del `ElasticsearchService`:

```javascript
// Ejemplo: Aumentar el peso de ciertos campos
searchBody.query.bool.should.push({
  multi_match: {
    query: params.query,
    fields: [
      "title^5",      // Título tiene peso 5
      "keywords^3",   // Keywords tienen peso 3
      "content^1"     // Contenido tiene peso 1
    ]
  }
});
```

---

¡Esta documentación te proporciona todo lo necesario para implementar la búsqueda avanzada en tu frontend! 🎉