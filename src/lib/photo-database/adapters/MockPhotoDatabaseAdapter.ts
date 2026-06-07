import type { IPhotoDatabaseAdapter, PhotoRecord, PhotoMetadata } from '../interfaces/IPhotoDatabaseAdapter.js';

export class MockPhotoDatabaseAdapter implements IPhotoDatabaseAdapter {
  private photos: Map<string, PhotoRecord> = new Map();
  private callCounts: Map<string, number> = new Map();

  async getApprovedPhotos(limit?: number): Promise<PhotoRecord[]> {
    this.incrementCallCount('getApprovedPhotos');

    const approved = Array.from(this.photos.values())
      .filter(photo => photo.is_approved === true && photo.is_hidden !== true);

    if (limit !== undefined && limit > 0) {
      return this.shuffleArray([...approved]).slice(0, limit);
    }
    return approved;
  }

  async savePhotoMetadata(metadata: PhotoMetadata): Promise<void> {
    this.incrementCallCount('savePhotoMetadata');

    const photo: PhotoRecord = {
      id: metadata.id,
      original_filename: metadata.originalFilename,
      file_size: metadata.fileSize,
      upload_ip: metadata.uploadIp,
      upload_date: new Date(),
      is_approved: false,
      is_hidden: false
    };

    this.photos.set(metadata.id, photo);
  }

  async approvePhoto(id: string, approved: boolean): Promise<void> {
    this.incrementCallCount('approvePhoto');

    const photo = this.photos.get(id);
    if (photo) {
      this.photos.set(id, { ...photo, is_approved: approved });
    } else {
      throw new Error(`Photo with id ${id} not found`);
    }
  }

  // Test utilities
  addTestPhoto(photo: PhotoRecord): void {
    this.photos.set(photo.id, { ...photo });
  }

  removeAllPhotos(): void {
    this.photos.clear();
  }

  getCallCount(method: string): number {
    return this.callCounts.get(method) || 0;
  }

  resetCallCounts(): void {
    this.callCounts.clear();
  }

  simulateError(method: string): void {
    // Override the method to throw an error
    const originalMethod = (this as any)[method];
    (this as any)[method] = async () => {
      this.incrementCallCount(method);
      throw new Error(`Simulated database error for ${method}`);
    };

    // Restore original method after one call
    setTimeout(() => {
      (this as any)[method] = originalMethod;
    }, 0);
  }

  private incrementCallCount(method: string): void {
    this.callCounts.set(method, (this.callCounts.get(method) || 0) + 1);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}