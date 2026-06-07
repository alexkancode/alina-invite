import type { FeatureFlags } from '../types.js';

export interface IFeatureFlagStorage {
  load(): Promise<FeatureFlags>;
  save(flags: FeatureFlags): Promise<void>;
}