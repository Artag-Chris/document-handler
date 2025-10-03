# 📋 API de Subida de Documentos - Hojas de Vida Docentes

## 📖 Descripción General

Esta API permite la subida y gestión de hojas de vida para docentes con capacidades avanzadas de:
- Extracción automática de texto de PDFs
- Generación de palabras clave inteligentes
- Indexación automática en Elasticsearch
- Organización por estructura de carpetas por empleado
- Metadatos enriquecidos para búsqueda

**Base URL:** `http://localhost:12345/api/documents`

---

## 🎯 Endpoint Principal

### **POST** `/upload`

Sube documentos de hojas de vida para docentes con procesamiento automático.

### Headers Requeridos
```
Content-Type: multipart/form-data
```

### Parámetros del Form Data

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `document` | File | ✅ | Archivo PDF de la hoja de vida | `cv_juan_perez.pdf` |
| `employeeUuid` | string | ✅ | UUID único del docente | `123e4567-e89b-12d3-a456-426614174000` |
| `employeeName` | string | ✅ | Nombre completo del docente | `Juan Carlos Pérez García` |
| `employeeCedula` | string | ✅ | Número de cédula del docente | `1234567890` |
| `title` | string | ❌ | Título del documento (auto-generado si no se proporciona) | `Hoja de Vida - Juan Carlos Pérez` |
| `description` | string | ❌ | Descripción adicional | `CV actualizado con experiencia en matemáticas` |
| `tags` | string[] | ❌ | Etiquetas para categorización | `["curriculum", "docente", "matematicas"]` |
| `category` | string | ❌ | Categoría del documento | `"curriculum-vitae"` |
| `documentType` | string | ❌ | Tipo específico (default: "hojas-de-vida") | `"hojas-de-vida"` |

### Estructura de Respuesta

```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "document": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "2025_1234567890_hojas-de-vida_1728576543210_cv_juan_perez.pdf",
    "originalName": "cv_juan_perez.pdf",
    "mimetype": "application/pdf",
    "size": 1048576,
    "uploadDate": "2025-10-03T15:30:45.123Z",
    "title": "Hoja de Vida - Juan Carlos Pérez García",
    "description": "CV actualizado con experiencia en matemáticas",
    "tags": ["curriculum", "docente", "matematicas"],
    "category": "curriculum-vitae",
    "employeeUuid": "123e4567-e89b-12d3-a456-426614174000",
    "employeeName": "Juan Carlos Pérez García",
    "employeeCedula": "1234567890",
    "documentType": "hojas-de-vida",
    "year": 2025,
    "relativePath": "uploads\\2025\\123e4567-e89b-12d3-a456-426614174000\\hojas-de-vida\\2025_1234567890_hojas-de-vida_1728576543210_cv_juan_perez.pdf",
    "keywords": [
      "educacion",
      "experiencia",
      "universidad",
      "docente",
      "matematicas",
      "licenciatura",
      "postgrado"
    ],
    "downloadUrl": "http://localhost:12345/api/retrieval/download/123e4567-e89b-12d3-a456-426614174000",
    "viewUrl": "http://localhost:12345/api/retrieval/view/123e4567-e89b-12d3-a456-426614174000",
    "elasticsearchIndexed": true
  },
  "elasticsearch": {
    "indexed": true,
    "indexName": "documents-2025",
    "documentId": "123e4567-e89b-12d3-a456-426614174000"
  },
  "extractedData": {
    "textExtracted": true,
    "keywordCount": 47,
    "textLength": 2543
  }
}
```

---

## ⚠️ **IMPORTANTE - Configuración del FormData**

### 🔧 **Campo de Archivo Requerido**

**CRÍTICO**: El backend está configurado para recibir el archivo con el nombre de campo **`'document'`**, NO `'file'`.

```typescript
// ✅ CORRECTO - Usar 'document' como nombre del campo
formData.append('document', fileObject);

// ❌ INCORRECTO - Esto causará "MulterError: Unexpected field"
formData.append('file', fileObject);
formData.append('cv', fileObject);
formData.append('upload', fileObject);
```

### 🚨 **Error Común: MulterError: Unexpected field**

Si ves este error:
```
MulterError: Unexpected field
    at wrappedFileFilter (multer/index.js:40:19)
```

**Causa**: Estás enviando el archivo con un nombre de campo incorrecto.

**Solución**: Cambiar el nombre del campo a `'document'`:

```typescript
// Cambiar esto:
const formData = new FormData();
formData.append('file', selectedFile);  // ❌ INCORRECTO

// Por esto:
const formData = new FormData();
formData.append('document', selectedFile);  // ✅ CORRECTO
```

### 📋 **Validación de Campos Requeridos**

El backend requiere estos campos mínimos:
- ✅ `document` (archivo)
- ✅ `employeeUuid` 
- ✅ `employeeName`
- ✅ `employeeCedula`

Cualquier campo adicional que no esté configurado en Multer causará el error "Unexpected field".

---

## 💻 Implementación Frontend

### 1. Hook React para Subida de Documentos

```typescript
// hooks/useDocumentUpload.ts
import { useState, useCallback } from 'react';

interface UploadDocumentData {
  file: File;
  employeeUuid: string;
  employeeName: string;
  employeeCedula: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  documentType?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  document: any;
  elasticsearch: any;
  extractedData: any;
}

interface UploadState {
  loading: boolean;
  progress: number;
  error: string | null;
  uploadedDocument: any | null;
}

export const useDocumentUpload = (baseUrl = 'http://localhost:12345/api/documents') => {
  const [state, setState] = useState<UploadState>({
    loading: false,
    progress: 0,
    error: null,
    uploadedDocument: null
  });

  const uploadDocument = useCallback(async (data: UploadDocumentData): Promise<UploadResponse> => {
    setState(prev => ({ ...prev, loading: true, progress: 0, error: null }));

    try {
      const formData = new FormData();
      
      // Archivo (requerido) - IMPORTANTE: debe ser 'document', no 'file'
      formData.append('document', data.file);
      
      // Datos del docente (requeridos)
      formData.append('employeeUuid', data.employeeUuid);
      formData.append('employeeName', data.employeeName);
      formData.append('employeeCedula', data.employeeCedula);
      
      // Configuración específica para hojas de vida
      formData.append('documentType', data.documentType || 'hojas-de-vida');
      formData.append('category', data.category || 'curriculum-vitae');
      
      // Datos opcionales
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      
      // Tags
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => formData.append('tags', tag));
      }

      // Crear XMLHttpRequest para seguimiento de progreso
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setState(prev => ({ ...prev, progress }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              progress: 100, 
              uploadedDocument: response.document 
            }));
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            setState(prev => ({ 
              ...prev, 
              loading: false, 
              error: error.message || 'Error al subir el documento' 
            }));
            reject(new Error(error.message || 'Error al subir el documento'));
          }
        });

        xhr.addEventListener('error', () => {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Error de conexión al subir el documento' 
          }));
          reject(new Error('Error de conexión'));
        });

        xhr.open('POST', `${baseUrl}/upload`);
        xhr.send(formData);
      });

      return await uploadPromise;

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }));
      throw error;
    }
  }, [baseUrl]);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      progress: 0,
      error: null,
      uploadedDocument: null
    });
  }, []);

  return {
    ...state,
    uploadDocument,
    resetState
  };
};
```

### 2. Componente de Subida de Hojas de Vida

```tsx
// components/CVUploadForm.tsx
import React, { useState, useRef } from 'react';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

interface CVUploadFormProps {
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
}

interface TeacherData {
  uuid: string;
  name: string;
  cedula: string;
}

const CVUploadForm: React.FC<CVUploadFormProps> = ({ 
  onUploadSuccess, 
  onUploadError 
}) => {
  const { loading, progress, error, uploadDocument, resetState } = useDocumentUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData>({
    uuid: '',
    name: '',
    cedula: ''
  });
  const [documentData, setDocumentData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    tagInput: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF para hojas de vida');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar los 10MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-generar título si no existe
      if (!documentData.title) {
        setDocumentData(prev => ({
          ...prev,
          title: `Hoja de Vida - ${teacherData.name || 'Docente'}`
        }));
      }
    }
  };

  const handleAddTag = () => {
    if (documentData.tagInput.trim() && !documentData.tags.includes(documentData.tagInput.trim())) {
      setDocumentData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDocumentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !teacherData.uuid || !teacherData.name || !teacherData.cedula) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const response = await uploadDocument({
        file: selectedFile,
        employeeUuid: teacherData.uuid,
        employeeName: teacherData.name,
        employeeCedula: teacherData.cedula,
        title: documentData.title,
        description: documentData.description,
        tags: ['curriculum', 'docente', ...documentData.tags],
        category: 'curriculum-vitae',
        documentType: 'hojas-de-vida'
      });

      console.log('📄 Documento subido exitosamente:', response);
      
      // Limpiar formulario
      setSelectedFile(null);
      setTeacherData({ uuid: '', name: '', cedula: '' });
      setDocumentData({ title: '', description: '', tags: [], tagInput: '' });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploadSuccess?.(response.document);
      
    } catch (error) {
      console.error('❌ Error subiendo documento:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleReset = () => {
    resetState();
    setSelectedFile(null);
    setTeacherData({ uuid: '', name: '', cedula: '' });
    setDocumentData({ title: '', description: '', tags: [], tagInput: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="cv-upload-form">
      <div className="form-header">
        <h2>📋 Subir Hoja de Vida - Docente</h2>
        <p>Suba documentos PDF de hojas de vida para docentes con procesamiento automático</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Datos del Docente */}
        <div className="form-section">
          <h3>👨‍🏫 Información del Docente</h3>
          
          <div className="form-group">
            <label htmlFor="teacherUuid">UUID del Docente *</label>
            <input
              id="teacherUuid"
              type="text"
              value={teacherData.uuid}
              onChange={(e) => setTeacherData(prev => ({ ...prev, uuid: e.target.value }))}
              placeholder="123e4567-e89b-12d3-a456-426614174000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacherName">Nombre Completo *</label>
            <input
              id="teacherName"
              type="text"
              value={teacherData.name}
              onChange={(e) => setTeacherData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Juan Carlos Pérez García"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="teacherCedula">Cédula *</label>
            <input
              id="teacherCedula"
              type="text"
              value={teacherData.cedula}
              onChange={(e) => setTeacherData(prev => ({ ...prev, cedula: e.target.value }))}
              placeholder="1234567890"
              required
            />
          </div>
        </div>

        {/* Archivo */}
        <div className="form-section">
          <h3>📄 Archivo de Hoja de Vida</h3>
          
          <div className="form-group">
            <label htmlFor="fileInput">Archivo PDF *</label>
            <input
              id="fileInput"
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              required
            />
            <small>Solo archivos PDF, máximo 10MB</small>
            
            {selectedFile && (
              <div className="file-info">
                <p>✅ Archivo seleccionado: {selectedFile.name}</p>
                <p>📦 Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadatos */}
        <div className="form-section">
          <h3>📝 Información del Documento</h3>
          
          <div className="form-group">
            <label htmlFor="docTitle">Título</label>
            <input
              id="docTitle"
              type="text"
              value={documentData.title}
              onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Se auto-genera si no se especifica"
            />
          </div>

          <div className="form-group">
            <label htmlFor="docDescription">Descripción</label>
            <textarea
              id="docDescription"
              value={documentData.description}
              onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción adicional del documento..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="docTags">Etiquetas Adicionales</label>
            <div className="tags-input">
              <input
                id="docTags"
                type="text"
                value={documentData.tagInput}
                onChange={(e) => setDocumentData(prev => ({ ...prev, tagInput: e.target.value }))}
                placeholder="Agregar etiqueta..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button type="button" onClick={handleAddTag}>Agregar</button>
            </div>
            
            <div className="tags-list">
              <span className="tag default">curriculum</span>
              <span className="tag default">docente</span>
              {documentData.tags.map(tag => (
                <span key={tag} className="tag removable">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p>Subiendo... {progress}%</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleReset}
            className="btn-secondary"
            disabled={loading}
          >
            Limpiar
          </button>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || !selectedFile || !teacherData.uuid || !teacherData.name || !teacherData.cedula}
          >
            {loading ? 'Subiendo...' : '📤 Subir Hoja de Vida'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CVUploadForm;
```

### 3. Componente de Lista de Documentos Subidos

```tsx
// components/UploadedDocumentsList.tsx
import React, { useState, useEffect } from 'react';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  employeeName: string;
  employeeCedula: string;
  uploadDate: string;
  size: number;
  downloadUrl: string;
  viewUrl: string;
  keywords: string[];
}

const UploadedDocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:12345/api/retrieval/advanced-search?documentType=hojas-de-vida&size=50');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => 
    doc.employeeName.toLowerCase().includes(filter.toLowerCase()) ||
    doc.employeeCedula.includes(filter) ||
    doc.originalName.toLowerCase().includes(filter.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="uploaded-documents-list">
      <div className="list-header">
        <h2>📚 Hojas de Vida Subidas</h2>
        <div className="list-controls">
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o archivo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <button onClick={loadDocuments} className="refresh-btn">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading && <div className="loading">Cargando documentos...</div>}

      <div className="documents-grid">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="document-item">
            <div className="document-header">
              <h3>{doc.employeeName}</h3>
              <span className="cedula">Cédula: {doc.employeeCedula}</span>
            </div>

            <div className="document-info">
              <p><strong>Archivo:</strong> {doc.originalName}</p>
              <p><strong>Subido:</strong> {formatDate(doc.uploadDate)}</p>
              <p><strong>Tamaño:</strong> {formatFileSize(doc.size)}</p>
            </div>

            {doc.keywords && doc.keywords.length > 0 && (
              <div className="keywords">
                <strong>Palabras clave:</strong>
                <div className="keywords-list">
                  {doc.keywords.slice(0, 5).map(keyword => (
                    <span key={keyword} className="keyword-tag">{keyword}</span>
                  ))}
                  {doc.keywords.length > 5 && (
                    <span className="more-keywords">+{doc.keywords.length - 5} más</span>
                  )}
                </div>
              </div>
            )}

            <div className="document-actions">
              <a href={doc.downloadUrl} className="btn-download" download>
                📥 Descargar
              </a>
              <a href={doc.viewUrl} className="btn-view" target="_blank" rel="noopener noreferrer">
                👁️ Ver
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && !loading && (
        <div className="no-documents">
          {filter ? 'No se encontraron documentos con ese filtro' : 'No hay hojas de vida subidas'}
        </div>
      )}
    </div>
  );
};

export default UploadedDocumentsList;
```

---

## 🎨 Estilos CSS

```css
/* styles/CVUpload.css */

.cv-upload-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #666;
  font-size: 0.9rem;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.file-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.file-info p {
  margin: 0;
  font-size: 0.9rem;
}

.tags-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tags-input input {
  flex: 1;
}

.tags-input button {
  padding: 0.75rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.tags-input button:hover {
  background: #0056b3;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag.default {
  background: #e9ecef;
  color: #495057;
}

.tag.removable {
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag.removable button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.upload-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.error-message {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

/* Lista de documentos */
.uploaded-documents-list {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  min-width: 250px;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.document-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.document-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.document-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.document-header h3 {
  margin: 0;
  color: #333;
}

.cedula {
  color: #6c757d;
  font-size: 0.9rem;
}

.document-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.keywords {
  margin: 1rem 0;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.keyword-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.more-keywords {
  color: #6c757d;
  font-size: 0.75rem;
  font-style: italic;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-download,
.btn-view {
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  transition: background-color 0.2s;
}

.btn-download {
  background: #28a745;
  color: white;
}

.btn-download:hover {
  background: #218838;
}

.btn-view {
  background: #007bff;
  color: white;
}

.btn-view:hover {
  background: #0056b3;
}

.loading,
.no-documents {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

/* Responsive */
@media (max-width: 768px) {
  .cv-upload-form {
    margin: 1rem;
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .list-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .list-controls {
    flex-direction: column;
  }
  
  .documents-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔧 Configuración y Notas Técnicas

### Estructura de Carpetas Generada
```
uploads/
└── 2025/
    └── {employeeUuid}/
        └── hojas-de-vida/
            └── 2025_{cedula}_hojas-de-vida_{timestamp}_{originalname}.pdf
```

### Procesamiento Automático
1. **Extracción de Texto**: PDF → Texto plano usando pdf-parse
2. **Generación de Keywords**: Algoritmo inteligente que extrae 50+ palabras clave
3. **Indexación Elasticsearch**: Documento indexado automáticamente para búsqueda
4. **Metadatos Enriquecidos**: Información del docente y estructura organizacional

### Validaciones Frontend
- ✅ Solo archivos PDF
- ✅ Máximo 10MB por archivo
- ✅ Campos requeridos validados
- ✅ UUID formato válido
- ✅ Cédula numérica

### URLs Generadas Automáticamente
- **Descarga**: `http://localhost:12345/api/retrieval/download/{documentId}`
- **Vista**: `http://localhost:12345/api/retrieval/view/{documentId}`

---

## 🚀 Ejemplo de Uso Completo

```tsx
// App.tsx
import React, { useState } from 'react';
import CVUploadForm from './components/CVUploadForm';
import UploadedDocumentsList from './components/UploadedDocumentsList';
import './styles/CVUpload.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');
  const [refreshList, setRefreshList] = useState(0);

  const handleUploadSuccess = (document: any) => {
    console.log('✅ Documento subido:', document);
    alert(`Hoja de vida de ${document.employeeName} subida exitosamente`);
    
    // Cambiar a la lista y refrescar
    setActiveTab('list');
    setRefreshList(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Error:', error);
    alert(`Error al subir el documento: ${error}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 Sistema de Gestión de Hojas de Vida - Docentes</h1>
        
        <nav className="tab-navigation">
          <button 
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            📤 Subir Hoja de Vida
          </button>
          <button 
            className={activeTab === 'list' ? 'active' : ''}
            onClick={() => setActiveTab('list')}
          >
            📚 Ver Documentos
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'upload' && (
          <CVUploadForm 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )}
        
        {activeTab === 'list' && (
          <UploadedDocumentsList key={refreshList} />
        )}
      </main>
    </div>
  );
};

export default App;
```

¡Con esta documentación tienes todo lo necesario para implementar la subida de hojas de vida de docentes en tu frontend! 🎉

La API ya está configurada para manejar diferentes tipos de documentos, así que cuando necesites implementar otros tipos (contratos, certificados, etc.), solo tendrás que cambiar el `documentType` y ajustar los formularios específicos.