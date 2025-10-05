#!/bin/bash

echo "🧪 Testing Document Handler API Routes"
echo "======================================="

# Función para hacer requests y mostrar resultados
test_route() {
    local method=$1
    local url=$2
    local description=$3
    
    echo ""
    echo "📍 Testing: $description"
    echo "🔗 URL: $url"
    echo "⚙️ Method: $method"
    echo "---"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$url" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    # Separar cuerpo y código de estado
    body=$(echo "$response" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')
    status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo "✅ SUCCESS - Status: $status"
        echo "$body" | head -10
    elif [ "$status" = "404" ]; then
        echo "❌ NOT FOUND - Status: $status"
        echo "$body"
    elif [ "$status" = "500" ]; then
        echo "🔥 SERVER ERROR - Status: $status"
        echo "$body"
    else
        echo "⚠️ UNEXPECTED - Status: $status"
        echo "$body"
    fi
    echo "---"
}

# Base URL for local testing
BASE_URL="http://localhost:3000"

# Test 1: Health check
test_route "GET" "$BASE_URL/api/health" "Health Check"

# Test 2: Employee-specific documents (Documents Route)
test_route "GET" "$BASE_URL/api/documents/employee/3389ecbe-a18c-11f0-99f3-0242ac120002" "Employee Documents (Documents Route)"

# Test 3: Employee-specific documents (Retrieval Route)
test_route "GET" "$BASE_URL/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002" "Employee Documents (Retrieval Route)"

# Test 4: Employee search (Retrieval Route)
test_route "GET" "$BASE_URL/api/retrieval/employee/3389ecbe-a18c-11f0-99f3-0242ac120002/search?q=prueba" "Employee Document Search"

# Test 5: General document search
test_route "GET" "$BASE_URL/api/documents/search?query=finova" "General Document Search"

# Test 6: All documents
test_route "GET" "$BASE_URL/api/documents?limit=5" "All Documents (Limited)"

echo ""
echo "🏁 Test completed!"
echo ""
echo "📋 NOTES:"
echo "- If server is not running, all tests will fail with connection errors"
echo "- Employee UUID being tested: 3389ecbe-a18c-11f0-99f3-0242ac120002"
echo "- Frontend should use these exact URLs (without duplication)"
echo ""
echo "🔧 To start the server:"
echo "npm run dev"
echo ""