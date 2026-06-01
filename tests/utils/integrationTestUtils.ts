import { vi } from 'vitest';

// Console error capture utility
export class ConsoleErrorCapture {
  private originalError: typeof console.error;
  private capturedErrors: string[] = [];

  constructor() {
    this.originalError = console.error;
  }

  start(): void {
    this.capturedErrors = [];
    console.error = vi.fn((...args) => {
      this.capturedErrors.push(args.map(arg =>
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' '));
    });
  }

  stop(): void {
    console.error = this.originalError;
  }

  getErrors(): string[] {
    return [...this.capturedErrors];
  }

  hasError(errorPattern: string | RegExp): boolean {
    return this.capturedErrors.some(error => {
      if (typeof errorPattern === 'string') {
        return error.includes(errorPattern);
      }
      return errorPattern.test(error);
    });
  }
}

// DOM testing utilities for Astro components
export function createMockDocument(): Document {
  const mockDocument = document.implementation.createHTMLDocument('Test');
  return mockDocument;
}

export function createMockElement(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

export function cleanupMockElement(element: HTMLElement): void {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

// Custom event testing utilities
export interface CustomEventCapture {
  eventType: string;
  detail: any;
  timestamp: number;
}

export class CustomEventListener {
  private capturedEvents: CustomEventCapture[] = [];
  private listeners: Map<string, EventListener> = new Map();

  listen(element: EventTarget, eventType: string): void {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent;
      this.capturedEvents.push({
        eventType,
        detail: customEvent.detail,
        timestamp: Date.now()
      });
    };

    this.listeners.set(eventType, listener);
    element.addEventListener(eventType, listener);
  }

  stop(element: EventTarget): void {
    this.listeners.forEach((listener, eventType) => {
      element.removeEventListener(eventType, listener);
    });
    this.listeners.clear();
  }

  getEvents(): CustomEventCapture[] {
    return [...this.capturedEvents];
  }

  getEventsOfType(eventType: string): CustomEventCapture[] {
    return this.capturedEvents.filter(event => event.eventType === eventType);
  }

  hasEventWithDetail(eventType: string, detailMatcher: (detail: any) => boolean): boolean {
    return this.getEventsOfType(eventType).some(event => detailMatcher(event.detail));
  }
}

// Async testing utilities
export function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  checkInterval: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}

export function waitForElement(
  selector: string,
  container: Document | HTMLElement = document,
  timeout: number = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector) as HTMLElement;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(container === document ? document.body : container, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
    }, timeout);
  });
}

// Fetch mock utilities
export function createFetchMock(responseData: any, options: { status?: number; ok?: boolean } = {}) {
  const { status = 200, ok = true } = options;

  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData))
  });
}

export function createFetchErrorMock(error: Error | string) {
  return vi.fn().mockRejectedValue(
    typeof error === 'string' ? new Error(error) : error
  );
}

// Component state testing utilities
export function triggerComponentInitialization(element: HTMLElement): void {
  // Simulate component initialization by dispatching DOMContentLoaded
  const event = new Event('DOMContentLoaded');
  element.dispatchEvent(event);
}

export function simulateAsyncComponentLoad(
  element: HTMLElement,
  delay: number = 100
): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      triggerComponentInitialization(element);
      resolve();
    }, delay);
  });
}