# 🔍 Guía Completa de Elasticsearch + Insomnia

## 🐳 **1. Verificar tu Docker de Elasticsearch**

Primero, necesitamos verificar los puertos de tu contenedor:

```bash
# Ver contenedores en ejecución
docker ps

# Ver puertos específicos del contenedor (reemplaza CONTAINER_ID)
docker port af6720d3023b

# Si no muestra puertos, revisar la configuración del contenedor
docker inspect af6720d3023b | grep -A 5 -B 5 "PortBindings"
```

## 🔗 **2. Puertos Comunes de Elasticsearch**

- **Puerto HTTP**: `9200` (API REST)
- **Puerto Transport**: `9300` (comunicación interna)

Si tu contenedor no tiene puertos mapeados, necesitas recrearlo:

```bash
# Detener contenedor actual
docker stop af6720d3023b

# Crear nuevo contenedor con puertos mapeados
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0
```

## 📡 **3. Configuración en Insomnia para Elasticsearch**

### **A. Probar la Conexión**

#### **Método 1: Directo a Elasticsearch**
```
Method: GET
URL: http://localhost:9200
```

#### **Método 2: A través de nuestra API**
```
Method: GET
URL: http://localhost:12345/api/elasticsearch/test-connection
```

### **B. Configurar Elasticsearch desde Insomnia**

Si tu Elasticsearch está en un puerto diferente:

```
Method: PUT
URL: http://localhost:12345/api/elasticsearch/config
Content-Type: application/json

Body:
{
  "host": "localhost",
  "port": 9200
}
```

### **C. Ver Configuración Actual**

```
Method: GET
URL: http://localhost:12345/api/elasticsearch/config
```

## 📋 **4. Endpoints de Elasticsearch en tu API**

### **🔧 Configuración y Conexión**

```bash
# Probar conexión
GET /api/elasticsearch/test-connection

# Ver configuración
GET /api/elasticsearch/config

# Actualizar configuración
PUT /api/elasticsearch/config
Body: {"host": "localhost", "port": 9200}

# Crear índice manualmente
POST /api/elasticsearch/create-index
Body: {"indexName": "documents-2025"}

# Ver estadísticas
GET /api/elasticsearch/stats?indexName=documents-2025
```

### **🔍 Búsquedas Avanzadas**

```bash
# Búsqueda simple por texto
GET /api/elasticsearch/search?text=contrato

# Búsqueda por empleado
GET /api/elasticsearch/search?employeeUuid=123e4567-e89b-12d3-a456-426614174000

# Búsqueda por tipo de documento
GET /api/elasticsearch/search?documentType=hojas

# Búsqueda combinada
GET /api/elasticsearch/search?text=contrato&employeeUuid=123e4567-e89b-12d3-a456-426614174000&documentType=contratos

# Búsqueda con paginación
GET /api/elasticsearch/search?text=documento&size=5&from=0

# Búsqueda por rango de fechas
GET /api/elasticsearch/search?dateFrom=2025-01-01&dateTo=2025-12-31
```

### **📄 Indexación Manual**

```bash
# Indexar documento específico
POST /api/elasticsearch/index-document
Body: {
  "documentId": "uuid-del-documento",
  "indexName": "documents-2025"
}
```

## 🧪 **5. Flujo Completo de Prueba en Insomnia**

### **Paso 1: Verificar Elasticsearch**
```
GET http://localhost:12345/api/elasticsearch/test-connection
```

**Respuesta esperada:**
```json
{
  "message": "Conexión exitosa con Elasticsearch",
  "status": "connected",
  "info": {
    "cluster": "docker-cluster",
    "version": "8.11.0",
    "lucene": "9.8.0"
  }
}
```

### **Paso 2: Subir un Documento**
```
POST http://localhost:12345/api/documents/upload
Content-Type: multipart/form-data

Form Data:
- document: [archivo.pdf]
- employeeUuid: 123e4567-e89b-12d3-a456-426614174000
- employeeName: Juan Pérez
- documentType: contratos
- title: Contrato de Trabajo 2025
```

**Respuesta esperada:**
```json
{
  "message": "Documento subido exitosamente",
  "document": {...},
  "elasticsearchData": {...},
  "indexInfo": {
    "suggestedIndex": "documents-2025",
    "readyForElasticsearch": true
  }
}
```

### **Paso 3: Buscar en Elasticsearch**
```
GET http://localhost:12345/api/elasticsearch/search?text=contrato&employeeUuid=123e4567-e89b-12d3-a456-426614174000
```

**Respuesta esperada:**
```json
{
  "documents": [
    {
      "id": "documento-uuid",
      "score": 1.5,
      "title": "Contrato de Trabajo 2025",
      "content": "contenido extraído...",
      "employeeUuid": "123e4567-e89b-12d3-a456-426614174000",
      "employeeName": "Juan Pérez",
      "documentType": "contratos",
      "keywords": ["contrato", "trabajo", "salario"]
    }
  ],
  "total": 1,
  "pagination": {
    "size": 10,
    "from": 0,
    "hasMore": false
  }
}
```

## 🔧 **6. Troubleshooting**

### **Error: "No se pudo conectar con Elasticsearch"**

1. **Verificar el contenedor:**
   ```bash
   docker ps | grep elasticsearch
   ```

2. **Verificar puertos:**
   ```bash
   docker port [container_id]
   ```

3. **Recrear contenedor con puertos:**
   ```bash
   docker stop [container_id]
   docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" elasticsearch:8.11.0
   ```

4. **Actualizar configuración desde Insomnia:**
   ```
   PUT /api/elasticsearch/config
   Body: {"host": "localhost", "port": 9200}
   ```

### **Error: "Índice no encontrado"**

```
POST /api/elasticsearch/create-index
Body: {"indexName": "documents-2025"}
```

### **Error: "Documento no indexado automáticamente"**

```
POST /api/elasticsearch/index-document
Body: {"documentId": "uuid-del-documento"}
```

## 🎯 **7. URLs de Referencia Rápida**

```bash
# Conexión
http://localhost:12345/api/elasticsearch/test-connection

# Configuración  
http://localhost:12345/api/elasticsearch/config

# Búsqueda básica
http://localhost:12345/api/elasticsearch/search?text=tu_busqueda

# Subir y autoindexar
http://localhost:12345/api/documents/upload

# Estadísticas
http://localhost:12345/api/elasticsearch/stats
```

## 🚀 **8. Automatización**

Una vez que subas un documento con `POST /api/documents/upload`, automáticamente:

1. ✅ Se guarda en la estructura de carpetas
2. ✅ Se extraen las keywords avanzadas  
3. ✅ Se intenta indexar en Elasticsearch
4. ✅ Se retornan los datos listos para usar

¡No necesitas hacer nada más! Solo asegúrate de que Elasticsearch esté corriendo en el puerto correcto.

## 🔍 **Ejemplo de Búsqueda Avanzada**

```
GET /api/elasticsearch/search?text=contrato trabajo&employeeUuid=123e4567-e89b-12d3-a456-426614174000&documentType=contratos&size=10&from=0
```

¡Con esto ya tienes integración completa entre tu API, Elasticsearch e Insomnia! 🎉