# Pruebas de la API de Documentos

## Configuración de Pruebas

Asegúrate de que el servidor esté ejecutándose en el puerto 12345.

## Comandos de Prueba

### 1. Crear un archivo de prueba PDF (opcional)
```bash
# Si tienes un PDF de prueba, úsalo. Si no, puedes crear un archivo de texto:
echo "Este es un documento de prueba con contenido importante para buscar." > test_document.txt
```

### 2. Subir un documento
```bash
curl -X POST "http://localhost:12345/api/documents/upload" \
  -F "document=@test_document.txt" \
  -F "title=Documento de Prueba" \
  -F "description=Un documento para probar la funcionalidad" \
  -F "category=pruebas" \
  -F "tags=test,importante,demo"
```

### 3. Obtener todos los documentos
```bash
curl "http://localhost:12345/api/documents/"
```

### 4. Buscar documentos
```bash
# Buscar por texto
curl "http://localhost:12345/api/retrieval/search?text=prueba"

# Buscar por categoría
curl "http://localhost:12345/api/retrieval/search?category=pruebas"

# Buscar por tags
curl "http://localhost:12345/api/retrieval/tags?tags=test"
```

### 5. Obtener estadísticas
```bash
curl "http://localhost:12345/api/retrieval/stats"
```

### 6. Obtener documentos recientes
```bash
curl "http://localhost:12345/api/retrieval/recent?limit=5"
```

### 7. Descargar documento (reemplaza {ID} con un ID real)
```bash
curl "http://localhost:12345/api/retrieval/download/{ID}" -o downloaded_document.txt
```

### 8. Subir múltiples documentos
```bash
# Crear varios archivos de prueba
echo "Documento 1" > doc1.txt
echo "Documento 2" > doc2.txt

curl -X POST "http://localhost:12345/api/documents/upload-multiple" \
  -F "documents=@doc1.txt" \
  -F "documents=@doc2.txt"
```

## Pruebas con Herramientas GUI

### Postman/Insomnia

1. **POST** `http://localhost:12345/api/documents/upload`
   - Body: form-data
   - document: [seleccionar archivo]
   - title: "Mi Documento"
   - category: "test"
   - tags: "importante,demo"

2. **GET** `http://localhost:12345/api/retrieval/search?text=importante`

3. **GET** `http://localhost:12345/api/retrieval/stats`

## Respuestas Esperadas

### Subida exitosa:
```json
{
  "message": "Documento subido exitosamente",
  "document": {
    "id": "uuid-generado",
    "title": "Documento de Prueba",
    "filename": "document-123456789.txt",
    "originalName": "test_document.txt",
    "size": 58,
    "mimetype": "text/plain",
    "uploadDate": "2024-10-02T18:17:00.000Z",
    "category": "pruebas",
    "tags": ["test", "importante", "demo"],
    "keywords": ["documento", "prueba", "contenido", "importante", "buscar"]
  }
}
```

### Búsqueda exitosa:
```json
{
  "documents": [...],
  "count": 1,
  "query": {
    "text": "prueba",
    "includeContent": false
  }
}
```

### Estadísticas:
```json
{
  "stats": {
    "totalDocuments": 1,
    "totalSize": 58,
    "averageSize": 58,
    "categories": {
      "pruebas": 1
    },
    "mimeTypes": {
      "text/plain": 1
    }
  }
}
```