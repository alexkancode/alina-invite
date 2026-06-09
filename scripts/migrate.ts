import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Use DATABASE_URL for production (Railway), individual params for local development
const client = new pg.Client(
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: 'localhost',
        port: 5432,
        database: 'party',
        user: 'postgres',
        password: 'dev'
      }
);

async function migrate() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const dir = path.resolve('migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      console.log(`skip ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`Done ${file}`);
  }

  await client.end();
  console.log('Migrations complete.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
