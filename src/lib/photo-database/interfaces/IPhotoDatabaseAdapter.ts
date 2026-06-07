export interface PhotoRecord {
  id: string;
  upload_date?: Date;
  is_approved?: boolean;
  original_filename?: string;
  file_size?: number;
  upload_ip?: string;
  is_hidden?: boolean;
  moderation_notes?: string;
}

export interface PhotoMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  uploadIp: string;
}

export interface IPhotoDatabaseAdapter {
  getApprovedPhotos(limit?: number): Promise<PhotoRecord[]>;
  savePhotoMetadata(metadata: PhotoMetadata): Promise<void>;
  approvePhoto(id: string, approved: boolean): Promise<void>;
}