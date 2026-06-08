export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  year: number;
  albumArtUrl?: string;
  previewUrl?: string;
  spotifyUrl: string;
  spotifyId: string;
}

export interface SpotifyComboboxProps {
  name: string;
  defaultValue?: SpotifyTrack | null;
  onSelectionChange?: (track: SpotifyTrack | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface SearchState {
  query: string;
  results: SpotifyTrack[];
  isLoading: boolean;
  isOpen: boolean;
  highlightedIndex: number;
  selectedTrack: SpotifyTrack | null;
}

export interface KeyboardNavigationState {
  highlightedIndex: number;
  isOpen: boolean;
  results: SpotifyTrack[];
}

export interface AudioPreviewState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  audio: HTMLAudioElement | null;
}

export interface AriaState {
  expanded: boolean;
  activeDescendant: string | null;
  resultCount: number;
}

export type KeyboardEventHandler = (event: KeyboardEvent) => void;
export type SearchEventHandler = (query: string) => Promise<void>;
export type SelectionEventHandler = (track: SpotifyTrack) => void;
export type PlayEventHandler = (track: SpotifyTrack) => Promise<void>;