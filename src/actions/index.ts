import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { processAndSavePhoto, validateUploadedFile, sanitizeFilename } from '../lib/photoProcessor.js';
import { getRecentUploadsFromIp } from '../lib/photoDatabase.js';

export const server = {
  uploadPhoto: defineAction({
    accept: 'form',
    input: z.object({
      photo: z.instanceof(File)
    }),
    handler: async ({ photo }, context) => {
      try {
        // Get client IP for rate limiting
        const clientIp = context.request.headers.get('x-forwarded-for') ||
                         context.request.headers.get('x-real-ip') ||
                         '127.0.0.1';

        // Basic rate limiting: max 5 uploads per hour per IP
        const recentUploads = await getRecentUploadsFromIp(clientIp, 60);
        if (recentUploads >= 5) {
          throw new Error('Too many uploads. Please try again later.');
        }

        // Validate file
        const validation = validateUploadedFile(photo);
        if (!validation.valid) {
          throw new Error(validation.error!);
        }

        // Convert File to Buffer for Sharp processing
        const arrayBuffer = await photo.arrayBuffer();
        const photoBuffer = Buffer.from(arrayBuffer);

        // Validate minimum image size (prevent 1x1 pixel attacks)
        if (photoBuffer.length < 1000) { // Less than 1KB is suspicious
          throw new Error('Image file is too small');
        }

        // Process and save photo
        const photoId = await processAndSavePhoto(photoBuffer, {
          originalFilename: sanitizeFilename(photo.name),
          fileSize: photo.size,
          uploadIp: clientIp
        });

        return {
          success: true,
          photoId,
          message: 'Photo uploaded successfully and is pending approval'
        };

      } catch (error) {
        console.error('Photo upload error:', error);

        // Throw ActionError with safe message
        throw new Error(error instanceof Error ? error.message : 'Failed to process photo upload');
      }
    }
  })
};