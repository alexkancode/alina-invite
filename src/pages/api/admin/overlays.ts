import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  getOverlayImages,
  saveOverlayMetadata,
  toggleOverlayStatus,
  deleteOverlay,
  getOverlayUsageStats,
  updateOverlaySettings,
  getOverlaySettings
} from '../../../lib/overlayDatabase';
import { processOverlayUpload, generateOverlayFilename } from '../../../lib/overlayProcessor';

export const prerender = false;

// GET: Retrieve overlay images and settings
export const GET: APIRoute = async ({ url }) => {
  const action = url.searchParams.get('action');

  try {
    switch (action) {
      case 'list': {
        const overlays = await getOverlayImages();
        return new Response(JSON.stringify({ overlays }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'stats': {
        const days = Number(url.searchParams.get('days')) || 7;
        const stats = await getOverlayUsageStats(days);
        return new Response(JSON.stringify({ stats }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'settings': {
        const settings = await getOverlaySettings();
        return new Response(JSON.stringify({ settings }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      default: {
        const overlays = await getOverlayImages();
        const settings = await getOverlaySettings();
        return new Response(JSON.stringify({ overlays, settings }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error('Overlay GET error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch overlay data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Upload new overlay image
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');

    if (!contentType?.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('overlay') as File;
    const displayName = formData.get('display_name') as string;
    const description = formData.get('description') as string;
    const opacity = Number(formData.get('opacity')) || 0.8;
    const blendMode = formData.get('blend_mode') as string || 'overlay';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!displayName) {
      return new Response(JSON.stringify({ error: 'Display name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'File must be an image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size must be less than 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID and filename
    const overlayId = randomBytes(16).toString('hex');
    const filename = generateOverlayFilename(file.name);

    // Save uploaded file temporarily
    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `temp-${overlayId}`);

    const buffer = await file.arrayBuffer();
    await fs.writeFile(tempPath, Buffer.from(buffer));

    // Process and save overlay
    const processingResult = await processOverlayUpload(tempPath, filename);

    if (!processingResult.success) {
      // Clean up temp file
      await fs.unlink(tempPath).catch(console.error);
      return new Response(JSON.stringify({
        error: 'Failed to process overlay image',
        details: processingResult.error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save metadata to database
    await saveOverlayMetadata({
      id: overlayId,
      filename,
      display_name: displayName.trim(),
      file_size: file.size,
      is_active: true,
      opacity: Math.max(0.1, Math.min(1.0, opacity)),
      blend_mode: blendMode,
      created_by: 'admin',
      description: description?.trim() || ''
    });

    // Clean up temp file
    await fs.unlink(tempPath).catch(console.error);

    return new Response(JSON.stringify({
      success: true,
      overlay: {
        id: overlayId,
        filename,
        display_name: displayName.trim(),
        file_size: file.size,
        is_active: true,
        opacity,
        blend_mode: blendMode,
        description: description?.trim() || ''
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Overlay upload error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to upload overlay',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT: Update overlay settings or toggle status
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, overlayId, settings } = body;

    switch (action) {
      case 'toggle': {
        if (!overlayId) {
          return new Response(JSON.stringify({ error: 'Overlay ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await toggleOverlayStatus(overlayId);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'update_settings': {
        if (!settings) {
          return new Response(JSON.stringify({ error: 'Settings data required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await updateOverlaySettings(settings);
        const updatedSettings = await getOverlaySettings();

        return new Response(JSON.stringify({
          success: true,
          settings: updatedSettings
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      default: {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error('Overlay update error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update overlay',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove overlay image
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const overlayId = url.searchParams.get('id');

    if (!overlayId) {
      return new Response(JSON.stringify({ error: 'Overlay ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get overlay info before deletion to clean up file
    const overlays = await getOverlayImages();
    const overlay = overlays.find(o => o.id === overlayId);

    await deleteOverlay(overlayId);

    // Clean up overlay file
    if (overlay) {
      const overlayPath = path.join(process.cwd(), 'public', 'admin', 'overlays', overlay.filename);
      await fs.unlink(overlayPath).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Overlay deletion error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete overlay',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};