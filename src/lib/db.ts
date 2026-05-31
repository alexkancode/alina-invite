import pg from 'pg';

// Ensure environment variables are loaded
const DATABASE_URL = process.env.DATABASE_URL || import.meta.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/party';

console.log('Database URL loaded:', DATABASE_URL ? 'Yes' : 'No');

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

export default pool;
