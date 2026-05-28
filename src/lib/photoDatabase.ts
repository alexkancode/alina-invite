import { Client } from 'pg';

export interface PhotoMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  uploadIp: string;
}

export interface PhotoRecord {
  id: string;
  upload_date: Date;
  is_approved: boolean;
  original_filename: string;
  file_size: number;
  upload_ip: string;
  is_hidden: boolean;
  moderation_notes?: string;
}

/**
 * Get database connection
 */
async function getDbClient(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
  });
  await client.connect();
  return client;
}

/**
 * Save photo metadata to database
 * @param metadata - Photo metadata to save
 */
export async function savePhotoMetadata(metadata: PhotoMetadata): Promise<void> {
  const client = await getDbClient();

  try {
    const query = `
      INSERT INTO user_photos (id, original_filename, file_size, upload_ip)
      VALUES ($1, $2, $3, $4)
    `;

    await client.query(query, [
      metadata.id,
      metadata.originalFilename,
      metadata.fileSize,
      metadata.uploadIp
    ]);

  } catch (error) {
    throw new Error(`Failed to save photo metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Get pending photos for moderation (unapproved, non-hidden, ordered by date)
 * @returns Array of pending photo records
 */
export async function getPendingPhotos(): Promise<PhotoRecord[]> {
  const client = await getDbClient();

  try {
    const query = `
      SELECT id, upload_date, is_approved, original_filename, file_size, upload_ip, is_hidden, moderation_notes
      FROM user_photos
      WHERE is_approved = false AND is_hidden = false
      ORDER BY upload_date ASC
    `;

    const result = await client.query(query);
    return result.rows;

  } catch (error) {
    throw new Error(`Failed to get pending photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Approve or reject a photo
 * @param photoId - ID of photo to approve/reject
 * @param approved - Whether to approve (true) or reject (false)
 */
export async function approvePhoto(photoId: string, approved: boolean): Promise<void> {
  const client = await getDbClient();

  try {
    const query = `
      UPDATE user_photos
      SET is_approved = $1
      WHERE id = $2
    `;

    const result = await client.query(query, [approved, photoId]);

    if (result.rowCount === 0) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }

  } catch (error) {
    throw new Error(`Failed to approve photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Get approved photos for use in games
 * @param limit - Maximum number of photos to return (optional)
 * @returns Array of approved photo records, optionally limited and randomized
 */
export async function getApprovedPhotos(limit?: number): Promise<PhotoRecord[]> {
  const client = await getDbClient();

  try {
    let query = `
      SELECT id, upload_date, is_approved, original_filename, file_size, upload_ip, is_hidden, moderation_notes
      FROM user_photos
      WHERE is_approved = true AND is_hidden = false
    `;

    if (limit !== undefined) {
      query += ` ORDER BY RANDOM() LIMIT $1`;
      const result = await client.query(query, [limit]);
      return result.rows;
    } else {
      const result = await client.query(query);
      return result.rows;
    }

  } catch (error) {
    throw new Error(`Failed to get approved photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Hide a photo from display (soft delete)
 * @param photoId - ID of photo to hide
 * @param reason - Optional reason for hiding
 */
export async function hidePhoto(photoId: string, reason?: string): Promise<void> {
  const client = await getDbClient();

  try {
    const query = `
      UPDATE user_photos
      SET is_hidden = true, moderation_notes = $1
      WHERE id = $2
    `;

    const result = await client.query(query, [reason || '', photoId]);

    if (result.rowCount === 0) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }

  } catch (error) {
    throw new Error(`Failed to hide photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Get photo upload statistics
 * @returns Statistics about photo uploads
 */
export async function getPhotoStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  hidden: number;
}> {
  const client = await getDbClient();

  try {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_approved = false AND is_hidden = false) as pending,
        COUNT(*) FILTER (WHERE is_approved = true AND is_hidden = false) as approved,
        COUNT(*) FILTER (WHERE is_hidden = true) as hidden
      FROM user_photos
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      pending: parseInt(row.pending),
      approved: parseInt(row.approved),
      hidden: parseInt(row.hidden)
    };

  } catch (error) {
    throw new Error(`Failed to get photo stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}

/**
 * Check if an IP has uploaded recently (for basic rate limiting)
 * @param uploadIp - IP address to check
 * @param withinMinutes - Check uploads within this many minutes
 * @returns Number of uploads from this IP within the time window
 */
export async function getRecentUploadsFromIp(uploadIp: string, withinMinutes: number = 60): Promise<number> {
  const client = await getDbClient();

  try {
    const query = `
      SELECT COUNT(*)
      FROM user_photos
      WHERE upload_ip = $1
        AND upload_date > NOW() - INTERVAL '${withinMinutes} minutes'
    `;

    const result = await client.query(query, [uploadIp]);
    return parseInt(result.rows[0].count);

  } catch (error) {
    throw new Error(`Failed to check recent uploads: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await client.end();
  }
}