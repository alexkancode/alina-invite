import type { IPhotoDatabaseAdapter, PhotoRecord, PhotoMetadata } from '../interfaces/IPhotoDatabaseAdapter.js';
import { getApprovedPhotos, savePhotoMetadata, approvePhoto } from '../../photoDatabase.js';

export class ProductionPhotoDatabaseAdapter implements IPhotoDatabaseAdapter {
  async getApprovedPhotos(limit?: number): Promise<PhotoRecord[]> {
    return await getApprovedPhotos(limit);
  }

  async savePhotoMetadata(metadata: PhotoMetadata): Promise<void> {
    return await savePhotoMetadata(metadata);
  }

  async approvePhoto(id: string, approved: boolean): Promise<void> {
    return await approvePhoto(id, approved);
  }
}