# 📋 Casos de Uso - API de Búsqueda Avanzada

## Escenarios Comunes de Implementación Frontend

### 🎯 Caso 1: Barra de Búsqueda Universal

**Objetivo:** Crear una barra de búsqueda que combine múltiples tipos de búsqueda.

```javascript
// SearchBar.jsx
import React, { useState, useEffect } from 'react';

const UniversalSearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Autocompletado en tiempo real
  useEffect(() => {
    if (query.length >= 2) {
      const getSuggestions = async () => {
        try {
          const response = await fetch(
            `/api/retrieval/suggestions?text=${encodeURIComponent(query)}&size=5`
          );
          const data = await response.json();
          setSuggestions(data.suggestions);
        } catch (error) {
          console.error('Error obteniendo sugerencias:', error);
        }
      };

      const timeoutId = setTimeout(getSuggestions, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = async (searchTerm = query) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/retrieval/advanced-search?query=${encodeURIComponent(searchTerm)}&fuzzy=true&boost=true&size=20`
      );
      const results = await response.json();
      
      // Manejar resultados (pasarlos al componente padre o contexto)
      onSearchResults(results);
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="universal-search-bar">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar documentos por contenido, palabras clave, título..."
          className="search-input"
        />
        
        <button 
          onClick={() => handleSearch()}
          disabled={isSearching}
          className="search-button"
        >
          {isSearching ? '🔄' : '🔍'}
        </button>
      </div>

      {/* Dropdown de sugerencias */}
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
                setSuggestions([]);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 🎯 Caso 2: Panel de Filtros Avanzados

**Objetivo:** Crear un panel lateral con múltiples filtros que se combinen dinámicamente.

```javascript
// AdvancedFiltersPanel.jsx
import React, { useState, useEffect } from 'react';

const AdvancedFiltersPanel = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    query: '',
    keywords: [],
    category: '',
    documentType: '',
    employeeUuid: '',
    dateFrom: '',
    dateTo: '',
    fileType: '',
    fuzzy: false,
    boost: true,
    sortBy: 'relevance',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [facets, setFacets] = useState({
    categories: [],
    documentTypes: [],
    employees: [],
    fileTypes: []
  });

  const [keywordInput, setKeywordInput] = useState('');

  // Obtener facetas disponibles al cargar
  useEffect(() => {
    const loadFacets = async () => {
      try {
        const response = await fetch('/api/retrieval/advanced-search?size=0');
        const data = await response.json();
        if (data.facets) {
          setFacets(data.facets);
        }
      } catch (error) {
        console.error('Error cargando facetas:', error);
      }
    };

    loadFacets();
  }, []);

  // Notificar cambios al componente padre
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      keywords: [],
      category: '',
      documentType: '',
      employeeUuid: '',
      dateFrom: '',
      dateTo: '',
      fileType: '',
      fuzzy: false,
      boost: true,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="advanced-filters-panel">
      <div className="filters-header">
        <h3>Filtros Avanzados</h3>
        <button onClick={clearAllFilters} className="clear-filters-btn">
          Limpiar Todo
        </button>
      </div>

      {/* Búsqueda general */}
      <div className="filter-group">
        <label>Búsqueda General:</label>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          placeholder="Texto a buscar..."
        />
      </div>

      {/* Palabras clave */}
      <div className="filter-group">
        <label>Palabras Clave:</label>
        <div className="keywords-input">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Agregar palabra clave..."
          />
          <button onClick={addKeyword}>+</button>
        </div>
        
        <div className="keywords-list">
          {filters.keywords.map(keyword => (
            <span key={keyword} className="keyword-tag">
              {keyword}
              <button onClick={() => removeKeyword(keyword)}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Categoría */}
      <div className="filter-group">
        <label>Categoría:</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {facets.categories.map(cat => (
            <option key={cat.key} value={cat.key}>
              {cat.key} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de documento */}
      <div className="filter-group">
        <label>Tipo de Documento:</label>
        <select
          value={filters.documentType}
          onChange={(e) => updateFilter('documentType', e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {facets.documentTypes.map(type => (
            <option key={type.key} value={type.key}>
              {type.key} ({type.count})
            </option>
          ))}
        </select>
      </div>

      {/* Empleado */}
      <div className="filter-group">
        <label>Empleado:</label>
        <select
          value={filters.employeeUuid}
          onChange={(e) => updateFilter('employeeUuid', e.target.value)}
        >
          <option value="">Todos los empleados</option>
          {facets.employees.map(emp => (
            <option key={emp.key} value={emp.key}>
              {emp.key} ({emp.count})
            </option>
          ))}
        </select>
      </div>

      {/* Rango de fechas */}
      <div className="filter-group">
        <label>Rango de Fechas:</label>
        <div className="date-range">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            placeholder="Desde"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Tipo de archivo */}
      <div className="filter-group">
        <label>Tipo de Archivo:</label>
        <select
          value={filters.fileType}
          onChange={(e) => updateFilter('fileType', e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {facets.fileTypes.map(type => (
            <option key={type.key} value={type.key}>
              {type.key} ({type.count})
            </option>
          ))}
        </select>
      </div>

      {/* Opciones de búsqueda */}
      <div className="filter-group">
        <label>Opciones de Búsqueda:</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.fuzzy}
              onChange={(e) => updateFilter('fuzzy', e.target.checked)}
            />
            Búsqueda tolerante a errores
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.boost}
              onChange={(e) => updateFilter('boost', e.target.checked)}
            />
            Aumentar relevancia
          </label>
        </div>
      </div>

      {/* Ordenamiento */}
      <div className="filter-group">
        <label>Ordenar por:</label>
        <div className="sort-controls">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
          >
            <option value="relevance">Relevancia</option>
            <option value="date">Fecha</option>
            <option value="size">Tamaño</option>
            <option value="filename">Nombre</option>
          </select>
          
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value)}
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>
    </div>
  );
};
```

---

### 🎯 Caso 3: Resultados con Paginación Infinita

**Objetivo:** Mostrar resultados con scroll infinito y highlighting.

```javascript
// SearchResults.jsx
import React, { useState, useEffect, useCallback } from 'react';

const SearchResults = ({ filters }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const pageSize = 10;

  const loadDocuments = useCallback(async (isNewSearch = false) => {
    if (loading) return;

    setLoading(true);
    
    try {
      const currentPage = isNewSearch ? 0 : page;
      const queryParams = new URLSearchParams({
        ...filters,
        size: pageSize.toString(),
        from: (currentPage * pageSize).toString()
      });

      // Manejar arrays (keywords)
      if (filters.keywords && Array.isArray(filters.keywords)) {
        queryParams.delete('keywords');
        filters.keywords.forEach(keyword => {
          queryParams.append('keywords', keyword);
        });
      }

      const response = await fetch(`/api/retrieval/advanced-search?${queryParams}`);
      const data = await response.json();

      if (isNewSearch) {
        setDocuments(data.documents);
        setPage(1);
      } else {
        setDocuments(prev => [...prev, ...data.documents]);
        setPage(prev => prev + 1);
      }

      setTotal(data.total);
      setHasMore(data.documents.length === pageSize);

    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading]);

  // Nueva búsqueda cuando cambian los filtros
  useEffect(() => {
    setDocuments([]);
    setPage(0);
    setHasMore(true);
    loadDocuments(true);
  }, [filters]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && hasMore && !loading
      ) {
        loadDocuments();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadDocuments, hasMore, loading]);

  const highlightText = (text, highlights) => {
    if (!highlights) return text;
    
    // Combinar todos los highlights
    const allHighlights = Object.values(highlights).flat();
    
    return (
      <div dangerouslySetInnerHTML={{ 
        __html: allHighlights[0] || text 
      }} />
    );
  };

  return (
    <div className="search-results">
      <div className="results-header">
        <h2>Resultados de Búsqueda</h2>
        <span className="results-count">
          {total > 0 ? `${documents.length} de ${total} documentos` : 'No se encontraron documentos'}
        </span>
      </div>

      <div className="documents-grid">
        {documents.map((doc, index) => (
          <div key={`${doc.id}-${index}`} className="document-card">
            <div className="document-header">
              <h3>{doc.title || doc.filename}</h3>
              <span className="document-score">
                Relevancia: {doc.score?.toFixed(2)}
              </span>
            </div>

            <div className="document-info">
              <div className="document-meta">
                <span className="category">{doc.category}</span>
                <span className="type">{doc.documentType}</span>
                <span className="size">{(doc.size / 1024).toFixed(1)} KB</span>
                <span className="date">
                  {new Date(doc.uploadDate).toLocaleDateString()}
                </span>
              </div>

              {doc.employeeName && (
                <div className="employee-info">
                  <strong>Empleado:</strong> {doc.employeeName}
                </div>
              )}

              {doc.keywords && doc.keywords.length > 0 && (
                <div className="keywords">
                  <strong>Palabras clave:</strong>
                  <div className="keywords-list">
                    {doc.keywords.slice(0, 5).map(keyword => (
                      <span key={keyword} className="keyword-tag">
                        {keyword}
                      </span>
                    ))}
                    {doc.keywords.length > 5 && (
                      <span className="more-keywords">
                        +{doc.keywords.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {doc.highlights && (
                <div className="highlights">
                  <strong>Coincidencias:</strong>
                  {Object.entries(doc.highlights).map(([field, highlights]) => (
                    <div key={field} className="highlight-field">
                      <em>{field}:</em>
                      {highlights.map((highlight, idx) => (
                        <div 
                          key={idx}
                          className="highlight-text"
                          dangerouslySetInnerHTML={{ __html: highlight }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="document-actions">
              <a 
                href={doc.downloadUrl} 
                className="action-button download"
                download
              >
                📥 Descargar
              </a>
              
              <a 
                href={doc.viewUrl} 
                className="action-button view"
                target="_blank" 
                rel="noopener noreferrer"
              >
                👁️ Ver
              </a>

              <button 
                className="action-button similar"
                onClick={() => findSimilarDocuments(doc.id)}
              >
                🔗 Similares
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Cargando más documentos...</span>
        </div>
      )}

      {!hasMore && documents.length > 0 && (
        <div className="end-of-results">
          <span>No hay más documentos que mostrar</span>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
```

---

### 🎯 Caso 4: Hook Personalizado para Manejo de Estado

**Objetivo:** Crear un hook reutilizable que maneje todo el estado de búsqueda.

```javascript
// hooks/useDocumentSearch.js
import { useState, useCallback, useRef } from 'react';

export const useDocumentSearch = () => {
  const [results, setResults] = useState({
    documents: [],
    total: 0,
    took: 0,
    facets: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  
  const abortControllerRef = useRef(null);

  // Búsqueda principal
  const search = useCallback(async (params, options = {}) => {
    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = options.endpoint || 'advanced-search';
      const response = await fetch(
        `/api/retrieval/${endpoint}?${queryParams}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (options.append) {
        setResults(prev => ({
          ...data,
          documents: [...prev.documents, ...data.documents]
        }));
      } else {
        setResults(data);
      }

      return data;

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Error en búsqueda:', err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda por palabras clave
  const searchByKeywords = useCallback(async (keywords, options = {}) => {
    return search({
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      ...options
    }, { endpoint: 'search/keywords' });
  }, [search]);

  // Búsqueda por contenido
  const searchByContent = useCallback(async (content, options = {}) => {
    return search({
      content,
      highlight: true,
      ...options
    }, { endpoint: 'search/content' });
  }, [search]);

  // Obtener sugerencias
  const getSuggestions = useCallback(async (text, field = 'keywords') => {
    try {
      const response = await fetch(
        `/api/retrieval/suggestions?text=${encodeURIComponent(text)}&field=${field}&size=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        return data.suggestions;
      }
    } catch (err) {
      console.error('Error obteniendo sugerencias:', err);
    }
    
    return [];
  }, []);

  // Encontrar documentos similares
  const findSimilar = useCallback(async (documentId, options = {}) => {
    try {
      const queryParams = new URLSearchParams({
        size: options.size || '5',
        minScore: options.minScore || '0.5'
      });

      const response = await fetch(
        `/api/retrieval/similar/${documentId}?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.similarDocuments;
      }
    } catch (err) {
      console.error('Error buscando documentos similares:', err);
    }

    return [];
  }, []);

  // Limpiar resultados
  const clearResults = useCallback(() => {
    setResults({
      documents: [],
      total: 0,
      took: 0,
      facets: null
    });
    setError(null);
    setSuggestions([]);
  }, []);

  // Cancelar búsqueda actual
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // Estado
    results,
    loading,
    error,
    suggestions,
    
    // Métodos de búsqueda
    search,
    searchByKeywords,
    searchByContent,
    getSuggestions,
    findSimilar,
    
    // Utilidades
    clearResults,
    cancelSearch
  };
};
```

---

### 🎯 Caso 5: Componente Principal de Aplicación

**Objetivo:** Integrar todos los componentes en una aplicación completa.

```javascript
// DocumentSearchApp.jsx
import React, { useState } from 'react';
import { useDocumentSearch } from './hooks/useDocumentSearch';
import UniversalSearchBar from './components/UniversalSearchBar';
import AdvancedFiltersPanel from './components/AdvancedFiltersPanel';
import SearchResults from './components/SearchResults';

const DocumentSearchApp = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  
  const {
    results,
    loading,
    error,
    search,
    searchByKeywords,
    searchByContent,
    getSuggestions,
    findSimilar,
    clearResults
  } = useDocumentSearch();

  const handleFiltersChange = async (newFilters) => {
    setCurrentFilters(newFilters);
    
    // Solo buscar si hay algún criterio de búsqueda
    const hasSearchCriteria = 
      newFilters.query || 
      newFilters.keywords?.length > 0 ||
      newFilters.content ||
      newFilters.category ||
      newFilters.documentType ||
      newFilters.employeeUuid;

    if (hasSearchCriteria) {
      await search(newFilters);
    } else {
      clearResults();
    }
  };

  const handleQuickSearch = async (query) => {
    const searchFilters = {
      ...currentFilters,
      query,
      fuzzy: true,
      boost: true
    };
    
    setCurrentFilters(searchFilters);
    await search(searchFilters);
  };

  return (
    <div className="document-search-app">
      <header className="app-header">
        <h1>🔍 Búsqueda Avanzada de Documentos</h1>
        
        <div className="header-controls">
          <UniversalSearchBar 
            onSearch={handleQuickSearch}
            getSuggestions={getSuggestions}
          />
          
          <button 
            className={`filters-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚙️ Filtros {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className={`layout ${showFilters ? 'with-filters' : 'full-width'}`}>
          
          {showFilters && (
            <aside className="filters-sidebar">
              <AdvancedFiltersPanel 
                onFiltersChange={handleFiltersChange}
                initialFilters={currentFilters}
              />
            </aside>
          )}

          <section className="results-section">
            {error && (
              <div className="error-message">
                <h3>❌ Error en la búsqueda</h3>
                <p>{error}</p>
                <button onClick={clearResults}>Limpiar</button>
              </div>
            )}

            <SearchResults 
              results={results}
              loading={loading}
              onFindSimilar={findSimilar}
              filters={currentFilters}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default DocumentSearchApp;
```

---

## 📱 Estilos CSS Recomendados

```css
/* styles/DocumentSearch.css */

.document-search-app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.universal-search-bar {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 200;
}

.suggestion-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.suggestion-item:hover {
  background-color: #f0f0f0;
}

.layout {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.layout.with-filters {
  grid-template-columns: 300px 1fr;
}

.filters-sidebar {
  width: 300px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 120px;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.filter-group input,
.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.keyword-tag {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.keyword-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.results-section {
  flex: 1;
}

.documents-grid {
  display: grid;
  gap: 1.5rem;
}

.document-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.document-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.document-header {
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.document-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.document-score {
  background: #e9ecef;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.document-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.document-meta span {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6c757d;
}

.highlights {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

.highlight-text em {
  background: #ffeb3b;
  font-style: normal;
  font-weight: bold;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.action-button.download {
  background: #28a745;
  color: white;
}

.action-button.view {
  background: #007bff;
  color: white;
}

.action-button.similar {
  background: #6c757d;
  color: white;
}

.action-button:hover {
  opacity: 0.9;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .layout {
    flex-direction: column;
    padding: 1rem;
  }
  
  .filters-sidebar {
    width: 100%;
    position: static;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
```

---

## 🚀 Guía de Implementación Rápida

### 1. **Instalación Básica**
```bash
npm install axios  # Para peticiones HTTP si no usas fetch
```

### 2. **Estructura de Archivos Recomendada**
```
src/
├── components/
│   ├── search/
│   │   ├── UniversalSearchBar.jsx
│   │   ├── AdvancedFiltersPanel.jsx
│   │   ├── SearchResults.jsx
│   │   └── DocumentCard.jsx
├── hooks/
│   └── useDocumentSearch.js
├── styles/
│   └── DocumentSearch.css
└── App.jsx
```

### 3. **Pasos de Integración**
1. Copia los hooks y componentes
2. Ajusta las URLs base según tu configuración
3. Personaliza los estilos según tu diseño
4. Añade manejo de errores específico
5. Implementa autenticación si es necesaria

¡Con esta documentación tienes todo lo necesario para implementar una búsqueda avanzada completa en tu frontend! 🎉