import { describe, test, expect } from 'vitest';
import {
  mapApiPhotoToComponent,
  mapApiOverlayToComponent,
  generatePhotoUrl,
  generateOverlayUrl,
  mapApiPhotosToComponents,
  mapApiOverlaysToComponents
} from '../../../src/lib/admin/fieldMappers';
import type { ActualPhoto, ActualOverlay } from '../../../src/schemas/actualApiResponses';

describe('Field Mappers', () => {
  describe('generatePhotoUrl', () => {
    test('generates correct thumbnail URL', () => {
      const url = generatePhotoUrl('test-id', 'photo.jpg', 'thumb');
      expect(url).toBe('/alina/thumbs/photo.jpg');
    });

    test('generates correct minigame URL', () => {
      const url = generatePhotoUrl('test-id', 'photo.jpg', 'minigame');
      expect(url).toBe('/alina/minigame/photo.jpg');
    });

    test('generates correct full URL', () => {
      const url = generatePhotoUrl('test-id', 'photo.jpg', 'full');
      expect(url).toBe('/alina/user-uploads/photo.jpg');
    });

    test('defaults to full URL when no type specified', () => {
      const url = generatePhotoUrl('test-id', 'photo.jpg');
      expect(url).toBe('/alina/user-uploads/photo.jpg');
    });
  });

  describe('generateOverlayUrl', () => {
    test('generates correct overlay URL', () => {
      const url = generateOverlayUrl('overlay.png');
      expect(url).toBe('/overlays/overlay.png');
    });
  });

  describe('mapApiPhotoToComponent', () => {
    test('maps API photo to component interface', () => {
      const apiPhoto: ActualPhoto = {
        id: 'photo-123',
        upload_date: '2026-06-01T10:00:00.000Z',
        is_approved: false,
        original_filename: 'test-photo.jpg',
        file_size: 1024,
        upload_ip: '127.0.0.1',
        is_hidden: false,
        moderation_notes: null
      };

      const result = mapApiPhotoToComponent(apiPhoto);

      expect(result).toEqual({
        id: 'photo-123',
        name: 'test-photo.jpg',
        path: '/alina/thumbs/test-photo.jpg'
      });
    });

    test('handles special filename characters correctly', () => {
      const apiPhoto: ActualPhoto = {
        id: 'photo-456',
        upload_date: '2026-06-01T10:00:00.000Z',
        is_approved: true,
        original_filename: 'my-photo@2x.jpeg',
        file_size: 2048,
        upload_ip: '192.168.1.1',
        is_hidden: false,
        moderation_notes: 'Approved'
      };

      const result = mapApiPhotoToComponent(apiPhoto);

      expect(result.name).toBe('my-photo@2x.jpeg');
      expect(result.path).toBe('/alina/thumbs/my-photo@2x.jpeg');
    });
  });

  describe('mapApiOverlayToComponent', () => {
    test('maps API overlay to component interface', () => {
      const apiOverlay: ActualOverlay = {
        id: 'overlay-123',
        filename: 'sparkles.png',
        display_name: 'Sparkle Effect',
        file_size: 512,
        is_active: true,
        opacity: 0.8,
        blend_mode: 'overlay',
        created_by: 'admin',
        description: 'Adds sparkle effects'
      };

      const result = mapApiOverlayToComponent(apiOverlay);

      expect(result).toEqual({
        id: 'overlay-123',
        name: 'Sparkle Effect',
        path: '/overlays/sparkles.png',
        blendMode: 'overlay',
        opacity: 0.8
      });
    });

    test('handles overlay without description', () => {
      const apiOverlay: ActualOverlay = {
        id: 'overlay-456',
        filename: 'glow.png',
        display_name: 'Glow Effect',
        file_size: 256,
        is_active: false,
        opacity: 0.6,
        blend_mode: 'multiply',
        created_by: 'user'
      };

      const result = mapApiOverlayToComponent(apiOverlay);

      expect(result).toEqual({
        id: 'overlay-456',
        name: 'Glow Effect',
        path: '/overlays/glow.png',
        blendMode: 'multiply',
        opacity: 0.6
      });
    });
  });

  describe('mapApiPhotosToComponents', () => {
    test('maps array of API photos to component interfaces', () => {
      const apiPhotos: ActualPhoto[] = [
        {
          id: 'photo-1',
          upload_date: '2026-06-01T10:00:00.000Z',
          is_approved: false,
          original_filename: 'photo1.jpg',
          file_size: 1024,
          upload_ip: '127.0.0.1',
          is_hidden: false,
          moderation_notes: null
        },
        {
          id: 'photo-2',
          upload_date: '2026-06-01T11:00:00.000Z',
          is_approved: true,
          original_filename: 'photo2.png',
          file_size: 2048,
          upload_ip: '127.0.0.1',
          is_hidden: false,
          moderation_notes: 'Good quality'
        }
      ];

      const result = mapApiPhotosToComponents(apiPhotos);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'photo-1',
        name: 'photo1.jpg',
        path: '/alina/thumbs/photo1.jpg'
      });
      expect(result[1]).toEqual({
        id: 'photo-2',
        name: 'photo2.png',
        path: '/alina/thumbs/photo2.png'
      });
    });

    test('handles empty array', () => {
      const result = mapApiPhotosToComponents([]);
      expect(result).toEqual([]);
    });
  });

  describe('mapApiOverlaysToComponents', () => {
    test('maps array of API overlays to component interfaces', () => {
      const apiOverlays: ActualOverlay[] = [
        {
          id: 'overlay-1',
          filename: 'effect1.png',
          display_name: 'Effect One',
          file_size: 512,
          is_active: true,
          opacity: 0.8,
          blend_mode: 'overlay',
          created_by: 'admin'
        },
        {
          id: 'overlay-2',
          filename: 'effect2.png',
          display_name: 'Effect Two',
          file_size: 256,
          is_active: false,
          opacity: 0.6,
          blend_mode: 'multiply',
          created_by: 'user',
          description: 'Cool effect'
        }
      ];

      const result = mapApiOverlaysToComponents(apiOverlays);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'overlay-1',
        name: 'Effect One',
        path: '/overlays/effect1.png',
        blendMode: 'overlay',
        opacity: 0.8
      });
      expect(result[1]).toEqual({
        id: 'overlay-2',
        name: 'Effect Two',
        path: '/overlays/effect2.png',
        blendMode: 'multiply',
        opacity: 0.6
      });
    });

    test('handles empty array', () => {
      const result = mapApiOverlaysToComponents([]);
      expect(result).toEqual([]);
    });
  });
});