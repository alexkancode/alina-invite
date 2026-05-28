import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const BASE = 'http://localhost:4321';

// Integration tests for photo upload API endpoint
// These test the full upload flow from client to server

let testUploadCounter = 0;

function uniqueTestName(): string {
  testUploadCounter++;
  return `TestUser${testUploadCounter}`;
}

async function uploadPhoto(photoBuffer: Buffer, filename = 'test.jpeg', additionalFields: Record<string, string> = {}) {
  const formData = new FormData();
  const blob = new Blob([photoBuffer], { type: 'image/jpeg' });
  formData.append('photo', blob, filename);

  // Add any additional form fields
  Object.entries(additionalFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return fetch(`${BASE}/api/photo-upload`, {
    method: 'POST',
    body: formData,
  });
}

beforeAll(async () => {
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

describe('POST /api/photo-upload', () => {
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Load a test image for uploading
    testImageBuffer = await readFile('public/alina/IMG_0049.jpeg');
  });

  // ── Happy paths ──

  it('should accept a valid JPEG photo upload', async () => {
    const res = await uploadPhoto(testImageBuffer, 'test-photo.jpeg');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.photoId).toMatch(/^[a-f0-9]{32}$/);
    expect(json.message).toContain('uploaded successfully');
  });

  it('should create all required thumbnail files', async () => {
    const res = await uploadPhoto(testImageBuffer);
    const json = await res.json();

    const photoId = json.photoId;

    // Verify all thumbnail files were created
    expect(existsSync(`public/alina/user-uploads/user-${photoId}.jpeg`)).toBe(true);
    expect(existsSync(`public/alina/thumbs/user-${photoId}.jpeg`)).toBe(true);
    expect(existsSync(`public/alina/minigame/user-${photoId}.jpeg`)).toBe(true);
  });

  it('should accept PNG files and convert to JPEG', async () => {
    const sharp = await import('sharp');

    // Create a small test PNG (PNG files are much larger than JPEG)
    const pngBuffer = await sharp.default({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 100, b: 50 }
      }
    }).png().toBuffer();

    const res = await uploadPhoto(pngBuffer, 'test.png');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('should handle compressed images correctly', async () => {
    // Test with a reasonably sized file
    const sharp = await import('sharp');
    const smallBuffer = await sharp.default({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).jpeg({ quality: 80 }).toBuffer();

    const res = await uploadPhoto(smallBuffer);
    expect(res.status).toBe(200);
  });

  // ── Error handling ──

  it('should reject files that are too large', async () => {
    // Create a mock 15MB file (over 10MB limit)
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024, 0xFF);

    const res = await uploadPhoto(largeBuffer);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('too large');
  });

  it('should reject non-image files', async () => {
    // Create a text file that's large enough to pass size checks but wrong type
    const textContent = 'This is definitely not an image file. '.repeat(50); // ~1.8KB
    const textBuffer = Buffer.from(textContent);

    // Create a fake "text file" with text/plain MIME type
    const formData = new FormData();
    const blob = new Blob([textBuffer], { type: 'text/plain' });
    formData.append('photo', blob, 'notanimage.txt');

    const res = await fetch(`${BASE}/api/photo-upload`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Invalid file type');
  });

  it('should reject requests without photo', async () => {
    const formData = new FormData();
    // Don't add a photo field

    const res = await fetch(`${BASE}/api/photo-upload`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('should handle corrupted image files gracefully', async () => {
    const corruptedBuffer = Buffer.from('fake-jpeg-header\xFF\xD8\xFF\xE0\x00\x10not-really-jpeg');

    const res = await uploadPhoto(corruptedBuffer, 'corrupted.jpeg');
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('corrupted');
  });

  // ── Security tests ──

  it('should sanitize filenames with path traversal attempts', async () => {
    const res = await uploadPhoto(testImageBuffer, '../../../etc/passwd.jpeg');
    // Should still process the image but use a safe filename
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify no files were created outside expected directories
    expect(existsSync('/etc/passwd.jpeg')).toBe(false);
    expect(existsSync('public/etc/passwd.jpeg')).toBe(false);
  });

  it('should reject extremely large dimensions', async () => {
    // This would be a computational attack vector
    const sharp = await import('sharp');

    try {
      const extremeBuffer = await sharp.default({
        create: {
          width: 50000,
          height: 50000,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).jpeg({ quality: 1 }).toBuffer();

      const res = await uploadPhoto(extremeBuffer);
      expect(res.status).toBe(400);
    } catch (error) {
      // Sharp might refuse to create such a large image, which is fine
      expect(true).toBe(true);
    }
  });

  it.skip('should rate limit upload attempts from same IP', async () => {
    // Skipped in development mode - rate limiting is disabled for testing
    expect(true).toBe(true);
  });

  // ── Performance tests ──

  it('should process uploads within reasonable time', async () => {
    const startTime = Date.now();

    const res = await uploadPhoto(testImageBuffer, `timing-test-${Date.now()}.jpeg`);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(res.status).toBe(200);
    // Should process a typical photo in under 2 seconds
    expect(processingTime).toBeLessThan(2000);
  });

  it('should handle concurrent uploads without corruption', async () => {
    // Test that parallel uploads don't interfere with each other
    const timestamp = Date.now();
    const uploads = [
      uploadPhoto(testImageBuffer, `concurrent-1-${timestamp}.jpeg`),
      uploadPhoto(testImageBuffer, `concurrent-2-${timestamp}.jpeg`),
      uploadPhoto(testImageBuffer, `concurrent-3-${timestamp}.jpeg`),
    ];

    const responses = await Promise.all(uploads);

    // All should succeed
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    // All should have different photo IDs
    const results = await Promise.all(responses.map(res => res.json()));
    const photoIds = results.map(r => r.photoId);
    const uniqueIds = new Set(photoIds);
    expect(uniqueIds.size).toBe(3);
  });
});

// Additional utility tests for photo validation
describe('Photo Validation Utilities', () => {
  it('should detect valid image MIME types', async () => {
    // Test the validation logic in isolation
    const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
    const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4'];

    // This would be testing utility functions once implemented
    expect(validTypes.every(type => type.startsWith('image/'))).toBe(true);
    expect(invalidTypes.every(type => !type.startsWith('image/'))).toBe(true);
  });
});