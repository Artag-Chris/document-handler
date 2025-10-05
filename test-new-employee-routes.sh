#!/bin/bash

# Script para probar las nuevas rutas de empleado
echo "🧪 PRUEBAS DE RUTAS POR EMPLEADO UUID"
echo "===================================="

# Variables
API_PORT=6133
EMPLOYEE_UUID="3389ecbe-a18c-11f0-99f3-0242ac120002"
API_BASE="http://localhost:$API_PORT"

echo "📋 Configuración:"
echo "- API: $API_BASE"
echo "- UUID Empleado: $EMPLOYEE_UUID"
echo ""

# Función para hacer requests y mostrar resultado
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    
    echo "🔍 Probando: $name"
    echo "   Endpoint: $method $endpoint"
    
    if command -v jq >/dev/null 2>&1; then
        curl -s -X "$method" "$endpoint" | jq . 2>/dev/null || echo "❌ Error o respuesta no válida"
    else
        curl -s -X "$method" "$endpoint" || echo "❌ Error en la request"
    fi
    
    echo ""
    echo "----------------------------------------"
}

echo "1. 🧪 Validando UUID del empleado..."
test_endpoint "Validación UUID" "$API_BASE/validate-uuid/$EMPLOYEE_UUID"

echo "2. 📄 Obteniendo documentos del empleado..."
test_endpoint "Documentos del empleado" "$API_BASE/api/documents/employee/$EMPLOYEE_UUID"

echo "3. 📄 Documentos del empleado con paginación..."
test_endpoint "Documentos paginados" "$API_BASE/api/documents/employee/$EMPLOYEE_UUID?page=1&limit=5&sortBy=title&sortOrder=asc"

echo "4. 🔍 Búsqueda en documentos del empleado (ruta retrieval)..."
test_endpoint "Todos los documentos (retrieval)" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID"

echo "5. 🔍 Búsqueda por tipo de documento..."
test_endpoint "Búsqueda por tipo" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID/search?documentType=contratos"

echo "6. 🔍 Búsqueda por texto..."
test_endpoint "Búsqueda por texto" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID/search?text=contrato"

echo "7. 🔍 Búsqueda por categoría..."
test_endpoint "Búsqueda por categoría" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID/search?category=curriculum-vitae"

echo "8. 🔍 Búsqueda por rango de fechas..."
test_endpoint "Búsqueda por fechas" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID/search?dateFrom=2025-01-01&dateTo=2025-12-31"

echo "9. 🔍 Búsqueda avanzada con múltiples filtros..."
test_endpoint "Búsqueda avanzada" "$API_BASE/api/retrieval/employee/$EMPLOYEE_UUID/search?text=contrato&documentType=contratos&page=1&limit=10"

echo "10. ❌ Probando con UUID inválido..."
test_endpoint "UUID inválido" "$API_BASE/api/documents/employee/invalid-uuid"

echo "✅ Pruebas completadas!"
echo ""
echo "📝 NOTAS:"
echo "- Si ves errores 404, es normal si no hay documentos para ese empleado"
echo "- Si ves errores 500, hay un problema en el servidor"
echo "- Si ves errores de conexión, verifica que el servidor esté corriendo"
echo ""
echo "🚀 Para usar desde el frontend:"
echo "   const response = await fetch('$API_BASE/api/documents/employee/$EMPLOYEE_UUID');"
echo "   const data = await response.json();"
echo "   console.log(data.documents);"