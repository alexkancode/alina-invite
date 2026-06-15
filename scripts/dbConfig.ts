import type pg from 'pg';

export function resolveDbConfig(env: NodeJS.ProcessEnv): pg.ClientConfig {
  if (env.DATABASE_URL) {
    return { connectionString: env.DATABASE_URL };
  }
  return {
    host: 'localhost',
    port: 5432,
    database: 'party',
    user: 'postgres',
    password: 'dev'
  };
}
