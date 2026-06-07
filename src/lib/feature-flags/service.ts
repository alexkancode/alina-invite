import { promises as fs } from 'fs';
import type { FeatureFlags, FeatureFlagConfig } from './types.js';
import { DEFAULT_CONFIG } from './types.js';

export class FeatureFlagService {
  private static instance: FeatureFlagService | null = null;
  private cache: FeatureFlags | null = null;
  private config: FeatureFlagConfig;

  private constructor(config: FeatureFlagConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  public static getInstance(config?: FeatureFlagConfig): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService(config);
    }
    return FeatureFlagService.instance;
  }

  public static clearCache(): void {
    if (FeatureFlagService.instance) {
      FeatureFlagService.instance.cache = null;
    }
    FeatureFlagService.instance = null;
  }

  public async isEnabled(flagName: keyof FeatureFlags): Promise<boolean> {
    const flags = await this.loadFlags();
    return flags[flagName];
  }

  public async setFlag(flagName: keyof FeatureFlags, value: boolean): Promise<void> {
    const currentFlags = await this.loadFlags();
    const updatedFlags: FeatureFlags = {
      ...currentFlags,
      [flagName]: value,
    };

    await fs.writeFile(
      this.config.filePath,
      JSON.stringify(updatedFlags, null, 2),
      'utf-8'
    );

    this.cache = updatedFlags;
  }

  public async getAllFlags(): Promise<FeatureFlags> {
    return await this.loadFlags();
  }

  private async loadFlags(): Promise<FeatureFlags> {
    if (this.cache) {
      return this.cache;
    }

    try {
      await fs.access(this.config.filePath);
      const fileContent = await fs.readFile(this.config.filePath, 'utf-8');
      const flags: FeatureFlags = JSON.parse(fileContent);

      this.cache = flags;
      return flags;
    } catch (error) {
      // File doesn't exist or invalid JSON - use defaults
      this.cache = { ...this.config.defaults };
      return this.cache;
    }
  }
}