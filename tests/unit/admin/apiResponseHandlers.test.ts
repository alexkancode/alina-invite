import { describe, test, expect } from 'vitest';
import {
  parsePhotosResponse,
  parseOverlaysResponse,
  parseDashboardStats,
  validateApiResponse
} from '../../../src/lib/admin/apiResponseHandlers';
import { z } from 'zod';

describe('API Response Handlers', () => {
  describe('parsePhotosResponse', () => {
    test('handles component format flat array correctly', () => {
      const flatArray = [
        { id: 'photo-1', name: 'photo1.jpg', path: '/uploads/photo1.jpg' },
        { id: 'photo-2', name: 'photo2.jpg', path: '/uploads/photo2.jpg' }
      ];

      const result = parsePhotosResponse(flatArray);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'photo-1',
        name: 'photo1.jpg',
        path: '/uploads/photo1.jpg'
      });
    });

    test('handles actual API response format', () => {
      const actualApiResponse = {
        success: true,
        photos: [
          {
            id: 'photo-123',
            upload_date: '2026-06-01T10:00:00.000Z',
            is_approved: false,
            original_filename: 'test-photo.jpg',
            file_size: 1024,
            upload_ip: '127.0.0.1',
            is_hidden: false,
            moderation_notes: null
          }
        ],
        count: 1
      };

      const result = parsePhotosResponse(actualApiResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'photo-123',
        name: 'test-photo.jpg',
        path: '/alina/thumbs/test-photo.jpg'
      });
    });

    test('handles flat array of actual API format', () => {
      const actualApiArray = [
        {
          id: 'photo-456',
          upload_date: '2026-06-01T11:00:00.000Z',
          is_approved: true,
          original_filename: 'another-photo.png',
          file_size: 2048,
          upload_ip: '127.0.0.1',
          is_hidden: false,
          moderation_notes: 'Approved'
        }
      ];

      const result = parsePhotosResponse(actualApiArray);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'photo-456',
        name: 'another-photo.png',
        path: '/alina/thumbs/another-photo.png'
      });
    });

    test('returns empty array for invalid response', () => {
      const invalidResponse = { error: 'Something went wrong' };

      const result = parsePhotosResponse(invalidResponse);

      expect(result).toEqual([]);
    });

    test('returns empty array for malformed data', () => {
      const malformedData = {
        success: true,
        photos: 'not an array',  // Invalid
        count: 0
      };

      const result = parsePhotosResponse(malformedData);

      expect(result).toEqual([]);
    });
  });

  describe('parseOverlaysResponse', () => {
    test('handles component format flat array correctly', () => {
      const flatArray = [
        {
          id: 'overlay-1',
          name: 'overlay1.png',
          path: '/overlays/overlay1.png',
          blendMode: 'overlay',
          opacity: 0.8
        }
      ];

      const result = parseOverlaysResponse(flatArray);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'overlay-1',
        name: 'overlay1.png',
        path: '/overlays/overlay1.png',
        blendMode: 'overlay',
        opacity: 0.8
      });
    });

    test('handles actual API response format', () => {
      const actualApiResponse = {
        overlays: [
          {
            id: 'overlay-123',
            filename: 'sparkles.png',
            display_name: 'Sparkle Effect',
            file_size: 512,
            is_active: true,
            opacity: 0.8,
            blend_mode: 'overlay',
            created_by: 'admin',
            description: 'Adds sparkle effects'
          }
        ],
        settings: {
          overlay_probability: 0.7,
          overlay_on_photos: true
        }
      };

      const result = parseOverlaysResponse(actualApiResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'overlay-123',
        name: 'Sparkle Effect',
        path: '/overlays/sparkles.png',
        blendMode: 'overlay',
        opacity: 0.8
      });
    });

    test('returns empty array for invalid response', () => {
      const invalidResponse = { error: 'Failed to fetch overlays' };

      const result = parseOverlaysResponse(invalidResponse);

      expect(result).toEqual([]);
    });
  });

  describe('parseDashboardStats', () => {
    test('calculates stats from actual API responses', () => {
      const photosResponse = {
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
          },
          {
            id: 'photo-2',
            upload_date: '2026-06-01T11:00:00.000Z',
            is_approved: true,
            original_filename: 'photo2.jpg',
            file_size: 2048,
            upload_ip: '127.0.0.1',
            is_hidden: false,
            moderation_notes: 'Approved'
          }
        ],
        count: 2
      };

      const overlaysResponse = {
        overlays: [
          {
            id: 'overlay-1',
            filename: 'effect1.png',
            display_name: 'Effect One',
            file_size: 512,
            is_active: true,
            opacity: 0.8,
            blend_mode: 'overlay',
            created_by: 'admin'
          },
          {
            id: 'overlay-2',
            filename: 'effect2.png',
            display_name: 'Effect Two',
            file_size: 256,
            is_active: false,
            opacity: 0.0,
            blend_mode: 'multiply',
            created_by: 'user'
          }
        ],
        settings: {}
      };

      const stats = parseDashboardStats(photosResponse, overlaysResponse);

      expect(stats).toEqual({
        photoCount: 2,
        overlayCount: 2,
        activeEffects: 1 // Only one overlay has opacity > 0
      });
    });

    test('handles empty responses gracefully', () => {
      const stats = parseDashboardStats({}, {});

      expect(stats).toEqual({
        photoCount: 0,
        overlayCount: 0,
        activeEffects: 0
      });
    });

    test('calculates active effects as minimum of active overlays and photos', () => {
      const photosResponse = {
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

      const overlaysResponse = {
        overlays: [
          {
            id: 'overlay-1',
            filename: 'effect1.png',
            display_name: 'Effect One',
            file_size: 512,
            is_active: true,
            opacity: 0.8,
            blend_mode: 'overlay',
            created_by: 'admin'
          },
          {
            id: 'overlay-2',
            filename: 'effect2.png',
            display_name: 'Effect Two',
            file_size: 256,
            is_active: false,
            opacity: 0.6,
            blend_mode: 'multiply',
            created_by: 'user'
          }
        ],
        settings: {}
      };

      const stats = parseDashboardStats(photosResponse, overlaysResponse);

      expect(stats.activeEffects).toBe(1); // min(2 active overlays, 1 photo) = 1
    });
  });

  describe('validateApiResponse', () => {
    test('validates correct data against schema', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string()
      });

      const validData = { id: '1', name: 'Test' };

      const result = validateApiResponse(validData, schema);

      expect(result).toEqual(validData);
    });

    test('returns null for invalid data', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string()
      });

      const invalidData = { id: 123, name: 'Test' }; // id should be string

      const result = validateApiResponse(invalidData, schema);

      expect(result).toBeNull();
    });

    test('handles null/undefined input gracefully', () => {
      const schema = z.string();

      expect(validateApiResponse(null, schema)).toBeNull();
      expect(validateApiResponse(undefined, schema)).toBeNull();
    });
  });
});