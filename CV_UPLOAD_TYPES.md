# 📝 Tipos TypeScript - Subida de Hojas de Vida

## 📖 Definiciones de Tipos

```typescript
// types/cvUpload.types.ts

// ===== TIPOS PRINCIPALES =====

export interface TeacherData {
  uuid: string;
  name: string;
  cedula: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface CVUploadData {
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

export interface CVDocumentMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date | string;
  title: string;
  description?: string;
  tags: string[];
  category?: string;
  employeeUuid: string;
  employeeName: string;
  employeeCedula: string;
  documentType: string;
  year: number;
  relativePath: string;
  filePath: string;
  keywords: string[];
  extractedText?: string;
  elasticId?: string;
  downloadUrl?: string;
  viewUrl?: string;
  elasticsearchIndexed?: boolean;
}

export interface CVUploadResponse {
  success: boolean;
  message: string;
  document: CVDocumentMetadata;
  elasticsearch: {
    indexed: boolean;
    indexName: string;
    documentId: string;
  };
  extractedData: {
    textExtracted: boolean;
    keywordCount: number;
    textLength: number;
  };
}

export interface UploadState {
  loading: boolean;
  progress: number;
  error: string | null;
  uploadedDocument: CVDocumentMetadata | null;
}

// ===== TIPOS PARA HOOKS =====

export interface UseDocumentUploadReturn {
  loading: boolean;
  progress: number;
  error: string | null;
  uploadedDocument: CVDocumentMetadata | null;
  uploadDocument: (data: CVUploadData) => Promise<CVUploadResponse>;
  resetState: () => void;
}

export interface UseDocumentUploadConfig {
  baseUrl?: string;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadSuccess?: (response: CVUploadResponse) => void;
  onUploadError?: (error: string) => void;
}

// ===== TIPOS PARA COMPONENTES =====

export interface CVUploadFormProps {
  onUploadSuccess?: (document: CVDocumentMetadata) => void;
  onUploadError?: (error: string) => void;
  initialTeacherData?: Partial<TeacherData>;
  config?: {
    maxFileSize?: number; // en bytes
    allowedMimeTypes?: string[];
    autoGenerateTitle?: boolean;
    defaultTags?: string[];
  };
}

export interface UploadedDocumentsListProps {
  refreshKey?: number;
  filter?: DocumentFilter;
  onDocumentSelect?: (document: CVDocumentMetadata) => void;
  onDocumentDelete?: (documentId: string) => void;
}

export interface DocumentFilter {
  searchTerm?: string;
  employeeUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

// ===== TIPOS PARA VALIDACIÓN =====

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface TeacherDataValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ===== TIPOS PARA CONFIGURACIÓN =====

export interface CVUploadConfig {
  api: {
    baseUrl: string;
    endpoints: {
      upload: string;
      list: string;
      download: string;
      view: string;
      delete: string;
    };
  };
  validation: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    requiredFields: string[];
  };
  ui: {
    showProgress: boolean;
    autoRedirect: boolean;
    defaultTags: string[];
  };
}

// ===== ENUMS =====

export enum DocumentType {
  CV = 'hojas-de-vida',
  CONTRACT = 'contratos',
  CERTIFICATE = 'certificados',
  EVALUATION = 'evaluaciones',
  OTHER = 'otros'
}

export enum DocumentCategory {
  CV = 'curriculum-vitae',
  ACADEMIC = 'academico',
  ADMINISTRATIVE = 'administrativo',
  LEGAL = 'legal',
  PERSONAL = 'personal'
}

export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// ===== CONSTANTES =====

export const CV_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  DEFAULT_DOCUMENT_TYPE: DocumentType.CV,
  DEFAULT_CATEGORY: DocumentCategory.CV,
  DEFAULT_TAGS: ['curriculum', 'docente'],
  MIN_CEDULA_LENGTH: 8,
  MAX_CEDULA_LENGTH: 12,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;

// ===== UTILIDADES DE TIPO =====

export type CVUploadFormData = Omit<CVUploadData, 'file'> & {
  file: File | null;
};

export type PartialCVDocument = Partial<CVDocumentMetadata> & {
  id: string;
  employeeUuid: string;
  employeeName: string;
};

export type CVDocumentSummary = Pick<
  CVDocumentMetadata, 
  'id' | 'filename' | 'employeeName' | 'employeeCedula' | 'uploadDate' | 'size'
>;

// ===== TIPOS PARA BÚSQUEDA =====

export interface CVSearchQuery {
  text?: string;
  employeeUuid?: string;
  employeeName?: string;
  employeeCedula?: string;
  documentType?: DocumentType;
  category?: DocumentCategory;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  size?: number;
  from?: number;
}

export interface CVSearchResult {
  documents: CVDocumentMetadata[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===== TIPOS PARA EVENTOS =====

export interface CVUploadEvent {
  type: 'upload_start' | 'upload_progress' | 'upload_success' | 'upload_error';
  payload: {
    documentId?: string;
    progress?: number;
    error?: string;
    document?: CVDocumentMetadata;
  };
  timestamp: Date;
}

export type CVUploadEventHandler = (event: CVUploadEvent) => void;

// ===== TIPOS PARA CONTEXTO =====

export interface CVUploadContextValue {
  documents: CVDocumentMetadata[];
  loading: boolean;
  error: string | null;
  uploadDocument: (data: CVUploadData) => Promise<CVUploadResponse>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
  searchDocuments: (query: CVSearchQuery) => Promise<CVSearchResult>;
}

// ===== GUARDS DE TIPO =====

export const isValidUUID = (uuid: string): boolean => {
  return CV_UPLOAD_CONSTANTS.UUID_REGEX.test(uuid);
};

export const isValidCedula = (cedula: string): boolean => {
  return cedula.length >= CV_UPLOAD_CONSTANTS.MIN_CEDULA_LENGTH && 
         cedula.length <= CV_UPLOAD_CONSTANTS.MAX_CEDULA_LENGTH &&
         /^\d+$/.test(cedula);
};

export const isValidFile = (file: File): boolean => {
  return CV_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.type) &&
         file.size <= CV_UPLOAD_CONSTANTS.MAX_FILE_SIZE;
};

export const isCVDocument = (doc: any): doc is CVDocumentMetadata => {
  return doc && 
         typeof doc.id === 'string' &&
         typeof doc.employeeUuid === 'string' &&
         typeof doc.employeeName === 'string' &&
         typeof doc.employeeCedula === 'string' &&
         doc.documentType === DocumentType.CV;
};

// ===== UTILIDADES =====

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatUploadDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateFileName = (
  originalName: string,
  employeeCedula: string,
  documentType: string = DocumentType.CV
): string => {
  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  
  return `${year}_${employeeCedula}_${documentType}_${timestamp}_${baseName}${extension}`;
};

export const createDocumentUrls = (documentId: string, baseUrl = 'http://localhost:12345') => {
  return {
    download: `${baseUrl}/api/retrieval/download/${documentId}`,
    view: `${baseUrl}/api/retrieval/view/${documentId}`,
    search: `${baseUrl}/api/retrieval/advanced-search`
  };
};

// ===== VALIDADORES =====

export const validateTeacherData = (data: Partial<TeacherData>): TeacherDataValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.uuid) {
    errors.push({
      field: 'uuid',
      message: 'El UUID del docente es requerido',
      code: 'REQUIRED'
    });
  } else if (!isValidUUID(data.uuid)) {
    errors.push({
      field: 'uuid',
      message: 'El UUID no tiene un formato válido',
      code: 'INVALID_FORMAT'
    });
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'El nombre del docente es requerido',
      code: 'REQUIRED'
    });
  } else if (data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'El nombre debe tener al menos 2 caracteres',
      code: 'MIN_LENGTH'
    });
  }

  if (!data.cedula) {
    errors.push({
      field: 'cedula',
      message: 'La cédula es requerida',
      code: 'REQUIRED'
    });
  } else if (!isValidCedula(data.cedula)) {
    errors.push({
      field: 'cedula',
      message: 'La cédula debe tener entre 8 y 12 dígitos',
      code: 'INVALID_FORMAT'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateFile = (file: File | null): FileValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!file) {
    errors.push({
      field: 'file',
      message: 'Debe seleccionar un archivo',
      code: 'REQUIRED'
    });
    return { valid: false, errors, warnings };
  }

  if (!CV_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: 'Solo se permiten archivos PDF',
      code: 'INVALID_TYPE'
    });
  }

  if (file.size > CV_UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `El archivo no puede superar ${formatFileSize(CV_UPLOAD_CONSTANTS.MAX_FILE_SIZE)}`,
      code: 'FILE_TOO_LARGE'
    });
  }

  if (file.size < 1024) {
    warnings.push('El archivo parece muy pequeño, asegúrese de que sea un PDF válido');
  }

  if (file.name.length > 255) {
    warnings.push('El nombre del archivo es muy largo');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
```

## 📋 Ejemplo de Uso de Tipos

```typescript
// Ejemplo de implementación con tipos
import { 
  CVUploadData, 
  CVUploadResponse, 
  useDocumentUpload,
  validateTeacherData,
  validateFile,
  CV_UPLOAD_CONSTANTS 
} from './types/cvUpload.types';

const ExampleUsage: React.FC = () => {
  const { uploadDocument, loading, error } = useDocumentUpload({
    baseUrl: 'http://localhost:12345/api/documents'
  });

  const handleUpload = async (data: CVUploadData) => {
    // Validar datos del docente
    const teacherValidation = validateTeacherData({
      uuid: data.employeeUuid,
      name: data.employeeName,
      cedula: data.employeeCedula
    });

    if (!teacherValidation.valid) {
      console.error('Errores en datos del docente:', teacherValidation.errors);
      return;
    }

    // Validar archivo
    const fileValidation = validateFile(data.file);
    if (!fileValidation.valid) {
      console.error('Errores en archivo:', fileValidation.errors);
      return;
    }

    try {
      const response: CVUploadResponse = await uploadDocument(data);
      console.log('Documento subido:', response.document);
    } catch (error) {
      console.error('Error subiendo documento:', error);
    }
  };

  return (
    <div>
      {/* Tu componente aquí */}
    </div>
  );
};
```

Esta documentación de tipos te da una base sólida y type-safe para trabajar con la subida de hojas de vida en TypeScript! 🎯