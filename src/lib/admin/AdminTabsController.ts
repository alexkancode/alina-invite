export interface AdminTabsOptions {
  container?: HTMLElement | string;
}

export class AdminTabsController {
  private container: HTMLElement;
  private tabButtons: NodeListOf<HTMLButtonElement>;
  private tabPanels: NodeListOf<HTMLElement>;

  constructor(options: AdminTabsOptions = {}) {
    const containerElement = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container || document.querySelector('.admin-tabs');

    if (!containerElement) {
      throw new Error('AdminTabs container not found');
    }

    this.container = containerElement as HTMLElement;
    this.tabButtons = this.container.querySelectorAll('.tab-button');
    this.tabPanels = this.container.querySelectorAll('.tab-panel');

    if (this.tabButtons.length === 0) {
      throw new Error('No tab buttons found in AdminTabs container');
    }

    this.setupEventListeners();
    this.setupKeyboardNavigation();
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  private setupKeyboardNavigation(): void {
    this.tabButtons.forEach(button => {
      button.addEventListener('keydown', this.handleKeydown.bind(this));
    });
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const tabButton = target.closest('.tab-button') as HTMLButtonElement;

    if (tabButton && tabButton.dataset.tab) {
      event.preventDefault();
      this.activateTab(tabButton.dataset.tab);
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLButtonElement;
    const currentIndex = Array.from(this.tabButtons).indexOf(target);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextTab(currentIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousTab(currentIndex);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (target.dataset.tab) {
          this.activateTab(target.dataset.tab);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusTab(this.tabButtons.length - 1);
        break;
    }
  }

  private focusNextTab(currentIndex: number): void {
    const nextIndex = (currentIndex + 1) % this.tabButtons.length;
    this.focusTab(nextIndex);
  }

  private focusPreviousTab(currentIndex: number): void {
    const prevIndex = currentIndex === 0 ? this.tabButtons.length - 1 : currentIndex - 1;
    this.focusTab(prevIndex);
  }

  private focusTab(index: number): void {
    this.tabButtons[index].focus();
  }

  public activateTab(tabId: string): void {
    const previousActiveButton = this.container.querySelector('.tab-button.active');
    const previousTab = previousActiveButton?.getAttribute('data-tab');

    this.tabButtons.forEach(button => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    this.tabPanels.forEach(panel => {
      const isActive = panel.dataset.panel === tabId;
      panel.classList.toggle('active', isActive);
      panel.classList.toggle('hidden', !isActive);
    });

    this.container.dispatchEvent(new CustomEvent('tabChanged', {
      detail: { activeTab: tabId, previousTab }
    }));
  }

  public destroy(): void {
    this.container.removeEventListener('click', this.handleClick.bind(this));
    this.tabButtons.forEach(button => {
      button.removeEventListener('keydown', this.handleKeydown.bind(this));
    });
  }
}