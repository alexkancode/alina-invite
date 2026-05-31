import type { APIRoute } from 'astro';
import { getPendingPhotos, getPhotoStats } from '../../../lib/photoDatabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get query parameters
    const searchParams = url.searchParams;
    const type = searchParams.get('type') || 'pending';

    // In production, implement proper authentication here
    // For now, this endpoint is open for development

    if (type === 'pending') {
      const photos = await getPendingPhotos();
      return new Response(
        JSON.stringify({
          success: true,
          photos: photos,
          count: photos.length
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (type === 'stats') {
      const stats = await getPhotoStats();
      return new Response(
        JSON.stringify({
          success: true,
          stats: stats
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type parameter. Use "pending" or "stats"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in admin photos endpoint:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};