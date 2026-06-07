import { FeatureFlagService } from './service.js';
import type { FeatureFlags } from './types.js';

export async function isFeatureEnabled(flagName: keyof FeatureFlags): Promise<boolean> {
  const service = FeatureFlagService.getInstance();
  return await service.isEnabled(flagName);
}