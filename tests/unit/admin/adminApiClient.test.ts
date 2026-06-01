import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultAdminApiClient } from '../../../src/lib/admin/adminApiClient';

describe('AdminApiClient', () => {
  let apiClient: DefaultAdminApiClient;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    apiClient = new DefaultAdminApiClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchPhotos', () => {
    test('returns parsed photos from successful API call', async () => {
      const mockResponse = {
        success: true,
        photos: [
          { id: 'photo-1', name: 'test.jpg', path: '/uploads/test.jpg' }
        ],
        count: 1
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const photos = await apiClient.fetchPhotos();

      expect(photos).toHaveLength(1);
      expect(photos[0]).toEqual({
        id: 'photo-1',
        name: 'test.jpg',
        path: '/uploads/test.jpg'
      });
      expect(fetch).toHaveBeenCalledWith('/api/admin/photos');
    });

    test('throws error for failed API call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(apiClient.fetchPhotos()).rejects.toThrow('Failed to load photos');
    });

    test('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(apiClient.fetchPhotos()).rejects.toMatchObject({
        message: 'Failed to load photos',
        details: 'Network error'
      });
    });
  });

  describe('fetchOverlays', () => {
    test('returns parsed overlays from successful API call', async () => {
      const mockResponse = {
        overlays: [
          {
            id: 'overlay-1',
            name: 'overlay.png',
            path: '/overlays/overlay.png',
            blendMode: 'overlay',
            opacity: 0.8
          }
        ],
        settings: { maxUploads: 10 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const overlays = await apiClient.fetchOverlays();

      expect(overlays).toHaveLength(1);
      expect(overlays[0]).toEqual({
        id: 'overlay-1',
        name: 'overlay.png',
        path: '/overlays/overlay.png',
        blendMode: 'overlay',
        opacity: 0.8
      });
      expect(fetch).toHaveBeenCalledWith('/api/admin/overlays');
    });

    test('throws error for failed API call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(apiClient.fetchOverlays()).rejects.toThrow('Failed to load overlays');
    });
  });

  describe('fetchDashboardStats', () => {
    test('returns combined stats from both APIs', async () => {
      const photosResponse = {
        success: true,
        photos: [
          { id: 'photo-1', name: 'photo.jpg', path: '/uploads/photo.jpg' },
          { id: 'photo-2', name: 'photo2.jpg', path: '/uploads/photo2.jpg' }
        ],
        count: 2
      };

      const overlaysResponse = {
        overlays: [
          {
            id: 'overlay-1',
            name: 'overlay.png',
            path: '/overlays/overlay.png',
            blendMode: 'overlay',
            opacity: 0.8
          }
        ],
        settings: {}
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(photosResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(overlaysResponse)
        });

      const stats = await apiClient.fetchDashboardStats();

      expect(stats).toEqual({
        photoCount: 2,
        overlayCount: 1,
        activeEffects: 1
      });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('/api/admin/photos');
      expect(fetch).toHaveBeenCalledWith('/api/admin/overlays');
    });

    test('handles partial API failures gracefully', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            overlays: [
              { id: 'overlay-1', name: 'overlay.png', path: '/overlays/overlay.png', blendMode: 'overlay', opacity: 0.8 }
            ],
            settings: {}
          })
        });

      const stats = await apiClient.fetchDashboardStats();

      expect(stats).toEqual({
        photoCount: 0, // Failed API returns empty
        overlayCount: 1,
        activeEffects: 0 // min(0 photos, 1 overlay) = 0
      });
    });

    test('throws error when both APIs fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      await expect(apiClient.fetchDashboardStats()).rejects.toMatchObject({
        message: 'Failed to load dashboard statistics',
        details: 'Network failure'
      });
    });
  });

  describe('constructor with baseUrl', () => {
    test('uses custom baseUrl for API calls', async () => {
      const customClient = new DefaultAdminApiClient('https://api.example.com');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, photos: [], count: 0 })
      });

      await customClient.fetchPhotos();

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/admin/photos');
    });
  });
});