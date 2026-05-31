import { getApprovedPhotos } from './photoDatabase.js';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export type GameType = 'disco-ball' | 'minigame';
export type SelectionStrategy = 'balanced' | 'prefer-user' | 'original-only' | 'random';

export interface PhotoInfo {
  path: string;
  filename: string;
  isUserPhoto: boolean;
  photoId?: string;
}

export interface PhotoSet {
  photos: PhotoInfo[];
  totalAvailable: number;
  userPhotoCount: number;
  originalPhotoCount: number;
  requestedCount: number;
  actualCount: number;
  strategy: SelectionStrategy;
  gameType: GameType;
}

export class PhotoSelectionManager {
  private originalPhotos: { disco: string[]; minigame: string[] };

  constructor() {
    // Original Alina photos from the existing codebase
    this.originalPhotos = {
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
   * Get admin-uploaded photos for the specified game type
   */
  private async getAdminPhotos(gameType: GameType): Promise<string[]> {
    const folderName = gameType === 'disco-ball' ? 'thumbs' : 'minigame';
    const dirPath = path.join(process.cwd(), 'public', 'alina', folderName);

    try {
      if (!existsSync(dirPath)) {
        return [];
      }

      const files = await readdir(dirPath);

      // Filter for admin-uploaded photos (prefix: admin-)
      const adminFiles = files
        .filter(file => file.startsWith('admin-') && file.endsWith('.jpeg'))
        .map(file => `/alina/${folderName}/${file}`);

      return adminFiles;
    } catch (error) {
      console.error(`Error reading admin photos from ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Select photos for a game with intelligent mixing of user, admin, and original photos
   */
  async selectPhotosForGame(
    count: number,
    gameType: GameType,
    strategy: SelectionStrategy = 'balanced'
  ): Promise<PhotoSet> {
    if (count < 0) {
      throw new Error('Count must be non-negative');
    }

    if (count === 0) {
      return {
        photos: [],
        totalAvailable: 0,
        userPhotoCount: 0,
        originalPhotoCount: 0,
        requestedCount: 0,
        actualCount: 0,
        strategy,
        gameType
      };
    }

    try {
      // Get approved user photos, admin photos, and original photos
      const userPhotos = await this.getApprovedUserPhotos();
      const adminPhotos = await this.getAdminPhotos(gameType);
      const originalPhotos = this.getOriginalPhotos(gameType);

      // Convert to PhotoInfo format
      const userPhotoInfos: PhotoInfo[] = userPhotos.map(photo => ({
        path: this.getUserPhotoPath(photo.id, gameType),
        filename: `user-${photo.id}.jpeg`,
        isUserPhoto: true,
        photoId: photo.id
      }));

      const adminPhotoInfos: PhotoInfo[] = adminPhotos.map(path => ({
        path,
        filename: path.split('/').pop()!,
        isUserPhoto: false, // Admin photos are treated like original photos
        photoId: `admin-${path.split('/').pop()!.replace('.jpeg', '')}`
      }));

      const originalPhotoInfos: PhotoInfo[] = originalPhotos.map(path => ({
        path,
        filename: path.split('/').pop()!,
        isUserPhoto: false
      }));

      // Combine admin photos with original photos for selection strategy
      const allNonUserPhotos = [...adminPhotoInfos, ...originalPhotoInfos];
      const totalAvailable = userPhotoInfos.length + allNonUserPhotos.length;

      // Apply selection strategy (admin photos are treated as "original" photos)
      const selectedPhotos = this.applySelectionStrategy(
        userPhotoInfos,
        allNonUserPhotos,
        count,
        strategy
      );

      const userCount = selectedPhotos.filter(p => p.isUserPhoto).length;
      const originalCount = selectedPhotos.filter(p => !p.isUserPhoto).length;

      return {
        photos: selectedPhotos,
        totalAvailable,
        userPhotoCount: userCount,
        originalPhotoCount: originalCount,
        requestedCount: count,
        actualCount: selectedPhotos.length,
        strategy,
        gameType
      };

    } catch (error) {
      console.warn('Failed to load user photos, falling back to original photos only:', error);

      // Fallback to original photos only
      const originalPhotos = this.getOriginalPhotos(gameType);
      const originalPhotoInfos: PhotoInfo[] = originalPhotos.map(path => ({
        path,
        filename: path.split('/').pop()!,
        isUserPhoto: false
      }));

      const selected = this.shuffleArray([...originalPhotoInfos]).slice(0, count);

      return {
        photos: selected,
        totalAvailable: originalPhotos.length,
        userPhotoCount: 0,
        originalPhotoCount: selected.length,
        requestedCount: count,
        actualCount: selected.length,
        strategy,
        gameType
      };
    }
  }

  /**
   * Get approved user photos from database (stub for dependency injection)
   */
  async getApprovedUserPhotos() {
    return await getApprovedPhotos();
  }

  /**
   * Get original photo paths for a game type
   */
  private getOriginalPhotos(gameType: GameType): string[] {
    switch (gameType) {
      case 'disco-ball':
        return this.originalPhotos.disco;
      case 'minigame':
        return this.originalPhotos.minigame;
      default:
        // Default to disco ball for unknown types
        return this.originalPhotos.disco;
    }
  }

  /**
   * Get the path for a user photo based on game type
   */
  private getUserPhotoPath(photoId: string, gameType: GameType): string {
    switch (gameType) {
      case 'disco-ball':
        return `/alina/thumbs/user-${photoId}.jpeg`;
      case 'minigame':
        return `/alina/minigame/user-${photoId}.jpeg`;
      default:
        return `/alina/thumbs/user-${photoId}.jpeg`;
    }
  }

  /**
   * Apply selection strategy to mix user and original photos
   */
  private applySelectionStrategy(
    userPhotos: PhotoInfo[],
    originalPhotos: PhotoInfo[],
    count: number,
    strategy: SelectionStrategy
  ): PhotoInfo[] {
    const totalAvailable = userPhotos.length + originalPhotos.length;
    const actualCount = Math.min(count, totalAvailable);

    switch (strategy) {
      case 'original-only':
        return this.shuffleArray([...originalPhotos]).slice(0, actualCount);

      case 'prefer-user':
        return this.selectWithUserPreference(userPhotos, originalPhotos, actualCount);

      case 'balanced':
        return this.selectBalanced(userPhotos, originalPhotos, actualCount);

      case 'random':
      default:
        const allPhotos = [...userPhotos, ...originalPhotos];
        return this.shuffleArray(allPhotos).slice(0, actualCount);
    }
  }

  /**
   * Select photos with preference for user photos
   */
  private selectWithUserPreference(
    userPhotos: PhotoInfo[],
    originalPhotos: PhotoInfo[],
    count: number
  ): PhotoInfo[] {
    const shuffledUser = this.shuffleArray([...userPhotos]);
    const shuffledOriginal = this.shuffleArray([...originalPhotos]);

    const result: PhotoInfo[] = [];

    // Take as many user photos as possible (up to 3/4 of requested count)
    const maxUserPhotos = Math.min(
      Math.ceil(count * 0.75),
      shuffledUser.length
    );

    result.push(...shuffledUser.slice(0, maxUserPhotos));

    // Fill remainder with original photos
    const remainingNeeded = count - result.length;
    if (remainingNeeded > 0) {
      result.push(...shuffledOriginal.slice(0, remainingNeeded));
    }

    return this.shuffleArray(result);
  }

  /**
   * Select photos with balanced mix of user and original
   */
  private selectBalanced(
    userPhotos: PhotoInfo[],
    originalPhotos: PhotoInfo[],
    count: number
  ): PhotoInfo[] {
    const shuffledUser = this.shuffleArray([...userPhotos]);
    const shuffledOriginal = this.shuffleArray([...originalPhotos]);

    // Aim for 50/50 split, but adjust based on availability
    const totalAvailable = userPhotos.length + originalPhotos.length;
    const userRatio = userPhotos.length / totalAvailable;

    let targetUserCount = Math.round(count * userRatio);
    let targetOriginalCount = count - targetUserCount;

    // Adjust if we don't have enough of one type
    if (targetUserCount > userPhotos.length) {
      targetUserCount = userPhotos.length;
      targetOriginalCount = count - targetUserCount;
    }

    if (targetOriginalCount > originalPhotos.length) {
      targetOriginalCount = originalPhotos.length;
      targetUserCount = count - targetOriginalCount;
    }

    const result: PhotoInfo[] = [];

    result.push(...shuffledUser.slice(0, targetUserCount));
    result.push(...shuffledOriginal.slice(0, targetOriginalCount));

    return this.shuffleArray(result);
  }

  /**
   * Fisher-Yates shuffle algorithm for proper randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}