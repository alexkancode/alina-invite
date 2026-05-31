import { PhotoSelectionManager, PhotoInfo, GameType, SelectionStrategy } from './photoSelectionManager.js';
import { Client } from 'pg';

export interface UsageStats {
  totalUsages: number;
  gameTypes: { [gameType: string]: number };
  userPhotoUsages: number;
  originalPhotoUsages: number;
}

export interface PhotoCount {
  userPhotos: number;
  originalPhotos: number;
  total: number;
}

export interface DiscoBallConfig {
  photos: string[];
  totalTiles: number;
  photoTileCount: number;
  iridescentTileCount: number;
  iridescent: {
    percentage: number;
  };
  photo: {
    percentage: number;
  };
}

export interface GameTile {
  id: number;
  pairId: number;
  position: number;
  photoPath: string;
  emoji?: string;
}

export interface TileGameSet {
  tiles: GameTile[];
  pairs: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ClientGameTile {
  id: number;
  position: number;
  photoPath: string;
  emoji?: string;
}

export interface ClientGameState {
  tiles: ClientGameTile[];
  difficulty: string;
  totalPairs: number;
}

/**
 * Central manager for game photo integration
 */
export class GamePhotoManager {
  private photoSelectionManager: PhotoSelectionManager;
  private dbClient: Client | null = null;

  constructor() {
    this.photoSelectionManager = new PhotoSelectionManager();
  }

  private async getDbClient(): Promise<Client> {
    if (!this.dbClient) {
      this.dbClient = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await this.dbClient.connect();
    }
    return this.dbClient;
  }

  /**
   * Select photos for a specific game
   */
  async selectPhotosForGame(
    count: number,
    gameType: GameType,
    strategy: SelectionStrategy = 'balanced'
  ) {
    return await this.photoSelectionManager.selectPhotosForGame(count, gameType, strategy);
  }

  /**
   * Get original photo paths organized by game type
   */
  async getOriginalPhotoPaths(): Promise<{ disco: string[]; minigame: string[] }> {
    return {
      disco: [
        '/alina/thumbs/IMG_0049.jpeg',
        '/alina/thumbs/IMG_0539.jpeg',
        '/alina/thumbs/IMG_0736.jpeg',
        '/alina/thumbs/IMG_7205.jpeg',
        '/alina/thumbs/IMG_7380.jpeg',
        '/alina/thumbs/IMG_8370.jpeg',
        '/alina/thumbs/IMG_8625.jpeg',
        '/alina/thumbs/IMG_9286.jpeg',
        '/alina/thumbs/IMG_9477.jpeg',
        '/alina/thumbs/IMG_9532.jpeg'
      ],
      minigame: [
        '/alina/minigame/IMG_0049.jpeg',
        '/alina/minigame/IMG_0539.jpeg',
        '/alina/minigame/IMG_0736.jpeg',
        '/alina/minigame/IMG_7205.jpeg',
        '/alina/minigame/IMG_7380.jpeg',
        '/alina/minigame/IMG_8370.jpeg',
        '/alina/minigame/IMG_8625.jpeg',
        '/alina/minigame/IMG_9286.jpeg',
        '/alina/minigame/IMG_9477.jpeg',
        '/alina/minigame/IMG_9532.jpeg'
      ]
    };
  }

  /**
   * Get count of available photos
   */
  async getAvailablePhotoCount(): Promise<PhotoCount> {
    const userPhotos = await this.photoSelectionManager.getApprovedUserPhotos();
    const originalPaths = await this.getOriginalPhotoPaths();

    return {
      userPhotos: userPhotos.length,
      originalPhotos: originalPaths.disco.length, // Same count for both game types
      total: userPhotos.length + originalPaths.disco.length
    };
  }

  /**
   * Refresh photo cache (for when new photos are approved)
   */
  async refreshPhotoCache(): Promise<void> {
    // Force refresh by creating a new instance and clear any internal caches
    this.photoSelectionManager = new PhotoSelectionManager();

    // Force a database query to ensure fresh data
    await this.photoSelectionManager.getApprovedUserPhotos();
  }

  /**
   * Record photo usage for analytics
   */
  async recordPhotoUsage(photos: PhotoInfo[], gameType: GameType): Promise<void> {
    const client = await this.getDbClient();

    try {
      const userPhotoUsages = photos.filter(p => p.isUserPhoto).length;
      const originalPhotoUsages = photos.filter(p => !p.isUserPhoto).length;

      // Insert usage record
      await client.query(`
        INSERT INTO photo_usage_stats (game_type, user_photo_count, original_photo_count, usage_date)
        VALUES ($1, $2, $3, NOW())
      `, [gameType, userPhotoUsages, originalPhotoUsages]);

    } catch (error) {
      console.warn('Failed to record photo usage:', error);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    const client = await this.getDbClient();

    try {
      const result = await client.query(`
        SELECT
          game_type,
          SUM(user_photo_count + original_photo_count) as total_usage,
          SUM(user_photo_count) as user_usage,
          SUM(original_photo_count) as original_usage
        FROM photo_usage_stats
        GROUP BY game_type
      `);

      const gameTypes: { [gameType: string]: number } = {};
      let totalUsages = 0;
      let userPhotoUsages = 0;
      let originalPhotoUsages = 0;

      result.rows.forEach(row => {
        gameTypes[row.game_type] = parseInt(row.total_usage);
        totalUsages += parseInt(row.total_usage);
        userPhotoUsages += parseInt(row.user_usage);
        originalPhotoUsages += parseInt(row.original_usage);
      });

      return {
        totalUsages,
        gameTypes,
        userPhotoUsages,
        originalPhotoUsages
      };

    } catch (error) {
      console.warn('Failed to get usage stats:', error);
      return {
        totalUsages: 0,
        gameTypes: {},
        userPhotoUsages: 0,
        originalPhotoUsages: 0
      };
    }
  }

  async close(): Promise<void> {
    if (this.dbClient) {
      await this.dbClient.end();
      this.dbClient = null;
    }
  }
}

/**
 * Manager for disco ball photo integration
 */
export class DiscoBallManager {
  private gamePhotoManager: GamePhotoManager;

  constructor(gamePhotoManager: GamePhotoManager) {
    this.gamePhotoManager = gamePhotoManager;
  }

  /**
   * Generate configuration for disco ball with mixed photos
   */
  async generateDiscoBallConfig(): Promise<DiscoBallConfig> {
    // Disco ball has approximately 70% photo tiles, 30% iridescent
    const totalTiles = 150; // Approximate number of tiles on disco ball
    const photoPercentage = 70;
    const iridescentPercentage = 30;

    const photoTileCount = Math.floor(totalTiles * (photoPercentage / 100));
    const iridescentTileCount = totalTiles - photoTileCount;

    // Request enough photos to fill all photo tiles (with repetition)
    const uniquePhotosNeeded = Math.min(photoTileCount, 20); // Cap at reasonable number
    const photoSelection = await this.gamePhotoManager.selectPhotosForGame(
      uniquePhotosNeeded,
      'disco-ball',
      'balanced'
    );

    // Repeat photos to fill all photo tile slots with cache-busting
    const cacheBuster = Date.now();
    const photoPaths: string[] = [];
    for (let i = 0; i < photoTileCount; i++) {
      const photoIndex = i % photoSelection.photos.length;
      const photoPath = photoSelection.photos[photoIndex].path;
      // Add cache-busting parameter to ensure fresh photo loading
      photoPaths.push(`${photoPath}?v=${cacheBuster}`);
    }

    return {
      photos: photoPaths,
      totalTiles,
      photoTileCount,
      iridescentTileCount,
      iridescent: {
        percentage: iridescentPercentage
      },
      photo: {
        percentage: photoPercentage
      }
    };
  }

  /**
   * Generate JavaScript code for disco ball with mixed photos
   */
  async generateDiscoBallJavaScript(): Promise<string> {
    const config = await this.generateDiscoBallConfig();

    return `
      // Generated disco ball configuration with user and original photos
      const photos = ${JSON.stringify(config.photos)};

      function buildDiscoBall(containerId, radius, tileSize) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const latStep = tileSize / radius;
        const gapFactor = 1.15;
        let count = 0;

        for (let phi = latStep / 2; phi < Math.PI; phi += latStep) {
          const ringRadius = radius * Math.sin(phi);
          const numTiles = Math.max(2, Math.floor((2 * Math.PI * ringRadius) / (tileSize * gapFactor)));
          const lonStep = (2 * Math.PI) / numTiles;

          for (let i = 0; i < numTiles; i++) {
            const theta = i * lonStep;
            const tile = document.createElement('div');
            tile.className = 'mirror-tile';
            tile.style.width = tileSize + 'px';
            tile.style.height = tileSize + 'px';
            tile.style.left = -(tileSize / 2) + 'px';
            tile.style.top = -(tileSize / 2) + 'px';
            tile.style.transform =
              \`rotateY(\${(theta * 180) / Math.PI}deg) \` +
              \`rotateX(\${(phi * 180) / Math.PI - 90}deg) \` +
              \`translateZ(\${radius}px)\`;

            if (Math.random() < ${config.iridescent.percentage / 100}) {
              // Iridescent tile
              tile.classList.add('iridescent');
            } else {
              // Photo tile
              tile.style.backgroundImage = \`url('\${photos[count % photos.length]}')\`;
              tile.style.backgroundSize = 'cover';
              tile.style.backgroundPosition = 'center';
            }
            container.appendChild(tile);
            count++;
          }
        }
      }

      // Initialize disco ball
      buildDiscoBall('discoBall', 130, 22);
    `;
  }
}

/**
 * Manager for tile matching game integration
 */
export class TileGameManager {
  private gamePhotoManager: GamePhotoManager;

  constructor(gamePhotoManager: GamePhotoManager) {
    this.gamePhotoManager = gamePhotoManager;
  }

  /**
   * Generate tile game set with mixed photos
   */
  async generateTileGameSet(difficulty: 'easy' | 'medium' | 'hard'): Promise<TileGameSet> {
    const pairCounts = {
      easy: 6,   // 6 pairs = 12 tiles
      medium: 8, // 8 pairs = 16 tiles
      hard: 12   // 12 pairs = 24 tiles
    };

    const pairs = pairCounts[difficulty];

    // Get available photos (may be fewer than needed)
    const maxAvailablePhotos = Math.min(pairs, 20); // Request up to needed, cap at reasonable limit
    const photoSelection = await this.gamePhotoManager.selectPhotosForGame(
      maxAvailablePhotos,
      'minigame',
      'balanced'
    );

    // Create photo list for pairs (repeat photos if necessary)
    const photoList: PhotoInfo[] = [];
    for (let i = 0; i < pairs; i++) {
      const photoIndex = i % photoSelection.photos.length;
      photoList.push(photoSelection.photos[photoIndex]);
    }

    // Create tiles (2 per pair)
    const tiles: GameTile[] = [];
    let tileId = 0;

    photoList.forEach((photo, pairId) => {
      // Create two tiles for each pair
      for (let i = 0; i < 2; i++) {
        tiles.push({
          id: tileId++,
          pairId,
          position: 0, // Will be set during shuffle
          photoPath: photo.path
        });
      }
    });

    // Shuffle tile positions using Fisher-Yates algorithm with better seed variation
    const positions = Array.from({ length: tiles.length }, (_, i) => i);

    // Add entropy to improve randomization
    const seed = Date.now() + Math.random() * 1000000;
    let seedState = seed;

    const seededRandom = () => {
      seedState = (seedState * 9301 + 49297) % 233280;
      return seedState / 233280;
    };

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Assign shuffled positions
    tiles.forEach((tile, index) => {
      tile.position = positions[index];
    });

    // Don't sort by position - that would undo the randomization!
    // Keep the shuffled order to maintain randomized tile positions

    return {
      tiles,
      pairs,
      difficulty
    };
  }

  /**
   * Generate client-safe game state (no pair information exposed)
   */
  generateClientGameState(gameSet: TileGameSet): ClientGameState {
    const clientTiles: ClientGameTile[] = gameSet.tiles.map(tile => ({
      id: tile.id,
      position: tile.position,
      photoPath: tile.photoPath,
      emoji: tile.emoji
    }));

    return {
      tiles: clientTiles,
      difficulty: gameSet.difficulty,
      totalPairs: gameSet.pairs
    };
  }
}