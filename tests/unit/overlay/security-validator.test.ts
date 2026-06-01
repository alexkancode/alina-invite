import { describe, test, expect, beforeEach } from 'vitest';
import { OverlaySecurityValidator } from '../../../src/lib/overlay/securityValidator.js';

describe('OverlaySecurityValidator', () => {
  let validator: OverlaySecurityValidator;

  beforeEach(() => {
    validator = new OverlaySecurityValidator();
  });

  describe('File Extension Validation', () => {
    test('accepts valid image extensions', () => {
      expect(validator.validateExtension('test.jpg')).toBe(true);
      expect(validator.validateExtension('test.jpeg')).toBe(true);
      expect(validator.validateExtension('test.png')).toBe(true);
      expect(validator.validateExtension('test.webp')).toBe(true);
      expect(validator.validateExtension('test.avif')).toBe(true);
    });

    test('rejects invalid extensions', () => {
      expect(validator.validateExtension('test.txt')).toBe(false);
      expect(validator.validateExtension('test.pdf')).toBe(false);
      expect(validator.validateExtension('test.exe')).toBe(false);
      expect(validator.validateExtension('test')).toBe(false);
    });

    test('handles case insensitive extensions', () => {
      expect(validator.validateExtension('test.JPG')).toBe(true);
      expect(validator.validateExtension('test.PNG')).toBe(true);
      expect(validator.validateExtension('test.WEBP')).toBe(true);
    });
  });

  describe('File Size Validation', () => {
    test('accepts files within size limit', () => {
      expect(validator.validateFileSize(1024)).toBe(true);
      expect(validator.validateFileSize(5 * 1024 * 1024)).toBe(true);
    });

    test('rejects files exceeding size limit', () => {
      expect(validator.validateFileSize(6 * 1024 * 1024)).toBe(false);
      expect(validator.validateFileSize(10 * 1024 * 1024)).toBe(false);
    });

    test('rejects zero-byte files', () => {
      expect(validator.validateFileSize(0)).toBe(false);
    });
  });

  describe('File Signature Validation', () => {
    test('detects JPEG signature', async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      const result = await validator.validateFileSignature(jpegBytes);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/jpeg');
    });

    test('detects PNG signature', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = await validator.validateFileSignature(pngBytes);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/png');
    });

    test('detects WebP signature', async () => {
      const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      const result = await validator.validateFileSignature(webpBytes);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/webp');
    });

    test('rejects invalid signatures', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = await validator.validateFileSignature(invalidBytes);
      expect(result.isValid).toBe(false);
      expect(result.contentType).toBe('');
    });
  });

  describe('Security Hash Generation', () => {
    test('generates consistent hashes for same input', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const hash1 = await validator.generateSecurityHash(testData);
      const hash2 = await validator.generateSecurityHash(testData);
      expect(hash1).toBe(hash2);
    });

    test('generates different hashes for different inputs', async () => {
      const data1 = new Uint8Array([1, 2, 3]);
      const data2 = new Uint8Array([4, 5, 6]);
      const hash1 = await validator.generateSecurityHash(data1);
      const hash2 = await validator.generateSecurityHash(data2);
      expect(hash1).not.toBe(hash2);
    });

    test('generates 64-character hex hash', async () => {
      const testData = new Uint8Array([1, 2, 3]);
      const hash = await validator.generateSecurityHash(testData);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Complete Validation Workflow', () => {
    test('validates secure image upload', async () => {
      const mockFile = {
        name: 'test.jpg',
        size: 1024 * 1024,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as File;

      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      mockFile.arrayBuffer = () => Promise.resolve(jpegData.buffer);

      const result = await validator.validateUpload(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/jpeg');
      expect(result.errors).toHaveLength(0);
      expect(result.securityHash).toBeTruthy();
    });

    test('rejects file with invalid extension', async () => {
      const mockFile = {
        name: 'test.txt',
        size: 1024,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as File;

      const result = await validator.validateUpload(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file extension');
    });

    test('rejects oversized file', async () => {
      const mockFile = {
        name: 'test.jpg',
        size: 10 * 1024 * 1024,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as File;

      const result = await validator.validateUpload(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds limit');
    });

    test('rejects file with mismatched signature', async () => {
      const mockFile = {
        name: 'test.jpg',
        size: 1024,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as File;

      const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      mockFile.arrayBuffer = () => Promise.resolve(invalidData.buffer);

      const result = await validator.validateUpload(mockFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file signature');
    });
  });
});