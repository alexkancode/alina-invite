/**
 * Database Transaction Test Helper
 *
 * Implements perfect test isolation using database transaction rollback.
 * Based on best practices from:
 * - Martin Fowler's test isolation patterns
 * - PostgreSQL MVCC transaction isolation
 * - Modern JavaScript testing frameworks (2026)
 */

import { Client } from 'pg';

export interface DatabaseTestContext {
  client: Client;
  rollback: () => Promise<void>;
}

/**
 * Creates an isolated database transaction for testing.
 *
 * Each test runs in its own transaction which is automatically
 * rolled back after the test completes, ensuring perfect isolation
 * without leaving any test data behind.
 *
 * Usage:
 * ```typescript
 * let dbContext: DatabaseTestContext;
 *
 * beforeEach(async () => {
 *   dbContext = await createDatabaseTestContext();
 * });
 *
 * afterEach(async () => {
 *   await dbContext.rollback();
 * });
 * ```
 */
export async function createDatabaseTestContext(): Promise<DatabaseTestContext> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
  });

  await client.connect();

  // Start transaction for perfect isolation
  await client.query('BEGIN');

  // Set transaction characteristics for consistent testing
  await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

  return {
    client,
    rollback: async () => {
      try {
        // Rollback all changes made during the test
        await client.query('ROLLBACK');
      } finally {
        // Always close the connection
        await client.end();
      }
    }
  };
}

/**
 * Wrapper function that automatically handles transaction setup and cleanup.
 *
 * Usage:
 * ```typescript
 * await withDatabaseTransaction(async (client) => {
 *   // All database operations here will be automatically rolled back
 *   await client.query('INSERT INTO user_photos ...');
 *   // Test your code
 * });
 * ```
 */
export async function withDatabaseTransaction<T>(
  testFn: (client: Client) => Promise<T>
): Promise<T> {
  const context = await createDatabaseTestContext();
  try {
    return await testFn(context.client);
  } finally {
    await context.rollback();
  }
}

/**
 * Isolated test context for photo tests using committed data.
 * Uses unique test prefixes and proper cleanup instead of transactions.
 * This approach works better with existing code that creates its own DB connections.
 */
export interface PhotoTestContext {
  createTestPhoto: (approved?: boolean) => Promise<string>;
  cleanup: () => Promise<void>;
}

/**
 * Creates a test context for photo tests using committed test data.
 * This approach ensures compatibility with existing PhotoSelectionManager
 * which creates its own database connections.
 */
export async function createPhotoTestContext(): Promise<PhotoTestContext> {

  const testPhotoIds: string[] = [];

  // Generate unique test session prefix (keep it short for VARCHAR(32) constraint)
  const testSessionId = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;

  const createTestPhoto = async (approved: boolean = true): Promise<string> => {
    const photoId = `${testSessionId}${testPhotoIds.length}`;
    testPhotoIds.push(photoId);

    // Use regular database functions that commit immediately
    const { savePhotoMetadata, approvePhoto } = await import('../../src/lib/photoDatabase.js');

    await savePhotoMetadata({
      id: photoId,
      originalFilename: `test-${photoId}.jpeg`,
      fileSize: 50000,
      uploadIp: '192.168.1.1'
    });

    if (approved) {
      await approvePhoto(photoId, true);
    }

    return photoId;
  };

  const cleanup = async () => {
    // Clean up all test photos created in this session
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dev@localhost:5432/party'
    });

    try {
      await client.connect();

      // Delete all photos created in this test session with a transaction for atomicity
      await client.query('BEGIN');

      for (const photoId of testPhotoIds) {
        await client.query('DELETE FROM user_photos WHERE id = $1', [photoId]);
      }

      await client.query('COMMIT');

      // Verify cleanup completed
      const verifyResult = await client.query(
        'SELECT COUNT(*) as count FROM user_photos WHERE id = ANY($1)',
        [testPhotoIds]
      );

      if (parseInt(verifyResult.rows[0].count) > 0) {
        console.warn(`Warning: ${verifyResult.rows[0].count} test photos still exist after cleanup`);
      }

    } catch (error) {
      console.error('Error during test cleanup:', error);
      // Try to rollback if we're in a transaction
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Ignore rollback errors
      }
      throw error;
    } finally {
      await client.end();
      testPhotoIds.length = 0;
    }
  };

  return {
    createTestPhoto,
    cleanup
  };
}