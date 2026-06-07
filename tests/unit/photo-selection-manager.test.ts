import { describe, it, expect, beforeEach } from 'vitest';
import { PhotoSelectionManager } from '../../src/lib/photoSelectionManager.js';
import { MockPhotoDatabaseAdapter } from '../../src/lib/photo-database/adapters/MockPhotoDatabaseAdapter.js';

describe('PhotoSelectionManager', () => {
  let photoManager: PhotoSelectionManager;
  let mockAdapter: MockPhotoDatabaseAdapter;

  beforeEach(() => {
    mockAdapter = new MockPhotoDatabaseAdapter();
    photoManager = new PhotoSelectionManager(mockAdapter);
  });

  describe('Basic Selection', () => {
    it('should return original photos when no user photos exist', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.photos).toHaveLength(8);
      expect(selection.totalAvailable).toBe(10); // Original Alina photos
      expect(selection.userPhotoCount).toBe(0);
      expect(selection.originalPhotoCount).toBe(8);

      // Should be original photos
      selection.photos.forEach(photo => {
        expect(photo.isUserPhoto).toBe(false);
        expect(photo.filename).toMatch(/^IMG_\d+\.jpeg$/);
      });
    });

    it('should mix user and original photos when both exist', async () => {
      // Add approved user photos to mock
      mockAdapter.addTestPhoto({
        id: 'user1',
        is_approved: true,
        is_hidden: false,
        original_filename: 'test1.jpg'
      });
      mockAdapter.addTestPhoto({
        id: 'user2',
        is_approved: true,
        is_hidden: false,
        original_filename: 'test2.jpg'
      });
      mockAdapter.addTestPhoto({
        id: 'user3',
        is_approved: true,
        is_hidden: false,
        original_filename: 'test3.jpg'
      });

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.photos).toHaveLength(8);
      expect(selection.totalAvailable).toBe(13); // 10 original + 3 user
      expect(selection.userPhotoCount).toBeGreaterThan(0);
      expect(selection.originalPhotoCount).toBeGreaterThan(0);
    });

    it('should prioritize user photos when available', async () => {
      // Add multiple approved user photos
      for (let i = 1; i <= 5; i++) {
        mockAdapter.addTestPhoto({
          id: `user${i}`,
          is_approved: true,
          is_hidden: false,
          original_filename: `test${i}.jpg`
        });
      }

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', 'prefer-user');

      expect(selection.photos).toHaveLength(8);
      expect(selection.userPhotoCount).toBe(5); // All 5 user photos should be included
      expect(selection.originalPhotoCount).toBe(3); // Remaining filled with original
    });

    it('should exclude pending photos from selection', async () => {
      // Add unapproved user photos
      mockAdapter.addTestPhoto({
        id: 'pending1',
        is_approved: false,
        is_hidden: false,
        original_filename: 'pending1.jpg'
      });

      // Add approved user photo
      mockAdapter.addTestPhoto({
        id: 'approved1',
        is_approved: true,
        is_hidden: false,
        original_filename: 'approved1.jpg'
      });

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.photos).toHaveLength(8);
      expect(selection.totalAvailable).toBe(11); // 10 original + 1 approved user
      expect(selection.userPhotoCount).toBe(1);
      expect(selection.originalPhotoCount).toBe(7);
    });
  });

  describe('Selection Strategies', () => {
    beforeEach(() => {
      // Add test user photos for strategy tests
      for (let i = 1; i <= 3; i++) {
        mockAdapter.addTestPhoto({
          id: `user${i}`,
          is_approved: true,
          is_hidden: false,
          original_filename: `user${i}.jpg`
        });
      }
    });

    it('should randomize selection between calls', async () => {
      const selection1 = await photoManager.selectPhotosForGame(8, 'disco-ball', 'random');
      const selection2 = await photoManager.selectPhotosForGame(8, 'disco-ball', 'random');

      expect(selection1.photos).toHaveLength(8);
      expect(selection2.photos).toHaveLength(8);

      // Photos might be different due to randomization
      // We can't guarantee they're different, but we can check they're valid selections
      expect(selection1.actualCount).toBe(8);
      expect(selection2.actualCount).toBe(8);
    });

    it('should handle balanced strategy correctly', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', 'balanced');

      expect(selection.photos).toHaveLength(8);
      expect(selection.strategy).toBe('balanced');
      expect(selection.userPhotoCount + selection.originalPhotoCount).toBe(8);
    });

    it('should handle original-only strategy', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', 'original-only');

      expect(selection.photos).toHaveLength(8);
      expect(selection.strategy).toBe('original-only');
      expect(selection.userPhotoCount).toBe(0);
      expect(selection.originalPhotoCount).toBe(8);

      // All photos should be original
      selection.photos.forEach(photo => {
        expect(photo.isUserPhoto).toBe(false);
      });
    });
  });

  describe('Game Type Specific Selection', () => {
    it('should provide disco ball sized photos for disco ball', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.gameType).toBe('disco-ball');
      selection.photos.forEach(photo => {
        if (!photo.isUserPhoto) {
          expect(photo.path).toContain('/thumbs/');
        }
      });
    });

    it('should provide minigame sized photos for tile game', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'minigame');

      expect(selection.gameType).toBe('minigame');
      selection.photos.forEach(photo => {
        if (!photo.isUserPhoto) {
          expect(photo.path).toContain('/minigame/');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle requesting more photos than available', async () => {
      const selection = await photoManager.selectPhotosForGame(20, 'disco-ball');

      expect(selection.photos).toHaveLength(10); // Only 10 original photos available
      expect(selection.requestedCount).toBe(20);
      expect(selection.actualCount).toBe(10);
    });

    it('should handle zero photo request', async () => {
      const selection = await photoManager.selectPhotosForGame(0, 'disco-ball');

      expect(selection.photos).toHaveLength(0);
      expect(selection.requestedCount).toBe(0);
      expect(selection.actualCount).toBe(0);
    });

    it('should handle negative photo request', async () => {
      await expect(photoManager.selectPhotosForGame(-1, 'disco-ball'))
        .rejects.toThrow('Count must be non-negative');
    });

    it('should handle database connection errors gracefully', async () => {
      // Simulate database error
      mockAdapter.simulateError('getApprovedPhotos');

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      // Should fall back to original photos only
      expect(selection.photos).toHaveLength(8);
      expect(selection.userPhotoCount).toBe(0);
      expect(selection.originalPhotoCount).toBe(8);
      expect(mockAdapter.getCallCount('getApprovedPhotos')).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should select photos within reasonable time', async () => {
      const startTime = Date.now();
      await photoManager.selectPhotosForGame(8, 'disco-ball');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle concurrent selection requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        photoManager.selectPhotosForGame(8, 'disco-ball')
      );

      const results = await Promise.all(promises);

      results.forEach(selection => {
        expect(selection.photos).toHaveLength(8);
        expect(selection.actualCount).toBe(8);
      });
    });
  });
});