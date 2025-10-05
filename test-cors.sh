#!/bin/bash

# Script para probar los endpoints con CORS
API_BASE="http://localhost:3000"
FRONTEND_ORIGIN="https://demo.facilcreditos.co"

echo "🧪 Probando endpoints de la API con CORS..."
echo "=================================="

# Test 1: Health check
echo "1. Probando health check..."
curl -v \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$API_BASE/health"

echo -e "\n\n"

# Test 2: Preflight request para upload
echo "2. Probando preflight request para upload..."
curl -v \
  -X OPTIONS \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$API_BASE/api/documents/upload"

echo -e "\n\n"

# Test 3: Listar documentos
echo "3. Probando GET documentos..."
curl -v \
  -H "Origin: $FRONTEND_ORIGIN" \
  "$API_BASE/api/documents/"

echo -e "\n\n"
echo "✅ Tests completados"