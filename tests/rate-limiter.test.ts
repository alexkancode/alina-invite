import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExponentialBackoffRateLimiter, formatRetryAfter } from '../src/lib/rateLimiter.js';

describe('Exponential Backoff Rate Limiter', () => {
  let rateLimiter: ExponentialBackoffRateLimiter;
  const testIp = '192.168.1.100';

  beforeEach(async () => {
    rateLimiter = new ExponentialBackoffRateLimiter(5); // 5 second base delay for faster testing
    // Clear any existing rate limit for test IP
    await rateLimiter.clearRateLimitFor(testIp);
  });

  afterEach(async () => {
    // Clean up test data
    await rateLimiter.clearRateLimitFor(testIp);
    await rateLimiter.close();
  });

  describe('Free attempts', () => {
    it('should allow first 3 uploads without delay', async () => {
      // First upload
      const result1 = await rateLimiter.checkUpload(testIp);
      expect(result1.allowed).toBe(true);
      expect(result1.attemptsRemaining).toBe(2);

      await rateLimiter.recordSuccessfulUpload(testIp);

      // Second upload
      const result2 = await rateLimiter.checkUpload(testIp);
      expect(result2.allowed).toBe(true);
      expect(result2.attemptsRemaining).toBe(1);

      await rateLimiter.recordSuccessfulUpload(testIp);

      // Third upload
      const result3 = await rateLimiter.checkUpload(testIp);
      expect(result3.allowed).toBe(true);
      expect(result3.attemptsRemaining).toBe(0);

      await rateLimiter.recordSuccessfulUpload(testIp);
    });
  });

  describe('Exponential backoff', () => {
    it('should apply exponential backoff after free attempts', async () => {
      // Use up free attempts (but don't record uploads that were blocked)
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiter.checkUpload(testIp);
        expect(result.allowed).toBe(true);
        // Only record if allowed
        if (result.allowed) {
          await rateLimiter.recordSuccessfulUpload(testIp);
        }
      }

      // 4th attempt should be blocked with 5 second delay
      const result4 = await rateLimiter.checkUpload(testIp);
      expect(result4.allowed).toBe(false);
      expect(result4.retryAfter).toBe(5);

      // 5th attempt during block should return remaining time (≤ 5 seconds)
      const result5 = await rateLimiter.checkUpload(testIp);
      expect(result5.allowed).toBe(false);
      expect(result5.retryAfter).toBeLessThanOrEqual(5);
      expect(result5.retryAfter).toBeGreaterThan(0);

      // 6th attempt during same block should also return remaining time
      const result6 = await rateLimiter.checkUpload(testIp);
      expect(result6.allowed).toBe(false);
      expect(result6.retryAfter).toBeLessThanOrEqual(5);
    });

    it('should block attempts until backoff period expires', async () => {
      // Use up free attempts and trigger first backoff
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiter.checkUpload(testIp);
        if (result.allowed) {
          await rateLimiter.recordSuccessfulUpload(testIp);
        }
      }

      const blockedResult = await rateLimiter.checkUpload(testIp);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.retryAfter).toBe(5);

      // Immediate retry should still be blocked
      const retryResult = await rateLimiter.checkUpload(testIp);
      expect(retryResult.allowed).toBe(false);
      expect(retryResult.retryAfter).toBeLessThanOrEqual(5);
    });
  });

  describe('Reset behavior', () => {
    it('should reset attempts after 1 hour cooldown', async () => {
      // This test would need time manipulation to test properly
      // For now, we'll test the reset function directly

      // Use up attempts
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkUpload(testIp);
        await rateLimiter.recordSuccessfulUpload(testIp);
      }

      // Trigger backoff
      const blocked = await rateLimiter.checkUpload(testIp);
      expect(blocked.allowed).toBe(false);

      // Clear and verify reset works
      await rateLimiter.clearRateLimitFor(testIp);

      const afterReset = await rateLimiter.checkUpload(testIp);
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.attemptsRemaining).toBe(2);
    });
  });

  describe('Different IPs', () => {
    it('should track rate limits separately per IP', async () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';

      // Use up IP1's attempts
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkUpload(ip1);
        await rateLimiter.recordSuccessfulUpload(ip1);
      }

      // IP1 should be blocked
      const ip1Blocked = await rateLimiter.checkUpload(ip1);
      expect(ip1Blocked.allowed).toBe(false);

      // IP2 should still have free attempts
      const ip2Result = await rateLimiter.checkUpload(ip2);
      expect(ip2Result.allowed).toBe(true);
      expect(ip2Result.attemptsRemaining).toBe(2);

      // Clean up IP2
      await rateLimiter.clearRateLimitFor(ip2);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate rate limit stats', async () => {
      // Add some test data
      await rateLimiter.checkUpload(testIp);
      await rateLimiter.recordSuccessfulUpload(testIp);

      const testIp2 = '192.168.1.101';
      await rateLimiter.checkUpload(testIp2);
      await rateLimiter.recordSuccessfulUpload(testIp2);

      const stats = await rateLimiter.getStats();
      expect(stats.totalIps).toBeGreaterThanOrEqual(2);
      expect(stats.averageAttempts).toBeGreaterThan(0);

      // Clean up
      await rateLimiter.clearRateLimitFor(testIp2);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatRetryAfter', () => {
    it('should format seconds correctly', () => {
      expect(formatRetryAfter(1)).toBe('1 second');
      expect(formatRetryAfter(30)).toBe('30 seconds');
      expect(formatRetryAfter(45)).toBe('45 seconds');
    });

    it('should format minutes correctly', () => {
      expect(formatRetryAfter(60)).toBe('1 minute');
      expect(formatRetryAfter(90)).toBe('2 minutes');
      expect(formatRetryAfter(150)).toBe('3 minutes');
    });

    it('should format hours correctly', () => {
      expect(formatRetryAfter(3600)).toBe('1 hour');
      expect(formatRetryAfter(7200)).toBe('2 hours');
      expect(formatRetryAfter(5400)).toBe('2 hours');
    });
  });
});