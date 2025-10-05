# 🎨 Ejemplos por Framework - API de Empleados

## ⚛️ React / Next.js

### Componente Principal con Hooks

```jsx
// hooks/useEmployeeDocuments.js
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6133';

export const useEmployeeDocuments = (employeeUuid) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async (options = {}) => {
    if (!employeeUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams(options);
      const response = await fetch(
        `${API_BASE_URL}/api/documents/employee/${employeeUuid}?${params}`
      );
      
      if (!response.ok) throw new Error(`Error ${response.status}`);
      
      const data = await response.json();
      setDocuments(data.documents);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeUuid]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments };
};

// components/EmployeeDocuments.jsx
import { useEmployeeDocuments } from '../hooks/useEmployeeDocuments';

const EmployeeDocuments = ({ employeeUuid }) => {
  const { documents, loading, error } = useEmployeeDocuments(employeeUuid);

  if (loading) return <div className="loading">Cargando documentos...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="employee-documents">
      <h2>Documentos del Empleado</h2>
      {documents.length === 0 ? (
        <p>No se encontraron documentos</p>
      ) : (
        <div className="documents-grid">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ document }) => (
  <div className="document-card">
    <h3>{document.title}</h3>
    <div className="document-meta">
      <span>Tipo: {document.documentType}</span>
      <span>Tamaño: {(document.size / 1024 / 1024).toFixed(2)} MB</span>
      <span>Fecha: {new Date(document.uploadDate).toLocaleDateString()}</span>
    </div>
    <div className="document-actions">
      <a href={document.downloadUrl} target="_blank" rel="noopener noreferrer">
        Descargar
      </a>
      <a href={document.viewUrl} target="_blank" rel="noopener noreferrer">
        Ver
      </a>
    </div>
  </div>
);
```

### Componente de Búsqueda Avanzada

```jsx
// components/DocumentSearch.jsx
import { useState } from 'react';
import { useEmployeeDocuments } from '../hooks/useEmployeeDocuments';

const DocumentSearch = ({ employeeUuid }) => {
  const [searchParams, setSearchParams] = useState({
    text: '',
    documentType: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);

    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/retrieval/employee/${employeeUuid}/search?${params}`
      );
      
      const data = await response.json();
      setSearchResults(data.documents);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="document-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar texto..."
          value={searchParams.text}
          onChange={(e) => setSearchParams(prev => ({ ...prev, text: e.target.value }))}
        />
        
        <select
          value={searchParams.documentType}
          onChange={(e) => setSearchParams(prev => ({ ...prev, documentType: e.target.value }))}
        >
          <option value="">Tipo de documento</option>
          <option value="contratos">Contratos</option>
          <option value="hojas">Hojas de Vida</option>
          <option value="reportes">Reportes</option>
        </select>

        <button type="submit" disabled={searching}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="search-results">
        {searchResults.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🟢 Vue.js / Nuxt.js

### Composable para Vue 3

```javascript
// composables/useEmployeeDocuments.js
import { ref, computed, onMounted } from 'vue'

export const useEmployeeDocuments = (employeeUuid) => {
  const documents = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchDocuments = async (options = {}) => {
    if (!employeeUuid.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams(options)
      const { data } = await $fetch(
        `/api/documents/employee/${employeeUuid.value}?${params}`
      )
      documents.value = data.documents
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching documents:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchDocuments()
  })

  return {
    documents: readonly(documents),
    loading: readonly(loading),
    error: readonly(error),
    fetchDocuments
  }
}
```

### Componente Vue

```vue
<!-- components/EmployeeDocuments.vue -->
<template>
  <div class="employee-documents">
    <h2>Documentos del Empleado</h2>
    
    <div v-if="loading" class="loading">
      Cargando documentos...
    </div>
    
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <div v-else class="documents-grid">
      <DocumentCard
        v-for="document in documents"
        :key="document.id"
        :document="document"
      />
    </div>
  </div>
</template>

<script setup>
import { useEmployeeDocuments } from '~/composables/useEmployeeDocuments'

const props = defineProps({
  employeeUuid: {
    type: String,
    required: true
  }
})

const employeeUuid = computed(() => props.employeeUuid)
const { documents, loading, error } = useEmployeeDocuments(employeeUuid)
</script>
```

### Componente de Búsqueda Vue

```vue
<!-- components/DocumentSearch.vue -->
<template>
  <div class="document-search">
    <form @submit.prevent="handleSearch">
      <input
        v-model="searchParams.text"
        type="text"
        placeholder="Buscar texto..."
      />
      
      <select v-model="searchParams.documentType">
        <option value="">Tipo de documento</option>
        <option value="contratos">Contratos</option>
        <option value="hojas">Hojas de Vida</option>
        <option value="reportes">Reportes</option>
      </select>

      <button type="submit" :disabled="searching">
        {{ searching ? 'Buscando...' : 'Buscar' }}
      </button>
    </form>

    <div class="search-results">
      <DocumentCard
        v-for="document in searchResults"
        :key="document.id"
        :document="document"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  employeeUuid: {
    type: String,
    required: true
  }
})

const searchParams = reactive({
  text: '',
  documentType: '',
  category: '',
  dateFrom: '',
  dateTo: ''
})

const searchResults = ref([])
const searching = ref(false)

const handleSearch = async () => {
  searching.value = true

  try {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    const { data } = await $fetch(
      `/api/retrieval/employee/${props.employeeUuid}/search?${params}`
    )
    
    searchResults.value = data.documents
  } catch (error) {
    console.error('Error searching:', error)
  } finally {
    searching.value = false
  }
}
</script>
```

---

## 🅰️ Angular

### Service Angular

```typescript
// services/employee-documents.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Document {
  id: string;
  title: string;
  filename: string;
  documentType: string;
  uploadDate: string;
  downloadUrl: string;
  viewUrl: string;
}

export interface DocumentResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeDocumentsService {
  private apiUrl = 'http://localhost:6133';
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public documents$ = this.documentsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getEmployeeDocuments(
    employeeUuid: string, 
    options: any = {}
  ): Observable<DocumentResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams();
    Object.keys(options).forEach(key => {
      if (options[key]) {
        params = params.append(key, options[key]);
      }
    });

    return this.http.get<DocumentResponse>(
      `${this.apiUrl}/api/documents/employee/${employeeUuid}`,
      { params }
    ).pipe(
      tap(response => {
        this.documentsSubject.next(response.documents);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  searchEmployeeDocuments(
    employeeUuid: string,
    searchParams: any
  ): Observable<any> {
    let params = new HttpParams();
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key]) {
        params = params.append(key, searchParams[key]);
      }
    });

    return this.http.get(
      `${this.apiUrl}/api/retrieval/employee/${employeeUuid}/search`,
      { params }
    );
  }
}
```

### Componente Angular

```typescript
// components/employee-documents.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { EmployeeDocumentsService, Document } from '../services/employee-documents.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-employee-documents',
  template: `
    <div class="employee-documents">
      <h2>Documentos del Empleado</h2>
      
      <div *ngIf="loading$ | async" class="loading">
        Cargando documentos...
      </div>
      
      <div *ngIf="!(loading$ | async)" class="documents-grid">
        <div 
          *ngFor="let document of documents$ | async" 
          class="document-card"
        >
          <h3>{{ document.title }}</h3>
          <p>Tipo: {{ document.documentType }}</p>
          <p>Fecha: {{ document.uploadDate | date }}</p>
          <div class="document-actions">
            <a [href]="document.downloadUrl" target="_blank">Descargar</a>
            <a [href]="document.viewUrl" target="_blank">Ver</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./employee-documents.component.css']
})
export class EmployeeDocumentsComponent implements OnInit {
  @Input() employeeUuid!: string;
  
  documents$: Observable<Document[]>;
  loading$: Observable<boolean>;

  constructor(private employeeDocumentsService: EmployeeDocumentsService) {
    this.documents$ = this.employeeDocumentsService.documents$;
    this.loading$ = this.employeeDocumentsService.loading$;
  }

  ngOnInit() {
    if (this.employeeUuid) {
      this.employeeDocumentsService.getEmployeeDocuments(this.employeeUuid)
        .subscribe();
    }
  }
}
```

### Componente de Búsqueda Angular

```typescript
// components/document-search.component.ts
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EmployeeDocumentsService } from '../services/employee-documents.service';

@Component({
  selector: 'app-document-search',
  template: `
    <div class="document-search">
      <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
        <input 
          formControlName="text" 
          type="text" 
          placeholder="Buscar texto..."
        />
        
        <select formControlName="documentType">
          <option value="">Tipo de documento</option>
          <option value="contratos">Contratos</option>
          <option value="hojas">Hojas de Vida</option>
          <option value="reportes">Reportes</option>
        </select>

        <button type="submit" [disabled]="searching">
          {{ searching ? 'Buscando...' : 'Buscar' }}
        </button>
      </form>

      <div class="search-results">
        <div 
          *ngFor="let document of searchResults" 
          class="document-card"
        >
          <h3>{{ document.title }}</h3>
          <p>Score: {{ (document.score * 100) | number:'1.1-1' }}%</p>
          <div class="document-actions">
            <a [href]="document.downloadUrl" target="_blank">Descargar</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentSearchComponent {
  @Input() employeeUuid!: string;
  
  searchForm: FormGroup;
  searchResults: any[] = [];
  searching = false;

  constructor(
    private fb: FormBuilder,
    private employeeDocumentsService: EmployeeDocumentsService
  ) {
    this.searchForm = this.fb.group({
      text: [''],
      documentType: [''],
      category: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  onSearch() {
    if (!this.employeeUuid) return;

    this.searching = true;
    const searchParams = this.searchForm.value;

    this.employeeDocumentsService
      .searchEmployeeDocuments(this.employeeUuid, searchParams)
      .subscribe({
        next: (response) => {
          this.searchResults = response.documents;
          this.searching = false;
        },
        error: (error) => {
          console.error('Error searching:', error);
          this.searching = false;
        }
      });
  }
}
```

---

## 🟡 JavaScript Vanilla

### Clase para manejar la API

```javascript
// js/EmployeeDocumentsAPI.js
class EmployeeDocumentsAPI {
  constructor(baseUrl = 'http://localhost:6133') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
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
  }

  async getEmployeeDocuments(employeeUuid, options = {}) {
    const params = new URLSearchParams(options);
    return await this.request(`/api/documents/employee/${employeeUuid}?${params}`);
  }

  async searchEmployeeDocuments(employeeUuid, searchParams = {}) {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });

    return await this.request(`/api/retrieval/employee/${employeeUuid}/search?${params}`);
  }
}

// Inicializar API
const employeeAPI = new EmployeeDocumentsAPI();
```

### HTML y JavaScript

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Documentos del Empleado</title>
  <style>
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .search-form { margin-bottom: 30px; }
    .form-group { margin-bottom: 15px; }
    .form-group input, .form-group select { 
      width: 100%; padding: 8px; margin-top: 5px; 
    }
    .documents-grid { 
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
      gap: 20px; 
    }
    .document-card { 
      border: 1px solid #ddd; padding: 15px; border-radius: 8px; 
      background: #f9f9f9; 
    }
    .loading { text-align: center; padding: 20px; }
    .error { color: red; padding: 10px; background: #ffebee; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Documentos del Empleado</h1>
    
    <!-- Formulario de búsqueda -->
    <form id="searchForm" class="search-form">
      <div class="form-group">
        <label>Texto de búsqueda:</label>
        <input type="text" id="searchText" placeholder="Buscar en documentos...">
      </div>
      
      <div class="form-group">
        <label>Tipo de documento:</label>
        <select id="documentType">
          <option value="">Todos los tipos</option>
          <option value="contratos">Contratos</option>
          <option value="hojas">Hojas de Vida</option>
          <option value="reportes">Reportes</option>
          <option value="facturas">Facturas</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Fecha desde:</label>
        <input type="date" id="dateFrom">
      </div>
      
      <div class="form-group">
        <label>Fecha hasta:</label>
        <input type="date" id="dateTo">
      </div>
      
      <button type="submit">Buscar</button>
      <button type="button" id="clearSearch">Limpiar</button>
    </form>

    <!-- Área de resultados -->
    <div id="loading" class="loading" style="display: none;">
      Cargando documentos...
    </div>
    
    <div id="error" class="error" style="display: none;"></div>
    
    <div id="documentsGrid" class="documents-grid"></div>
  </div>

  <script src="js/EmployeeDocumentsAPI.js"></script>
  <script>
    const employeeUuid = '3389ecbe-a18c-11f0-99f3-0242ac120002'; // Tu UUID aquí
    
    // Elementos del DOM
    const searchForm = document.getElementById('searchForm');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const documentsGrid = document.getElementById('documentsGrid');
    const clearSearchBtn = document.getElementById('clearSearch');

    // Mostrar loading
    function showLoading() {
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      documentsGrid.innerHTML = '';
    }

    // Mostrar error
    function showError(message) {
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      errorDiv.textContent = message;
    }

    // Renderizar documentos
    function renderDocuments(documents) {
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'none';
      
      if (documents.length === 0) {
        documentsGrid.innerHTML = '<p>No se encontraron documentos</p>';
        return;
      }

      documentsGrid.innerHTML = documents.map(doc => `
        <div class="document-card">
          <h3>${doc.title}</h3>
          <p><strong>Tipo:</strong> ${doc.documentType}</p>
          <p><strong>Fecha:</strong> ${new Date(doc.uploadDate).toLocaleDateString()}</p>
          <p><strong>Tamaño:</strong> ${(doc.size / 1024 / 1024).toFixed(2)} MB</p>
          ${doc.score ? `<p><strong>Relevancia:</strong> ${(doc.score * 100).toFixed(1)}%</p>` : ''}
          <div class="document-actions">
            <a href="${doc.downloadUrl}" target="_blank">Descargar</a>
            <a href="${doc.viewUrl}" target="_blank">Ver</a>
          </div>
        </div>
      `).join('');
    }

    // Cargar documentos iniciales
    async function loadInitialDocuments() {
      showLoading();
      try {
        const response = await employeeAPI.getEmployeeDocuments(employeeUuid);
        renderDocuments(response.documents);
      } catch (error) {
        showError('Error cargando documentos: ' + error.message);
      }
    }

    // Manejar búsqueda
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const searchParams = {
        text: document.getElementById('searchText').value,
        documentType: document.getElementById('documentType').value,
        dateFrom: document.getElementById('dateFrom').value,
        dateTo: document.getElementById('dateTo').value
      };

      // Verificar que al menos un parámetro tenga valor
      const hasSearchParams = Object.values(searchParams).some(value => value.trim() !== '');
      
      if (!hasSearchParams) {
        alert('Ingrese al menos un criterio de búsqueda');
        return;
      }

      showLoading();
      try {
        const response = await employeeAPI.searchEmployeeDocuments(employeeUuid, searchParams);
        renderDocuments(response.documents);
      } catch (error) {
        showError('Error en la búsqueda: ' + error.message);
      }
    });

    // Limpiar búsqueda
    clearSearchBtn.addEventListener('click', () => {
      searchForm.reset();
      loadInitialDocuments();
    });

    // Cargar documentos al iniciar
    loadInitialDocuments();
  </script>
</body>
</html>
```

---

## 🎯 Testing

### Test con Jest (React)

```javascript
// __tests__/EmployeeDocuments.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { useEmployeeDocuments } from '../hooks/useEmployeeDocuments';
import EmployeeDocuments from '../components/EmployeeDocuments';

// Mock del hook
jest.mock('../hooks/useEmployeeDocuments');

describe('EmployeeDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra loading al cargar', () => {
    useEmployeeDocuments.mockReturnValue({
      documents: [],
      loading: true,
      error: null
    });

    render(<EmployeeDocuments employeeUuid="test-uuid" />);
    expect(screen.getByText('Cargando documentos...')).toBeInTheDocument();
  });

  it('muestra documentos cuando se cargan', async () => {
    const mockDocuments = [
      {
        id: '1',
        title: 'Test Document',
        documentType: 'contratos',
        uploadDate: '2025-01-01',
        downloadUrl: 'http://test.com/download/1'
      }
    ];

    useEmployeeDocuments.mockReturnValue({
      documents: mockDocuments,
      loading: false,
      error: null
    });

    render(<EmployeeDocuments employeeUuid="test-uuid" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });
});
```

---

Esta documentación proporciona ejemplos completos para integrar las nuevas rutas en diferentes frameworks frontend. ¡Elige el que uses y adapta según tus necesidades! 🚀