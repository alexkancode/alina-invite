import type { APIRoute } from 'astro';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { photos } = await request.json();

    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No photos provided for deletion'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const photoPath of photos) {
      try {
        // Validate that this is a user or admin photo (not original)
        const filename = photoPath.split('/').pop();
        if (!filename || (!filename.startsWith('user-') && !filename.startsWith('admin-'))) {
          errors.push(`Skipped ${filename}: Only user and admin photos can be deleted`);
          continue;
        }

        // Convert web path to filesystem path
        const webPathParts = photoPath.split('/');
        const publicIndex = webPathParts.indexOf('alina');

        if (publicIndex === -1) {
          errors.push(`Invalid path: ${photoPath}`);
          continue;
        }

        const relativePath = webPathParts.slice(publicIndex).join('/');
        const fullPath = path.join(process.cwd(), 'public', relativePath);

        // Check if file exists and delete it
        if (existsSync(fullPath)) {
          await unlink(fullPath);
          deletedCount++;
          console.log(`Deleted: ${fullPath}`);

          // For admin photos, also try to delete from other sizes if they exist
          if (filename.startsWith('admin-')) {
            const baseName = filename.replace('.jpeg', '');

            // Try to delete from tiles folder
            const tilesPath = fullPath.replace('/thumbs/', '/tiles/');
            if (existsSync(tilesPath)) {
              await unlink(tilesPath);
              console.log(`Deleted tiles version: ${tilesPath}`);
            }

            // Try to delete from minigame folder
            const minigamePath = fullPath.replace('/thumbs/', '/minigame/');
            if (existsSync(minigamePath)) {
              await unlink(minigamePath);
              console.log(`Deleted minigame version: ${minigamePath}`);
            }

            // Try to delete original if exists
            const originalPath = fullPath.replace('/thumbs/', '/original/');
            if (existsSync(originalPath)) {
              await unlink(originalPath);
              console.log(`Deleted original version: ${originalPath}`);
            }
          }
        } else {
          errors.push(`File not found: ${filename}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to delete ${photoPath}: ${errorMsg}`);
        console.error(`Delete error for ${photoPath}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deletedCount,
      requestedCount: photos.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete photos API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process deletion request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};