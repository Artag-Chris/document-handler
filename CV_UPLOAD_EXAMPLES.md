# 🚀 Ejemplos Prácticos - Subida de Hojas de Vida

## 📋 Casos de Uso Comunes

### 1. 📤 Subida Individual de CV

```typescript
// examples/SingleCVUpload.tsx
import React, { useState } from 'react';
import { CVUploadData, useDocumentUpload } from '../types/cvUpload.types';

const SingleCVUpload: React.FC = () => {
  const { uploadDocument, loading, progress, error } = useDocumentUpload();
  const [formData, setFormData] = useState<Partial<CVUploadData>>({
    employeeUuid: '',
    employeeName: '',
    employeeCedula: '',
    documentType: 'hojas-de-vida'
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.employeeUuid || !formData.employeeName || !formData.employeeCedula) {
      alert('Complete todos los campos requeridos');
      return;
    }

    try {
      const result = await uploadDocument(formData as CVUploadData);
      console.log('✅ CV subido exitosamente:', result);
      
      // Limpiar formulario
      setFormData({
        employeeUuid: '',
        employeeName: '',
        employeeCedula: '',
        documentType: 'hojas-de-vida'
      });
      
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="single-cv-upload">
      <h2>📄 Subir Hoja de Vida Individual</h2>
      
      <div className="form-group">
        <label>UUID Docente:</label>
        <input
          type="text"
          value={formData.employeeUuid || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, employeeUuid: e.target.value }))}
          placeholder="123e4567-e89b-12d3-a456-426614174000"
          required
        />
      </div>

      <div className="form-group">
        <label>Nombre Completo:</label>
        <input
          type="text"
          value={formData.employeeName || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
          placeholder="Juan Carlos Pérez García"
          required
        />
      </div>

      <div className="form-group">
        <label>Cédula:</label>
        <input
          type="text"
          value={formData.employeeCedula || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, employeeCedula: e.target.value }))}
          placeholder="1234567890"
          required
        />
      </div>

      <div className="form-group">
        <label>Archivo PDF:</label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          required
        />
      </div>

      {loading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} className="progress-fill"></div>
          </div>
          <p>Subiendo... {progress}%</p>
        </div>
      )}

      {error && (
        <div className="error-message">❌ {error}</div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Subiendo...' : '📤 Subir CV'}
      </button>
    </form>
  );
};

export default SingleCVUpload;
```

### 2. 📚 Subida Masiva de CVs

```typescript
// examples/BulkCVUpload.tsx
import React, { useState } from 'react';
import { CVUploadData, TeacherData } from '../types/cvUpload.types';

interface BulkUploadItem {
  file: File;
  teacher: TeacherData;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

const BulkCVUpload: React.FC = () => {
  const [uploadItems, setUploadItems] = useState<BulkUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newItems: BulkUploadItem[] = files.map(file => ({
      file,
      teacher: {
        uuid: '',
        name: '',
        cedula: ''
      },
      status: 'pending'
    }));

    setUploadItems(prev => [...prev, ...newItems]);
  };

  const updateTeacherData = (index: number, field: keyof TeacherData, value: string) => {
    setUploadItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, teacher: { ...item.teacher, [field]: value } }
        : item
    ));
  };

  const removeItem = (index: number) => {
    setUploadItems(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingle = async (item: BulkUploadItem, index: number): Promise<void> => {
    // Validar datos
    if (!item.teacher.uuid || !item.teacher.name || !item.teacher.cedula) {
      setUploadItems(prev => prev.map((it, i) => 
        i === index 
          ? { ...it, status: 'error', error: 'Datos del docente incompletos' }
          : it
      ));
      return;
    }

    try {
      setUploadItems(prev => prev.map((it, i) => 
        i === index 
          ? { ...it, status: 'uploading', progress: 0 }
          : it
      ));

      const formData = new FormData();
      formData.append('document', item.file);  // IMPORTANTE: usar 'document', no 'file'
      formData.append('employeeUuid', item.teacher.uuid);
      formData.append('employeeName', item.teacher.name);
      formData.append('employeeCedula', item.teacher.cedula);
      formData.append('documentType', 'hojas-de-vida');
      formData.append('category', 'curriculum-vitae');

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadItems(prev => prev.map((it, i) => 
              i === index 
                ? { ...it, progress }
                : it
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadItems(prev => prev.map((it, i) => 
              i === index 
                ? { ...it, status: 'success', progress: 100 }
                : it
            ));
            resolve();
          } else {
            const error = JSON.parse(xhr.responseText);
            setUploadItems(prev => prev.map((it, i) => 
              i === index 
                ? { ...it, status: 'error', error: error.message }
                : it
            ));
            reject(new Error(error.message));
          }
        });

        xhr.addEventListener('error', () => {
          setUploadItems(prev => prev.map((it, i) => 
            i === index 
              ? { ...it, status: 'error', error: 'Error de conexión' }
              : it
          ));
          reject(new Error('Error de conexión'));
        });

        xhr.open('POST', 'http://localhost:12345/api/documents/upload');
        xhr.send(formData);
      });

      await uploadPromise;

    } catch (error) {
      console.error(`Error subiendo archivo ${index}:`, error);
    }
  };

  const startBulkUpload = async () => {
    setUploading(true);
    
    // Subir de a 3 archivos simultáneamente para no sobrecargar el servidor
    const batchSize = 3;
    for (let i = 0; i < uploadItems.length; i += batchSize) {
      const batch = uploadItems.slice(i, i + batchSize);
      const uploadPromises = batch.map((item, batchIndex) => 
        uploadSingle(item, i + batchIndex)
      );
      
      await Promise.allSettled(uploadPromises);
      
      // Pausa pequeña entre lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setUploading(false);
  };

  const getStatusIcon = (status: BulkUploadItem['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="bulk-cv-upload">
      <h2>📚 Subida Masiva de Hojas de Vida</h2>
      
      <div className="upload-controls">
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFilesSelect}
          disabled={uploading}
        />
        
        <button 
          onClick={startBulkUpload} 
          disabled={uploadItems.length === 0 || uploading}
          className="start-upload-btn"
        >
          {uploading ? '📤 Subiendo...' : `🚀 Subir ${uploadItems.length} archivos`}
        </button>
      </div>

      <div className="upload-items">
        {uploadItems.map((item, index) => (
          <div key={index} className={`upload-item ${item.status}`}>
            <div className="item-header">
              <span className="status-icon">{getStatusIcon(item.status)}</span>
              <span className="filename">{item.file.name}</span>
              <button 
                onClick={() => removeItem(index)}
                disabled={uploading}
                className="remove-btn"
              >
                🗑️
              </button>
            </div>

            <div className="teacher-data">
              <input
                type="text"
                placeholder="UUID del docente"
                value={item.teacher.uuid}
                onChange={(e) => updateTeacherData(index, 'uuid', e.target.value)}
                disabled={uploading || item.status === 'success'}
              />
              <input
                type="text"
                placeholder="Nombre completo"
                value={item.teacher.name}
                onChange={(e) => updateTeacherData(index, 'name', e.target.value)}
                disabled={uploading || item.status === 'success'}
              />
              <input
                type="text"
                placeholder="Cédula"
                value={item.teacher.cedula}
                onChange={(e) => updateTeacherData(index, 'cedula', e.target.value)}
                disabled={uploading || item.status === 'success'}
              />
            </div>

            {item.status === 'uploading' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${item.progress || 0}%` }}
                ></div>
              </div>
            )}

            {item.error && (
              <div className="error-message">❌ {item.error}</div>
            )}
          </div>
        ))}
      </div>

      {uploadItems.length === 0 && (
        <div className="no-files">
          📁 Seleccione archivos PDF para comenzar la subida masiva
        </div>
      )}
    </div>
  );
};

export default BulkCVUpload;
```

### 3. 🔍 Buscador de CVs Subidos

```typescript
// examples/CVSearchAndList.tsx
import React, { useState, useEffect } from 'react';
import { CVDocumentMetadata, CVSearchQuery } from '../types/cvUpload.types';

const CVSearchAndList: React.FC = () => {
  const [documents, setDocuments] = useState<CVDocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<CVSearchQuery>({
    text: '',
    size: 20
  });

  const searchDocuments = async (query: CVSearchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (query.text) params.append('query', query.text);
      if (query.employeeUuid) params.append('employeeUuid', query.employeeUuid);
      if (query.employeeName) params.append('employeeName', query.employeeName);
      if (query.employeeCedula) params.append('employeeCedula', query.employeeCedula);
      
      params.append('documentType', 'hojas-de-vida');
      params.append('size', (query.size || 20).toString());

      const response = await fetch(`http://localhost:12345/api/retrieval/advanced-search?${params}`);
      const data = await response.json();
      
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error buscando documentos:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar todos los CVs al inicio
    searchDocuments({ documentType: 'hojas-de-vida', size: 50 });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchDocuments(searchQuery);
  };

  const downloadDocument = (documentId: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:12345/api/retrieval/download/${documentId}`;
    link.download = filename;
    link.click();
  };

  const viewDocument = (documentId: string) => {
    window.open(`http://localhost:12345/api/retrieval/view/${documentId}`, '_blank');
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      const response = await fetch(`http://localhost:12345/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert('Documento eliminado exitosamente');
      } else {
        alert('Error eliminando documento');
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
      alert('Error eliminando documento');
    }
  };

  return (
    <div className="cv-search-and-list">
      <h2>🔍 Buscar y Gestionar Hojas de Vida</h2>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-row">
          <input
            type="text"
            placeholder="Buscar por texto, nombre, keywords..."
            value={searchQuery.text || ''}
            onChange={(e) => setSearchQuery(prev => ({ ...prev, text: e.target.value }))}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Cédula específica"
            value={searchQuery.employeeCedula || ''}
            onChange={(e) => setSearchQuery(prev => ({ ...prev, employeeCedula: e.target.value }))}
            className="cedula-input"
          />
          <button type="submit" disabled={loading}>
            {loading ? '🔄' : '🔍'} Buscar
          </button>
        </div>
      </form>

      <div className="results-summary">
        <p>{documents.length} hojas de vida encontradas</p>
      </div>

      {loading && (
        <div className="loading">Buscando documentos...</div>
      )}

      <div className="documents-grid">
        {documents.map(doc => (
          <div key={doc.id} className="document-card">
            <div className="card-header">
              <h3>{doc.employeeName}</h3>
              <span className="cedula">Cédula: {doc.employeeCedula}</span>
            </div>

            <div className="card-info">
              <p><strong>Archivo:</strong> {doc.originalName}</p>
              <p><strong>Subido:</strong> {new Date(doc.uploadDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Tamaño:</strong> {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
              {doc.elasticsearchIndexed && (
                <p className="indexed">✅ Indexado en Elasticsearch</p>
              )}
            </div>

            {doc.keywords && doc.keywords.length > 0 && (
              <div className="keywords">
                <strong>Keywords:</strong>
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

            <div className="card-actions">
              <button 
                onClick={() => viewDocument(doc.id)}
                className="btn-view"
              >
                👁️ Ver
              </button>
              <button 
                onClick={() => downloadDocument(doc.id, doc.originalName)}
                className="btn-download"
              >
                📥 Descargar
              </button>
              <button 
                onClick={() => deleteDocument(doc.id)}
                className="btn-delete"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && !loading && (
        <div className="no-results">
          📄 No se encontraron hojas de vida con los criterios de búsqueda
        </div>
      )}
    </div>
  );
};

export default CVSearchAndList;
```

### 4. 📊 Dashboard de Estadísticas

```typescript
// examples/CVDashboard.tsx
import React, { useState, useEffect } from 'react';

interface CVStats {
  totalDocuments: number;
  totalDocents: number;
  uploadsToday: number;
  uploadsThisMonth: number;
  averageFileSize: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  recentUploads: Array<{
    id: string;
    employeeName: string;
    uploadDate: string;
    filename: string;
  }>;
}

const CVDashboard: React.FC = () => {
  const [stats, setStats] = useState<CVStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Cargar todos los documentos de tipo hojas-de-vida
      const response = await fetch('http://localhost:12345/api/retrieval/advanced-search?documentType=hojas-de-vida&size=1000');
      const data = await response.json();
      const documents = data.documents || [];

      // Calcular estadísticas
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const uploadsToday = documents.filter((doc: any) => {
        const uploadDate = new Date(doc.uploadDate);
        return uploadDate.toDateString() === today.toDateString();
      }).length;

      const uploadsThisMonth = documents.filter((doc: any) => {
        const uploadDate = new Date(doc.uploadDate);
        return uploadDate >= thisMonth;
      }).length;

      const totalSize = documents.reduce((sum: number, doc: any) => sum + (doc.size || 0), 0);
      const averageFileSize = documents.length > 0 ? totalSize / documents.length : 0;

      // Contar keywords más frecuentes
      const keywordCount = new Map<string, number>();
      documents.forEach((doc: any) => {
        doc.keywords?.forEach((keyword: string) => {
          keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
        });
      });

      const topKeywords = Array.from(keywordCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));

      // Documentos más recientes
      const recentUploads = documents
        .sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5)
        .map((doc: any) => ({
          id: doc.id,
          employeeName: doc.employeeName,
          uploadDate: doc.uploadDate,
          filename: doc.originalName
        }));

      // Contar docentes únicos
      const uniqueDocents = new Set(documents.map((doc: any) => doc.employeeUuid)).size;

      setStats({
        totalDocuments: documents.length,
        totalDocents: uniqueDocents,
        uploadsToday,
        uploadsThisMonth,
        averageFileSize,
        topKeywords,
        recentUploads
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="dashboard-loading">📊 Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="dashboard-error">❌ Error cargando estadísticas</div>;
  }

  return (
    <div className="cv-dashboard">
      <h2>📊 Dashboard - Hojas de Vida</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.totalDocuments}</h3>
            <p>Total de CVs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>{stats.totalDocents}</h3>
            <p>Docentes Registrados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.uploadsToday}</h3>
            <p>Subidas Hoy</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.uploadsThisMonth}</h3>
            <p>Subidas Este Mes</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>📊 Información General</h3>
          <div className="info-list">
            <div className="info-item">
              <span>Tamaño Promedio de Archivo:</span>
              <strong>{formatFileSize(stats.averageFileSize)}</strong>
            </div>
            <div className="info-item">
              <span>CVs por Docente (promedio):</span>
              <strong>{(stats.totalDocuments / Math.max(stats.totalDocents, 1)).toFixed(1)}</strong>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>🏷️ Keywords Más Frecuentes</h3>
          <div className="keywords-chart">
            {stats.topKeywords.map(({ keyword, count }) => (
              <div key={keyword} className="keyword-bar">
                <span className="keyword-label">{keyword}</span>
                <div className="keyword-progress">
                  <div 
                    className="keyword-fill" 
                    style={{ 
                      width: `${(count / stats.topKeywords[0].count) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="keyword-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>🕒 Subidas Recientes</h3>
          <div className="recent-uploads">
            {stats.recentUploads.map(upload => (
              <div key={upload.id} className="recent-item">
                <div className="recent-info">
                  <strong>{upload.employeeName}</strong>
                  <span className="recent-filename">{upload.filename}</span>
                </div>
                <div className="recent-date">
                  {new Date(upload.uploadDate).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={loadStats} className="refresh-btn">
          🔄 Actualizar Estadísticas
        </button>
      </div>
    </div>
  );
};

export default CVDashboard;
```

## 🎨 Estilos CSS para los Ejemplos

```css
/* examples/examples.css */

/* Subida Individual */
.single-cv-upload {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.single-cv-upload .form-group {
  margin-bottom: 1rem;
}

.single-cv-upload label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.single-cv-upload input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.upload-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
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
  transition: width 0.3s;
}

/* Subida Masiva */
.bulk-cv-upload {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.start-upload-btn {
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.upload-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.upload-item.success {
  border-color: #28a745;
  background: #f8fff9;
}

.upload-item.error {
  border-color: #dc3545;
  background: #fff8f8;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filename {
  flex: 1;
  font-weight: 600;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.teacher-data {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.teacher-data input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Buscador */
.cv-search-and-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr 200px auto;
  gap: 1rem;
  align-items: center;
}

.search-input,
.cedula-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.document-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.document-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.cedula {
  color: #666;
  font-size: 0.9rem;
}

.card-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #555;
}

.indexed {
  color: #28a745;
  font-weight: 600;
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

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn-view,
.btn-download,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-view {
  background: #007bff;
  color: white;
}

.btn-download {
  background: #28a745;
  color: white;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

/* Dashboard */
.cv-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.keywords-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.keyword-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.keyword-label {
  min-width: 80px;
  font-size: 0.9rem;
  color: #555;
}

.keyword-progress {
  flex: 1;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.keyword-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s;
}

.keyword-count {
  min-width: 30px;
  text-align: right;
  font-weight: 600;
  color: #333;
}

.recent-uploads {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.recent-info {
  display: flex;
  flex-direction: column;
}

.recent-filename {
  font-size: 0.8rem;
  color: #666;
}

.recent-date {
  font-size: 0.8rem;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .search-row {
    grid-template-columns: 1fr;
  }
  
  .documents-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
  
  .teacher-data {
    grid-template-columns: 1fr;
  }
}
```

## 🚀 Implementación en App Principal

```typescript
// App.tsx
import React, { useState } from 'react';
import SingleCVUpload from './examples/SingleCVUpload';
import BulkCVUpload from './examples/BulkCVUpload';
import CVSearchAndList from './examples/CVSearchAndList';
import CVDashboard from './examples/CVDashboard';
import './examples/examples.css';

type TabType = 'dashboard' | 'upload' | 'bulk' | 'search';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 Sistema de Gestión de Hojas de Vida - Docentes</h1>
        
        <nav className="main-navigation">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            📤 Subir CV
          </button>
          <button 
            className={activeTab === 'bulk' ? 'active' : ''}
            onClick={() => setActiveTab('bulk')}
          >
            📚 Subida Masiva
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            🔍 Buscar CVs
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && <CVDashboard />}
        {activeTab === 'upload' && <SingleCVUpload />}
        {activeTab === 'bulk' && <BulkCVUpload />}
        {activeTab === 'search' && <CVSearchAndList />}
      </main>
    </div>
  );
};

export default App;
```

¡Con estos ejemplos prácticos tienes casos de uso completos para implementar todo el sistema de gestión de hojas de vida de docentes! 🎉

Cada ejemplo incluye:
- ✅ **Funcionalidad completa**
- ✅ **Manejo de errores**
- ✅ **Validaciones**
- ✅ **UI/UX responsivo**
- ✅ **TypeScript type-safe**
- ✅ **Integración con tu API**