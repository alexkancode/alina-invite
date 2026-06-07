import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminTabsController } from '../../../src/lib/admin/AdminTabsController';

describe('AdminTabs UI Component', () => {
  let mockContainer: HTMLElement;
  let tabsController: AdminTabsController;

  beforeEach(() => {
    // Create mock DOM elements for testing
    mockContainer = document.createElement('div');
    mockContainer.className = 'admin-tabs';
    mockContainer.innerHTML = `
      <nav class="tab-nav" role="tablist">
        <button class="tab-button active" data-tab="photos" role="tab" aria-controls="panel-0" id="tab-0" tabindex="0">Photo Gallery</button>
        <button class="tab-button" data-tab="overlays" role="tab" aria-controls="panel-1" id="tab-1" tabindex="-1">Overlay Effects</button>
      </nav>
      <div class="tab-content">
        <div class="tab-panel active" data-panel="photos" role="tabpanel" aria-labelledby="tab-0" id="panel-0">Photo content</div>
        <div class="tab-panel hidden" data-panel="overlays" role="tabpanel" aria-labelledby="tab-1" id="panel-1">Overlay content</div>
      </div>
    `;

    document.body.appendChild(mockContainer);

    // Initialize the controller with the mock container
    tabsController = new AdminTabsController({ container: mockContainer });
  });

  afterEach(() => {
    if (tabsController) {
      tabsController.destroy();
    }
    document.body.removeChild(mockContainer);
  });

  describe('Tab Switching', () => {
    test('switches to overlay tab when clicked', () => {
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;
      const photoButton = mockContainer.querySelector('[data-tab="photos"]') as HTMLButtonElement;

      overlayButton.click();

      expect(overlayButton.classList.contains('active')).toBe(true);
      expect(photoButton.classList.contains('active')).toBe(false);
    });

    test('shows correct panel content when tab is switched', () => {
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;
      const photoPanel = mockContainer.querySelector('[data-panel="photos"]') as HTMLElement;
      const overlayPanel = mockContainer.querySelector('[data-panel="overlays"]') as HTMLElement;

      overlayButton.click();

      expect(photoPanel.classList.contains('active')).toBe(false);
      expect(photoPanel.classList.contains('hidden')).toBe(true);
      expect(overlayPanel.classList.contains('active')).toBe(true);
      expect(overlayPanel.classList.contains('hidden')).toBe(false);
    });

    test('maintains single active tab state', () => {
      const photoButton = mockContainer.querySelector('[data-tab="photos"]') as HTMLButtonElement;
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;

      overlayButton.click();
      photoButton.click();

      const activeButtons = mockContainer.querySelectorAll('.tab-button.active');
      expect(activeButtons).toHaveLength(1);
      expect(activeButtons[0].getAttribute('data-tab')).toBe('photos');
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports arrow key navigation', () => {
      const photoButton = mockContainer.querySelector('[data-tab="photos"]') as HTMLButtonElement;
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;

      photoButton.focus();

      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      photoButton.dispatchEvent(arrowRightEvent);

      expect(document.activeElement).toBe(overlayButton);
    });

    test('supports enter key activation', () => {
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;

      overlayButton.focus();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      overlayButton.dispatchEvent(enterEvent);

      expect(overlayButton.classList.contains('active')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      const tabList = mockContainer.querySelector('.tab-nav');
      const tabs = mockContainer.querySelectorAll('.tab-button');
      const panels = mockContainer.querySelectorAll('.tab-panel');

      expect(tabList?.getAttribute('role')).toBe('tablist');

      tabs.forEach((tab, index) => {
        expect(tab.getAttribute('role')).toBe('tab');
        expect(tab.getAttribute('aria-controls')).toBe(`panel-${index}`);
        expect(tab.getAttribute('tabindex')).toBeDefined();
      });

      panels.forEach((panel, index) => {
        expect(panel.getAttribute('role')).toBe('tabpanel');
        expect(panel.getAttribute('aria-labelledby')).toBe(`tab-${index}`);
      });
    });

    test('manages focus correctly', () => {
      const photoButton = mockContainer.querySelector('[data-tab="photos"]') as HTMLButtonElement;
      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;

      // Only active tab should be in tab order
      expect(photoButton.getAttribute('tabindex')).toBe('0');
      expect(overlayButton.getAttribute('tabindex')).toBe('-1');

      overlayButton.click();

      expect(photoButton.getAttribute('tabindex')).toBe('-1');
      expect(overlayButton.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Event Handling', () => {
    test('emits custom events on tab change', () => {
      const eventListener = vi.fn();
      mockContainer.addEventListener('tabChanged', eventListener);

      const overlayButton = mockContainer.querySelector('[data-tab="overlays"]') as HTMLButtonElement;
      overlayButton.click();

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { activeTab: 'overlays', previousTab: 'photos' }
        })
      );
    });

    test('prevents default behavior for non-tab clicks', () => {
      const nonTabElement = document.createElement('span');
      mockContainer.appendChild(nonTabElement);

      const clickEvent = vi.fn();
      nonTabElement.addEventListener('click', clickEvent);

      nonTabElement.click();

      // Should not trigger tab switching behavior
      const activeTab = mockContainer.querySelector('.tab-button.active');
      expect(activeTab?.getAttribute('data-tab')).toBe('photos'); // Should remain unchanged
    });
  });
});