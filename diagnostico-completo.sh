#!/bin/bash

echo "🔧 DIAGNÓSTICO COMPLETO DE SIGED DOCUMENT HANDLER"
echo "================================================="

# Variables
API_PORT=6133
ES_PORT=9200

echo "📋 1. Verificando servicios activos..."
echo "----------------------------------------"

# Verificar si los contenedores están corriendo
echo "🐳 Contenedores Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(elasticsearch|siged-document-handler)"

echo -e "\n📡 2. Verificando conectividad de red..."
echo "----------------------------------------"

# Verificar puertos abiertos
echo "🔌 Puerto API (6133):"
nc -z localhost $API_PORT && echo "✅ API disponible" || echo "❌ API no disponible"

echo "🔌 Puerto Elasticsearch (9200):"
nc -z localhost $ES_PORT && echo "✅ Elasticsearch disponible" || echo "❌ Elasticsearch no disponible"

echo -e "\n🌐 3. Probando endpoints..."
echo "----------------------------------------"

# Health check de la API
echo "🏥 Health check API:"
curl -s "http://localhost:$API_PORT/health" | jq . || echo "❌ No responde o JSON inválido"

# Test de conexión Elasticsearch
echo -e "\n🔍 Test Elasticsearch desde API:"
curl -s "http://localhost:$API_PORT/api/elasticsearch/test-connection" | jq . || echo "❌ No responde o JSON inválido"

# Health check directo de Elasticsearch
echo -e "\n📊 Health Elasticsearch directo:"
curl -s "http://localhost:$ES_PORT/_cluster/health" | jq . || echo "❌ No responde o JSON inválido"

echo -e "\n🧪 4. Test de CORS..."
echo "----------------------------------------"

# Test CORS con origen del frontend
echo "🌐 CORS desde demo.facilcreditos.co:"
curl -v -H "Origin: https://demo.facilcreditos.co" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS "http://localhost:$API_PORT/api/documents/upload" 2>&1 | grep -i "access-control"

echo -e "\n📁 5. Verificando estructura de uploads..."
echo "----------------------------------------"
ls -la uploads/ 2>/dev/null || echo "ℹ️ Directorio uploads no existe aún"

echo -e "\n✅ Diagnóstico completado"
echo "================================================="

echo -e "\n📝 RESUMEN DE CONFIGURACIÓN:"
echo "- API: http://localhost:$API_PORT"
echo "- Elasticsearch: http://localhost:$ES_PORT"
echo "- Documentos: http://localhost:$API_PORT/api/documents/upload"
echo "- Test ES: http://localhost:$API_PORT/api/elasticsearch/test-connection"