#!/bin/bash

# Test para las nuevas rutas de búsqueda por UUID de empleado
UUID="3389ecbe-a18c-11f0-99f3-0242ac120002"
API_BASE="http://localhost:6133"

echo "🧪 Testing Employee UUID Routes"
echo "======================================"
echo "UUID de prueba: $UUID"
echo ""

# 1. Validar UUID
echo "1. 🔍 Validando UUID..."
curl -s "$API_BASE/validate-uuid/$UUID" | jq '.validation' || echo "Endpoint no disponible"
echo ""

# 2. Obtener documentos del empleado (ruta principal)
echo "2. 📄 Obteniendo documentos del empleado (ruta principal)..."
curl -s "$API_BASE/api/documents/employee/$UUID" | jq '{
  employeeUuid: .employeeUuid,
  totalDocuments: (.documents | length),
  pagination: .pagination,
  employeeInfo: .meta.employeeInfo
}' || echo "Error en la consulta"
echo ""

# 3. Obtener documentos del empleado (ruta retrieval)
echo "3. 📄 Obteniendo documentos del empleado (ruta retrieval)..."
curl -s "$API_BASE/api/retrieval/employee/$UUID" | jq '{
  employeeUuid: .employeeUuid,
  totalDocuments: (.documents | length),
  pagination: .pagination,
  employeeInfo: .meta.employeeInfo
}' || echo "Error en la consulta"
echo ""

# 4. Buscar "contrato" en documentos del empleado
echo "4. 🔍 Buscando 'contrato' en documentos del empleado..."
curl -s "$API_BASE/api/retrieval/employee/$UUID/search?text=contrato" | jq '{
  searchQuery: .searchQuery,
  totalResults: (.documents | length),
  documents: [.documents[] | {id: .id, title: .title, score: .score}]
}' || echo "Error en la búsqueda"
echo ""

# 5. Buscar por tipo de documento "contratos"
echo "5. 📋 Buscando documentos tipo 'contratos'..."
curl -s "$API_BASE/api/retrieval/employee/$UUID/search?documentType=contratos" | jq '{
  searchQuery: .searchQuery,
  totalResults: (.documents | length),
  documents: [.documents[] | {id: .id, title: .title, documentType: .documentType}]
}' || echo "Error en la búsqueda"
echo ""

# 6. Buscar con paginación
echo "6. 📄 Probando paginación (página 1, límite 5)..."
curl -s "$API_BASE/api/documents/employee/$UUID?page=1&limit=5&sortBy=title&sortOrder=asc" | jq '{
  pagination: .pagination,
  documentsCount: (.documents | length),
  firstDocument: .documents[0].title // null
}' || echo "Error en la consulta"
echo ""

# 7. Test con UUID inválido
echo "7. ❌ Probando con UUID inválido..."
curl -s "$API_BASE/api/documents/employee/invalid-uuid" | jq '.error' || echo "Error en la consulta"
echo ""

# 8. Verificar CORS
echo "8. 🌐 Verificando CORS..."
curl -I -H "Origin: https://demo.facilcreditos.co" "$API_BASE/api/documents/employee/$UUID" 2>/dev/null | grep -i "access-control" || echo "Sin headers CORS detectados"
echo ""

echo "✅ Tests completados"
echo ""
echo "📋 Resumen de rutas disponibles:"
echo "   • GET /api/documents/employee/:uuid - Documentos del empleado"
echo "   • GET /api/retrieval/employee/:uuid - Documentos del empleado (retrieval)"
echo "   • GET /api/retrieval/employee/:uuid/search - Buscar en documentos del empleado"
echo "   • GET /validate-uuid/:uuid - Validar formato UUID"