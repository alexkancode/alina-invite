import type { APIRoute } from 'astro';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

export const prerender = false;

interface PhotoInfo {
  filename: string;
  path: string;
  type: 'original' | 'user' | 'admin';
  size?: number;
  modified?: string;
  width?: number;
  height?: number;
  folder?: string;
}

async function getPhotosFromDirectory(dirPath: string, webPath: string, type: 'original' | 'user' | 'admin'): Promise<PhotoInfo[]> {
  try {
    if (!existsSync(dirPath)) {
      return [];
    }

    const files = await readdir(dirPath);
    const photos: PhotoInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png')) {
        let includeFile = false;

        // Filter based on type
        if (type === 'original' && file.startsWith('IMG_')) {
          includeFile = true;
        } else if (type === 'user' && file.startsWith('user-')) {
          includeFile = true;
        } else if (type === 'admin' && file.startsWith('admin-')) {
          includeFile = true;
        }

        if (includeFile) {
          const filePath = path.join(dirPath, file);
          const stats = await stat(filePath);

          // Get image dimensions
          let width: number | undefined;
          let height: number | undefined;
          try {
            const metadata = await sharp(filePath).metadata();
            width = metadata.width;
            height = metadata.height;
          } catch (error) {
            console.warn(`Failed to get dimensions for ${file}:`, error);
          }

          // Extract and normalize folder name from webPath
          let folderName = webPath.split('/').pop() || 'unknown';

          // Map folder names to cleaner display names
          if (folderName === 'user-uploads') folderName = 'user-uploads';
          if (folderName === 'admin-uploads') folderName = 'admin-uploads';
          if (webPath === '/alina') folderName = 'original'; // Root folder = original full-size

          photos.push({
            filename: file,
            path: `${webPath}/${file}`,
            type,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            width,
            height,
            folder: folderName
          });
        }
      }
    }

    return photos;
  } catch (error) {
    console.error(`Error reading photos from ${dirPath}:`, error);
    return [];
  }
}

export const GET: APIRoute = async () => {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'alina');

    // Get photos from all different directories and folders
    const allPhotosPromises = [
      // Thumbs folder
      getPhotosFromDirectory(path.join(publicDir, 'thumbs'), '/alina/thumbs', 'original'),
      getPhotosFromDirectory(path.join(publicDir, 'thumbs'), '/alina/thumbs', 'user'),
      getPhotosFromDirectory(path.join(publicDir, 'thumbs'), '/alina/thumbs', 'admin'),

      // Minigame folder
      getPhotosFromDirectory(path.join(publicDir, 'minigame'), '/alina/minigame', 'original'),
      getPhotosFromDirectory(path.join(publicDir, 'minigame'), '/alina/minigame', 'user'),
      getPhotosFromDirectory(path.join(publicDir, 'minigame'), '/alina/minigame', 'admin'),

      // Root folder (original full-size photos)
      getPhotosFromDirectory(publicDir, '/alina', 'original'),

      // User uploads folder
      getPhotosFromDirectory(path.join(publicDir, 'user-uploads'), '/alina/user-uploads', 'user'),

      // Admin uploads folder
      getPhotosFromDirectory(path.join(publicDir, 'admin-uploads'), '/alina/admin-uploads', 'admin')
    ];

    const photoArrays = await Promise.all(allPhotosPromises);

    // Flatten all photo arrays into one array
    const allPhotos = photoArrays.flat()
      .sort((a, b) => new Date(b.modified || 0).getTime() - new Date(a.modified || 0).getTime());

    // Calculate counts by type
    const counts = {
      original: allPhotos.filter(p => p.type === 'original').length,
      user: allPhotos.filter(p => p.type === 'user').length,
      admin: allPhotos.filter(p => p.type === 'admin').length
    };

    return new Response(JSON.stringify({
      success: true,
      totalPhotos: allPhotos.length,
      photos: allPhotos,
      counts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch photos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};