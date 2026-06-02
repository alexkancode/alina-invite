import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// End-to-end calendar button integration tests
// Tests the complete calendar button workflow from click to calendar integration

describe('Calendar Button Integration', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;

  const mockCalendarEvent = {
    title: "Alina's Birthday Party",
    description: "You're invited to celebrate!",
    location: "3220 Alabama CT, Houston, TX 77027",
    startTime: new Date('2026-07-11T15:00:00-05:00'),
    endTime: new Date('2026-07-11T18:00:00-05:00'),
    guestName: 'Test Guest'
  };

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="calendar-button-container">
            <button id="add-to-calendar-btn" class="calendar-button">
              Add to Calendar
            </button>
            <div id="calendar-status" class="calendar-status hidden"></div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;

    // Set up global mocks
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', document);

    // Mock APIs
    window.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    };

    // Mock successful navigation
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: 'http://localhost:3000'
    });
  });

  afterEach(() => {
    dom.window.close();
    vi.unstubAllGlobals();
  });

  describe('Button Click Behavior', () => {
    it('should detect Safari and attempt deep linking first', async () => {
      // Mock Safari iOS user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        writable: true
      });

      // Load calendar button functionality
      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      expect(button).toBeTruthy();

      // Mock click event
      const clickEvent = new window.Event('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      // Should attempt Google Calendar deep link
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async operations
      expect(window.location.href).toContain('calendar.google.com/calendar/render');
    });

    it('should show loading state during calendar operation', async () => {
      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      const statusDiv = document.getElementById('calendar-status');

      // Simulate slow operation
      const slowPromise = new Promise(resolve => setTimeout(resolve, 100));

      button.click();

      // Check loading state immediately after click
      expect(button.textContent).toContain('Adding...');
      expect(button.disabled).toBe(true);

      await slowPromise;
    });

    it('should display error message when calendar operation fails', async () => {
      // Mock navigation failure
      Object.defineProperty(window.location, 'href', {
        set: () => { throw new Error('Navigation blocked'); }
      });

      // Mock blob creation failure as well
      window.URL.createObjectURL = vi.fn(() => { throw new Error('Blob failed'); });

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      const statusDiv = document.getElementById('calendar-status');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(statusDiv.textContent).toContain('Failed to add to calendar');
      expect(statusDiv.classList.contains('hidden')).toBe(false);
      expect(button.disabled).toBe(false);
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should use ICS download for desktop browsers', async () => {
      // Mock desktop Chrome user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        writable: true
      });

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should create blob for download
      expect(window.URL.createObjectURL).toHaveBeenCalled();

      // Should not attempt navigation
      expect(window.location.href).toBe('http://localhost:3000');
    });

    it('should handle Android Chrome with intent URLs', async () => {
      // Mock Android Chrome user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 12; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36',
        writable: true
      });

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should attempt intent URL
      expect(window.location.href).toContain('intent://calendar.google.com');
    });
  });

  describe('CSS and Styling Integration', () => {
    it('should apply cursor pointer for Safari compatibility', async () => {
      // Mock Safari
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true
      });

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      const computedStyle = window.getComputedStyle(button);

      // Should have cursor pointer for Safari
      expect(button.style.cursor).toBe('pointer');
    });

    it('should not use target="_blank" for Safari links', async () => {
      // Mock Safari
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true
      });

      // Force fallback to ICS download
      Object.defineProperty(window.location, 'href', {
        set: () => { throw new Error('Force fallback'); }
      });

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check that no links with target="_blank" were created
      const links = document.querySelectorAll('a[target="_blank"]');
      expect(links.length).toBe(0);
    });
  });

  describe('Event Data Validation', () => {
    it('should handle missing event data gracefully', async () => {
      const incompleteEvent = {
        title: 'Test Event',
        // Missing required fields
      };

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');

      // Should not throw error
      await expect(initializeCalendarButton(incompleteEvent)).resolves.not.toThrow();
    });

    it('should validate date format before processing', async () => {
      const eventWithInvalidDate = {
        ...mockCalendarEvent,
        startTime: 'invalid-date',
        endTime: new Date('2026-07-11T18:00:00-05:00')
      };

      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(eventWithInvalidDate);

      const button = document.getElementById('add-to-calendar-btn');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      const statusDiv = document.getElementById('calendar-status');
      expect(statusDiv.textContent).toContain('Invalid event data');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain button accessibility during operations', async () => {
      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');

      // Check initial accessibility
      expect(button.getAttribute('role')).toBe('button');
      expect(button.getAttribute('aria-label')).toContain('Add to Calendar');

      // Check accessibility during loading
      button.click();
      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should provide screen reader feedback for status changes', async () => {
      const { initializeCalendarButton } = require('../../../src/lib/calendarButtonHandler.js');
      await initializeCalendarButton(mockCalendarEvent);

      const button = document.getElementById('add-to-calendar-btn');
      const statusDiv = document.getElementById('calendar-status');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Status div should have aria-live for screen readers
      expect(statusDiv.getAttribute('aria-live')).toBe('polite');
      expect(statusDiv.getAttribute('role')).toBe('status');
    });
  });
});