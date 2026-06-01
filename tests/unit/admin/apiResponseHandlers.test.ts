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
    test('handles flat array format correctly', () => {
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

    test('handles nested object format (current API)', () => {
      const nestedObject = {
        success: true,
        photos: [
          { id: 'photo-1', name: 'photo1.jpg', path: '/uploads/photo1.jpg' }
        ],
        count: 1
      };

      const result = parsePhotosResponse(nestedObject);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'photo-1',
        name: 'photo1.jpg',
        path: '/uploads/photo1.jpg'
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
    test('handles flat array format correctly', () => {
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

    test('handles nested object format (current API)', () => {
      const nestedObject = {
        overlays: [
          {
            id: 'overlay-1',
            name: 'overlay1.png',
            path: '/overlays/overlay1.png',
            blendMode: 'multiply',
            opacity: 0.6
          }
        ],
        settings: {
          maxUploads: 10,
          allowedFormats: ['png', 'jpg']
        }
      };

      const result = parseOverlaysResponse(nestedObject);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'overlay-1',
        name: 'overlay1.png',
        path: '/overlays/overlay1.png',
        blendMode: 'multiply',
        opacity: 0.6
      });
    });

    test('returns empty array for invalid response', () => {
      const invalidResponse = { error: 'Failed to fetch overlays' };

      const result = parseOverlaysResponse(invalidResponse);

      expect(result).toEqual([]);
    });
  });

  describe('parseDashboardStats', () => {
    test('calculates stats from both responses', () => {
      const photosResponse = {
        success: true,
        photos: [
          { id: 'photo-1', name: 'photo1.jpg', path: '/uploads/photo1.jpg' },
          { id: 'photo-2', name: 'photo2.jpg', path: '/uploads/photo2.jpg' }
        ],
        count: 2
      };

      const overlaysResponse = {
        overlays: [
          { id: 'overlay-1', name: 'overlay1.png', path: '/overlays/overlay1.png', blendMode: 'overlay', opacity: 0.8 },
          { id: 'overlay-2', name: 'overlay2.png', path: '/overlays/overlay2.png', blendMode: 'multiply', opacity: 0.0 }
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
          { id: 'photo-1', name: 'photo1.jpg', path: '/uploads/photo1.jpg' }
        ],
        count: 1
      };

      const overlaysResponse = {
        overlays: [
          { id: 'overlay-1', name: 'overlay1.png', path: '/overlays/overlay1.png', blendMode: 'overlay', opacity: 0.8 },
          { id: 'overlay-2', name: 'overlay2.png', path: '/overlays/overlay2.png', blendMode: 'multiply', opacity: 0.6 }
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