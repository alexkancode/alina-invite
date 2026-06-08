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
  private debounceTimer: number | null = null;
  private currentRequestId: number = 0;

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

    if (!this.searchInput || !this.resultsList || !this.hiddenInput) {
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
        spotifyId: track.spotifyId
      });

      this.searchInput.value = `${track.title} - ${track.artist}`;
      this.setState({
        selectedTrack: track,
        isOpen: false,
        highlightedIndex: -1,
        results: []
      });
    } else {
      this.hiddenInput.value = '';
      this.searchInput.value = '';
      this.setState({ selectedTrack: null });
    }

    this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  public setState(partialState: Partial<SearchState>): void {
    this.state = { ...this.state, ...partialState };
    this.updateDOM();
    this.updateAriaAttributes();
  }

  private updateDOM(): void {
    this.resultsList.innerHTML = '';

    if (this.state.isOpen && this.state.results.length > 0) {
      this.state.results.forEach((track, index) => {
        const li = this.createResultItem(track, index);
        this.resultsList.appendChild(li);
      });
      this.resultsList.style.display = 'block';
    } else {
      this.resultsList.style.display = 'none';
    }
  }

  private createResultItem(track: SpotifyTrack, index: number): HTMLLIElement {
    const li = document.createElement('li');
    li.role = 'option';
    li.id = `spotify-option-${track.id}`;
    li.className = `spotify-result-item${index === this.state.highlightedIndex ? ' spotify-result-highlighted' : ''}`;
    li.setAttribute('data-track-id', track.id);

    li.innerHTML = `
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

    li.addEventListener('click', () => {
      this.selectTrack(track);
    });

    return li;
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