import { Client } from 'pg';

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until next attempt allowed
  attemptsRemaining?: number;
}

interface RateLimitEntry {
  ip: string;
  attempts: number;
  last_attempt: Date;
  blocked_until?: Date;
}

/**
 * Exponential backoff rate limiter
 * - First 3 uploads: allowed immediately
 * - 4th upload: 30 second delay
 * - 5th upload: 1 minute delay
 * - 6th upload: 2 minute delay
 * - 7th+ upload: exponentially increasing delays
 */
export class ExponentialBackoffRateLimiter {
  private dbClient: Client | null = null;

  constructor(private baseDelaySeconds: number = 30) {}

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
   * Check if upload is allowed for this IP
   */
  async checkUpload(ip: string): Promise<RateLimitResult> {
    const client = await this.getDbClient();

    try {
      // Get or create rate limit entry
      let entry = await this.getRateLimitEntry(client, ip);

      if (!entry) {
        // First upload from this IP
        await this.createRateLimitEntry(client, ip);
        return { allowed: true, attemptsRemaining: 2 };
      }

      const now = new Date();

      // Check if still blocked from previous violations
      if (entry.blocked_until && entry.blocked_until > now) {
        const retryAfter = Math.ceil((entry.blocked_until.getTime() - now.getTime()) / 1000);
        // Don't increment attempts during an active block - they're already being penalized
        return {
          allowed: false,
          retryAfter
        };
      }

      // Reset attempts if enough time has passed since last attempt (1 hour cooldown)
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (entry.last_attempt < hourAgo) {
        await this.resetRateLimitEntry(client, ip);
        return { allowed: true, attemptsRemaining: 2 };
      }

      // Check current attempt count
      const freeAttempts = 3; // Allow 3 uploads per hour without delay

      if (entry.attempts < freeAttempts) {
        // Still within free attempts - increment AFTER calculating remaining
        const remaining = freeAttempts - entry.attempts - 1;
        await this.incrementAttempts(client, ip);
        return {
          allowed: true,
          attemptsRemaining: remaining
        };
      }

      // Calculate exponential backoff delay
      // For 4th attempt: excessAttempts = 1 -> 2^0 * base = base
      // For 5th attempt: excessAttempts = 2 -> 2^1 * base = 2*base
      // etc.
      const excessAttempts = entry.attempts - freeAttempts + 1;
      const delaySeconds = this.baseDelaySeconds * Math.pow(2, Math.max(0, excessAttempts - 1));
      const blockedUntil = new Date(now.getTime() + (delaySeconds * 1000));

      // Apply the backoff delay
      await this.applyBackoff(client, ip, blockedUntil);

      return {
        allowed: false,
        retryAfter: delaySeconds
      };

    } finally {
      // Don't close the connection - reuse it for performance
    }
  }

  /**
   * Record successful upload (for metrics)
   * Note: This doesn't increment attempts as that's done in checkUpload
   */
  async recordSuccessfulUpload(ip: string): Promise<void> {
    const client = await this.getDbClient();

    // Just update the timestamp, don't increment attempts again
    await client.query(`
      UPDATE photo_rate_limits
      SET last_attempt = NOW()
      WHERE ip = $1
    `, [ip]);
  }

  private async getRateLimitEntry(client: Client, ip: string): Promise<RateLimitEntry | null> {
    const result = await client.query(`
      SELECT ip, attempts, last_attempt, blocked_until
      FROM photo_rate_limits
      WHERE ip = $1
    `, [ip]);

    return result.rows[0] || null;
  }

  private async createRateLimitEntry(client: Client, ip: string): Promise<void> {
    await client.query(`
      INSERT INTO photo_rate_limits (ip, attempts, last_attempt)
      VALUES ($1, 1, NOW())
      ON CONFLICT (ip) DO UPDATE SET
        attempts = 1,
        last_attempt = NOW(),
        blocked_until = NULL
    `, [ip]);
  }

  private async incrementAttempts(client: Client, ip: string): Promise<void> {
    await client.query(`
      UPDATE photo_rate_limits
      SET attempts = attempts + 1, last_attempt = NOW()
      WHERE ip = $1
    `, [ip]);
  }

  private async resetRateLimitEntry(client: Client, ip: string): Promise<void> {
    await client.query(`
      UPDATE photo_rate_limits
      SET attempts = 1, last_attempt = NOW(), blocked_until = NULL
      WHERE ip = $1
    `, [ip]);
  }

  private async applyBackoff(client: Client, ip: string, blockedUntil: Date): Promise<void> {
    await client.query(`
      UPDATE photo_rate_limits
      SET attempts = attempts + 1, last_attempt = NOW(), blocked_until = $2
      WHERE ip = $1
    `, [ip, blockedUntil]);
  }

  /**
   * Admin function: clear rate limits for an IP (for testing/support)
   */
  async clearRateLimitFor(ip: string): Promise<void> {
    const client = await this.getDbClient();

    await client.query(`
      DELETE FROM photo_rate_limits WHERE ip = $1
    `, [ip]);
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(): Promise<{
    totalIps: number;
    currentlyBlocked: number;
    averageAttempts: number;
  }> {
    const client = await this.getDbClient();

    const result = await client.query(`
      SELECT
        COUNT(*) as total_ips,
        COUNT(*) FILTER (WHERE blocked_until > NOW()) as currently_blocked,
        AVG(attempts) as average_attempts
      FROM photo_rate_limits
    `);

    const row = result.rows[0];
    return {
      totalIps: parseInt(row.total_ips),
      currentlyBlocked: parseInt(row.currently_blocked),
      averageAttempts: parseFloat(row.average_attempts) || 0
    };
  }

  async close(): Promise<void> {
    if (this.dbClient) {
      await this.dbClient.end();
      this.dbClient = null;
    }
  }
}

// Singleton instance
export const photoUploadRateLimiter = new ExponentialBackoffRateLimiter(30); // 30 second base delay

/**
 * Utility function for formatting retry-after times in user-friendly way
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}