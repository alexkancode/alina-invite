import { z } from 'zod';

// Schema for actual photo response from database
export const ActualPhotoSchema = z.object({
  id: z.string(),
  upload_date: z.string(),
  is_approved: z.boolean(),
  original_filename: z.string(),
  file_size: z.number(),
  upload_ip: z.string(),
  is_hidden: z.boolean(),
  moderation_notes: z.string().nullable()
});

// Schema for actual overlay response from database
export const ActualOverlaySchema = z.object({
  id: z.string(),
  filename: z.string(),
  display_name: z.string(),
  file_size: z.number(),
  is_active: z.boolean(),
  opacity: z.number(),
  blend_mode: z.string(),
  created_by: z.string(),
  description: z.string().optional()
});

// API Response wrapper schemas
export const ActualPhotosApiResponseSchema = z.object({
  success: z.boolean(),
  photos: z.array(ActualPhotoSchema),
  count: z.number()
});

export const ActualOverlaysApiResponseSchema = z.object({
  overlays: z.array(ActualOverlaySchema),
  settings: z.object({
    overlay_probability: z.number().optional(),
    overlay_on_photos: z.boolean().optional(),
    overlay_on_iridescent: z.boolean().optional(),
    overlay_rotation_enabled: z.boolean().optional(),
    overlay_max_per_session: z.number().optional(),
    overlay_cache_duration: z.number().optional()
  }).optional()
});

// Exported types
export type ActualPhoto = z.infer<typeof ActualPhotoSchema>;
export type ActualOverlay = z.infer<typeof ActualOverlaySchema>;
export type ActualPhotosApiResponse = z.infer<typeof ActualPhotosApiResponseSchema>;
export type ActualOverlaysApiResponse = z.infer<typeof ActualOverlaysApiResponseSchema>;