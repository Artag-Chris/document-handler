# 🔧 Tipos TypeScript para la API de Búsqueda

## Definiciones de Tipos

```typescript
// types/documentSearch.ts

// Documento base
export interface Document {
  id: string;
  title?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: string;
  description?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  employeeUuid: string;
  employeeName?: string;
  employeeCedula?: string;
  documentType?: string;
  downloadUrl: string;
  viewUrl: string;
  score?: number;
  highlights?: DocumentHighlights;
}

// Highlights de búsqueda
export interface DocumentHighlights {
  title?: string[];
  content?: string[];
  keywords?: string[];
  [field: string]: string[] | undefined;
}

// Facetas/Agregaciones
export interface SearchFacet {
  key: string;
  count: number;
}

export interface SearchFacets {
  categories: SearchFacet[];
  documentTypes: SearchFacet[];
  employees: SearchFacet[];
  fileTypes: SearchFacet[];
}

// Filtros de búsqueda
export interface DateRange {
  from?: Date | string;
  to?: Date | string;
}

export interface SearchFilters {
  category?: string;
  documentType?: string;
  employeeUuid?: string;
  dateRange?: DateRange;
  fileType?: string;
}

// Parámetros de búsqueda avanzada
export interface AdvancedSearchParams {
  query?: string;
  keywords?: string[];
  content?: string;
  fuzzy?: boolean;
  boost?: boolean;
  size?: number;
  from?: number;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'size' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

// Respuesta de búsqueda avanzada
export interface AdvancedSearchResponse {
  documents: Document[];
  total: number;
  took: number;
  facets?: SearchFacets;
  query: AdvancedSearchParams;
}

// Búsqueda por palabras clave
export interface KeywordSearchParams {
  keywords: string[];
  size?: number;
  from?: number;
  exactMatch?: boolean;
  boost?: boolean;
}

export interface KeywordSearchResponse {
  documents: Document[];
  total: number;
  matchedKeywords: string[];
  searchedKeywords: string[];
}

// Búsqueda por contenido
export interface ContentSearchParams {
  content: string;
  size?: number;
  from?: number;
  fuzzy?: boolean;
  highlight?: boolean;
}

export interface ContentSearchResponse {
  documents: Document[];
  total: number;
  searchTerm: string;
  highlights?: DocumentHighlights[];
}

// Sugerencias
export interface SuggestionsParams {
  text: string;
  field?: 'title' | 'keywords' | 'content';
  size?: number;
}

export interface SuggestionsResponse {
  suggestions: string[];
  searchTerm: string;
}

// Documentos similares
export interface SimilarDocumentsParams {
  size?: number;
  minScore?: number;
}

export interface SimilarDocumentsResponse {
  similarDocuments: Document[];
  count: number;
  referenceDocumentId: string;
}

// Estados del hook
export interface SearchState {
  results: AdvancedSearchResponse | null;
  loading: boolean;
  error: string | null;
  suggestions: string[];
}

// Opciones de búsqueda
export interface SearchOptions {
  endpoint?: string;
  append?: boolean;
  signal?: AbortSignal;
}

// API Endpoints
export type SearchEndpoint = 
  | 'advanced-search'
  | 'search/keywords'
  | 'search/content'
  | 'suggestions'
  | `similar/${string}`;

// Error types
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Hook return type
export interface UseDocumentSearchReturn {
  // Estado
  results: AdvancedSearchResponse | null;
  loading: boolean;
  error: string | null;
  suggestions: string[];
  
  // Métodos de búsqueda
  search: (params: AdvancedSearchParams, options?: SearchOptions) => Promise<AdvancedSearchResponse>;
  searchByKeywords: (keywords: string[], options?: Omit<KeywordSearchParams, 'keywords'>) => Promise<KeywordSearchResponse>;
  searchByContent: (content: string, options?: Omit<ContentSearchParams, 'content'>) => Promise<ContentSearchResponse>;
  getSuggestions: (text: string, field?: SuggestionsParams['field']) => Promise<string[]>;
  findSimilar: (documentId: string, options?: SimilarDocumentsParams) => Promise<Document[]>;
  
  // Utilidades
  clearResults: () => void;
  cancelSearch: () => void;
}

// Componente props
export interface UniversalSearchBarProps {
  onSearch: (query: string) => void;
  getSuggestions: (text: string, field?: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
}

export interface AdvancedFiltersPanelProps {
  onFiltersChange: (filters: AdvancedSearchParams) => void;
  initialFilters?: Partial<AdvancedSearchParams>;
  availableFacets?: SearchFacets;
  className?: string;
}

export interface SearchResultsProps {
  results: AdvancedSearchResponse | null;
  loading: boolean;
  onFindSimilar: (documentId: string) => Promise<Document[]>;
  filters: AdvancedSearchParams;
  onLoadMore?: () => void;
  className?: string;
}

export interface DocumentCardProps {
  document: Document;
  onFindSimilar: (documentId: string) => void;
  showHighlights?: boolean;
  className?: string;
}

// Utils types
export interface UrlBuilder {
  baseUrl: string;
  buildSearchUrl: (endpoint: SearchEndpoint, params: Record<string, any>) => string;
  buildDownloadUrl: (documentId: string) => string;
  buildViewUrl: (documentId: string) => string;
}

// Storage types para caché
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface SearchCache {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  clear: () => void;
  generateKey: (params: Record<string, any>) => string;
}

// Configuración
export interface SearchConfig {
  baseUrl: string;
  defaultPageSize: number;
  maxCacheSize: number;
  defaultCacheTTL: number;
  debounceDelay: number;
  endpoints: {
    advancedSearch: string;
    keywordSearch: string;
    contentSearch: string;
    suggestions: string;
    similar: string;
  };
}
```

## Hook TypeScript Completo

```typescript
// hooks/useDocumentSearch.ts
import { useState, useCallback, useRef } from 'react';
import {
  AdvancedSearchParams,
  AdvancedSearchResponse,
  KeywordSearchResponse,
  ContentSearchResponse,
  SearchOptions,
  UseDocumentSearchReturn,
  Document,
  APIError
} from '../types/documentSearch';

export const useDocumentSearch = (config?: {
  baseUrl?: string;
  defaultPageSize?: number;
}): UseDocumentSearchReturn => {
  const baseUrl = config?.baseUrl || '/api/retrieval';
  const defaultPageSize = config?.defaultPageSize || 10;

  const [results, setResults] = useState<AdvancedSearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const buildQueryString = useCallback((params: Record<string, any>): string => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => queryParams.append(key, String(item)));
      } else if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    return queryParams.toString();
  }, []);

  const makeRequest = async <T>(
    endpoint: string, 
    params: Record<string, any> = {},
    options: SearchOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}/${endpoint}?${buildQueryString(params)}`;
    
    const response = await fetch(url, {
      signal: options.signal || abortControllerRef.current?.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: APIError = {
        message: errorData.error || `Error ${response.status}: ${response.statusText}`,
        status: response.status,
        code: errorData.code
      };
      throw error;
    }

    return response.json();
  };

  const search = useCallback(async (
    params: AdvancedSearchParams, 
    options: SearchOptions = {}
  ): Promise<AdvancedSearchResponse> => {
    if (abortControllerRef.current && !options.signal) {
      abortControllerRef.current.abort();
    }

    if (!options.signal) {
      abortControllerRef.current = new AbortController();
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        size: defaultPageSize,
        ...params
      };

      const data = await makeRequest<AdvancedSearchResponse>(
        options.endpoint || 'advanced-search',
        searchParams,
        options
      );
      
      if (options.append && results) {
        const newResults: AdvancedSearchResponse = {
          ...data,
          documents: [...results.documents, ...data.documents]
        };
        setResults(newResults);
        return newResults;
      } else {
        setResults(data);
        return data;
      }

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = (err as APIError).message || 'Error desconocido';
        setError(errorMessage);
        console.error('Error en búsqueda:', err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, defaultPageSize, buildQueryString, results]);

  const searchByKeywords = useCallback(async (
    keywords: string[], 
    options: Omit<KeywordSearchParams, 'keywords'> = {}
  ): Promise<KeywordSearchResponse> => {
    const params = { keywords, ...options };
    return makeRequest<KeywordSearchResponse>('search/keywords', params);
  }, [makeRequest]);

  const searchByContent = useCallback(async (
    content: string, 
    options: Omit<ContentSearchParams, 'content'> = {}
  ): Promise<ContentSearchResponse> => {
    const params = { content, highlight: true, ...options };
    return makeRequest<ContentSearchResponse>('search/content', params);
  }, [makeRequest]);

  const getSuggestions = useCallback(async (
    text: string, 
    field: 'title' | 'keywords' | 'content' = 'keywords'
  ): Promise<string[]> => {
    try {
      const data = await makeRequest<{ suggestions: string[] }>('suggestions', {
        text,
        field,
        size: 5
      });
      
      setSuggestions(data.suggestions);
      return data.suggestions;
    } catch (err) {
      console.error('Error obteniendo sugerencias:', err);
      return [];
    }
  }, [makeRequest]);

  const findSimilar = useCallback(async (
    documentId: string, 
    options: SimilarDocumentsParams = {}
  ): Promise<Document[]> => {
    try {
      const data = await makeRequest<{ similarDocuments: Document[] }>(
        `similar/${documentId}`, 
        {
          size: options.size || 5,
          minScore: options.minScore || 0.5
        }
      );
      
      return data.similarDocuments;
    } catch (err) {
      console.error('Error buscando documentos similares:', err);
      return [];
    }
  }, [makeRequest]);

  const clearResults = useCallback((): void => {
    setResults(null);
    setError(null);
    setSuggestions([]);
  }, []);

  const cancelSearch = useCallback((): void => {
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

## Utilidades TypeScript

```typescript
// utils/searchUtils.ts
import { AdvancedSearchParams, SearchCache, CacheEntry } from '../types/documentSearch';

// Cache simple en memoria
export class InMemorySearchCache implements SearchCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutos
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Validadores
export const validateSearchParams = (params: AdvancedSearchParams): string[] => {
  const errors: string[] = [];

  if (params.size && (params.size < 1 || params.size > 100)) {
    errors.push('El tamaño debe estar entre 1 y 100');
  }

  if (params.from && params.from < 0) {
    errors.push('El offset no puede ser negativo');
  }

  if (params.query && params.query.length > 500) {
    errors.push('La consulta no puede exceder 500 caracteres');
  }

  if (params.keywords && params.keywords.length > 20) {
    errors.push('No se pueden incluir más de 20 palabras clave');
  }

  return errors;
};

// Formatters
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// URL Builder
export class SearchUrlBuilder {
  constructor(private baseUrl: string) {}

  buildSearchUrl(endpoint: string, params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => queryParams.append(key, String(item)));
      } else if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    return `${this.baseUrl}/${endpoint}?${queryParams.toString()}`;
  }

  buildDownloadUrl(documentId: string): string {
    return `${this.baseUrl}/download/${documentId}`;
  }

  buildViewUrl(documentId: string): string {
    return `${this.baseUrl}/view/${documentId}`;
  }
}
```

## Configuración Global

```typescript
// config/searchConfig.ts
import { SearchConfig } from '../types/documentSearch';

export const searchConfig: SearchConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:12345/api/retrieval',
  defaultPageSize: 10,
  maxCacheSize: 100,
  defaultCacheTTL: 5 * 60 * 1000, // 5 minutos
  debounceDelay: 300,
  endpoints: {
    advancedSearch: 'advanced-search',
    keywordSearch: 'search/keywords',
    contentSearch: 'search/content',
    suggestions: 'suggestions',
    similar: 'similar'
  }
};

// Context Provider
import React, { createContext, useContext, ReactNode } from 'react';

interface SearchContextType {
  config: SearchConfig;
  cache: SearchCache;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cache = new InMemorySearchCache(
    searchConfig.maxCacheSize,
    searchConfig.defaultCacheTTL
  );

  return (
    <SearchContext.Provider value={{ config: searchConfig, cache }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};
```

¡Con estos tipos TypeScript tendrás intellisense completo y seguridad de tipos en toda tu implementación! 🚀