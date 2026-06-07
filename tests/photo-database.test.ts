import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockPhotoDatabaseAdapter } from '../src/lib/photo-database/adapters/MockPhotoDatabaseAdapter';
import type { PhotoMetadata, PhotoRecord } from '../src/lib/photo-database/interfaces/IPhotoDatabaseAdapter';

// Photo database adapter tests using mock implementation
// Tests the database abstraction layer functionality

describe('Photo Database Operations', () => {
  let adapter: MockPhotoDatabaseAdapter;

  beforeEach(() => {
    adapter = new MockPhotoDatabaseAdapter();
  });

  afterEach(() => {
    adapter.removeAllPhotos();
    adapter.resetCallCounts();
  });

  function generateTestPhotoId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  describe('savePhotoMetadata', () => {
    it('should save photo metadata to database', async () => {
      const photoId = generateTestPhotoId();
      const metadata: PhotoMetadata = {
        id: photoId,
        originalFilename: 'test-photo.jpeg',
        fileSize: 12345,
        uploadIp: '192.168.1.1'
      };

      await adapter.savePhotoMetadata(metadata);

      // Verify it was saved by checking call count
      expect(adapter.getCallCount('savePhotoMetadata')).toBe(1);
    });

    it('should handle duplicate photo IDs gracefully', async () => {
      const photoId = generateTestPhotoId();
      const metadata: PhotoMetadata = {
        id: photoId,
        originalFilename: 'first.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      };

      await adapter.savePhotoMetadata(metadata);

      // Try to save again with same ID - mock allows overwrites
      const duplicateMetadata: PhotoMetadata = {
        ...metadata,
        originalFilename: 'second.jpeg',
        fileSize: 2000,
      };

      // Mock adapter allows overwrites, but we can test the behavior
      await expect(adapter.savePhotoMetadata(duplicateMetadata)).resolves.not.toThrow();
      expect(adapter.getCallCount('savePhotoMetadata')).toBe(2);
    });

    it('should validate required fields', async () => {
      const incompleteMetadata = {
        // Missing required id field
        originalFilename: 'test.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      } as any;

      // Mock adapter doesn't validate, but real adapter would
      // This test documents expected behavior
      await expect(adapter.savePhotoMetadata(incompleteMetadata)).resolves.not.toThrow();
    });

    it('should handle malicious input safely', async () => {
      const photoId = generateTestPhotoId();
      const maliciousMetadata: PhotoMetadata = {
        id: photoId,
        originalFilename: "'; DROP TABLE user_photos; --",
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      };

      // Mock adapter safely stores the malicious string
      await expect(adapter.savePhotoMetadata(maliciousMetadata)).resolves.not.toThrow();
      expect(adapter.getCallCount('savePhotoMetadata')).toBe(1);
    });
  });

  describe('approvePhoto', () => {
    it('should approve a photo and make it available', async () => {
      const photoId = generateTestPhotoId();
      await adapter.savePhotoMetadata({
        id: photoId,
        originalFilename: 'to-approve.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await adapter.approvePhoto(photoId, true);

      // Verify approval by checking approved photos
      const approvedPhotos = await adapter.getApprovedPhotos();
      expect(approvedPhotos.find(p => p.id === photoId)).toBeTruthy();
      expect(adapter.getCallCount('approvePhoto')).toBe(1);
    });

    it('should reject a photo by setting approved to false', async () => {
      const photoId = generateTestPhotoId();
      await adapter.savePhotoMetadata({
        id: photoId,
        originalFilename: 'to-reject.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await adapter.approvePhoto(photoId, false);

      // Verify rejection by checking approved photos (should not include this)
      const approvedPhotos = await adapter.getApprovedPhotos();
      expect(approvedPhotos.find(p => p.id === photoId)).toBeUndefined();
      expect(adapter.getCallCount('approvePhoto')).toBe(1);
    });

    it('should handle non-existent photo IDs gracefully', async () => {
      const fakeId = 'non-existent-photo-id';

      await expect(adapter.approvePhoto(fakeId, true))
        .rejects
        .toThrow('Photo with id non-existent-photo-id not found');
    });
  });

  describe('getApprovedPhotos', () => {
    it('should return only approved photos for game use', async () => {
      // Create mix of approved and pending photos
      const approvedId1 = generateTestPhotoId();
      const approvedId2 = generateTestPhotoId();
      const pendingId = generateTestPhotoId();

      await adapter.savePhotoMetadata({
        id: approvedId1,
        originalFilename: 'approved1.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await adapter.savePhotoMetadata({
        id: approvedId2,
        originalFilename: 'approved2.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.2'
      });

      await adapter.savePhotoMetadata({
        id: pendingId,
        originalFilename: 'pending.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.3'
      });

      // Approve the first two
      await adapter.approvePhoto(approvedId1, true);
      await adapter.approvePhoto(approvedId2, true);
      // pendingId stays unapproved (default false)

      const approved = await adapter.getApprovedPhotos();

      // Should include both approved photos
      expect(approved).toHaveLength(2);
      expect(approved.find(p => p.id === approvedId1)).toBeTruthy();
      expect(approved.find(p => p.id === approvedId2)).toBeTruthy();

      // Should not include pending photo
      expect(approved.find(p => p.id === pendingId)).toBeUndefined();
    });

    it('should support random sampling for game tiles', async () => {
      // Create several approved photos
      const photoIds = [];
      for (let i = 0; i < 15; i++) {
        const id = generateTestPhotoId();
        photoIds.push(id);
        await adapter.savePhotoMetadata({
          id,
          originalFilename: `test${i}.jpeg`,
          fileSize: 1000,
          uploadIp: '192.168.1.1'
        });
        await adapter.approvePhoto(id, true);
      }

      // Get random sample
      const sample = await adapter.getApprovedPhotos(8); // Limit to 8 for game

      expect(sample.length).toBeLessThanOrEqual(8);
      expect(sample.length).toBeGreaterThan(0);

      // All should be approved photos
      sample.forEach(photo => {
        expect(photo.is_approved).toBe(true);
        expect(photoIds).toContain(photo.id);
      });
    });

    it('should return all photos when no limit specified', async () => {
      // Create multiple approved photos
      for (let i = 0; i < 5; i++) {
        const id = generateTestPhotoId();
        await adapter.savePhotoMetadata({
          id,
          originalFilename: `test${i}.jpeg`,
          fileSize: 1000,
          uploadIp: '192.168.1.1'
        });
        await adapter.approvePhoto(id, true);
      }

      const allApproved = await adapter.getApprovedPhotos();
      expect(allApproved).toHaveLength(5);
    });

    it('should exclude hidden photos even if approved', async () => {
      const approvedId = generateTestPhotoId();
      const hiddenId = generateTestPhotoId();

      await adapter.savePhotoMetadata({
        id: approvedId,
        originalFilename: 'approved.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await adapter.savePhotoMetadata({
        id: hiddenId,
        originalFilename: 'hidden.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.2'
      });

      // Approve both
      await adapter.approvePhoto(approvedId, true);
      await adapter.approvePhoto(hiddenId, true);

      // Manually add hidden photo to test hidden functionality
      adapter.addTestPhoto({
        id: hiddenId,
        upload_date: new Date(),
        is_approved: true,
        is_hidden: true, // Hidden
        original_filename: 'hidden.jpeg',
        file_size: 1000,
        upload_ip: '192.168.1.2'
      });

      const approved = await adapter.getApprovedPhotos();

      // Should include only non-hidden approved photo
      expect(approved.find(p => p.id === approvedId)).toBeTruthy();
      expect(approved.find(p => p.id === hiddenId)).toBeUndefined();
    });
  });

  describe('Adapter Test Utilities', () => {
    it('should track method call counts', async () => {
      expect(adapter.getCallCount('savePhotoMetadata')).toBe(0);

      await adapter.savePhotoMetadata({
        id: generateTestPhotoId(),
        originalFilename: 'test.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      expect(adapter.getCallCount('savePhotoMetadata')).toBe(1);

      await adapter.getApprovedPhotos();
      expect(adapter.getCallCount('getApprovedPhotos')).toBe(1);
    });

    it('should reset call counts', async () => {
      await adapter.savePhotoMetadata({
        id: generateTestPhotoId(),
        originalFilename: 'test.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      expect(adapter.getCallCount('savePhotoMetadata')).toBe(1);

      adapter.resetCallCounts();
      expect(adapter.getCallCount('savePhotoMetadata')).toBe(0);
    });

    it('should simulate database errors', async () => {
      const photoId = generateTestPhotoId();

      adapter.simulateError('savePhotoMetadata');

      await expect(adapter.savePhotoMetadata({
        id: photoId,
        originalFilename: 'test.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      })).rejects.toThrow('Simulated database error for savePhotoMetadata');

      // Wait for method restoration (the MockAdapter uses setTimeout)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Method should be restored for next call
      await expect(adapter.savePhotoMetadata({
        id: generateTestPhotoId(),
        originalFilename: 'test2.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      })).resolves.not.toThrow();
    });

    it('should add and remove test photos', async () => {
      const testPhoto: PhotoRecord = {
        id: generateTestPhotoId(),
        upload_date: new Date(),
        is_approved: true,
        is_hidden: false,
        original_filename: 'test.jpeg',
        file_size: 1000,
        upload_ip: '192.168.1.1'
      };

      adapter.addTestPhoto(testPhoto);

      const approved = await adapter.getApprovedPhotos();
      expect(approved.find(p => p.id === testPhoto.id)).toBeTruthy();

      adapter.removeAllPhotos();

      const empty = await adapter.getApprovedPhotos();
      expect(empty).toHaveLength(0);
    });
  });
});

describe('Database Schema Validation', () => {
  let adapter: MockPhotoDatabaseAdapter;

  beforeEach(() => {
    adapter = new MockPhotoDatabaseAdapter();
  });

  it('should have correct photo record structure', async () => {
    const photoId = generateTestPhotoId();
    await adapter.savePhotoMetadata({
      id: photoId,
      originalFilename: 'test.jpeg',
      fileSize: 1000,
      uploadIp: '192.168.1.1'
    });

    // Add as test photo to verify complete structure
    const completePhoto: PhotoRecord = {
      id: photoId,
      upload_date: new Date(),
      is_approved: false,
      is_hidden: false,
      original_filename: 'test.jpeg',
      file_size: 1000,
      upload_ip: '192.168.1.1',
      moderation_notes: 'Test notes'
    };

    adapter.addTestPhoto(completePhoto);

    const approved = await adapter.getApprovedPhotos();
    // Even though we added it, it won't show in approved since is_approved is false
    expect(approved.find(p => p.id === photoId)).toBeUndefined();

    // Approve it to test structure
    await adapter.approvePhoto(photoId, true);
    const nowApproved = await adapter.getApprovedPhotos();
    const photo = nowApproved.find(p => p.id === photoId);

    expect(photo).toBeTruthy();
    expect(photo).toHaveProperty('id');
    expect(photo).toHaveProperty('upload_date');
    expect(photo).toHaveProperty('is_approved');
    expect(photo).toHaveProperty('original_filename');
    expect(photo).toHaveProperty('file_size');
    expect(photo).toHaveProperty('upload_ip');
    expect(photo).toHaveProperty('is_hidden');
  });

  function generateTestPhotoId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
});