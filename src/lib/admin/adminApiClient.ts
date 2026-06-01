import {
  parsePhotosResponse,
  parseOverlaysResponse,
  parseDashboardStats,
  type DashboardStats
} from './apiResponseHandlers';
import type { PhotoAsset, OverlayAsset } from './tabState';

// Admin API Client interface
export interface AdminApiClient {
  fetchPhotos(): Promise<PhotoAsset[]>;
  fetchOverlays(): Promise<OverlayAsset[]>;
  fetchDashboardStats(): Promise<DashboardStats>;
}

// Error handling interface
export interface ApiError {
  message: string;
  details?: string;
  status?: number;
}

// Implementation of AdminApiClient
export class DefaultAdminApiClient implements AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async fetchPhotos(): Promise<PhotoAsset[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/photos`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return parsePhotosResponse(data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      throw this.createApiError(error, 'Failed to load photos');
    }
  }

  async fetchOverlays(): Promise<OverlayAsset[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/overlays`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return parseOverlaysResponse(data);
    } catch (error) {
      console.error('Failed to fetch overlays:', error);
      throw this.createApiError(error, 'Failed to load overlays');
    }
  }

  async fetchDashboardStats(): Promise<DashboardStats> {
    try {
      const [photosResponse, overlaysResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/admin/photos`),
        fetch(`${this.baseUrl}/api/admin/overlays`)
      ]);

      let photosData = {};
      let overlaysData = {};

      if (photosResponse.ok) {
        photosData = await photosResponse.json();
      } else {
        console.warn('Photos API failed:', photosResponse.statusText);
      }

      if (overlaysResponse.ok) {
        overlaysData = await overlaysResponse.json();
      } else {
        console.warn('Overlays API failed:', overlaysResponse.statusText);
      }

      return parseDashboardStats(photosData, overlaysData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw this.createApiError(error, 'Failed to load dashboard statistics');
    }
  }

  private createApiError(error: unknown, defaultMessage: string): ApiError {
    if (error instanceof Error) {
      return {
        message: defaultMessage,
        details: error.message
      };
    }

    return {
      message: defaultMessage,
      details: typeof error === 'string' ? error : 'Unknown error occurred'
    };
  }
}

// Global instance for convenience
export const adminApiClient = new DefaultAdminApiClient();