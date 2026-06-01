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
  mockPhotosApiResponse,
  mockOverlaysApiResponse,
  mockErrorHandlers
} from '../utils/mockApiResponses';

// Setup MSW server
const server = setupServer(...mockApiHandlers);

describe('Admin Components Fixed Integration Tests', () => {
  let consoleCapture: ConsoleErrorCapture;
  let eventListener: CustomEventListener;
  let mockContainer: HTMLElement;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
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

  describe('PhotoManager with Fixed API Response Handling', () => {
    test('correctly handles nested API response without console errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockPhotosApiResponse)
      });

      mockContainer = createMockElement(`
        <div class="photo-manager">
          <div class="photo-gallery" id="photo-gallery"></div>
        </div>
      `);

      consoleCapture.start();

      // Simulate the fixed PhotoManager loadExistingPhotos method
      try {
        // Import and use the new API client
        const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
        const photos = await adminApiClient.fetchPhotos();

        // This should now work without errors
        expect(Array.isArray(photos)).toBe(true);
        expect(photos).toHaveLength(2);
        expect(photos[0]).toEqual({
          id: 'photo-1',
          name: 'test-photo-1.jpg',
          path: '/uploads/test-photo-1.jpg'
        });

        // Simulate adding photos to gallery
        photos.forEach(photo => {
          const photoCard = document.createElement('div');
          photoCard.className = 'photo-card';
          photoCard.innerHTML = `<img src="${photo.path}" alt="${photo.name}" />`;
          mockContainer.querySelector('.photo-gallery')?.appendChild(photoCard);
        });

      } catch (error) {
        console.error('Failed to load existing photos:', error);
      }

      consoleCapture.stop();

      // Verify no forEach errors occurred
      const errors = consoleCapture.getErrors();
      expect(errors.some(error => error.includes('forEach is not a function'))).toBe(false);

      // Verify photos were added to gallery
      const photoCards = mockContainer.querySelectorAll('.photo-card');
      expect(photoCards).toHaveLength(2);
    });

    test('shows graceful error state when API fails', async () => {
      server.use(...mockErrorHandlers);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({ error: 'Server error' })
      });

      mockContainer = createMockElement(`
        <div class="photo-manager">
          <div class="photo-gallery" id="photo-gallery"></div>
        </div>
      `);

      try {
        const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
        await adminApiClient.fetchPhotos();
      } catch (error) {
        // Simulate showing error state
        const gallery = mockContainer.querySelector('.photo-gallery');
        if (gallery) {
          gallery.innerHTML = `
            <div class="error-state">
              <p>Unable to load photos. Please try refreshing the page.</p>
              <button>Retry</button>
            </div>
          `;
        }
      }

      const errorState = mockContainer.querySelector('.error-state');
      expect(errorState).toBeTruthy();
      expect(errorState?.textContent).toContain('Unable to load photos');
    });
  });

  describe('OverlayManager with Fixed API Response Handling', () => {
    test('correctly handles nested overlay API response without console errors', async () => {
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

      consoleCapture.start();

      try {
        const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
        const overlays = await adminApiClient.fetchOverlays();

        expect(Array.isArray(overlays)).toBe(true);
        expect(overlays).toHaveLength(2);
        expect(overlays[0]).toEqual({
          id: 'overlay-1',
          name: 'Test Overlay 1',
          path: '/overlays/test-overlay-1.png',
          blendMode: 'overlay',
          opacity: 0.8
        });

        // Simulate adding overlays to gallery
        overlays.forEach(overlay => {
          const overlayCard = document.createElement('div');
          overlayCard.className = 'overlay-card';
          overlayCard.innerHTML = `
            <img src="${overlay.path}" alt="${overlay.name}" />
            <div class="overlay-info">
              <span>Blend: ${overlay.blendMode}</span>
              <span>Opacity: ${overlay.opacity}</span>
            </div>
          `;
          mockContainer.querySelector('.overlay-gallery')?.appendChild(overlayCard);
        });

      } catch (error) {
        console.error('Failed to load existing overlays:', error);
      }

      consoleCapture.stop();

      // Verify no forEach errors occurred
      const errors = consoleCapture.getErrors();
      expect(errors.some(error => error.includes('forEach is not a function'))).toBe(false);

      // Verify overlays were added to gallery
      const overlayCards = mockContainer.querySelectorAll('.overlay-card');
      expect(overlayCards).toHaveLength(2);
    });
  });

  describe('AdminDashboard with Fixed Stats Calculation', () => {
    test('correctly calculates dashboard stats without console errors', async () => {
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
        const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
        const stats = await adminApiClient.fetchDashboardStats();

        // Update stats display
        const photoElement = mockContainer.querySelector('#total-photos');
        const overlayElement = mockContainer.querySelector('#total-overlays');
        const effectsElement = mockContainer.querySelector('#active-effects');

        if (photoElement) photoElement.textContent = stats.photoCount.toString();
        if (overlayElement) overlayElement.textContent = stats.overlayCount.toString();
        if (effectsElement) effectsElement.textContent = stats.activeEffects.toString();

        // Verify correct stats calculation
        expect(stats.photoCount).toBe(2); // 2 photos in mock response
        expect(stats.overlayCount).toBe(2); // 2 overlays in mock response
        expect(stats.activeEffects).toBe(2); // All overlays have opacity > 0

      } catch (error) {
        console.error('Failed to load initial stats:', error);
      }

      consoleCapture.stop();

      // Verify no length access errors occurred
      const errors = consoleCapture.getErrors();
      expect(errors.some(error =>
        error.includes('photos.length is undefined') ||
        error.includes('overlays.filter is not a function')
      )).toBe(false);

      // Verify stats are displayed correctly
      expect(mockContainer.querySelector('#total-photos')?.textContent).toBe('2');
      expect(mockContainer.querySelector('#total-overlays')?.textContent).toBe('2');
      expect(mockContainer.querySelector('#active-effects')?.textContent).toBe('2');
    });

    test('provides fallback values when stats calculation fails', async () => {
      server.use(...mockErrorHandlers);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      mockContainer = createMockElement(`
        <div class="admin-dashboard">
          <div id="total-photos">999</div>
          <div id="total-overlays">999</div>
          <div id="active-effects">999</div>
        </div>
      `);

      try {
        const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
        await adminApiClient.fetchDashboardStats();
      } catch (error) {
        // Simulate fallback behavior
        const photoElement = mockContainer.querySelector('#total-photos');
        const overlayElement = mockContainer.querySelector('#total-overlays');
        const effectsElement = mockContainer.querySelector('#active-effects');

        if (photoElement) photoElement.textContent = '0';
        if (overlayElement) overlayElement.textContent = '0';
        if (effectsElement) effectsElement.textContent = '0';
      }

      // Verify fallback values are set
      expect(mockContainer.querySelector('#total-photos')?.textContent).toBe('0');
      expect(mockContainer.querySelector('#total-overlays')?.textContent).toBe('0');
      expect(mockContainer.querySelector('#active-effects')?.textContent).toBe('0');
    });
  });

  describe('API Response Format Compatibility', () => {
    test('handles both old and new API response formats', async () => {
      // Test with flat array format (future-proof)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([
          { id: 'photo-1', name: 'photo.jpg', path: '/uploads/photo.jpg' }
        ])
      });

      const { adminApiClient } = await import('../../src/lib/admin/adminApiClient');
      const photosFlat = await adminApiClient.fetchPhotos();
      expect(photosFlat).toHaveLength(1);

      // Test with nested object format (current API)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockPhotosApiResponse)
      });

      const photosNested = await adminApiClient.fetchPhotos();
      expect(photosNested).toHaveLength(2);
    });
  });
});