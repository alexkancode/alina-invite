#!/bin/bash
# Comprehensive Spotify API Smoke Tests
# Tests both local and production endpoints

API_PROD="https://yait.social/api/music-search"
API_LOCAL="http://localhost:4321/api/music-search"

PASS=0
FAIL=0

test_endpoint() {
  local base="$1"
  local name="$2"
  local query="$3"
  local expected="$4"

  echo "Testing $name: $query"

  # Make request and capture timing
  response=$(curl -w "Status: %{http_code}, Time: %{time_total}s" \
                  -s "$base?q=$query&maxResults=3" 2>/dev/null)

  status=$(echo "$response" | tail -1 | grep -o "Status: [0-9]*" | cut -d' ' -f2)
  body=$(echo "$response" | head -n -1)

  # Check status code
  if [ "$status" = "200" ]; then
    echo "  ✅ HTTP Status: $status"

    # Check response format
    if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
      echo "  ✅ Valid JSON with success field"

      # Check for expected content
      if echo "$body" | grep -qi "$expected"; then
        echo "  ✅ Contains expected content: $expected"
        ((PASS++))
      else
        echo "  ❌ Missing expected content: $expected"
        echo "  Response: $(echo "$body" | head -c 100)..."
        ((FAIL++))
      fi
    else
      echo "  ❌ Invalid JSON response"
      echo "  Response: $(echo "$body" | head -c 100)..."
      ((FAIL++))
    fi
  else
    echo "  ❌ HTTP Status: $status (expected 200)"
    echo "  Response: $(echo "$body" | head -c 100)..."
    ((FAIL++))
  fi

  echo ""
}

# Test happy path scenarios
echo "=== Spotify API Smoke Tests ==="
echo "Timestamp: $(date)"
echo ""

echo "🔍 Testing Production (https://yait.social)"
test_endpoint "$API_PROD" "Production - Queen Search" "queen" "Queen"
test_endpoint "$API_PROD" "Production - ABBA Search" "abba" "ABBA\|Dancing Queen"
test_endpoint "$API_PROD" "Production - Bee Gees Search" "bee gees" "Bee Gees\|Stayin"

echo "🔍 Testing Local (localhost:4321)"
test_endpoint "$API_LOCAL" "Local - Queen Search" "queen" "Queen"
test_endpoint "$API_LOCAL" "Local - ABBA Search" "abba" "ABBA\|Dancing Queen"
test_endpoint "$API_LOCAL" "Local - Bee Gees Search" "bee gees" "Bee Gees\|Stayin"

# Test edge cases
echo "🧪 Testing Edge Cases"
echo ""

test_edge_case() {
  local base="$1"
  local name="$2"
  local query="$3"
  local expected_status="$4"

  echo "Testing $name: $query"

  response=$(curl -w "Status: %{http_code}" -s "$base?q=$query" 2>/dev/null)
  status=$(echo "$response" | tail -1 | grep -o "Status: [0-9]*" | cut -d' ' -f2)

  if [ "$status" = "$expected_status" ]; then
    echo "  ✅ Status: $status (expected)"
    ((PASS++))
  else
    echo "  ❌ Status: $status (expected $expected_status)"
    ((FAIL++))
  fi
  echo ""
}

test_edge_case "$API_PROD" "Production - Empty Query" "" "400"
test_edge_case "$API_PROD" "Production - Special Characters" "don't stop" "200"
test_edge_case "$API_LOCAL" "Local - Empty Query" "" "400"
test_edge_case "$API_LOCAL" "Local - Special Characters" "don't stop" "200"

# Summary
echo "==============================================="
echo "Test Results: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed! Spotify API is working correctly."
  exit 0
else
  echo "❌ Some tests failed. Check the output above for details."
  exit 1
fi