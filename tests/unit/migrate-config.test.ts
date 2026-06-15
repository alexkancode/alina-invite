import { describe, expect, test } from 'vitest';
import { resolveDbConfig } from '../../scripts/dbConfig';

describe('resolveDbConfig (migrate DB selection)', () => {
  test('uses DATABASE_URL whenever it is set', () => {
    expect(resolveDbConfig({ DATABASE_URL: 'postgres://u:p@remote.example:5432/db' }))
      .toEqual({ connectionString: 'postgres://u:p@remote.example:5432/db' });
  });

  test('honours a localhost DATABASE_URL (the CI regression that broke migrate)', () => {
    const url = 'postgresql://postgres:test@localhost:5432/party';
    expect(resolveDbConfig({ DATABASE_URL: url })).toEqual({ connectionString: url });
  });

  test('falls back to the local dev config when DATABASE_URL is unset', () => {
    expect(resolveDbConfig({})).toEqual({
      host: 'localhost',
      port: 5432,
      database: 'party',
      user: 'postgres',
      password: 'dev'
    });
  });
});
