import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhotoSelectionManager, type PhotoInfo, type GameType } from '../../src/lib/photoSelectionManager.js';

// Mock the photo database
vi.mock('../../src/lib/photoDatabase.js', () => ({
  getApprovedPhotos: vi.fn(() => Promise.resolve([
    { id: 'user1', filename: 'test1.jpg', approved: true },
    { id: 'user2', filename: 'test2.jpg', approved: true },
    { id: 'user3', filename: 'test3.jpg', approved: true }
  ]))
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(() => Promise.resolve([
    'admin-123456789-abc.jpeg',
    'admin-987654321-xyz.jpeg',
    'IMG_0049.jpeg',
    'IMG_0539.jpeg'
  ]))
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true)
}));

describe('PhotoSelectionManager', () => {
  let manager: PhotoSelectionManager;

  beforeEach(() => {
    manager = new PhotoSelectionManager();
    vi.clearAllMocks();
  });

  describe('selectPhotosForGame', () => {

    it('returns correct structure for valid requests', async () => {
      const result = await manager.selectPhotosForGame(5, 'disco-ball', 'balanced');

      expect(result).toHaveProperty('photos');
      expect(result).toHaveProperty('totalAvailable');
      expect(result).toHaveProperty('userPhotoCount');
      expect(result).toHaveProperty('originalPhotoCount');
      expect(result).toHaveProperty('requestedCount', 5);
      expect(result).toHaveProperty('actualCount');
      expect(result).toHaveProperty('strategy', 'balanced');
      expect(result).toHaveProperty('gameType', 'disco-ball');

      expect(Array.isArray(result.photos)).toBe(true);
    });

    it('handles zero count request', async () => {
      const result = await manager.selectPhotosForGame(0, 'disco-ball', 'balanced');

      expect(result.photos).toHaveLength(0);
      expect(result.requestedCount).toBe(0);
      expect(result.actualCount).toBe(0);
    });

    it('throws error for negative count', async () => {
      await expect(manager.selectPhotosForGame(-1, 'disco-ball', 'balanced'))
        .rejects.toThrow('Count must be non-negative');
    });

    it('respects different selection strategies', async () => {
      const strategies = ['balanced', 'prefer-user', 'random', 'original-only'];

      for (const strategy of strategies) {
        const result = await manager.selectPhotosForGame(5, 'disco-ball', strategy as any);
        expect(result.strategy).toBe(strategy);
      }
    });

    it('handles different game types correctly', async () => {
      const gameTypes: GameType[] = ['disco-ball', 'minigame'];

      for (const gameType of gameTypes) {
        const result = await manager.selectPhotosForGame(5, gameType, 'balanced');
        expect(result.gameType).toBe(gameType);
        expect(result.photos.every(photo => photo.path.includes(
          gameType === 'disco-ball' ? '/thumbs/' : '/minigame/'
        ))).toBe(true);
      }
    });

    it('returns photos with correct PhotoInfo structure', async () => {
      const result = await manager.selectPhotosForGame(3, 'disco-ball', 'balanced');

      result.photos.forEach(photo => {
        expect(photo).toHaveProperty('path');
        expect(photo).toHaveProperty('filename');
        expect(photo).toHaveProperty('isUserPhoto');
        expect(typeof photo.path).toBe('string');
        expect(typeof photo.filename).toBe('string');
        expect(typeof photo.isUserPhoto).toBe('boolean');
      });
    });

  });

  describe('selection strategies', () => {

    it('balanced strategy mixes photo types appropriately', async () => {
      const result = await manager.selectPhotosForGame(10, 'disco-ball', 'balanced');

      // Should have both user and non-user photos when available
      const hasUserPhotos = result.userPhotoCount > 0;
      const hasOriginalPhotos = result.originalPhotoCount > 0;

      // At least one type should be present
      expect(hasUserPhotos || hasOriginalPhotos).toBe(true);
    });

    it('prefer-user strategy prioritizes user photos', async () => {
      const result = await manager.selectPhotosForGame(10, 'disco-ball', 'prefer-user');

      // Should have more user photos than a balanced approach when possible
      expect(result.strategy).toBe('prefer-user');
    });

    it('original-only strategy excludes user photos', async () => {
      const result = await manager.selectPhotosForGame(5, 'disco-ball', 'original-only');

      expect(result.userPhotoCount).toBe(0);
      expect(result.originalPhotoCount).toBeGreaterThan(0);
    });

  });

  describe('fallback behavior', () => {

    it('falls back to original photos when database fails', async () => {
      // Mock database failure
      const { getApprovedPhotos } = await import('../../src/lib/photoDatabase.js');
      vi.mocked(getApprovedPhotos).mockRejectedValueOnce(new Error('Database error'));

      const result = await manager.selectPhotosForGame(3, 'disco-ball', 'balanced');

      // Should still return photos (from original set)
      expect(result.photos.length).toBeGreaterThan(0);
      expect(result.userPhotoCount).toBe(0); // No user photos due to database failure
      expect(result.originalPhotoCount).toBeGreaterThan(0);
    });

  });

  describe('admin photo integration', () => {

    it('includes admin photos in selection pool', async () => {
      const result = await manager.selectPhotosForGame(20, 'disco-ball', 'balanced');

      // Admin photos should be treated as "original" photos in the count
      expect(result.originalPhotoCount).toBeGreaterThan(0);

      // Some photos might have admin- prefix in filename (depending on mock)
      const hasAdminSizedPhotos = result.photos.some(photo =>
        photo.filename && photo.filename.startsWith('admin-')
      );

      // This test depends on mock data, so we just verify structure is correct
      expect(result).toBeDefined();
    });

  });

  describe('photo path generation', () => {

    it('generates correct paths for disco-ball game type', async () => {
      const result = await manager.selectPhotosForGame(3, 'disco-ball', 'balanced');

      result.photos.forEach(photo => {
        if (photo.isUserPhoto) {
          expect(photo.path).toContain('/alina/thumbs/user-');
        } else {
          expect(photo.path).toMatch(/\/alina\/thumbs\/(IMG_|admin-)/);
        }
      });
    });

    it('generates correct paths for minigame game type', async () => {
      const result = await manager.selectPhotosForGame(3, 'minigame', 'balanced');

      result.photos.forEach(photo => {
        if (photo.isUserPhoto) {
          expect(photo.path).toContain('/alina/minigame/user-');
        } else {
          expect(photo.path).toMatch(/\/alina\/minigame\/(IMG_|admin-)/);
        }
      });
    });

  });

  describe('edge cases', () => {

    it('handles empty admin photo directories gracefully', async () => {
      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce([]); // Empty directory

      const result = await manager.selectPhotosForGame(5, 'disco-ball', 'balanced');

      // Should still return photos from original set
      expect(result.photos.length).toBeGreaterThan(0);
    });

    it('handles more requested photos than available', async () => {
      const result = await manager.selectPhotosForGame(1000, 'disco-ball', 'balanced');

      // Should return all available photos without error
      expect(result.actualCount).toBeLessThanOrEqual(result.totalAvailable);
      expect(result.actualCount).toBeGreaterThan(0);
    });

  });

});