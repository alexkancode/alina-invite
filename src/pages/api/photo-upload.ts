import type { APIRoute } from 'astro';
import { processAndSavePhoto, validateUploadedFile, sanitizeFilename } from '../../lib/photoProcessor.js';
import { photoUploadRateLimiter, formatRetryAfter } from '../../lib/rateLimiter.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Only allow in development/testing
    if (import.meta.env.MODE === 'production') {
      return new Response('Not available in production', { status: 404 });
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';

    // Exponential backoff rate limiting
    if (import.meta.env.MODE === 'production') {
      const rateLimitResult = await photoUploadRateLimiter.checkUpload(clientIp);

      if (!rateLimitResult.allowed) {
        const retryAfterFormatted = rateLimitResult.retryAfter
          ? formatRetryAfter(rateLimitResult.retryAfter)
          : 'later';

        return new Response(JSON.stringify({
          success: false,
          error: `Rate limit exceeded. Please try again in ${retryAfterFormatted}.`,
          retryAfter: rateLimitResult.retryAfter
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600'
          }
        });
      }
    }

    // Parse multipart form data
    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No photo provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First validate file type and size
    const validation = validateUploadedFile(photo);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert File to Buffer for Sharp processing
    const arrayBuffer = await photo.arrayBuffer();
    const photoBuffer = Buffer.from(arrayBuffer);

    // Additional validation for potential attacks
    if (photoBuffer.length < 100 && !photo.type.startsWith('image/')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file: not a valid image'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process and save photo
    const photoId = await processAndSavePhoto(photoBuffer, {
      originalFilename: sanitizeFilename(photo.name),
      fileSize: photo.size,
      uploadIp: clientIp
    });

    // Record successful upload for rate limiting metrics
    if (import.meta.env.MODE === 'production') {
      await photoUploadRateLimiter.recordSuccessfulUpload(clientIp);
    }

    return new Response(JSON.stringify({
      success: true,
      photoId,
      message: 'Photo uploaded successfully and is pending approval'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Photo upload error:', error);

    // Don't leak internal error details to client
    let errorMessage = 'Failed to process photo upload';

    if (error instanceof Error) {
      // Safe error messages we can show to users
      if (error.message.includes('Invalid image') ||
          error.message.includes('Failed to process image')) {
        errorMessage = 'Invalid image file or corrupted data';
      }
      if (error.message.includes('Too many uploads') ||
          error.message.includes('Image file is too small') ||
          error.message.includes('File too large') ||
          error.message.includes('Invalid file type')) {
        errorMessage = error.message;
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};