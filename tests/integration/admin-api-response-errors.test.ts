import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import {
  ConsoleErrorCapture,
  CustomEventListener,
  createMockElement,
  cleanupMockElement,
  waitForCondition
} from '../utils/integrationTestUtils';
import {
  mockApiHandlers,
  mockErrorHandlers,
  mockInvalidStructureHandlers,
  mockPhotosApiResponse,
  mockOverlaysApiResponse
} from '../utils/mockApiResponses';

// Setup MSW server
const server = setupServer(...mockApiHandlers);

describe('Admin API Response Errors Integration Tests', () => {
  let consoleCapture: ConsoleErrorCapture;
  let eventListener: CustomEventListener;
  let mockContainer: HTMLElement;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });

    // Mock fetch globally for the tests
    global.fetch = vi.fn();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    consoleCapture = new ConsoleErrorCapture();
    eventListener = new CustomEventListener();
    server.resetHandlers();
  });

  afterEach(() => {
    consoleCapture.stop();
    if (mockContainer) {
      cleanupMockElement(mockContainer);
    }
  });

  describe('PhotoManager Component Errors', () => {
    test('demonstrates forEach error with nested API response', async () => {
      // Mock the current API response structure that causes errors
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockPhotosApiResponse)
      });

      // Create mock PhotoManager component DOM
      mockContainer = createMockElement(`
        <div class="photo-manager">
          <div class="photo-gallery" id="photo-gallery"></div>
        </div>
      `);

      // Simulate the PhotoManager component's loadExistingPhotos method
      const response = await fetch('/api/admin/photos');
      const photos = await response.json();

      // Verify the API returns nested structure (not flat array)
      expect(photos).toHaveProperty('success');
      expect(photos).toHaveProperty('photos');
      expect(Array.isArray(photos)).toBe(false);
      expect(Array.isArray(photos.photos)).toBe(true);

      // This demonstrates the error: photos.forEach is not a function
      expect(() => photos.forEach((photo: any) => {})).toThrow('forEach is not a function');
    });

    test('demonstrates stats calculation error with invalid response structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockPhotosApiResponse)
      });

      const response = await fetch('/api/admin/photos');
      const photos = await response.json();

      // Verify the response structure
      expect(photos).toHaveProperty('success');
      expect(photos).toHaveProperty('photos');
      expect(photos.length).toBeUndefined(); // photos.length is undefined

      // This demonstrates the error when trying to access length
      expect(() => photos.length.toString()).toThrow();
    });
  });

  describe('OverlayManager Component Errors', () => {
    test('demonstrates forEach error with nested overlay response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockOverlaysApiResponse)
      });

      mockContainer = createMockElement(`
        <div class="overlay-manager">
          <div class="overlay-gallery" id="overlay-gallery"></div>
        </div>
      `);

      const response = await fetch('/api/admin/overlays');
      const overlays = await response.json();

      // Verify the API returns nested structure
      expect(overlays).toHaveProperty('overlays');
      expect(overlays).toHaveProperty('settings');
      expect(Array.isArray(overlays)).toBe(false);
      expect(Array.isArray(overlays.overlays)).toBe(true);

      // This demonstrates the error: overlays.forEach is not a function
      expect(() => overlays.forEach((overlay: any) => {})).toThrow('forEach is not a function');
    });

    test('shows overlay response has correct nested structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockOverlaysApiResponse)
      });

      const response = await fetch('/api/admin/overlays');
      const data = await response.json();

      // Verify the API returns nested structure
      expect(data).toHaveProperty('overlays');
      expect(data).toHaveProperty('settings');
      expect(Array.isArray(data.overlays)).toBe(true);
      expect(data.overlays).toHaveLength(2);

      // But the component expects a flat array
      expect(() => data.forEach(() => {})).toThrow('forEach is not a function');
    });
  });

  describe('AdminDashboard Stats Errors', () => {
    test('demonstrates dashboard stats calculation failure', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockPhotosApiResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockOverlaysApiResponse)
        });

      mockContainer = createMockElement(`
        <div class="admin-dashboard">
          <div id="total-photos">0</div>
          <div id="total-overlays">0</div>
          <div id="active-effects">0</div>
        </div>
      `);

      consoleCapture.start();

      try {
        const [photosResponse, overlaysResponse] = await Promise.all([
          fetch('/api/admin/photos'),
          fetch('/api/admin/overlays')
        ]);

        const photos = await photosResponse.json();
        const overlays = await overlaysResponse.json();

        // These lines cause console errors
        if (photosResponse.ok) {
          // Error: photos.length is undefined
          const photoElement = mockContainer.querySelector('#total-photos');
          if (photoElement) {
            photoElement.textContent = photos.length.toString();
          }
        }

        if (overlaysResponse.ok) {
          // Error: overlays.filter is not a function
          const activeOverlays = overlays.filter((overlay: any) => overlay.active);
          const overlayElement = mockContainer.querySelector('#total-overlays');
          if (overlayElement) {
            overlayElement.textContent = overlays.length.toString();
          }
        }
      } catch (error) {
        console.error('Failed to load initial stats:', error);
      }

      consoleCapture.stop();

      const errors = consoleCapture.getErrors();
      expect(errors.some(error =>
        error.includes('photos.length is undefined') ||
        error.includes('overlays.filter is not a function') ||
        error.includes('Failed to load initial stats')
      )).toBe(true);
    });
  });

  describe('Expected vs Actual Response Structures', () => {
    test('documents current API response structures that cause errors', async () => {
      // What the components expect: flat arrays
      const expectedPhotosStructure = [
        { id: 'photo-1', name: 'photo.jpg', path: '/uploads/photo.jpg' }
      ];
      const expectedOverlaysStructure = [
        { id: 'overlay-1', name: 'overlay.png', path: '/overlays/overlay.png' }
      ];

      // What the APIs actually return: nested objects
      const actualPhotosStructure = mockPhotosApiResponse;
      const actualOverlaysStructure = mockOverlaysApiResponse;

      // Verify structure mismatch
      expect(Array.isArray(expectedPhotosStructure)).toBe(true);
      expect(Array.isArray(actualPhotosStructure)).toBe(false);
      expect(actualPhotosStructure).toHaveProperty('photos');
      expect(actualPhotosStructure).toHaveProperty('success');

      expect(Array.isArray(expectedOverlaysStructure)).toBe(true);
      expect(Array.isArray(actualOverlaysStructure)).toBe(false);
      expect(actualOverlaysStructure).toHaveProperty('overlays');
      expect(actualOverlaysStructure).toHaveProperty('settings');

      // The actual arrays are nested inside the response objects
      expect(Array.isArray(actualPhotosStructure.photos)).toBe(true);
      expect(Array.isArray(actualOverlaysStructure.overlays)).toBe(true);
    });
  });

  describe('Network Error Scenarios', () => {
    test('handles network failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      consoleCapture.start();

      try {
        const response = await fetch('/api/admin/photos');
        const photos = await response.json();
        photos.forEach(() => {});
      } catch (error) {
        console.error('Failed to load existing photos:', error);
      }

      consoleCapture.stop();

      const errors = consoleCapture.getErrors();
      expect(errors.some(error =>
        error.includes('Network error') ||
        error.includes('Failed to load existing photos')
      )).toBe(true);
    });
  });
});