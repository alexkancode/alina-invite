import { itunesPreviewService } from '../../lib/itunesPreviewService.js';
import { createProductionService } from '../../lib/feature-flags/factory.js';

export async function GET(request: Request): Promise<Response> {
  const featureFlagService = createProductionService();
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
  const title = url.searchParams.get('title')?.trim();
  const artist = url.searchParams.get('artist')?.trim();

  if (!title || !artist) {
    return new Response(JSON.stringify({ error: 'Title and artist are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const preview = await itunesPreviewService.findPreview(title, artist);

    return new Response(JSON.stringify({ success: preview !== null, preview }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.warn('Preview lookup error:', error);

    return new Response(JSON.stringify({ success: false, preview: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
