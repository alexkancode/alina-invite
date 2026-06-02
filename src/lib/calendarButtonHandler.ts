import { detectPlatform } from './platformDetectionService.js';
import { addToCalendar, type CalendarEvent } from './mobileCalendarIntegration.js';

export interface CalendarButtonElements {
  button: HTMLButtonElement;
  statusDiv: HTMLElement;
}

export async function initializeCalendarButton(
  eventData: CalendarEvent,
  buttonSelector: string = '#add-to-calendar-btn',
  statusSelector: string = '#calendar-status'
): Promise<void> {
  const button = document.querySelector(buttonSelector) as HTMLButtonElement;
  const statusDiv = document.querySelector(statusSelector) as HTMLElement;

  if (!button) {
    console.error('Calendar button not found:', buttonSelector);
    return;
  }

  if (!statusDiv) {
    console.error('Calendar status element not found:', statusSelector);
    return;
  }

  const elements = { button, statusDiv };
  const platformInfo = detectPlatform();

  setupButtonAccessibility(elements);
  applyPlatformSpecificStyling(elements, platformInfo);
  attachEventHandlers(elements, eventData, platformInfo);
}

function setupButtonAccessibility({ button, statusDiv }: CalendarButtonElements): void {
  button.setAttribute('role', 'button');
  button.setAttribute('aria-label', 'Add event to your calendar');

  statusDiv.setAttribute('aria-live', 'polite');
  statusDiv.setAttribute('role', 'status');
}

function applyPlatformSpecificStyling(
  { button }: CalendarButtonElements,
  platformInfo: any
): void {
  if (platformInfo.requiresCursorPointer) {
    button.style.cursor = 'pointer';
  }

  if (platformInfo.requiresSafariOptimizations) {
    button.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0)';
    button.style.touchAction = 'manipulation';
  }
}

function attachEventHandlers(
  elements: CalendarButtonElements,
  eventData: CalendarEvent,
  platformInfo: any
): void {
  const { button, statusDiv } = elements;

  button.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!validateEventData(eventData)) {
      showStatus(statusDiv, 'Invalid event data. Please try again.', 'error');
      return;
    }

    try {
      setLoadingState(button, true);
      hideStatus(statusDiv);

      await addToCalendar(eventData, platformInfo);

      showStatus(statusDiv, 'Event added to calendar successfully!', 'success');
    } catch (error) {
      console.error('Calendar integration failed:', error);
      showStatus(statusDiv, 'Failed to add to calendar. Please try downloading the calendar file manually.', 'error');
    } finally {
      setLoadingState(button, false);
    }
  });
}

function setLoadingState(button: HTMLButtonElement, loading: boolean): void {
  const originalText = button.dataset.originalText || button.textContent;

  if (loading) {
    button.dataset.originalText = originalText;
    button.textContent = 'Adding...';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    button.textContent = originalText;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function showStatus(statusDiv: HTMLElement, message: string, type: 'success' | 'error'): void {
  statusDiv.textContent = message;
  statusDiv.className = `calendar-status ${type}`;
  statusDiv.classList.remove('hidden');
}

function hideStatus(statusDiv: HTMLElement): void {
  statusDiv.classList.add('hidden');
  statusDiv.textContent = '';
}

function validateEventData(eventData: CalendarEvent): boolean {
  if (!eventData) return false;
  if (!eventData.title || typeof eventData.title !== 'string') return false;
  if (!eventData.startTime || !(eventData.startTime instanceof Date) || isNaN(eventData.startTime.getTime())) return false;
  if (!eventData.endTime || !(eventData.endTime instanceof Date) || isNaN(eventData.endTime.getTime())) return false;
  if (eventData.startTime >= eventData.endTime) return false;

  return true;
}