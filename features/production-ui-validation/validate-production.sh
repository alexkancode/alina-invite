#!/bin/bash
# Production UI Validation Script
# Automates comprehensive validation of dynamic music search deployment

set -e

PRODUCTION_URL="https://yait.social"
EVIDENCE_DIR="$(dirname "$0")/evidence"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔍 Starting Production UI Validation - $TIMESTAMP"
echo "📍 Target: $PRODUCTION_URL"
echo "📁 Evidence: $EVIDENCE_DIR"

# Create evidence directories
mkdir -p "$EVIDENCE_DIR/network-traces" "$EVIDENCE_DIR/performance-data"

# 1. Test API Functionality
echo "
## 1. API Integration Testing"
echo "Testing music search API endpoints..."

API_TEST_RESULTS="$EVIDENCE_DIR/performance-data/api-test-results.json"
{
  echo "{"
  echo "  \"timestamp\": \"$(date -Iseconds)\","
  echo "  \"tests\": ["

  # Test 1: Basic search
  echo "    {"
  echo "      \"query\": \"dancing queen\","
  echo "      \"maxResults\": 1,"
  RESPONSE_TIME=$(time (curl -s "$PRODUCTION_URL/api/music-search?q=dancing%20queen&maxResults=1" > /tmp/api_test1.json) 2>&1 | grep real | awk '{print $2}')
  echo "      \"responseTime\": \"$RESPONSE_TIME\","
  echo "      \"response\": $(cat /tmp/api_test1.json),"
  SONG_COUNT=$(cat /tmp/api_test1.json | grep -o '"songs":\[.*\]' | grep -o '},{' | wc -l)
  echo "      \"songCount\": $SONG_COUNT"
  echo "    },"

  # Test 2: Broader search
  echo "    {"
  echo "      \"query\": \"queen\","
  echo "      \"maxResults\": 3,"
  RESPONSE_TIME=$(time (curl -s "$PRODUCTION_URL/api/music-search?q=queen&maxResults=3" > /tmp/api_test2.json) 2>&1 | grep real | awk '{print $2}')
  echo "      \"responseTime\": \"$RESPONSE_TIME\","
  echo "      \"response\": $(cat /tmp/api_test2.json),"
  SONG_COUNT=$(cat /tmp/api_test2.json | grep -o '"songs":\[.*\]' | grep -o '},{' | wc -l)
  echo "      \"songCount\": $SONG_COUNT"
  echo "    }"

  echo "  ]"
  echo "}"
} > "$API_TEST_RESULTS"

echo "✅ API test results saved to $API_TEST_RESULTS"

# 2. UI Component Analysis
echo "
## 2. UI Component Analysis"
echo "Fetching production page source..."

PAGE_SOURCE="$EVIDENCE_DIR/network-traces/production-page-$TIMESTAMP.html"
curl -s "$PRODUCTION_URL" > "$PAGE_SOURCE"

echo "🔍 Analyzing music search component..."
MUSIC_WIDGET_HTML="$EVIDENCE_DIR/network-traces/music-widget-component.html"
grep -A10 -B5 "music-search-widget\|select.*groovy\|favoriteSong" "$PAGE_SOURCE" > "$MUSIC_WIDGET_HTML" || echo "Music widget not found"

# Check for dynamic vs static implementation
if grep -q "music-search-widget.*select.*option" "$PAGE_SOURCE"; then
  UI_TYPE="static_dropdown"
  echo "❌ FOUND: Static dropdown implementation"
elif grep -q "music-search-widget.*input\|search.*input" "$PAGE_SOURCE"; then
  UI_TYPE="dynamic_search"
  echo "✅ FOUND: Dynamic search implementation"
else
  UI_TYPE="unknown"
  echo "⚠️  UNKNOWN: Could not determine UI implementation type"
fi

# 3. Generate Validation Report
echo "
## 3. Generating Validation Report"
VALIDATION_REPORT="$EVIDENCE_DIR/validation-report-$TIMESTAMP.md"
{
  echo "# Production Validation Report"
  echo "**Date**: $(date)"
  echo "**Production URL**: $PRODUCTION_URL"
  echo "**Validation Status**: $(if [ "$UI_TYPE" = "dynamic_search" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)"
  echo ""

  echo "## Summary"
  echo "- **UI Implementation**: $UI_TYPE"
  echo "- **API Functionality**: $(if [ -s /tmp/api_test1.json ]; then echo "Responding"; else echo "Not responding"; fi)"
  echo "- **Song Results**: $(cat /tmp/api_test1.json | grep -o '"totalFound":[0-9]*' | cut -d':' -f2) found"
  echo ""

  echo "## Evidence Files"
  echo "- Page Source: [production-page-$TIMESTAMP.html](network-traces/production-page-$TIMESTAMP.html)"
  echo "- API Tests: [api-test-results.json](performance-data/api-test-results.json)"
  echo "- Component HTML: [music-widget-component.html](network-traces/music-widget-component.html)"
  echo ""

  echo "## Recommendations"
  if [ "$UI_TYPE" = "static_dropdown" ]; then
    echo "❌ **CRITICAL**: Dynamic search component not deployed"
    echo "- Verify MusicSearchWidget.astro changes are committed"
    echo "- Confirm Railway deployment included component updates"
    echo "- Re-deploy with proper component integration"
  fi

  SONG_COUNT=$(cat /tmp/api_test1.json | grep -o '"totalFound":[0-9]*' | cut -d':' -f2)
  if [ "$SONG_COUNT" = "0" ]; then
    echo "❌ **API ISSUE**: No songs returned from Spotify integration"
    echo "- Check Spotify credentials in Railway environment"
    echo "- Verify feature flag configuration"
    echo "- Test API authentication flow"
  fi
} > "$VALIDATION_REPORT"

echo "📄 Validation report: $VALIDATION_REPORT"

# 4. Summary
echo "
## Validation Complete"
echo "**UI Type Detected**: $UI_TYPE"
echo "**Evidence Directory**: $EVIDENCE_DIR"

if [ "$UI_TYPE" = "dynamic_search" ]; then
  echo "🎉 SUCCESS: Dynamic search component deployed correctly"
  exit 0
else
  echo "💥 FAILURE: Production validation failed - see report for details"
  exit 1
fi