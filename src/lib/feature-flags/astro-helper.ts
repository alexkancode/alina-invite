import { createProductionService } from './factory.js';
import type { FeatureFlags } from './types.js';
import type { IFeatureFlagService } from './interfaces/IFeatureFlagService.js';

export async function isFeatureEnabled(
  flagName: keyof FeatureFlags,
  service?: IFeatureFlagService
): Promise<boolean> {
  const flagService = service || createProductionService();
  return await flagService.isEnabled(flagName);
}