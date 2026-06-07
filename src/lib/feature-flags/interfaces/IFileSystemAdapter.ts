export interface IFileSystemAdapter {
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
  writeFile(path: string, data: string, encoding: BufferEncoding): Promise<void>;
  access(path: string): Promise<void>;
}