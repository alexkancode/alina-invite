#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';

const grantRegex = /grant\s+([\w,\s]+)\s+on\s+(?:(schema|table)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s+to\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
const roleRegex = /create\s+role\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;

function removeComments(sqlContent) {
  let result = sqlContent;
  result = result.replace(/--.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

async function validateMigrations() {
  try {
    const files = await fs.readdir('./migrations');
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    const allRoles = new Set();
    const allGrants = [];

    for (const file of sqlFiles) {
      const content = await fs.readFile(join('./migrations', file), 'utf-8');
      const cleanContent = removeComments(content);

      let match;
      while ((match = roleRegex.exec(cleanContent)) !== null) {
        allRoles.add(match[1]);
      }

      grantRegex.lastIndex = 0;
      while ((match = grantRegex.exec(cleanContent)) !== null) {
        allGrants.push({
          grantee: match[4],
          fileName: file
        });
      }
    }

    const missingRoles = allGrants
      .map(g => g.grantee)
      .filter((role, index, arr) => arr.indexOf(role) === index)
      .filter(role => !allRoles.has(role));

    if (missingRoles.length > 0) {
      console.log('❌ Migration validation failed');
      console.log('Missing PostgreSQL roles:', missingRoles.join(', '));
      console.log('');
      console.log('Affected files:');
      allGrants
        .filter(g => missingRoles.includes(g.grantee))
        .forEach(g => console.log(`  • ${g.fileName} - grants to ${g.grantee}`));
      console.log('');
      console.log('Suggested fixes:');
      missingRoles.forEach(role => console.log(`  CREATE ROLE ${role};`));

      process.exit(1);
    }

    console.log('✅ Migration validation passed');
    console.log('All role dependencies satisfied');

  } catch (error) {
    console.error('❌ Migration validation error:', error.message);
    process.exit(1);
  }
}

validateMigrations();