import type {
  SpotifyTrack,
  SearchState,
  KeyboardEventHandler,
  SearchEventHandler,
  SelectionEventHandler
} from './types.js';

export class SpotifyCombobox {
  private container: HTMLElement;
  private searchInput: HTMLInputElement;
  private resultsList: HTMLUListElement;
  private hiddenInput: HTMLInputElement;
  private inputWrapper: HTMLElement;
  private selectedContainer: HTMLElement;
  private debounceTimer: number | null = null;
  private currentRequestId: number = 0;
  private previousResultsLength: number = 0;

  private state: SearchState = {
    query: '',
    results: [],
    isLoading: false,
    isOpen: false,
    highlightedIndex: -1,
    selectedTrack: null
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeElements();
    this.bindEvents();
    this.setupAccessibility();
  }

  private initializeElements(): void {
    this.searchInput = this.container.querySelector('[role="combobox"]') as HTMLInputElement;
    this.resultsList = this.container.querySelector('[role="listbox"]') as HTMLUListElement;
    this.hiddenInput = this.container.querySelector('input[type="hidden"]') as HTMLInputElement;
    this.inputWrapper = this.container.querySelector('.spotify-input-wrapper') as HTMLElement;
    this.selectedContainer = this.container.querySelector('.spotify-selected-container') as HTMLElement;

    if (!this.searchInput || !this.resultsList || !this.hiddenInput ||
        !this.inputWrapper || !this.selectedContainer) {
      throw new Error('Required elements not found in container');
    }
  }

  private bindEvents(): void {
    this.searchInput.addEventListener('input', this.handleInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
    this.searchInput.addEventListener('blur', this.handleBlur.bind(this));
  }

  private setupAccessibility(): void {
    this.searchInput.setAttribute('role', 'combobox');
    this.searchInput.setAttribute('aria-controls', this.resultsList.id || 'spotify-results');
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.setAttribute('aria-autocomplete', 'list');
    this.searchInput.setAttribute('aria-haspopup', 'listbox');
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();

    this.setState({ query });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (query.length === 0) {
      this.setState({ results: [], isOpen: false });
      return;
    }

    this.debounceTimer = window.setTimeout(() => {
      this.performSearch(query);
    }, 200);
  }

  private async performSearch(query: string): Promise<void> {
    const requestId = ++this.currentRequestId;
    this.setState({ isLoading: true });

    try {
      const response = await fetch(
        `/api/music-search?q=${encodeURIComponent(query)}&maxResults=10`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (requestId !== this.currentRequestId) {
        return;
      }

      if (data.success && data.songs) {
        const tracks = this.transformToSpotifyTracks(data.songs);
        this.setState({
          results: tracks,
          isLoading: false,
          isOpen: tracks.length > 0,
          highlightedIndex: -1
        });
      } else {
        this.setState({ results: [], isLoading: false, isOpen: false });
      }
    } catch (error) {
      if (requestId === this.currentRequestId) {
        console.warn('Search failed:', error);
        this.setState({ results: [], isLoading: false, isOpen: false });
      }
    }
  }

  private transformToSpotifyTracks(songs: any[]): SpotifyTrack[] {
    return songs.map(song => ({
      id: song.id || song.spotifyId,
      title: song.title,
      artist: song.artist,
      year: song.year,
      albumArtUrl: song.albumArtUrl,
      previewUrl: song.previewUrl,
      spotifyUrl: song.spotifyId ? `https://open.spotify.com/track/${song.spotifyId}` : '',
      spotifyId: song.spotifyId || song.id
    }));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.state.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateNext();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.navigatePrevious();
        break;

      case 'Enter':
        event.preventDefault();
        this.selectHighlighted();
        break;

      case 'Escape':
        event.preventDefault();
        this.setState({ isOpen: false, highlightedIndex: -1 });
        break;

      case 'Home':
        event.preventDefault();
        this.setState({ highlightedIndex: 0 });
        break;

      case 'End':
        event.preventDefault();
        this.setState({ highlightedIndex: this.state.results.length - 1 });
        break;
    }
  }

  private navigateNext(): void {
    const maxIndex = this.state.results.length - 1;
    const nextIndex = this.state.highlightedIndex < maxIndex
      ? this.state.highlightedIndex + 1
      : 0;

    this.setState({ highlightedIndex: nextIndex });
  }

  private navigatePrevious(): void {
    const maxIndex = this.state.results.length - 1;
    const prevIndex = this.state.highlightedIndex > 0
      ? this.state.highlightedIndex - 1
      : maxIndex;

    this.setState({ highlightedIndex: prevIndex });
  }

  private selectHighlighted(): void {
    if (this.state.highlightedIndex >= 0 && this.state.highlightedIndex < this.state.results.length) {
      const track = this.state.results[this.state.highlightedIndex];
      this.selectTrack(track);
    }
  }

  private handleFocus(): void {
    if (this.state.results.length > 0) {
      this.setState({ isOpen: true });
    }
  }

  private handleBlur(event: FocusEvent): void {
    setTimeout(() => {
      if (!this.container.contains(document.activeElement)) {
        this.setState({ isOpen: false, highlightedIndex: -1 });
      }
    }, 100);
  }

  public selectTrack(track: SpotifyTrack | null): void {
    if (track) {
      this.hiddenInput.value = JSON.stringify({
        id: track.id,
        title: track.title,
        artist: track.artist,
        year: track.year,
        spotifyUrl: track.spotifyUrl,
        spotifyId: track.spotifyId
      });

      this.searchInput.value = '';
      this.setState({
        selectedTrack: track,
        query: '',
        isOpen: false,
        highlightedIndex: -1,
        results: []
      });
    } else {
      this.hiddenInput.value = '';
      this.searchInput.value = '';
      this.setState({ selectedTrack: null, query: '' });
    }

    this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private handleClearClick(): void {
    this.selectTrack(null);
    this.searchInput.focus();
  }

  public setState(partialState: Partial<SearchState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partialState };

    // Check if results array has changed to trigger auto-scroll
    const resultsChanged = partialState.results !== undefined &&
                          partialState.results !== previousState.results;

    this.updateDOM();
    this.updateAriaAttributes();

    // Auto-scroll to top when new results are populated
    if (resultsChanged && this.state.isOpen && this.state.results.length > 0) {
      this.scrollResultsToTop();
    }
  }

  private updateDOM(): void {
    this.renderDropdown();
    this.renderSelection();
  }

  private renderDropdown(): void {
    this.resultsList.innerHTML = '';

    if (this.state.isOpen && this.state.results.length > 0) {
      this.state.results.forEach((track, index) => {
        const li = this.createResultItem(track, index);
        this.resultsList.appendChild(li);
      });
      this.resultsList.style.display = 'block';
      this.calculateDropdownPosition();
    } else {
      this.resultsList.style.display = 'none';
    }
  }

  private renderSelection(): void {
    const track = this.state.selectedTrack;

    if (!track) {
      this.selectedContainer.innerHTML = '';
      this.selectedContainer.classList.add('hidden');
      this.inputWrapper.classList.remove('hidden');
      return;
    }

    this.selectedContainer.innerHTML = `
      <div class="spotify-selected-card" data-testid="spotify-selected-card">
        ${this.renderTrackContent(track)}
        <button
          type="button"
          class="spotify-clear-button"
          aria-label="Clear selected song"
        >&times;</button>
      </div>
    `;

    const clearButton = this.selectedContainer.querySelector('.spotify-clear-button') as HTMLButtonElement;
    clearButton.addEventListener('click', this.handleClearClick.bind(this));

    this.selectedContainer.classList.remove('hidden');
    this.inputWrapper.classList.add('hidden');
  }

  private createResultItem(track: SpotifyTrack, index: number): HTMLLIElement {
    const li = document.createElement('li');
    li.role = 'option';
    li.id = `spotify-option-${track.id}`;
    li.className = `spotify-result-item${index === this.state.highlightedIndex ? ' spotify-result-highlighted' : ''}`;
    li.setAttribute('data-track-id', track.id);

    li.innerHTML = this.renderTrackContent(track);

    li.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    li.addEventListener('click', () => {
      this.selectTrack(track);
    });

    return li;
  }

  private renderTrackContent(track: SpotifyTrack): string {
    return `
      <div class="spotify-result-content flex items-center gap-phi-md px-phi-md py-phi-sm cursor-pointer hover:bg-white/5 transition-colors">
        ${track.albumArtUrl ? `
          <img
            src="${track.albumArtUrl}"
            alt="Album cover"
            class="w-12 h-12 rounded object-cover"
            loading="lazy"
          />
        ` : `
          <div class="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-warm-cream/50">🎵</div>
        `}

        <div class="flex-1 min-w-0">
          <div class="spotify-track-title-artist text-warm-cream font-medium">
            <span class="spotify-track-title">${this.escapeHtml(track.title)}</span>
            <span class="spotify-track-separator"> - </span>
            <span class="spotify-track-artist">${this.escapeHtml(track.artist)}</span>
          </div>
          <div class="spotify-track-year text-metallic-silver/70 text-sm">${track.year}</div>
        </div>

        <div class="spotify-track-actions flex gap-2">
          ${track.previewUrl ? `
            <button
              type="button"
              class="spotify-play-button w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
              title="Play preview"
              data-preview-url="${track.previewUrl}"
            >
              ▶
            </button>
          ` : ''}

          <button
            type="button"
            class="spotify-open-button w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
            title="Open in Spotify"
            data-spotify-url="${track.spotifyUrl}"
          >
            🎧
          </button>
        </div>
      </div>
    `;
  }

  private scrollResultsToTop(): void {
    if (this.resultsList) {
      this.resultsList.scrollTop = 0;
    }
  }

  private calculateDropdownPosition(): void {
    if (!this.resultsList || !this.searchInput) return;

    const inputRect = this.searchInput.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Estimate dropdown height (max 320px or 80% viewport)
    const maxDropdownHeight = Math.min(320, viewportHeight * 0.8);

    // Check if dropdown would be clipped at bottom
    const spaceBelow = viewportHeight - inputRect.bottom - 20; // 20px buffer
    const shouldShowAbove = spaceBelow < maxDropdownHeight && inputRect.top > maxDropdownHeight;

    // Reset positioning styles
    this.resultsList.style.top = '';
    this.resultsList.style.bottom = '';
    this.resultsList.style.left = '';
    this.resultsList.style.right = '';
    this.resultsList.style.position = '';

    // Check for mobile viewport
    const isMobile = viewportWidth <= 768;

    if (isMobile) {
      // Mobile: use fixed positioning with full width
      this.resultsList.style.position = 'fixed';
      this.resultsList.style.left = '1rem';
      this.resultsList.style.right = '1rem';
      this.resultsList.style.maxHeight = '50vh';

      if (shouldShowAbove) {
        this.resultsList.style.bottom = `${viewportHeight - inputRect.top}px`;
      } else {
        this.resultsList.style.top = `${inputRect.bottom}px`;
      }
    } else {
      // Desktop: enhanced positioning
      const isInModal = this.isInsideModal();

      // Calculate available space and set max height first
      const availableHeight = shouldShowAbove
        ? Math.min(inputRect.top - 20, maxDropdownHeight)
        : Math.min(spaceBelow, maxDropdownHeight);

      this.resultsList.style.maxHeight = `${availableHeight}px`;
      this.resultsList.style.zIndex = '999';

      // Prefer relative positioning for viewport-aware behavior
      // Only use fixed positioning when dropdown would be significantly clipped
      const canUseRelativePositioning = !isInModal ||
        this.canDropdownFitWithinModal(availableHeight) ||
        shouldShowAbove; // Always use relative positioning when showing above

      if (canUseRelativePositioning) {
        // Use relative positioning (absolute within container)
        this.resultsList.style.position = 'absolute';
        this.resultsList.style.left = '0';
        this.resultsList.style.right = '0';

        if (shouldShowAbove) {
          this.resultsList.style.bottom = '100%';
          this.resultsList.style.top = 'auto';
        } else {
          this.resultsList.style.top = '100%';
          this.resultsList.style.bottom = 'auto';
        }
      } else {
        // Use fixed positioning to break out of modal
        this.resultsList.style.position = 'fixed';
        this.resultsList.style.left = `${inputRect.left}px`;
        this.resultsList.style.width = `${inputRect.width}px`;

        if (shouldShowAbove) {
          this.resultsList.style.bottom = `${viewportHeight - inputRect.top}px`;
        } else {
          this.resultsList.style.top = `${inputRect.bottom}px`;
        }
      }
    }
  }

  private isInsideModal(): boolean {
    let element: Element | null = this.container;
    while (element && element !== document.body) {
      if (element.id === 'rsvp-modal' ||
          element.classList.contains('modal') ||
          element.classList.contains('overflow-hidden')) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }

  private canDropdownFitWithinModal(dropdownHeight: number): boolean {
    // For testing and simple cases, prefer relative positioning
    // In complex modal scenarios, we may need fixed positioning
    const modalContainer = this.findModalContainer();
    if (!modalContainer) return true;

    const modalRect = modalContainer.getBoundingClientRect();
    const inputRect = this.searchInput.getBoundingClientRect();

    // Check if dropdown would extend beyond modal boundaries
    const dropdownBottom = inputRect.bottom + dropdownHeight;
    const modalBottom = modalRect.bottom;

    return dropdownBottom <= modalBottom + 50; // 50px tolerance
  }

  private findModalContainer(): Element | null {
    let element: Element | null = this.container;
    while (element && element !== document.body) {
      if (element.id === 'rsvp-modal' ||
          element.classList.contains('modal') ||
          element.classList.contains('overflow-hidden')) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  private updateAriaAttributes(): void {
    this.searchInput.setAttribute('aria-expanded', this.state.isOpen.toString());

    if (this.state.highlightedIndex >= 0 && this.state.highlightedIndex < this.state.results.length) {
      const track = this.state.results[this.state.highlightedIndex];
      this.searchInput.setAttribute('aria-activedescendant', `spotify-option-${track.id}`);
    } else {
      this.searchInput.removeAttribute('aria-activedescendant');
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public getState(): SearchState {
    return { ...this.state };
  }
}