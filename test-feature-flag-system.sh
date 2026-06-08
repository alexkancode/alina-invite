#!/bin/bash

echo "=== Testing Refactored Feature Flag System ==="
echo

# Test 1: Check initial feature flag status
echo "1. Check current feature flag status:"
npm run feature:status musicSearch
echo

# Test 2: Test API with feature enabled
echo "2. Test API with feature enabled:"
curl -s "http://localhost:4321/api/music-search?q=test&maxResults=1" | head -c 200
echo "..."
echo

# Test 3: Test UI with feature enabled
echo "3. Test UI with feature enabled:"
MUSIC_SEARCH_COUNT=$(curl -s "http://localhost:4321/" | grep -c "music-search")
echo "Music search widget occurrences in DOM: $MUSIC_SEARCH_COUNT"
echo

# Test 4: Disable feature flag
echo "4. Disable feature flag:"
npm run feature:disable musicSearch
echo

# Test 5: Restart server to pick up disabled flag (simulate in test)
echo "5. Test API with feature disabled (after simulated restart):"
# Note: In a real deployment, we'd restart the server here
# For testing, we'll just call the API which should now return disabled
curl -s "http://localhost:4321/api/music-search?q=test"
echo
echo

# Test 6: Test error handling with malformed requests
echo "6. Test API error handling:"
echo "6a. Empty query:"
curl -s "http://localhost:4321/api/music-search?q="
echo
echo

echo "6b. Invalid parameters:"
curl -s "http://localhost:4321/api/music-search?q=test&maxResults=abc" | head -c 200
echo "..."
echo
echo

# Test 7: Re-enable feature flag
echo "7. Re-enable feature flag:"
npm run feature:enable musicSearch
echo

# Test 8: List all feature flags
echo "8. List all feature flags:"
npm run feature:list
echo

# Test 9: Test with different flag values
echo "9. Test flag validation with invalid flag name:"
echo "Expected error for invalid flag:"
npm run feature:enable invalidFlag 2>&1 || echo "Correctly rejected invalid flag"
echo

# Test 10: Performance test - rapid API calls
echo "10. Performance test - rapid API calls:"
echo "Making 5 rapid API calls to test caching..."
for i in {1..5}; do
  START_TIME=$(date +%s%N)
  curl -s "http://localhost:4321/api/music-search?q=test$i&maxResults=1" > /dev/null
  END_TIME=$(date +%s%N)
  DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))
  echo "Call $i: ${DURATION}ms"
done
echo

echo "=== Feature Flag System Test Complete ==="

# Cleanup: Remove test files
rm -f contract-test-flags.json integration-test-flags.json test-*flags*.json 2>/dev/null || true
echo "Cleaned up test files"