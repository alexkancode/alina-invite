import type { PhotoAsset, OverlayAsset } from './tabState';
import type { ActualPhoto, ActualOverlay } from '../../schemas/actualApiResponses';

// Path generation utilities
export function generatePhotoUrl(id: string, filename: string, type: 'full' | 'thumb' | 'minigame' = 'full'): string {
  // Based on existing path patterns in the codebase
  const basePath = '/alina';

  switch (type) {
    case 'thumb':
      return `${basePath}/thumbs/${filename}`;
    case 'minigame':
      return `${basePath}/minigame/${filename}`;
    case 'full':
    default:
      return `${basePath}/user-uploads/${filename}`;
  }
}

export function generateOverlayUrl(filename: string): string {
  return `/overlays/${filename}`;
}

// Field mapping functions
export function mapApiPhotoToComponent(apiPhoto: ActualPhoto): PhotoAsset {
  return {
    id: apiPhoto.id,
    name: apiPhoto.original_filename,
    path: generatePhotoUrl(apiPhoto.id, apiPhoto.original_filename, 'thumb')
  };
}

export function mapApiOverlayToComponent(apiOverlay: ActualOverlay): OverlayAsset {
  return {
    id: apiOverlay.id,
    name: apiOverlay.display_name,
    path: generateOverlayUrl(apiOverlay.filename),
    blendMode: apiOverlay.blend_mode,
    opacity: apiOverlay.opacity
  };
}

// Batch mapping functions
export function mapApiPhotosToComponents(apiPhotos: ActualPhoto[]): PhotoAsset[] {
  return apiPhotos.map(mapApiPhotoToComponent);
}

export function mapApiOverlaysToComponents(apiOverlays: ActualOverlay[]): OverlayAsset[] {
  return apiOverlays.map(mapApiOverlayToComponent);
}