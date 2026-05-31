#!/usr/bin/env node

import pg from 'pg';

console.log('🔧 Setting up PostgreSQL for local development...');

// Try different connection approaches
const connectionAttempts = [
  'postgresql://dnsmasq@localhost:5432/postgres',
  'postgresql://postgres@localhost:5432/postgres',
  'postgresql://localhost:5432/postgres'
];

async function testConnection(url) {
  return new Promise((resolve) => {
    const { Pool } = pg;
    const pool = new Pool({ connectionString: url });

    pool.connect()
      .then(async (client) => {
        console.log(`✅ Connected with: ${url.replace(/:\/\/.*@/, '://*****@')}`);

        // Create party database if it doesn't exist
        try {
          await client.query('CREATE DATABASE party');
          console.log('✅ Created party database');
        } catch (err) {
          if (err.code === '42P04') {
            console.log('ℹ️  Party database already exists');
          } else {
            console.log('⚠️  Database creation issue:', err.message);
          }
        }

        client.release();
        pool.end();
        resolve(url);
      })
      .catch((err) => {
        console.log(`❌ Failed: ${url.replace(/:\/\/.*@/, '://*****@')} - ${err.message}`);
        pool.end();
        resolve(null);
      });
  });
}

async function findWorkingConnection() {
  console.log('🔍 Testing PostgreSQL connections...');

  for (const url of connectionAttempts) {
    const result = await testConnection(url);
    if (result) {
      return result;
    }
  }

  console.log('❌ No working PostgreSQL connection found');
  console.log('💡 Try installing and starting PostgreSQL:');
  console.log('   sudo apt update && sudo apt install postgresql postgresql-contrib');
  console.log('   sudo systemctl start postgresql');
  return null;
}

findWorkingConnection()
  .then((workingUrl) => {
    if (workingUrl) {
      console.log('\n🎉 Database setup complete!');
      console.log('📝 Add this to your .env file:');
      console.log(`DATABASE_URL=${workingUrl.replace('/postgres', '/party')}`);
    }
  });