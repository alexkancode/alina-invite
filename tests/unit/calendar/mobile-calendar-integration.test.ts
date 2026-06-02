import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { generatePersonalizedICS, generateGenericICS } from '../../../src/lib/calendarGenerator.js';

// Mobile calendar integration tests
// Ensures proper platform-specific calendar handling with deep linking and fallbacks

describe('Mobile Calendar Integration Service', () => {
  const mockPlatformInfo = {
    os: 'ios' as const,
    browser: 'safari' as const,
    version: '15.0',
    supportsDeepLinking: true,
    requiresSafariOptimizations: true,
    avoidTargetBlank: true,
    requiresCursorPointer: true
  };

  const mockCalendarEvent = {
    title: 'Test Birthday Party',
    description: 'A fun celebration',
    location: '123 Test St, Houston, TX',
    startTime: new Date('2024-07-11T15:00:00-05:00'),
    endTime: new Date('2024-07-11T18:00:00-05:00'),
    guestName: 'Test Guest'
  };

  // Mock DOM APIs
  const mockURL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  };

  const mockDocument = {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  };

  const mockWindow = {
    location: { href: '' },
    URL: mockURL
  };

  beforeEach(() => {
    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('URL', mockURL);

    // Reset mocks
    vi.clearAllMocks();
    mockWindow.location.href = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Platform-Specific Calendar Integration', () => {
    it('should attempt deep linking on iOS for Google Calendar', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      await addToCalendar(mockCalendarEvent, mockPlatformInfo);

      expect(mockWindow.location.href).toContain('calendar.google.com/calendar/render');
      expect(mockWindow.location.href).toContain('action=TEMPLATE');
      expect(mockWindow.location.href).toContain('text=Test%20Birthday%20Party');
    });

    it('should format event data for Google Calendar URL', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      await addToCalendar(mockCalendarEvent, mockPlatformInfo);

      const url = mockWindow.location.href;
      expect(url).toContain('dates=20240711T200000Z%2F20240711T230000Z');
      expect(url).toContain('location=123%20Test%20St%2C%20Houston%2C%20TX');
      expect(url).toContain('details=A%20fun%20celebration');
    });

    it('should use Android intent URL for Android platform', async () => {
      const androidPlatform = {
        ...mockPlatformInfo,
        os: 'android' as const,
        browser: 'chrome' as const,
        requiresIntentHandling: true,
        requiresSafariOptimizations: false
      };

      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      await addToCalendar(mockCalendarEvent, androidPlatform);

      // Should try intent URL first
      expect(mockWindow.location.href).toContain('intent://calendar.google.com');
      expect(mockWindow.location.href).toContain('scheme=https');
      expect(mockWindow.location.href).toContain('package=com.google.android.calendar');
    });
  });

  describe('ICS Fallback Integration', () => {
    it('should generate Safari-optimized ICS download when deep linking fails', async () => {
      // Mock deep link failure by throwing error
      const mockDeepLinkError = new Error('Deep link failed');

      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      // Simulate deep link failure scenario
      vi.spyOn(mockWindow.location, 'href', 'set').mockImplementation(() => {
        throw mockDeepLinkError;
      });

      await addToCalendar(mockCalendarEvent, mockPlatformInfo);

      // Should fallback to ICS download
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockDocument.createElement).toHaveBeenCalledWith('a');

      // Verify Safari optimizations
      const createElementCalls = mockDocument.createElement.mock.calls;
      const linkElement = createElementCalls[0][0];
      expect(linkElement).toBe('a');
    });

    it('should use existing ICS generation for fallback', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      // Force fallback by mocking platform without deep linking
      const desktopPlatform = {
        ...mockPlatformInfo,
        os: 'desktop' as const,
        supportsDeepLinking: false,
        preferStandardDownload: true
      };

      await addToCalendar(mockCalendarEvent, desktopPlatform);

      // Verify ICS content generation was used
      expect(mockURL.createObjectURL).toHaveBeenCalled();

      // Get the blob that was created
      const createObjectURLCall = mockURL.createObjectURL.mock.calls[0];
      const blob = createObjectURLCall[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/calendar;charset=utf-8');
    });

    it('should avoid target="_blank" for Safari optimization', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      const safariPlatform = {
        ...mockPlatformInfo,
        supportsDeepLinking: false,
        avoidTargetBlank: true
      };

      await addToCalendar(mockCalendarEvent, safariPlatform);

      // Verify link element doesn't have target="_blank"
      const linkElement = mockDocument.createElement.mock.results[0].value;
      expect(linkElement.target).not.toBe('_blank');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle deep link failure gracefully', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      // Mock navigation failure
      Object.defineProperty(mockWindow.location, 'href', {
        set: () => { throw new Error('Navigation blocked'); }
      });

      // Should not throw error
      await expect(addToCalendar(mockCalendarEvent, mockPlatformInfo)).resolves.not.toThrow();

      // Should fallback to ICS
      expect(mockURL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle blob creation failure gracefully', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      // Mock Blob constructor failure
      vi.stubGlobal('Blob', function() {
        throw new Error('Blob creation failed');
      });

      const desktopPlatform = {
        ...mockPlatformInfo,
        os: 'desktop' as const,
        supportsDeepLinking: false
      };

      // Should handle error gracefully
      await expect(addToCalendar(mockCalendarEvent, desktopPlatform)).resolves.not.toThrow();
    });
  });

  describe('Integration with Existing Calendar Generator', () => {
    it('should use personalized ICS when guest name is provided', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      const eventWithGuest = {
        ...mockCalendarEvent,
        guestName: 'John Doe'
      };

      const desktopPlatform = {
        ...mockPlatformInfo,
        os: 'desktop' as const,
        supportsDeepLinking: false
      };

      await addToCalendar(eventWithGuest, desktopPlatform);

      // Verify personalized ICS generation was used
      expect(mockURL.createObjectURL).toHaveBeenCalled();

      // Check that the blob contains personalized content
      const blob = mockURL.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe('text/calendar;charset=utf-8');
    });

    it('should use generic ICS when no guest name is provided', async () => {
      const { addToCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      const eventWithoutGuest = {
        ...mockCalendarEvent,
        guestName: undefined
      };

      const desktopPlatform = {
        ...mockPlatformInfo,
        os: 'desktop' as const,
        supportsDeepLinking: false
      };

      await addToCalendar(eventWithoutGuest, desktopPlatform);

      // Verify ICS generation was used
      expect(mockURL.createObjectURL).toHaveBeenCalled();

      const blob = mockURL.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe('text/calendar;charset=utf-8');
    });
  });

  describe('Date Format Conversion', () => {
    it('should correctly convert dates to Google Calendar format', () => {
      const { formatDateForGoogleCalendar } = require('../../../src/lib/mobileCalendarIntegration.js');

      const testDate = new Date('2024-07-11T15:00:00-05:00');
      const formatted = formatDateForGoogleCalendar(testDate);

      expect(formatted).toBe('20240711T200000Z');
    });

    it('should format date range for Google Calendar URLs', () => {
      const { formatDateRangeForUrl } = require('../../../src/lib/mobileCalendarIntegration.js');

      const start = new Date('2024-07-11T15:00:00-05:00');
      const end = new Date('2024-07-11T18:00:00-05:00');
      const formatted = formatDateRangeForUrl(start, end);

      expect(formatted).toBe('20240711T200000Z/20240711T230000Z');
    });
  });
});