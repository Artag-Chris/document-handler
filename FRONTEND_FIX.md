# 🔧 Corrección Inmediata para Error "MulterError: Unexpected field"

## 🚨 El Problema

Tu frontend está generando este error:
```
MulterError: Unexpected field
    at wrappedFileFilter (multer/index.js:40:19)
```

## ✅ La Solución

El backend está configurado para recibir el archivo con el campo `'document'`, NO `'file'`.

### 🔄 Cambios Necesarios en tu Frontend

Busca en tu código donde estás creando el FormData y cambia:

```typescript
// ❌ INCORRECTO - Lo que probablemente tienes ahora
formData.append('file', selectedFile);

// ✅ CORRECTO - Lo que necesitas
formData.append('document', selectedFile);
```

### 📱 Ejemplo Completo de Corrección

```typescript
const uploadCV = async (file: File, teacherData: any) => {
  const formData = new FormData();
  
  // ✅ CAMPO CRÍTICO - Debe ser 'document'
  formData.append('document', file);
  
  // ✅ Campos requeridos
  formData.append('employeeUuid', teacherData.uuid);
  formData.append('employeeName', teacherData.name);
  formData.append('employeeCedula', teacherData.cedula);
  
  // ✅ Campos opcionales
  formData.append('documentType', 'hojas-de-vida');
  formData.append('category', 'curriculum-vitae');
  
  try {
    const response = await fetch('http://localhost:12345/api/documents/upload', {
      method: 'POST',
      body: formData  // NO agregar Content-Type header, fetch lo hace automáticamente
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ CV subido exitosamente:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Error del servidor:', error);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    throw error;
  }
};
```

### 🔍 Verificación Rápida

Para verificar que estás enviando los campos correctos, agrega esto antes del fetch:

```typescript
// 🔍 Debug: verificar qué campos estás enviando
console.log('📋 Campos del FormData:');
for (let [key, value] of formData.entries()) {
  console.log(`  ${key}:`, value);
}
```

Deberías ver algo como:
```
📋 Campos del FormData:
  document: File { name: "cv.pdf", size: 1234567, type: "application/pdf" }
  employeeUuid: "123e4567-e89b-12d3-a456-426614174000"
  employeeName: "María Elena González Pérez"
  employeeCedula: "12345678"
  documentType: "hojas-de-vida"
  category: "curriculum-vitae"
```

### 🎯 Resumen de Campos del Backend

El backend de Multer está configurado para aceptar exactamente estos campos:

| Campo | Requerido | Tipo | Descripción |
|-------|-----------|------|-------------|
| `document` | ✅ | File | El archivo PDF (DEBE ser 'document') |
| `employeeUuid` | ✅ | string | UUID del docente |
| `employeeName` | ✅ | string | Nombre completo |
| `employeeCedula` | ✅ | string | Número de cédula |
| `documentType` | ❌ | string | Tipo de documento (default: 'documentos') |
| `category` | ❌ | string | Categoría del documento |
| `title` | ❌ | string | Título del documento |
| `description` | ❌ | string | Descripción |
| `tags` | ❌ | string[] | Tags (múltiples entradas) |

### 🚫 Campos que NO debes usar

Estos nombres de campo causarán el error "Unexpected field":
- ❌ `file`
- ❌ `upload`
- ❌ `cv`
- ❌ `pdf`
- ❌ `archivo`

### 🎉 Prueba Final

Después del cambio, tu subida debería funcionar y deberías ver en la consola del backend algo como:

```
📄 Documento procesado exitosamente: {
  id: "123e4567-...",
  employeeUuid: "1",
  documentType: "hojas-de-vida",
  year: 2025,
  path: "uploads\\2025\\1\\hojas-de-vida\\...",
  keywordsCount: 47,
  fileSize: 32345678,
  elasticsearchIndexed: true
}
```

¡Con este cambio tu error debería desaparecer completamente! 🎯