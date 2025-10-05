#!/bin/bash

# Test rápido para verificar tu UUID específico
UUID="3389ecbe-a18c-11f0-99f3-0242ac120002"
API_PORT=6133

echo "🧪 Probando UUID: $UUID"
echo "========================================"

# 1. Test del endpoint de validación
echo "1. 🔍 Validando UUID a través del endpoint:"
curl -s "http://localhost:$API_PORT/validate-uuid/$UUID" | jq . || echo "Endpoint no disponible"

echo -e "\n2. 📝 Información técnica del UUID:"
echo "   UUID: $UUID"
echo "   Longitud: ${#UUID} caracteres"
echo "   Versión: ${UUID:14:1}"
echo "   Variant: ${UUID:19:1}"

echo -e "\n3. ✅ Análisis:"
if [[ ${#UUID} -eq 36 ]]; then
    echo "   ✓ Longitud correcta (36 caracteres)"
else
    echo "   ✗ Longitud incorrecta (debe ser 36)"
fi

VERSION=${UUID:14:1}
if [[ $VERSION =~ [1-5] ]]; then
    echo "   ✓ Versión válida (v$VERSION)"
else
    echo "   ✗ Versión inválida ($VERSION)"
fi

VARIANT=${UUID:19:1}
if [[ $VARIANT =~ [89abAB] ]]; then
    echo "   ✓ Variant válido ($VARIANT)"
else
    echo "   ✗ Variant inválido ($VARIANT)"
fi

if [[ $UUID =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$ ]]; then
    echo -e "\n🎉 ¡Tu UUID es VÁLIDO y debería funcionar!"
else
    echo -e "\n❌ Tu UUID tiene algún problema de formato"
fi

echo -e "\n4. 🧪 Test de upload (simulado):"
echo "Para probar con un archivo real, usa:"
echo "curl -X POST \\"
echo "  -F \"document=@tu-archivo.pdf\" \\"
echo "  -F \"employeeUuid=$UUID\" \\"
echo "  -F \"title=Test Document\" \\"
echo "  http://localhost:$API_PORT/api/documents/upload"