import type { NextApiRequest, NextApiResponse } from 'astro';
import { musicSearchService, type SearchResult } from '../../lib/musicSearchService.js';
import { FeatureFlagService } from '../../lib/feature-flags/service.js';

export async function GET(request: Request): Promise<Response> {
  // Check if music search feature is enabled
  const featureFlagService = FeatureFlagService.getInstance();
  const isMusicSearchEnabled = await featureFlagService.isEnabled('musicSearch');

  if (!isMusicSearchEnabled) {
    return new Response(JSON.stringify({
      error: 'Music search feature is disabled',
      code: 'FEATURE_DISABLED'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const includeSpotify = url.searchParams.get('includeSpotify') !== 'false';
  const spotifyPrimary = url.searchParams.get('spotifyPrimary') === 'true';
  const maxResults = parseInt(url.searchParams.get('maxResults') || '15');

  if (!query || query.trim() === '') {
    return new Response(JSON.stringify({ error: 'Search query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await musicSearchService.search70sSongs(query.trim(), {
      includeFallback: true,
      includeSpotify,
      spotifyPrimary,
      maxResults
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Music search error:', error);

    return new Response(JSON.stringify({
      success: false,
      songs: [],
      error: 'Search service temporarily unavailable',
      source: 'api'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}