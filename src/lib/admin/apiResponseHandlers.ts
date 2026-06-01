import { z } from 'zod';
import type { PhotoAsset, OverlayAsset } from './tabState';

// Zod schemas for API response validation
const PhotoAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string()
});

const OverlayAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  blendMode: z.string(),
  opacity: z.number()
});

// API Response schemas
const PhotosApiResponseSchema = z.object({
  success: z.boolean(),
  photos: z.array(PhotoAssetSchema),
  count: z.number()
});

const OverlaysApiResponseSchema = z.object({
  overlays: z.array(OverlayAssetSchema),
  settings: z.object({
    maxUploads: z.number().optional(),
    allowedFormats: z.array(z.string()).optional()
  }).optional()
});

// Generic response validation utility
export function validateApiResponse<T>(data: unknown, schema: z.ZodSchema<T>): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('API response validation failed:', error);
    return null;
  }
}

// Type-safe response parsing functions
export function parsePhotosResponse(response: unknown): PhotoAsset[] {
  // Handle flat array (expected format)
  if (Array.isArray(response)) {
    const flatArraySchema = z.array(PhotoAssetSchema);
    const validatedArray = validateApiResponse(response, flatArraySchema);
    return validatedArray || [];
  }

  // Handle nested object (current API format)
  const validatedResponse = validateApiResponse(response, PhotosApiResponseSchema);
  if (validatedResponse && validatedResponse.success) {
    return validatedResponse.photos;
  }

  return [];
}

export function parseOverlaysResponse(response: unknown): OverlayAsset[] {
  // Handle flat array (expected format)
  if (Array.isArray(response)) {
    const flatArraySchema = z.array(OverlayAssetSchema);
    const validatedArray = validateApiResponse(response, flatArraySchema);
    return validatedArray || [];
  }

  // Handle nested object (current API format)
  const validatedResponse = validateApiResponse(response, OverlaysApiResponseSchema);
  if (validatedResponse && validatedResponse.overlays) {
    return validatedResponse.overlays;
  }

  return [];
}

// Dashboard stats interface
export interface DashboardStats {
  photoCount: number;
  overlayCount: number;
  activeEffects: number;
}

export function parseDashboardStats(
  photosResponse: unknown,
  overlaysResponse: unknown
): DashboardStats {
  const photos = parsePhotosResponse(photosResponse);
  const overlays = parseOverlaysResponse(overlaysResponse);

  const activeOverlays = overlays.filter(overlay =>
    // Assume overlay is active if opacity > 0
    overlay.opacity > 0
  );

  return {
    photoCount: photos.length,
    overlayCount: overlays.length,
    activeEffects: Math.min(activeOverlays.length, photos.length)
  };
}