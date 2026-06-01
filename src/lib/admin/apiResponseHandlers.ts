import { z } from 'zod';
import type { PhotoAsset, OverlayAsset } from './tabState';
import {
  ActualPhotosApiResponseSchema,
  ActualOverlaysApiResponseSchema,
  ActualPhotoSchema,
  ActualOverlaySchema
} from '../../schemas/actualApiResponses';
import {
  mapApiPhotosToComponents,
  mapApiOverlaysToComponents
} from './fieldMappers';

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
  // Handle flat array formats
  if (Array.isArray(response)) {
    // Try component format first (future-proof)
    const componentArraySchema = z.array(z.object({
      id: z.string(),
      name: z.string(),
      path: z.string()
    }));
    const validatedComponentArray = validateApiResponse(response, componentArraySchema);
    if (validatedComponentArray) {
      return validatedComponentArray;
    }

    // Try actual API format array
    const validatedApiArray = validateApiResponse(response, z.array(ActualPhotoSchema));
    if (validatedApiArray) {
      return mapApiPhotosToComponents(validatedApiArray);
    }

    return [];
  }

  // Handle actual API response format (nested object)
  const validatedResponse = validateApiResponse(response, ActualPhotosApiResponseSchema);
  if (validatedResponse && validatedResponse.success) {
    return mapApiPhotosToComponents(validatedResponse.photos);
  }

  return [];
}

export function parseOverlaysResponse(response: unknown): OverlayAsset[] {
  // Handle flat array formats
  if (Array.isArray(response)) {
    // Try component format first (future-proof)
    const componentArraySchema = z.array(z.object({
      id: z.string(),
      name: z.string(),
      path: z.string(),
      blendMode: z.string(),
      opacity: z.number()
    }));
    const validatedComponentArray = validateApiResponse(response, componentArraySchema);
    if (validatedComponentArray) {
      return validatedComponentArray;
    }

    // Try actual API format array
    const validatedApiArray = validateApiResponse(response, z.array(ActualOverlaySchema));
    if (validatedApiArray) {
      return mapApiOverlaysToComponents(validatedApiArray);
    }

    return [];
  }

  // Handle actual API response format (nested object)
  const validatedResponse = validateApiResponse(response, ActualOverlaysApiResponseSchema);
  if (validatedResponse && validatedResponse.overlays) {
    return mapApiOverlaysToComponents(validatedResponse.overlays);
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
    // Overlay is active if opacity > 0
    overlay.opacity > 0
  );

  return {
    photoCount: photos.length,
    overlayCount: overlays.length,
    activeEffects: Math.min(activeOverlays.length, photos.length)
  };
}