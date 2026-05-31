import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { savePhotoMetadata, getPendingPhotos, approvePhoto, getApprovedPhotos } from '../src/lib/photoDatabase.js';

// Database integration tests for photo metadata
// These ensure proper storage and retrieval of photo records

let testPhotoIds: string[] = [];

function generateTestPhotoId(): string {
  const id = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  testPhotoIds.push(id);
  return id;
}

afterEach(async () => {
  // Clean up test data
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
  });
  await client.connect();

  for (const photoId of testPhotoIds) {
    await client.query('DELETE FROM user_photos WHERE id = $1', [photoId]);
  }

  await client.end();
  testPhotoIds = [];
});

describe('Photo Database Operations', () => {

  describe('savePhotoMetadata', () => {
    it('should save photo metadata to database', async () => {
      const photoId = generateTestPhotoId();
      const metadata = {
        id: photoId,
        originalFilename: 'test-photo.jpeg',
        fileSize: 12345,
        uploadIp: '192.168.1.1'
      };

      await expect(savePhotoMetadata(metadata)).resolves.not.toThrow();

      // Verify it was saved
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await client.connect();

      const result = await client.query('SELECT * FROM user_photos WHERE id = $1', [photoId]);
      expect(result.rows).toHaveLength(1);

      const saved = result.rows[0];
      expect(saved.id).toBe(photoId);
      expect(saved.original_filename).toBe('test-photo.jpeg');
      expect(saved.file_size).toBe(12345);
      expect(saved.upload_ip).toBe('192.168.1.1');
      expect(saved.is_approved).toBe(false); // Default
      expect(saved.is_hidden).toBe(false);   // Default
      expect(saved.upload_date).toBeTruthy();

      await client.end();
    });

    it('should handle duplicate photo IDs gracefully', async () => {
      const photoId = generateTestPhotoId();
      const metadata = {
        id: photoId,
        originalFilename: 'first.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      };

      await savePhotoMetadata(metadata);

      // Try to save again with same ID
      const duplicateMetadata = {
        ...metadata,
        originalFilename: 'second.jpeg',
        fileSize: 2000,
      };

      await expect(savePhotoMetadata(duplicateMetadata))
        .rejects
        .toThrow(); // Should reject duplicate primary key
    });

    it('should validate required fields', async () => {
      const incompleteMetadata = {
        // Missing required id field
        originalFilename: 'test.jpeg',
        fileSize: 1000,
      };

      await expect(savePhotoMetadata(incompleteMetadata as any))
        .rejects
        .toThrow();
    });

    it('should handle malicious input safely', async () => {
      const photoId = generateTestPhotoId();
      const maliciousMetadata = {
        id: photoId,
        originalFilename: "'; DROP TABLE user_photos; --",
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      };

      await expect(savePhotoMetadata(maliciousMetadata)).resolves.not.toThrow();

      // Verify table still exists and data is safely stored
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await client.connect();

      const result = await client.query('SELECT * FROM user_photos WHERE id = $1', [photoId]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].original_filename).toBe("'; DROP TABLE user_photos; --");

      await client.end();
    });
  });

  describe('getPendingPhotos', () => {
    it('should return only unapproved, non-hidden photos', async () => {
      // Create test photos with different states
      const pendingId = generateTestPhotoId();
      const approvedId = generateTestPhotoId();
      const hiddenId = generateTestPhotoId();

      await savePhotoMetadata({
        id: pendingId,
        originalFilename: 'pending.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await savePhotoMetadata({
        id: approvedId,
        originalFilename: 'approved.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.2'
      });

      await savePhotoMetadata({
        id: hiddenId,
        originalFilename: 'hidden.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.3'
      });

      // Manually set states
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await client.connect();

      await client.query('UPDATE user_photos SET is_approved = true WHERE id = $1', [approvedId]);
      await client.query('UPDATE user_photos SET is_hidden = true WHERE id = $1', [hiddenId]);

      await client.end();

      // Test getPendingPhotos
      const pending = await getPendingPhotos();

      expect(pending).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: pendingId,
            original_filename: 'pending.jpeg'
          })
        ])
      );

      // Should not include approved or hidden photos
      expect(pending.find(p => p.id === approvedId)).toBeUndefined();
      expect(pending.find(p => p.id === hiddenId)).toBeUndefined();
    });

    it('should return photos in upload date order (oldest first)', async () => {
      // Create multiple pending photos with slight delays
      const firstId = generateTestPhotoId();
      await savePhotoMetadata({
        id: firstId,
        originalFilename: 'first.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondId = generateTestPhotoId();
      await savePhotoMetadata({
        id: secondId,
        originalFilename: 'second.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.2'
      });

      const pending = await getPendingPhotos();

      expect(pending.length).toBeGreaterThanOrEqual(2);

      // Find our test photos
      const first = pending.find(p => p.id === firstId);
      const second = pending.find(p => p.id === secondId);

      expect(first).toBeTruthy();
      expect(second).toBeTruthy();

      // First should come before second in the array
      const firstIndex = pending.indexOf(first!);
      const secondIndex = pending.indexOf(second!);
      expect(firstIndex).toBeLessThan(secondIndex);
    });
  });

  describe('approvePhoto', () => {
    it('should approve a photo and make it available', async () => {
      const photoId = generateTestPhotoId();
      await savePhotoMetadata({
        id: photoId,
        originalFilename: 'to-approve.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await approvePhoto(photoId, true);

      // Verify approval
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await client.connect();

      const result = await client.query('SELECT is_approved FROM user_photos WHERE id = $1', [photoId]);
      expect(result.rows[0].is_approved).toBe(true);

      await client.end();
    });

    it('should reject a photo by setting approved to false', async () => {
      const photoId = generateTestPhotoId();
      await savePhotoMetadata({
        id: photoId,
        originalFilename: 'to-reject.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await approvePhoto(photoId, false);

      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
      });
      await client.connect();

      const result = await client.query('SELECT is_approved FROM user_photos WHERE id = $1', [photoId]);
      expect(result.rows[0].is_approved).toBe(false);

      await client.end();
    });

    it('should handle non-existent photo IDs gracefully', async () => {
      const fakeId = 'non-existent-photo-id';

      await expect(approvePhoto(fakeId, true))
        .rejects
        .toThrow();
    });
  });

  describe('getApprovedPhotos', () => {
    it('should return only approved photos for game use', async () => {
      // Create mix of approved and pending photos
      const approvedId1 = generateTestPhotoId();
      const approvedId2 = generateTestPhotoId();
      const pendingId = generateTestPhotoId();

      await savePhotoMetadata({
        id: approvedId1,
        originalFilename: 'approved1.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.1'
      });

      await savePhotoMetadata({
        id: approvedId2,
        originalFilename: 'approved2.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.2'
      });

      await savePhotoMetadata({
        id: pendingId,
        originalFilename: 'pending.jpeg',
        fileSize: 1000,
        uploadIp: '192.168.1.3'
      });

      // Approve the first two
      await approvePhoto(approvedId1, true);
      await approvePhoto(approvedId2, true);

      const approved = await getApprovedPhotos();

      // Should include both approved photos
      expect(approved).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: approvedId1 }),
          expect.objectContaining({ id: approvedId2 })
        ])
      );

      // Should not include pending photo
      expect(approved.find(p => p.id === pendingId)).toBeUndefined();
    });

    it('should support random sampling for game tiles', async () => {
      // Create several approved photos
      const photoIds = [];
      for (let i = 0; i < 15; i++) {
        const id = generateTestPhotoId();
        photoIds.push(id);
        await savePhotoMetadata({
          id,
          originalFilename: `test${i}.jpeg`,
          fileSize: 1000,
          uploadIp: '192.168.1.1'
        });
        await approvePhoto(id, true);
      }

      // Get random sample
      const sample = await getApprovedPhotos(8); // Limit to 8 for game

      expect(sample.length).toBeLessThanOrEqual(8);
      expect(sample.length).toBeGreaterThan(0);

      // Should be truly random - run multiple times and verify difference
      const sample2 = await getApprovedPhotos(8);
      const idsFromSample1 = new Set(sample.map(p => p.id));
      const idsFromSample2 = new Set(sample2.map(p => p.id));

      // With 15 photos and selecting 8, different samples should be possible
      // (This test might occasionally fail due to randomness, but very unlikely)
      if (sample.length >= 8 && sample2.length >= 8) {
        const intersection = new Set([...idsFromSample1].filter(id => idsFromSample2.has(id)));
        expect(intersection.size).toBeLessThan(8); // Not exactly the same
      }
    });
  });
});

describe('Database Schema Validation', () => {
  it('should have correct table structure', async () => {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
    });
    await client.connect();

    // Verify table exists and has expected columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_photos'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = {
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      };
      return acc;
    }, {} as Record<string, any>);

    // Verify expected columns exist
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('upload_date');
    expect(columns).toHaveProperty('is_approved');
    expect(columns).toHaveProperty('original_filename');
    expect(columns).toHaveProperty('file_size');
    expect(columns).toHaveProperty('upload_ip');
    expect(columns).toHaveProperty('is_hidden');

    // Verify correct types and constraints
    expect(columns.id.type).toBe('character varying');
    expect(columns.id.nullable).toBe(false);
    expect(columns.is_approved.default).toBe('false');
    expect(columns.is_hidden.default).toBe('false');

    await client.end();
  });

  it('should have proper indexes for performance', async () => {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
    });
    await client.connect();

    // Check for index on approved photos (for game queries)
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'user_photos'
      AND indexdef LIKE '%is_approved%'
    `);

    expect(indexResult.rows.length).toBeGreaterThan(0);

    await client.end();
  });
});