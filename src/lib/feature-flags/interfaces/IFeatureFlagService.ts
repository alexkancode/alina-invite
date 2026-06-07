import type { FeatureFlags } from '../types.js';

export interface IFeatureFlagService {
  isEnabled(flagName: keyof FeatureFlags): Promise<boolean>;
  setFlag(flagName: keyof FeatureFlags, value: boolean): Promise<void>;
  getAllFlags(): Promise<FeatureFlags>;
}