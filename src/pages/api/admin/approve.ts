import type { APIRoute } from 'astro';
import { approvePhoto, hidePhoto } from '../../../lib/photoDatabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { photoId, action } = body;

    // Validate input
    if (!photoId || typeof photoId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Photo ID is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Action must be either "approve" or "reject"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process the action
    if (action === 'approve') {
      await approvePhoto(photoId, true);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Photo ${photoId} has been approved successfully`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (action === 'reject') {
      await hidePhoto(photoId, 'Rejected by admin');
      return new Response(
        JSON.stringify({
          success: true,
          message: `Photo ${photoId} has been rejected and hidden`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in admin approve endpoint:', error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({ error: 'Photo not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};