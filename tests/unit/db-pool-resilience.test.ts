import { describe, expect, test } from 'vitest';
import pool from '../../src/lib/db';

describe('database pool resilience', () => {
  test('an error listener is registered so idle client failures cannot crash the process', () => {
    expect(pool.listenerCount('error')).toBeGreaterThanOrEqual(1);
  });

  test('the registered listener survives an emitted idle client error', () => {
    expect(() => pool.emit('error', new Error('terminating connection due to administrator command'))).not.toThrow();
  });
});
