#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_TESTS = {
  nixpacks: {
    path: 'nixpacks.toml',
    checks: [
      content => content.includes('[providers]'),
      content => content.includes('static = "caddy"'),
      content => content.includes('BUILD_CMD'),
      content => content.includes('START_CMD')
    ]
  },
  caddyfile: {
    path: 'Caddyfile',
    checks: [
      content => content.includes(':{$PORT}'),
      content => content.includes('/alina/*'),
      content => content.includes('file_server'),
      content => content.includes('try_files')
    ]
  }
};

function testConfigFile(name, config) {
  if (!fs.existsSync(config.path)) {
    console.error(`❌ ${name}: File ${config.path} not found`);
    return false;
  }

  const content = fs.readFileSync(config.path, 'utf8');

  for (let i = 0; i < config.checks.length; i++) {
    if (!config.checks[i](content)) {
      console.error(`❌ ${name}: Check ${i + 1} failed`);
      return false;
    }
  }

  console.log(`✅ ${name}: All checks passed`);
  return true;
}

function main() {
  console.log('🔍 Testing Railway static assets configuration...\n');

  let allPassed = true;

  for (const [name, config] of Object.entries(CONFIG_TESTS)) {
    if (!testConfigFile(name, config)) {
      allPassed = false;
    }
  }

  console.log('\n📊 Test Results:');
  if (allPassed) {
    console.log('✅ All configuration tests passed');
    process.exit(0);
  } else {
    console.log('❌ Some configuration tests failed');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testConfigFile, CONFIG_TESTS };