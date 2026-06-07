import type { IFeatureFlagService } from './interfaces/IFeatureFlagService.js';
import type { IFeatureFlagStorage } from './interfaces/IFeatureFlagStorage.js';
import type { FeatureFlags } from './types.js';

export class RefactoredFeatureFlagService implements IFeatureFlagService {
  private cache: FeatureFlags | null = null;

  constructor(private storage: IFeatureFlagStorage) {}

  async isEnabled(flagName: keyof FeatureFlags): Promise<boolean> {
    const flags = await this.loadFlags();
    return flags[flagName];
  }

  async setFlag(flagName: keyof FeatureFlags, value: boolean): Promise<void> {
    const currentFlags = await this.loadFlags();
    const updatedFlags: FeatureFlags = {
      ...currentFlags,
      [flagName]: value,
    };

    await this.storage.save(updatedFlags);
    this.cache = updatedFlags;
  }

  async getAllFlags(): Promise<FeatureFlags> {
    return await this.loadFlags();
  }

  private async loadFlags(): Promise<FeatureFlags> {
    if (this.cache) {
      return this.cache;
    }

    this.cache = await this.storage.load();
    return this.cache;
  }
}