# API de Gestión de Documentos

Esta API proporciona dos módulos principales para la gestión de documentos:

1. **Módulo de Documentos (Documents)**: Para subir y gestionar documentos
2. **Módulo de Recuperación (Retrieval)**: Para buscar y descargar documentos

## Características

- Soporte para múltiples tipos de archivos (PDF, DOC, DOCX, TXT)
- Extracción automática de texto de PDFs
- Generación de palabras clave automática
- Búsqueda avanzada por texto, categorías y etiquetas
- Descarga y visualización de documentos
- Estadísticas de documentos

## Configuración del Servidor

El servidor ha sido configurado para manejar archivos grandes:
- Límite de archivos: 500MB
- Timeout para operaciones largas: 10 minutos
- Soporte para múltiples archivos simultáneos

## Endpoints

### Módulo de Documentos (`/api/documents`)

#### Subir un documento
```
POST /api/documents/upload
Content-Type: multipart/form-data

Body:
- document: archivo (requerido)
- title: string (opcional)
- description: string (opcional)
- tags: string[] o string separado por comas (opcional)
- category: string (opcional)
```

#### Subir múltiples documentos
```
POST /api/documents/upload-multiple
Content-Type: multipart/form-data

Body:
- documents: archivo[] (requerido, máximo 5 archivos)
```

#### Obtener todos los documentos
```
GET /api/documents/
```

#### Buscar documentos
```
GET /api/documents/search?text=...&category=...&tags=...&dateFrom=...&dateTo=...
```

#### Obtener documento por ID
```
GET /api/documents/:id
```

#### Eliminar documento
```
DELETE /api/documents/:id
```

### Módulo de Recuperación (`/api/retrieval`)

#### Buscar documentos
```
GET /api/retrieval/search?text=...&category=...&tags=...&dateFrom=...&dateTo=...&includeContent=true
```

#### Obtener estadísticas
```
GET /api/retrieval/stats
```

#### Documentos recientes
```
GET /api/retrieval/recent?limit=10
```

#### Documentos por categoría
```
GET /api/retrieval/category/:category
```

#### Documentos por etiquetas
```
GET /api/retrieval/tags?tags=tag1&tags=tag2
```

#### Descargar documento
```
GET /api/retrieval/download/:id
```

#### Visualizar documento
```
GET /api/retrieval/view/:id
```

## Tipos de Archivo Soportados

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Texto plano (.txt)

## Ejemplo de Uso

### Subir un documento PDF:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "document=@mi_archivo.pdf" \
  -F "title=Mi Documento" \
  -F "category=informes" \
  -F "tags=importante,2024"
```

### Buscar documentos:
```bash
curl "http://localhost:3000/api/retrieval/search?text=contrato&category=legal"
```

### Descargar documento:
```bash
curl "http://localhost:3000/api/retrieval/download/123e4567-e89b-12d3-a456-426614174000" -o documento.pdf
```

## Respuestas de la API

### Éxito (200/201):
```json
{
  "message": "Documento subido exitosamente",
  "document": {
    "id": "uuid",
    "title": "string",
    "filename": "string",
    "originalName": "string",
    "size": number,
    "mimetype": "string",
    "uploadDate": "ISO date",
    "category": "string",
    "tags": ["string"],
    "keywords": ["string"]
  }
}
```

### Error (400/404/500):
```json
{
  "error": "Mensaje de error descriptivo"
}
```

## Instalación y Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. El servidor estará disponible en `http://localhost:3000`

## Estructura de Directorios

```
src/
├── documents/              # Módulo de subida de documentos
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   ├── documents.routes.ts
│   └── middlewares/
│       └── upload.middleware.ts
├── retrieval/              # Módulo de recuperación de documentos
│   ├── retrieval.controller.ts
│   ├── retrieval.service.ts
│   ├── retrieval.routes.ts
│   └── middlewares/
│       └── validation.middleware.ts
└── domain/
    └── dtos/
        └── documents.dto.ts
```

Los archivos subidos se almacenan en el directorio `uploads/` en la raíz del proyecto.