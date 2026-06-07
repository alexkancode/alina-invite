#!/usr/bin/env node

import { promises as fs } from 'fs';

// Valid feature flags (must match TypeScript interface)
const VALID_FLAGS = ['musicSearch'];

async function loadFlags(filePath) {
  try {
    await fs.access(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or invalid JSON - use defaults
    return { musicSearch: true };
  }
}

async function saveFlags(filePath, flags) {
  await fs.writeFile(filePath, JSON.stringify(flags, null, 2), 'utf-8');
}

function validateFlagName(flagName) {
  if (!VALID_FLAGS.includes(flagName)) {
    throw new Error(`Invalid flag name "${flagName}". Valid flags: ${VALID_FLAGS.join(', ')}`);
  }
}

async function enableFlag(flagName, filePath) {
  validateFlagName(flagName);
  const flags = await loadFlags(filePath);
  flags[flagName] = true;
  await saveFlags(filePath, flags);
  console.log(`Feature flag "${flagName}" enabled`);
}

async function disableFlag(flagName, filePath) {
  validateFlagName(flagName);
  const flags = await loadFlags(filePath);
  flags[flagName] = false;
  await saveFlags(filePath, flags);
  console.log(`Feature flag "${flagName}" disabled`);
}

async function showStatus(flagName, filePath) {
  validateFlagName(flagName);
  const flags = await loadFlags(filePath);
  const status = flags[flagName] ? 'enabled' : 'disabled';
  console.log(`${flagName}: ${status}`);
}

async function listFlags(filePath) {
  const flags = await loadFlags(filePath);
  console.log('Feature Flags:');
  for (const [flagName, enabled] of Object.entries(flags)) {
    const status = enabled ? 'enabled' : 'disabled';
    console.log(`  ${flagName}: ${status}`);
  }
}

function showHelp() {
  console.log(`
Usage: node scripts/feature-flags.js <command> [arguments]

Commands:
  enable <flag>     Enable a feature flag
  disable <flag>    Disable a feature flag
  status <flag>     Show status of a feature flag
  list              List all feature flags
  help              Show this help message

Options:
  --file <path>     Specify custom feature flags file (default: feature-flags.json)

Valid flags: ${VALID_FLAGS.join(', ')}

Examples:
  node scripts/feature-flags.js enable musicSearch
  node scripts/feature-flags.js disable musicSearch
  node scripts/feature-flags.js status musicSearch
  node scripts/feature-flags.js list
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }

  // Parse file option
  let filePath = 'feature-flags.json';
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && fileIndex + 1 < args.length) {
    filePath = args[fileIndex + 1];
    // Remove --file and its value from args
    args.splice(fileIndex, 2);
  }

  const command = args[0];
  const flagName = args[1];

  try {
    switch (command) {
      case 'enable':
        if (!flagName) {
          throw new Error('Flag name is required for enable command');
        }
        await enableFlag(flagName, filePath);
        break;

      case 'disable':
        if (!flagName) {
          throw new Error('Flag name is required for disable command');
        }
        await disableFlag(flagName, filePath);
        break;

      case 'status':
        if (!flagName) {
          throw new Error('Flag name is required for status command');
        }
        await showStatus(flagName, filePath);
        break;

      case 'list':
        await listFlags(filePath);
        break;

      default:
        throw new Error(`Unknown command "${command}". Use "help" for usage information.`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});