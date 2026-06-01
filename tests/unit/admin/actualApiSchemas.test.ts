import { describe, test, expect } from 'vitest';
import {
  ActualPhotoSchema,
  ActualOverlaySchema,
  ActualPhotosApiResponseSchema,
  ActualOverlaysApiResponseSchema
} from '../../../src/schemas/actualApiResponses';

describe('Actual API Response Schemas', () => {
  describe('ActualPhotoSchema', () => {
    test('validates correct photo object', () => {
      const validPhoto = {
        id: 'b51d1a6da52d9426d32934683849f612',
        upload_date: '2026-05-30T06:47:26.935Z',
        is_approved: false,
        original_filename: 'test-photo.jpeg',
        file_size: 1328537,
        upload_ip: '127.0.0.1',
        is_hidden: false,
        moderation_notes: null
      };

      const result = ActualPhotoSchema.safeParse(validPhoto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPhoto);
      }
    });

    test('validates photo with moderation notes', () => {
      const photoWithNotes = {
        id: 'test-id',
        upload_date: '2026-06-01T10:00:00.000Z',
        is_approved: true,
        original_filename: 'approved-photo.jpg',
        file_size: 2048,
        upload_ip: '192.168.1.1',
        is_hidden: false,
        moderation_notes: 'Looks good to me'
      };

      const result = ActualPhotoSchema.safeParse(photoWithNotes);
      expect(result.success).toBe(true);
    });

    test('rejects photo with missing required fields', () => {
      const invalidPhoto = {
        id: 'test-id',
        // Missing other required fields
      };

      const result = ActualPhotoSchema.safeParse(invalidPhoto);
      expect(result.success).toBe(false);
    });

    test('rejects photo with wrong field types', () => {
      const invalidPhoto = {
        id: 'test-id',
        upload_date: '2026-06-01T10:00:00.000Z',
        is_approved: 'false', // Should be boolean
        original_filename: 'test.jpg',
        file_size: '1024', // Should be number
        upload_ip: '127.0.0.1',
        is_hidden: false,
        moderation_notes: null
      };

      const result = ActualPhotoSchema.safeParse(invalidPhoto);
      expect(result.success).toBe(false);
    });
  });

  describe('ActualOverlaySchema', () => {
    test('validates correct overlay object', () => {
      const validOverlay = {
        id: 'overlay-123',
        filename: 'sparkles.png',
        display_name: 'Sparkle Effect',
        file_size: 512,
        is_active: true,
        opacity: 0.8,
        blend_mode: 'overlay',
        created_by: 'admin',
        description: 'Adds sparkle effects'
      };

      const result = ActualOverlaySchema.safeParse(validOverlay);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validOverlay);
      }
    });

    test('validates overlay without optional description', () => {
      const overlayWithoutDescription = {
        id: 'overlay-456',
        filename: 'glow.png',
        display_name: 'Glow Effect',
        file_size: 256,
        is_active: false,
        opacity: 0.6,
        blend_mode: 'multiply',
        created_by: 'user'
      };

      const result = ActualOverlaySchema.safeParse(overlayWithoutDescription);
      expect(result.success).toBe(true);
    });

    test('rejects overlay with missing required fields', () => {
      const invalidOverlay = {
        id: 'overlay-id',
        filename: 'test.png'
        // Missing other required fields
      };

      const result = ActualOverlaySchema.safeParse(invalidOverlay);
      expect(result.success).toBe(false);
    });
  });

  describe('ActualPhotosApiResponseSchema', () => {
    test('validates correct photos API response', () => {
      const validResponse = {
        success: true,
        photos: [
          {
            id: 'photo-1',
            upload_date: '2026-06-01T10:00:00.000Z',
            is_approved: false,
            original_filename: 'photo1.jpg',
            file_size: 1024,
            upload_ip: '127.0.0.1',
            is_hidden: false,
            moderation_notes: null
          }
        ],
        count: 1
      };

      const result = ActualPhotosApiResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    test('validates empty photos array', () => {
      const emptyResponse = {
        success: true,
        photos: [],
        count: 0
      };

      const result = ActualPhotosApiResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    test('rejects response with invalid photo data', () => {
      const invalidResponse = {
        success: true,
        photos: [
          {
            id: 'photo-1',
            // Missing required fields
          }
        ],
        count: 1
      };

      const result = ActualPhotosApiResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('ActualOverlaysApiResponseSchema', () => {
    test('validates correct overlays API response', () => {
      const validResponse = {
        overlays: [
          {
            id: 'overlay-1',
            filename: 'effect.png',
            display_name: 'Effect',
            file_size: 512,
            is_active: true,
            opacity: 0.8,
            blend_mode: 'overlay',
            created_by: 'admin'
          }
        ],
        settings: {
          overlay_probability: 0.7,
          overlay_on_photos: true,
          overlay_on_iridescent: false,
          overlay_rotation_enabled: true,
          overlay_max_per_session: 50,
          overlay_cache_duration: 3600
        }
      };

      const result = ActualOverlaysApiResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    test('validates response without settings', () => {
      const responseWithoutSettings = {
        overlays: []
      };

      const result = ActualOverlaysApiResponseSchema.safeParse(responseWithoutSettings);
      expect(result.success).toBe(true);
    });

    test('validates empty overlays array', () => {
      const emptyResponse = {
        overlays: [],
        settings: {}
      };

      const result = ActualOverlaysApiResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });
  });
});