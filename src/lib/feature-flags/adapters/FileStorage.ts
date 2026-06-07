import type { IFileSystemAdapter } from '../interfaces/IFileSystemAdapter.js';
import type { IFeatureFlagStorage } from '../interfaces/IFeatureFlagStorage.js';
import type { FeatureFlags } from '../types.js';

export class FileStorage implements IFeatureFlagStorage {
  constructor(
    private fileSystemAdapter: IFileSystemAdapter,
    private filePath: string,
    private defaults: FeatureFlags
  ) {}

  async load(): Promise<FeatureFlags> {
    try {
      await this.fileSystemAdapter.access(this.filePath);
      const fileContent = await this.fileSystemAdapter.readFile(this.filePath, 'utf-8');
      const flags: FeatureFlags = JSON.parse(fileContent);
      return flags;
    } catch (error) {
      // File doesn't exist, invalid JSON, or access error - use defaults
      return { ...this.defaults };
    }
  }

  async save(flags: FeatureFlags): Promise<void> {
    const fileContent = JSON.stringify(flags, null, 2);
    await this.fileSystemAdapter.writeFile(this.filePath, fileContent, 'utf-8');
  }
}