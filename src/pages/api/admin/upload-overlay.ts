import type { APIRoute } from 'astro';
import { OverlaySecurityValidator } from '../../../lib/overlay/securityValidator.js';
import { OverlayImageOptimizer } from '../../../lib/overlay/imageOptimizer.js';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getDatabase } from '../../../lib/database.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Multipart form data required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('overlay') as File;

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No overlay file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validator = new OverlaySecurityValidator();
    const validationResult = await validator.validateUpload(file);

    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        error: 'File validation failed',
        details: validationResult.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const overlayDir = path.join(process.cwd(), 'public', 'overlays');
    await mkdir(overlayDir, { recursive: true });

    const originalFilename = `${Date.now()}-${validationResult.securityHash.substring(0, 8)}.jpg`;
    const originalPath = path.join(overlayDir, originalFilename);

    const fileBuffer = await file.arrayBuffer();
    await writeFile(originalPath, new Uint8Array(fileBuffer));

    const optimizer = new OverlayImageOptimizer();
    const pipeline = await optimizer.createProcessingPipeline(originalPath, overlayDir);

    const db = getDatabase();
    const result = await db.query(`
      INSERT INTO overlay_assets (
        original_name,
        storage_path,
        file_size,
        content_type,
        security_hash,
        jpeg_path,
        active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, original_name, jpeg_path, blend_mode, opacity, active
    `, [
      file.name,
      `/overlays/${originalFilename}`,
      file.size,
      validationResult.contentType,
      validationResult.securityHash,
      `/overlays/${originalFilename}`,
      false
    ]);

    const overlayAsset = result.rows[0];

    return new Response(JSON.stringify({
      success: true,
      overlay: {
        id: overlayAsset.id,
        originalName: overlayAsset.original_name,
        previewPath: overlayAsset.jpeg_path,
        blendMode: overlayAsset.blend_mode,
        opacity: overlayAsset.opacity,
        active: overlayAsset.active
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload overlay error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error during upload'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};