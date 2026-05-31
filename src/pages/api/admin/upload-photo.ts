import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const prerender = false;

// Simple admin authentication
function isAuthenticated(request: Request): boolean {
  const formData = request.body;
  // In a real app, you'd have proper auth. For now, just check for admin flag
  return true; // Simplified for demo
}

async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get the uploaded file from form data
    const formData = await request.formData();
    const photoFile = formData.get('photo') as File;

    if (!photoFile) {
      return new Response(JSON.stringify({ error: 'No photo uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!photoFile.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'File must be an image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileId = `admin-${timestamp}-${randomId}`;

    // Get image buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Ensure directories exist
    const publicDir = path.join(process.cwd(), 'public', 'alina');
    await ensureDirectoryExists(publicDir);
    await ensureDirectoryExists(path.join(publicDir, 'thumbs'));
    await ensureDirectoryExists(path.join(publicDir, 'minigame'));
    await ensureDirectoryExists(path.join(publicDir, 'admin-uploads'));

    // Process image into 3 sizes using Sharp
    // 1. Original size (max 1200x1200, high quality)
    const originalBuffer = await sharp(imageBuffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 2. Disco ball thumbnails (128x128, smart crop)
    const thumbBuffer = await sharp(imageBuffer)
      .resize(128, 128, {
        fit: 'cover',
        position: 'attention' // Smart cropping
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 3. Tile game images (256x256, smart crop)
    const tileBuffer = await sharp(imageBuffer)
      .resize(256, 256, {
        fit: 'cover',
        position: 'attention' // Smart cropping
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Save all three versions
    const originalPath = path.join(publicDir, 'admin-uploads', `${fileId}.jpeg`);
    const thumbPath = path.join(publicDir, 'thumbs', `${fileId}.jpeg`);
    const tilePath = path.join(publicDir, 'minigame', `${fileId}.jpeg`);

    await Promise.all([
      writeFile(originalPath, originalBuffer),
      writeFile(thumbPath, thumbBuffer),
      writeFile(tilePath, tileBuffer),
    ]);

    // Update the photo list (in a real app, you'd update the database)
    // For now, just return success - the photos will be picked up by the selection system

    console.log(`✅ Admin uploaded photo: ${fileId}.jpeg`);
    console.log(`   - Original: ${originalPath}`);
    console.log(`   - Thumb: ${thumbPath}`);
    console.log(`   - Tile: ${tilePath}`);

    return new Response(JSON.stringify({
      success: true,
      photoId: fileId,
      message: 'Photo successfully added to game mix',
      paths: {
        original: `/alina/admin-uploads/${fileId}.jpeg`,
        thumb: `/alina/thumbs/${fileId}.jpeg`,
        tile: `/alina/minigame/${fileId}.jpeg`
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Photo upload error:', error);

    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};