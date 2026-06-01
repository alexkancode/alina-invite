import { http, HttpResponse } from 'msw';

// Current API response structures (causing errors)
export const mockPhotosApiResponse = {
  success: true,
  photos: [
    {
      id: 'photo-1',
      name: 'test-photo-1.jpg',
      path: '/uploads/test-photo-1.jpg'
    },
    {
      id: 'photo-2',
      name: 'test-photo-2.jpg',
      path: '/uploads/test-photo-2.jpg'
    }
  ],
  count: 2
};

export const mockOverlaysApiResponse = {
  overlays: [
    {
      id: 'overlay-1',
      name: 'Test Overlay 1',
      path: '/overlays/test-overlay-1.png',
      blendMode: 'overlay',
      opacity: 0.8
    },
    {
      id: 'overlay-2',
      name: 'Test Overlay 2',
      path: '/overlays/test-overlay-2.png',
      blendMode: 'multiply',
      opacity: 0.6
    }
  ],
  settings: {
    maxUploads: 10,
    allowedFormats: ['png', 'jpg']
  }
};

// Error response scenarios
export const mockApiErrorResponse = {
  error: 'Internal server error',
  details: 'Database connection failed'
};

export const mockInvalidPhotosResponse = {
  data: { photos: [] }, // Wrong structure - nested under 'data'
  meta: { total: 0 }
};

export const mockInvalidOverlaysResponse = {
  results: [], // Wrong structure - should be 'overlays' key
  pagination: { page: 1, limit: 10 }
};

// MSW handlers for testing
export const mockApiHandlers = [
  // Default successful responses (current structure causing errors)
  http.get('/api/admin/photos', () => {
    return HttpResponse.json(mockPhotosApiResponse);
  }),

  http.get('/api/admin/overlays', () => {
    return HttpResponse.json(mockOverlaysApiResponse);
  })
];

// Error scenario handlers
export const mockErrorHandlers = [
  http.get('/api/admin/photos', () => {
    return HttpResponse.json(mockApiErrorResponse, { status: 500 });
  }),

  http.get('/api/admin/overlays', () => {
    return HttpResponse.json(mockApiErrorResponse, { status: 500 });
  })
];

// Invalid structure handlers
export const mockInvalidStructureHandlers = [
  http.get('/api/admin/photos', () => {
    return HttpResponse.json(mockInvalidPhotosResponse);
  }),

  http.get('/api/admin/overlays', () => {
    return HttpResponse.json(mockInvalidOverlaysResponse);
  })
];

// Network error handlers
export const mockNetworkErrorHandlers = [
  http.get('/api/admin/photos', () => {
    return HttpResponse.error();
  }),

  http.get('/api/admin/overlays', () => {
    return HttpResponse.error();
  })
];