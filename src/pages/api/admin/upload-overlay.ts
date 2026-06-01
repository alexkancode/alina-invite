import type { APIRoute } from 'astro';
import { OverlaySecurityValidator } from '../../../lib/overlay/securityValidator.ts';
import { OverlayImageOptimizer } from '../../../lib/overlay/imageOptimizer.ts';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '../../../lib/db.js';

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

    try {
      await mkdir(overlayDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create overlay directory:', error);
      throw new Error('Directory creation failed');
    }

    const originalFilename = `${Date.now()}-${validationResult.securityHash.substring(0, 8)}.jpg`;
    const originalPath = path.join(overlayDir, originalFilename);

    try {
      const fileBuffer = await file.arrayBuffer();
      await writeFile(originalPath, new Uint8Array(fileBuffer));
    } catch (error) {
      console.error('Failed to write overlay file:', error);
      throw new Error('File write failed');
    }

    // Create processing pipeline for future use (currently just returns metadata)
    const optimizer = new OverlayImageOptimizer();
    const pipeline = await optimizer.createProcessingPipeline(originalPath, overlayDir);

    let result;
    try {
      result = await pool.query(`
        INSERT INTO overlay_assets (
          original_name,
          storage_path,
          file_size,
          content_type,
          security_hash,
          jpeg_path,
          blend_mode,
          opacity,
          active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, original_name, jpeg_path, blend_mode, opacity, active
      `, [
        file.name,
        `/overlays/${originalFilename}`,
        file.size,
        validationResult.contentType,
        validationResult.securityHash,
        `/overlays/${originalFilename}`,
        'overlay',                     // blend_mode default
        0.8,                          // opacity default
        false                         // active
      ]);
    } catch (error) {
      console.error('Database insert failed:', error);
      throw new Error('Database operation failed');
    }

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

    // Provide more specific error messages for debugging
    let errorMessage = 'Internal server error during upload';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);

      // Include specific error type in development
      if (process.env.NODE_ENV === 'development') {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
    }

    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};