import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GamePhotoManager, DiscoBallManager, TileGameManager } from '../src/lib/gameIntegration.js';
import { PhotoTestContext, createPhotoTestContext } from './helpers/databaseTransaction.js';
import { approvePhoto } from '../src/lib/photoDatabase.js';

// Tests for game integration with user photos
describe('Game Photo Integration', () => {
  let gamePhotoManager: GamePhotoManager;
  let discoBallManager: DiscoBallManager;
  let tileGameManager: TileGameManager;
  let dbContext: PhotoTestContext;

  beforeEach(async () => {
    gamePhotoManager = new GamePhotoManager();
    discoBallManager = new DiscoBallManager(gamePhotoManager);
    tileGameManager = new TileGameManager(gamePhotoManager);
    // Create isolated test context
    dbContext = await createPhotoTestContext();
  });

  afterEach(async () => {
    // Clean up all test data
    await dbContext.cleanup();
  });

  describe('Game Photo Manager', () => {
    it('should initialize with correct photo paths', async () => {
      const photoPaths = await gamePhotoManager.getOriginalPhotoPaths();

      expect(photoPaths.disco).toHaveLength(10);
      expect(photoPaths.minigame).toHaveLength(10);

      // Should have correct paths
      photoPaths.disco.forEach(path => {
        expect(path).toMatch(/^\/alina\/thumbs\/IMG_\d+\.jpeg$/);
      });

      photoPaths.minigame.forEach(path => {
        expect(path).toMatch(/^\/alina\/minigame\/IMG_\d+\.jpeg$/);
      });
    });

    it('should refresh photo cache when requested', async () => {
      // Get initial state
      const initial = await gamePhotoManager.getAvailablePhotoCount();

      // Add a new photo after getting initial state
      await dbContext.createTestPhoto(true);

      // Refresh cache to pick up new photo
      await gamePhotoManager.refreshPhotoCache();

      // Get updated state
      const updated = await gamePhotoManager.getAvailablePhotoCount();

      expect(updated.userPhotos).toBeGreaterThan(initial.userPhotos);
      expect(updated.total).toBeGreaterThan(initial.total);
    });

    it('should track photo usage statistics', async () => {
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);

      const photos = await gamePhotoManager.selectPhotosForGame(6, 'disco-ball');

      // Record usage
      await gamePhotoManager.recordPhotoUsage(photos.photos, 'disco-ball');

      const stats = await gamePhotoManager.getUsageStats();

      expect(stats.totalUsages).toBeGreaterThan(0);
      expect(stats.gameTypes).toHaveProperty('disco-ball');
      expect(stats.gameTypes['disco-ball']).toBeGreaterThan(0);
    });

    it('should handle photo unavailability gracefully', async () => {
      // Request photos when none are approved
      await dbContext.createTestPhoto(false); // Pending, not approved

      const photos = await gamePhotoManager.selectPhotosForGame(8, 'disco-ball');

      // Should fall back to original photos
      expect(photos.photos).toHaveLength(8);
      expect(photos.userPhotoCount).toBe(0);
      expect(photos.originalPhotoCount).toBe(8);
    });
  });

  describe('Disco Ball Manager', () => {
    it('should generate disco ball photo configuration', async () => {
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);

      const config = await discoBallManager.generateDiscoBallConfig();

      expect(config.photos).toHaveLength(config.photoTileCount); // Should match calculated photo tile count
      expect(config.iridescent.percentage).toBe(30); // 30% iridescent tiles
      expect(config.photo.percentage).toBe(70); // 70% photo tiles

      // Should have mix of original and user photos
      const userPhotos = config.photos.filter(p => p.includes('user-'));
      expect(userPhotos.length).toBeGreaterThan(0);
    });

    it('should maintain disco ball tile distribution', async () => {
      const config = await discoBallManager.generateDiscoBallConfig();

      const totalTiles = config.totalTiles;
      const photoTiles = Math.floor(totalTiles * 0.7);
      const iridescentTiles = totalTiles - photoTiles;

      expect(config.photoTileCount).toBe(photoTiles);
      expect(config.iridescentTileCount).toBe(iridescentTiles);
      expect(config.photos).toHaveLength(photoTiles);
    });

    it('should provide JavaScript for disco ball generation', async () => {
      await dbContext.createTestPhoto(true);

      const jsCode = await discoBallManager.generateDiscoBallJavaScript();

      // Should contain necessary functions and data
      expect(jsCode).toContain('buildDiscoBall');
      expect(jsCode).toContain('photos');
      expect(jsCode).toContain('user-'); // Should include user photos

      // Should be valid JavaScript (basic syntax check)
      expect(() => new Function(jsCode)).not.toThrow();
    });

    it('should handle disco ball rebuild requests', async () => {
      // Initial configuration
      const config1 = await discoBallManager.generateDiscoBallConfig();

      // Add more photos and rebuild
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);

      const config2 = await discoBallManager.generateDiscoBallConfig();

      // Should include new photos
      const userPhotos1 = config1.photos.filter(p => p.includes('user-'));
      const userPhotos2 = config2.photos.filter(p => p.includes('user-'));

      expect(userPhotos2.length).toBeGreaterThan(userPhotos1.length);
    });
  });

  describe('Tile Game Manager', () => {
    it('should generate tile game photo sets', async () => {
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);

      const gameSet = await tileGameManager.generateTileGameSet('medium');

      expect(gameSet.tiles).toHaveLength(16); // 8 pairs = 16 tiles for medium
      expect(gameSet.pairs).toBe(8);
      expect(gameSet.difficulty).toBe('medium');

      // Should have unique pairs
      const pairIds = gameSet.tiles.map(t => t.pairId);
      const uniquePairs = new Set(pairIds);
      expect(uniquePairs.size).toBe(8);

      // Each pair should appear exactly twice
      const pairCounts: { [key: number]: number } = {};
      pairIds.forEach(id => {
        pairCounts[id] = (pairCounts[id] || 0) + 1;
      });

      Object.values(pairCounts).forEach(count => {
        expect(count).toBe(2);
      });
    });

    it('should handle different difficulty levels', async () => {
      const easy = await tileGameManager.generateTileGameSet('easy');
      const medium = await tileGameManager.generateTileGameSet('medium');
      const hard = await tileGameManager.generateTileGameSet('hard');

      expect(easy.pairs).toBe(6);   // 6 pairs = 12 tiles
      expect(medium.pairs).toBe(8); // 8 pairs = 16 tiles
      expect(hard.pairs).toBe(12);  // 12 pairs = 24 tiles

      expect(easy.tiles).toHaveLength(12);
      expect(medium.tiles).toHaveLength(16);
      expect(hard.tiles).toHaveLength(24);
    });

    it('should randomize tile positions', async () => {
      await dbContext.createTestPhoto(true);

      const game1 = await tileGameManager.generateTileGameSet('easy');
      await new Promise(resolve => setTimeout(resolve, 10));
      const game2 = await tileGameManager.generateTileGameSet('easy');

      // Check basic properties
      expect(game1.tiles).toHaveLength(12); // 6 pairs = 12 tiles
      expect(game2.tiles).toHaveLength(12);

      // Check that positions are valid (0 to 11)
      game1.tiles.forEach(tile => {
        expect(tile.position).toBeGreaterThanOrEqual(0);
        expect(tile.position).toBeLessThan(12);
      });

      // Check that the positions are different (randomized)
      const positions1 = game1.tiles.map(t => t.position).join(',');
      const positions2 = game2.tiles.map(t => t.position).join(',');

      expect(positions1).not.toBe(positions2);
    });

    it('should mix user and original photos in tiles', async () => {
      // Create several user photos
      for (let i = 0; i < 5; i++) {
        await dbContext.createTestPhoto(true);
      }

      const gameSet = await tileGameManager.generateTileGameSet('medium');

      // Should have both types of photos
      const userPhotoTiles = gameSet.tiles.filter(t => t.photoPath.includes('user-'));
      const originalPhotoTiles = gameSet.tiles.filter(t => !t.photoPath.includes('user-'));

      expect(userPhotoTiles.length).toBeGreaterThan(0);
      expect(originalPhotoTiles.length).toBeGreaterThan(0);

      // Each pair should use the same photo
      const pairPhotoMap: { [key: number]: string } = {};
      gameSet.tiles.forEach(tile => {
        if (pairPhotoMap[tile.pairId] && pairPhotoMap[tile.pairId] !== tile.photoPath) {
          throw new Error(`Pair ${tile.pairId} has mismatched photos`);
        }
        pairPhotoMap[tile.pairId] = tile.photoPath;
      });
    });

    it('should generate game state for client', async () => {
      await dbContext.createTestPhoto(true);

      const gameSet = await tileGameManager.generateTileGameSet('medium');
      const clientState = tileGameManager.generateClientGameState(gameSet);

      expect(clientState).toHaveProperty('tiles');
      expect(clientState).toHaveProperty('difficulty');
      expect(clientState).toHaveProperty('totalPairs');

      // Client state should not expose pair information
      clientState.tiles.forEach(tile => {
        expect(tile).toHaveProperty('id');
        expect(tile).toHaveProperty('position');
        expect(tile).toHaveProperty('photoPath');
        expect(tile).not.toHaveProperty('pairId'); // Hidden from client
      });
    });
  });

  describe('Integration Between Components', () => {
    it('should coordinate between disco ball and tile game photo usage', async () => {
      // Create shared photos
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);
      await dbContext.createTestPhoto(true);

      // Generate disco ball with some photos
      const discoBallConfig = await discoBallManager.generateDiscoBallConfig();

      // Generate tile game with potentially overlapping photos
      const tileGameSet = await tileGameManager.generateTileGameSet('medium');

      // Both should work independently
      expect(discoBallConfig.photos.length).toBeGreaterThan(0);
      expect(tileGameSet.tiles.length).toBeGreaterThan(0);

      // Both should potentially use the same user photos
      const discoBallUserPhotos = discoBallConfig.photos.filter(p => p.includes('user-'));
      const tileGameUserPhotos = tileGameSet.tiles
        .map(t => t.photoPath)
        .filter(p => p.includes('user-'));

      expect(discoBallUserPhotos.length).toBeGreaterThan(0);
      expect(tileGameUserPhotos.length).toBeGreaterThan(0);
    });

    it('should handle photo approval changes', async () => {
      // Create and approve a photo
      const photoId = await dbContext.createTestPhoto(true);

      // Generate games with the photo
      const initialDiscoBall = await discoBallManager.generateDiscoBallConfig();
      const initialTileGame = await tileGameManager.generateTileGameSet('medium');

      // Revoke approval
      await approvePhoto(photoId, false);

      // Refresh caches
      await gamePhotoManager.refreshPhotoCache();

      // Generate new games
      const updatedDiscoBall = await discoBallManager.generateDiscoBallConfig();
      const updatedTileGame = await tileGameManager.generateTileGameSet('medium');

      // Should not include the revoked photo
      const initialUserPhotos = initialDiscoBall.photos.filter(p => p.includes('user-'));
      const updatedUserPhotos = updatedDiscoBall.photos.filter(p => p.includes('user-'));

      expect(updatedUserPhotos.length).toBeLessThan(initialUserPhotos.length);
    });

    it('should handle high load with many concurrent games', async () => {
      // Create photos for load testing
      for (let i = 0; i < 10; i++) {
        await dbContext.createTestPhoto(true);
      }

      // Generate many games concurrently
      const promises = [];

      // 5 disco balls
      for (let i = 0; i < 5; i++) {
        promises.push(discoBallManager.generateDiscoBallConfig());
      }

      // 10 tile games (different difficulties)
      for (let i = 0; i < 10; i++) {
        const difficulties = ['easy', 'medium', 'hard'];
        const difficulty = difficulties[i % 3];
        promises.push(tileGameManager.generateTileGameSet(difficulty as any));
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(15);
      results.forEach(result => {
        expect(result).toBeTruthy();
      });
    });
  });
});