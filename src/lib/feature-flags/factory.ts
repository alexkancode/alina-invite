import type { IFeatureFlagService } from './interfaces/IFeatureFlagService.js';
import type { IFeatureFlagStorage } from './interfaces/IFeatureFlagStorage.js';
import type { FeatureFlags, FeatureFlagConfig } from './types.js';
import { RefactoredFeatureFlagService } from './RefactoredFeatureFlagService.js';
import { ProductionFileSystemAdapter } from './adapters/ProductionFileSystemAdapter.js';
import { FileStorage } from './adapters/FileStorage.js';
import { DEFAULT_CONFIG } from './types.js';

let productionServiceInstance: IFeatureFlagService | null = null;

export function createProductionService(config: Partial<FeatureFlagConfig> = {}): IFeatureFlagService {
  if (productionServiceInstance) {
    return productionServiceInstance;
  }

  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const fileSystemAdapter = new ProductionFileSystemAdapter();
  const storage = new FileStorage(
    fileSystemAdapter,
    fullConfig.filePath,
    fullConfig.defaults
  );

  productionServiceInstance = new RefactoredFeatureFlagService(storage);
  return productionServiceInstance;
}

export function createTestService(storage: IFeatureFlagStorage): IFeatureFlagService {
  return new RefactoredFeatureFlagService(storage);
}

export function resetProductionSingleton(): void {
  productionServiceInstance = null;
}