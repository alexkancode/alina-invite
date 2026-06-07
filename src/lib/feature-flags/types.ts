export interface FeatureFlags {
  musicSearch: boolean;
}

export interface FeatureFlagConfig {
  filePath: string;
  defaults: FeatureFlags;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  musicSearch: true,
};

export const DEFAULT_CONFIG: FeatureFlagConfig = {
  filePath: 'feature-flags.json',
  defaults: DEFAULT_FLAGS,
};