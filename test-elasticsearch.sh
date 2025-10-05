#!/bin/bash

# Script para probar la conexión con Elasticsearch desde Docker
echo "🔍 Probando conectividad con Elasticsearch..."
echo "================================================"

# Variables
API_HOST="localhost:6133"  # Puerto del contenedor siged-document-handler
ES_HOST="elasticsearch:9200"  # Host interno de Docker

echo "1. 🌐 Probando conectividad directa desde el host..."
curl -f "http://localhost:9200" || echo "❌ No se puede conectar a Elasticsearch desde el host"

echo -e "\n\n2. 🧪 Probando endpoint de test de la API..."
curl -v "http://$API_HOST/api/elasticsearch/test-connection" || echo "❌ No se puede conectar al endpoint de test"

echo -e "\n\n3. 📊 Probando health check de Elasticsearch..."
curl -v "http://localhost:9200/_cluster/health" || echo "❌ No se puede obtener health de Elasticsearch"

echo -e "\n\n4. 🔧 Información de configuración actual..."
curl -v "http://$API_HOST/api/elasticsearch/config" || echo "❌ No se puede obtener configuración"

echo -e "\n\n✅ Tests completados"