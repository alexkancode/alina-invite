import type { IFileSystemAdapter } from '../../interfaces/IFileSystemAdapter.js';

export class MockFileSystemAdapter implements IFileSystemAdapter {
  private files: Map<string, string> = new Map();
  private errorSimulations: Map<string, Error> = new Map();
  private callCounts: Map<string, number> = new Map();

  async readFile(path: string, encoding: BufferEncoding): Promise<string> {
    this.incrementCallCount('readFile');
    this.checkForErrorSimulation('readFile');

    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }

    return this.files.get(path)!;
  }

  async writeFile(path: string, data: string, encoding: BufferEncoding): Promise<void> {
    this.incrementCallCount('writeFile');
    this.checkForErrorSimulation('writeFile');

    this.files.set(path, data);
  }

  async access(path: string): Promise<void> {
    this.incrementCallCount('access');
    this.checkForErrorSimulation('access');

    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`);
    }
  }

  // Test utility methods
  setFileContent(path: string, content: string): void {
    this.files.set(path, content);
  }

  getFileContent(path: string): string {
    if (!this.files.has(path)) {
      throw new Error('File not found');
    }
    return this.files.get(path)!;
  }

  simulateError(operation: string, error: Error): void {
    this.errorSimulations.set(operation, error);
  }

  hasErrorSimulation(operation: string): boolean {
    return this.errorSimulations.has(operation);
  }

  getCallCount(operation: string): number {
    return this.callCounts.get(operation) || 0;
  }

  reset(): void {
    this.files.clear();
    this.errorSimulations.clear();
    this.callCounts.clear();
  }

  private incrementCallCount(operation: string): void {
    const current = this.callCounts.get(operation) || 0;
    this.callCounts.set(operation, current + 1);
  }

  private checkForErrorSimulation(operation: string): void {
    const error = this.errorSimulations.get(operation);
    if (error) {
      this.errorSimulations.delete(operation); // One-time error simulation
      throw error;
    }
  }
}