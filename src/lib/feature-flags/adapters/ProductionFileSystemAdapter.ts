import { promises as fs } from 'fs';
import type { IFileSystemAdapter } from '../interfaces/IFileSystemAdapter.js';

export class ProductionFileSystemAdapter implements IFileSystemAdapter {
  async readFile(path: string, encoding: BufferEncoding): Promise<string> {
    return await fs.readFile(path, encoding);
  }

  async writeFile(path: string, data: string, encoding: BufferEncoding): Promise<void> {
    await fs.writeFile(path, data, encoding);
  }

  async access(path: string): Promise<void> {
    await fs.access(path);
  }
}