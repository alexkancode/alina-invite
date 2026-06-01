export function DriftRule(config) {
  // Validate required configuration
  if (!config || typeof config !== 'object') {
    throw new Error('DriftRule configuration must be an object');
  }

  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Rule name is required');
  }

  if (config.parsers && !Array.isArray(config.parsers)) {
    throw new Error('Parsers must be an array');
  }

  if (config.compatibilityRules && !Array.isArray(config.compatibilityRules)) {
    throw new Error('Compatibility rules must be an array');
  }

  if (config.severity && !['error', 'warn', 'off'].includes(config.severity)) {
    throw new Error('Severity must be "error", "warn", or "off"');
  }

  if (config.schema && !Array.isArray(config.schema)) {
    throw new Error('Schema must be an array');
  }

  return function(target) {
    // Store metadata on class for factory processing
    target._driftRuleConfig = {
      name: config.name,
      description: config.description || '',
      parsers: config.parsers || [],
      compatibilityRules: config.compatibilityRules || [],
      severity: config.severity || 'error',
      schema: config.schema || []
    };

    return target;
  };
}