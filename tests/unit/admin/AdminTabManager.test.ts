import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AdminTabManager, TabState } from '../../../src/lib/admin/tabState.js';

describe('AdminTabManager', () => {
  let tabManager: AdminTabManager;
  let mockSubscriber: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tabManager = new AdminTabManager();
    mockSubscriber = vi.fn();
  });

  describe('Tab State Management', () => {
    test('initializes with default state', () => {
      const state = tabManager.getState();

      expect(state.activeTab).toBe('photos');
      expect(state.photoAssets).toEqual([]);
      expect(state.overlayAssets).toEqual([]);
    });

    test('sets active tab correctly', () => {
      tabManager.setActiveTab('overlays');

      expect(tabManager.getState().activeTab).toBe('overlays');
    });

    test('maintains previous state when switching tabs', () => {
      const photoAssets = [{ id: '1', name: 'test.jpg', path: '/test.jpg' }];

      tabManager.updatePhotoAssets(photoAssets);
      tabManager.setActiveTab('overlays');

      const state = tabManager.getState();
      expect(state.activeTab).toBe('overlays');
      expect(state.photoAssets).toEqual(photoAssets);
    });

    test('rejects invalid tab names', () => {
      expect(() => {
        tabManager.setActiveTab('invalid');
      }).toThrow('Invalid tab name');
    });
  });

  describe('Asset Management', () => {
    test('updates photo assets correctly', () => {
      const assets = [
        { id: '1', name: 'photo1.jpg', path: '/photos/1.jpg' },
        { id: '2', name: 'photo2.jpg', path: '/photos/2.jpg' }
      ];

      tabManager.updatePhotoAssets(assets);

      expect(tabManager.getState().photoAssets).toEqual(assets);
    });

    test('updates overlay assets correctly', () => {
      const assets = [
        { id: '1', name: 'overlay1.png', path: '/overlays/1.png', blendMode: 'multiply', opacity: 0.7 }
      ];

      tabManager.updateOverlayAssets(assets);

      expect(tabManager.getState().overlayAssets).toEqual(assets);
    });

    test('validates asset structure', () => {
      const invalidAsset = { name: 'test.jpg' }; // Missing required fields

      expect(() => {
        tabManager.updatePhotoAssets([invalidAsset as any]);
      }).toThrow('Invalid asset structure');
    });
  });

  describe('Subscription System', () => {
    test('notifies subscribers on tab change', () => {
      tabManager.subscribe(mockSubscriber);

      tabManager.setActiveTab('overlays');

      expect(mockSubscriber).toHaveBeenCalledWith({
        activeTab: 'overlays',
        photoAssets: [],
        overlayAssets: []
      });
    });

    test('notifies subscribers on asset updates', () => {
      tabManager.subscribe(mockSubscriber);
      const assets = [{ id: '1', name: 'test.jpg', path: '/test.jpg' }];

      tabManager.updatePhotoAssets(assets);

      expect(mockSubscriber).toHaveBeenCalledWith({
        activeTab: 'photos',
        photoAssets: assets,
        overlayAssets: []
      });
    });

    test('allows unsubscribing', () => {
      const unsubscribe = tabManager.subscribe(mockSubscriber);

      unsubscribe();
      tabManager.setActiveTab('overlays');

      expect(mockSubscriber).not.toHaveBeenCalled();
    });

    test('handles multiple subscribers', () => {
      const subscriber2 = vi.fn();

      tabManager.subscribe(mockSubscriber);
      tabManager.subscribe(subscriber2);

      tabManager.setActiveTab('overlays');

      expect(mockSubscriber).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    test('maintains state across operations', () => {
      const photoAssets = [{ id: '1', name: 'photo.jpg', path: '/photo.jpg' }];
      const overlayAssets = [{ id: '2', name: 'overlay.png', path: '/overlay.png', blendMode: 'multiply', opacity: 0.5 }];

      tabManager.updatePhotoAssets(photoAssets);
      tabManager.updateOverlayAssets(overlayAssets);
      tabManager.setActiveTab('overlays');

      const state = tabManager.getState();
      expect(state.activeTab).toBe('overlays');
      expect(state.photoAssets).toEqual(photoAssets);
      expect(state.overlayAssets).toEqual(overlayAssets);
    });

    test('creates immutable state snapshots', () => {
      const assets = [{ id: '1', name: 'test.jpg', path: '/test.jpg' }];

      tabManager.updatePhotoAssets(assets);
      const state1 = tabManager.getState();

      assets.push({ id: '2', name: 'test2.jpg', path: '/test2.jpg' });
      const state2 = tabManager.getState();

      expect(state1.photoAssets).toHaveLength(1);
      expect(state2.photoAssets).toHaveLength(1);
      expect(state1).not.toBe(state2);
    });
  });
});