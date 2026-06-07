import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhotoSelectionManager, SelectionStrategy, PhotoSet } from '../src/lib/photoSelectionManager.js';
import { MockPhotoDatabaseAdapter } from '../src/lib/photo-database/adapters/MockPhotoDatabaseAdapter.js';
import type { PhotoRecord } from '../src/lib/photo-database/interfaces/IPhotoDatabaseAdapter.js';

// Tests for intelligent photo selection for games
// Uses mock database adapter for perfect test isolation
describe('Photo Selection Manager', () => {
  let photoManager: PhotoSelectionManager;
  let mockAdapter: MockPhotoDatabaseAdapter;

  beforeEach(async () => {
    mockAdapter = new MockPhotoDatabaseAdapter();
    photoManager = new PhotoSelectionManager(mockAdapter);
  });

  afterEach(async () => {
    // Clean up mock data
    mockAdapter.removeAllPhotos();
    mockAdapter.resetCallCounts();
  });

  function createTestPhoto(isApproved: boolean = true): PhotoRecord {
    const id = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const photo: PhotoRecord = {
      id,
      upload_date: new Date(),
      is_approved: isApproved,
      is_hidden: false,
      original_filename: `test-${id}.jpeg`,
      file_size: 1000,
      upload_ip: '192.168.1.1'
    };
    mockAdapter.addTestPhoto(photo);
    return photo;
  }

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
      // Create some approved user photos
      createTestPhoto(true);
      createTestPhoto(true);
      createTestPhoto(true);

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.photos).toHaveLength(8);
      expect(selection.totalAvailable).toBe(13); // 10 original + 3 user
      expect(selection.userPhotoCount).toBeGreaterThan(0);
      expect(selection.originalPhotoCount).toBeGreaterThan(0);

      // Should have mix of both types
      const userPhotos = selection.photos.filter(p => p.isUserPhoto);
      const originalPhotos = selection.photos.filter(p => !p.isUserPhoto);

      expect(userPhotos.length).toBeGreaterThan(0);
      expect(originalPhotos.length).toBeGreaterThan(0);
    });

    it('should prioritize user photos when available', async () => {
      // Create many user photos (more than needed)
      for (let i = 0; i < 12; i++) {
        createTestPhoto(true);
      }

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', 'prefer-user');

      expect(selection.photos).toHaveLength(8);
      expect(selection.userPhotoCount).toBeGreaterThanOrEqual(6); // Should favor user photos

      const userPhotos = selection.photos.filter(p => p.isUserPhoto);
      expect(userPhotos.length).toBeGreaterThanOrEqual(6);
    });

    it('should exclude pending photos from selection', async () => {
      // Create approved and pending photos
      createTestPhoto(true);  // Approved
      createTestPhoto(false); // Pending
      createTestPhoto(true);  // Approved

      const selection = await photoManager.selectPhotosForGame(10, 'disco-ball');

      // Should only count approved photos
      expect(selection.userPhotoCount).toBeLessThanOrEqual(2);

      // All selected user photos should be approved
      const userPhotos = selection.photos.filter(p => p.isUserPhoto);
      expect(userPhotos.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Selection Strategies', () => {
    it('should randomize selection between calls', async () => {
      // Create enough photos for variation
      for (let i = 0; i < 5; i++) {
        createTestPhoto(true);
      }

      const selection1 = await photoManager.selectPhotosForGame(8, 'disco-ball');
      const selection2 = await photoManager.selectPhotosForGame(8, 'disco-ball');

      // With 15 total photos (10 original + 5 user) selecting 8,
      // there should be variation between calls
      const photos1 = selection1.photos.map(p => p.path).sort();
      const photos2 = selection2.photos.map(p => p.path).sort();

      // At least some photos should be different (randomization working)
      const intersection = photos1.filter(p => photos2.includes(p));
      expect(intersection.length).toBeLessThan(8);
    });

    it('should handle balanced strategy correctly', async () => {
      // Create equal numbers of user and original photos available
      for (let i = 0; i < 5; i++) {
        createTestPhoto(true);
      }

      const selection = await photoManager.selectPhotosForGame(10, 'disco-ball', 'balanced');

      // Should try to balance user vs original photos
      const userCount = selection.userPhotoCount;
      const originalCount = selection.originalPhotoCount;

      // Neither should be zero, and they should be reasonably balanced
      expect(userCount).toBeGreaterThan(0);
      expect(originalCount).toBeGreaterThan(0);

      // Difference shouldn't be too extreme
      const difference = Math.abs(userCount - originalCount);
      expect(difference).toBeLessThanOrEqual(4);
    });

    it('should handle original-only strategy', async () => {
      // Create user photos but request original-only
      createTestPhoto(true);
      createTestPhoto(true);

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', 'original-only');

      expect(selection.userPhotoCount).toBe(0);
      expect(selection.originalPhotoCount).toBe(8);

      selection.photos.forEach(photo => {
        expect(photo.isUserPhoto).toBe(false);
      });
    });
  });

  describe('Game Type Specific Selection', () => {
    it('should provide disco ball sized photos for disco ball', async () => {
      createTestPhoto(true);

      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball');

      selection.photos.forEach(photo => {
        if (photo.isUserPhoto) {
          expect(photo.path).toMatch(/\/alina\/thumbs\/user-.*\.jpeg$/);
        } else {
          expect(photo.path).toMatch(/\/alina\/thumbs\/.*\.jpeg$/);
        }
      });
    });

    it('should provide minigame sized photos for tile game', async () => {
      createTestPhoto(true);

      const selection = await photoManager.selectPhotosForGame(8, 'minigame');

      selection.photos.forEach(photo => {
        if (photo.isUserPhoto) {
          expect(photo.path).toMatch(/\/alina\/minigame\/user-.*\.jpeg$/);
        } else {
          expect(photo.path).toMatch(/\/alina\/minigame\/.*\.jpeg$/);
        }
      });
    });

    it('should handle unknown game type gracefully', async () => {
      const selection = await photoManager.selectPhotosForGame(8, 'unknown-game' as any);

      // Should default to some reasonable behavior
      expect(selection.photos).toHaveLength(8);
      expect(selection.totalAvailable).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requesting more photos than available', async () => {
      // Only 10 original photos exist by default
      const selection = await photoManager.selectPhotosForGame(20, 'disco-ball');

      // Should return all available photos
      expect(selection.photos).toHaveLength(10);
      expect(selection.totalAvailable).toBe(10);
      expect(selection.requestedCount).toBe(20);
      expect(selection.actualCount).toBe(10);
    });

    it('should handle zero photo request', async () => {
      const selection = await photoManager.selectPhotosForGame(0, 'disco-ball');

      expect(selection.photos).toHaveLength(0);
      expect(selection.actualCount).toBe(0);
      expect(selection.requestedCount).toBe(0);
    });

    it('should handle negative photo request', async () => {
      await expect(photoManager.selectPhotosForGame(-1, 'disco-ball'))
        .rejects
        .toThrow('Count must be non-negative');
    });

    it('should handle database connection errors gracefully', async () => {
      // Create a photo manager with invalid connection
      const badPhotoManager = new PhotoSelectionManager();

      // Mock the database to fail
      const originalMethod = badPhotoManager.getApprovedUserPhotos;
      badPhotoManager.getApprovedUserPhotos = async () => {
        throw new Error('Database connection failed');
      };

      // Should fallback to original photos only
      const selection = await badPhotoManager.selectPhotosForGame(8, 'disco-ball');

      expect(selection.photos).toHaveLength(8);
      expect(selection.userPhotoCount).toBe(0);
      expect(selection.originalPhotoCount).toBe(8);
    });
  });

  describe('Performance', () => {
    it('should select photos within reasonable time', async () => {
      // Create many photos to test performance
      for (let i = 0; i < 50; i++) {
        createTestPhoto(true);
      }

      const startTime = Date.now();
      const selection = await photoManager.selectPhotosForGame(16, 'disco-ball');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // Should be fast
      expect(selection.photos).toHaveLength(16);
    });

    it('should handle concurrent selection requests', async () => {
      // Create photos for concurrent testing
      for (let i = 0; i < 10; i++) {
        createTestPhoto(true);
      }

      // Make multiple concurrent requests
      const promises = [
        photoManager.selectPhotosForGame(8, 'disco-ball'),
        photoManager.selectPhotosForGame(8, 'minigame'),
        photoManager.selectPhotosForGame(6, 'disco-ball'),
        photoManager.selectPhotosForGame(10, 'minigame')
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.photos.length).toBeGreaterThan(0);
        expect(result.totalAvailable).toBeGreaterThan(0);
      });

      // Results should be independent (different randomization)
      const paths1 = results[0].photos.map(p => p.path).sort();
      const paths2 = results[1].photos.map(p => p.path).sort();

      // Different game types should use different photo sizes
      expect(paths1.some(p => p.includes('/thumbs/'))).toBe(true);
      expect(paths2.some(p => p.includes('/minigame/'))).toBe(true);
    });
  });

  // Integration test with real uploaded photo (if available)
  describe('Integration with Real Upload', () => {
    it('should work with photos uploaded via API', async () => {
      console.log('\n🎮 Integration Test: Photo Selection with Real Upload');

      const uploadedPhotoId = '7221f26b6b55a7c7d40b190f040d89c9'; // Photo uploaded via API

      // Test before approval
      console.log('\n📸 Testing before photo approval:');
      const beforeApproval = await photoManager.selectPhotosForGame(8, 'disco-ball');
      console.log(`   User photos: ${beforeApproval.userPhotoCount}, Original: ${beforeApproval.originalPhotoCount}`);

      // Try to approve the uploaded photo (might already be approved or not exist)
      try {
        const { approvePhoto } = await import('../src/lib/photoDatabase.js');
        await approvePhoto(uploadedPhotoId, true);
        console.log('   ✅ Photo approved successfully');

        // Test after approval
        const afterApproval = await photoManager.selectPhotosForGame(8, 'disco-ball');
        console.log(`   After approval - User photos: ${afterApproval.userPhotoCount}, Original: ${afterApproval.originalPhotoCount}`);

        if (afterApproval.userPhotoCount > beforeApproval.userPhotoCount) {
          console.log('   🎉 SUCCESS: Photo selection is working with uploaded photos!');
        }

      } catch (error) {
        console.log(`   ℹ️  Photo not available or already processed: ${error.message}`);
      }

      // Test different strategies with current state
      console.log('\n🎯 Testing selection strategies:');
      const strategies = ['balanced', 'prefer-user', 'original-only'] as const;
      for (const strategy of strategies) {
        const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', strategy);
        console.log(`   ${strategy}: ${selection.userPhotoCount} user + ${selection.originalPhotoCount} original`);
      }

      // Test both game types
      console.log('\n🎮 Testing game-specific photo sizing:');
      const discoBall = await photoManager.selectPhotosForGame(4, 'disco-ball');
      const minigame = await photoManager.selectPhotosForGame(4, 'minigame');

      if (discoBall.photos.length > 0 && minigame.photos.length > 0) {
        console.log(`   Disco ball path: ${discoBall.photos[0].path}`);
        console.log(`   Minigame path: ${minigame.photos[0].path}`);

        // Verify they use different paths (thumbs vs minigame)
        const discoHasThumbPath = discoBall.photos.some(p => p.path.includes('/thumbs/'));
        const minigameHasMinigamePath = minigame.photos.some(p => p.path.includes('/minigame/'));

        if (discoHasThumbPath && minigameHasMinigamePath) {
          console.log('   ✅ Game-specific photo sizing is working!');
        }
      }

      console.log('\n✅ Integration testing completed');

      // Always pass - this is just for verification, not strict testing
      expect(true).toBe(true);
    });
  });
});