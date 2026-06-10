import { succinctSongTitle } from '../../lib/songTitle.js';

export interface GuestRsvp {
  name: string;
  attending: string;
  song_title?: string | null;
  song_artist?: string | null;
  song_spotify_id?: string | null;
  song_album_art_url?: string | null;
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ESCAPE_MAP[ch]);
}

function trackIdFor(guest: GuestRsvp): string {
  if (guest.song_spotify_id) {
    return guest.song_spotify_id;
  }
  return `guest-${guest.name}-${guest.song_title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function renderStatusMark(attending: string): string {
  return attending === 'yes'
    ? '<span class="guest-status-mark guest-status-going">✓</span>'
    : '<span class="guest-status-mark guest-status-not-going">✗</span>';
}

function renderSongRow(guest: GuestRsvp): string {
  if (!guest.song_title || !guest.song_artist) {
    return '';
  }

  return `
    <div class="guest-song-row">
      <span class="guest-song-line text-phi-xs">♪ ${escapeHtml(succinctSongTitle(guest.song_title))}</span>
      <button
        type="button"
        class="guest-song-play preview-icon-button"
        title="Play preview"
        data-track-id="${escapeHtml(trackIdFor(guest))}"
        data-title="${escapeHtml(guest.song_title)}"
        data-artist="${escapeHtml(guest.song_artist)}"
      >▶</button>
    </div>
  `;
}

export function isDeferredGuest(guest: GuestRsvp): boolean {
  return guest.attending !== 'yes' && !(guest.song_title && guest.song_artist);
}

function entryArt(guest: GuestRsvp): { className: string; styleAttribute: string } {
  if (!guest.song_album_art_url) {
    return { className: '', styleAttribute: '' };
  }

  const safeUrl = guest.song_album_art_url.replace(/["'()\\]/g, '');
  return {
    className: ' guest-entry-art',
    styleAttribute: ` style="--album-art: url(&quot;${escapeHtml(safeUrl)}&quot;)"`
  };
}

export function renderGuestEntries(rsvps: GuestRsvp[]): string {
  return rsvps.map(guest => {
    const art = entryArt(guest);
    const deferred = isDeferredGuest(guest) ? ' guest-entry-deferred' : '';
    return `
    <div class="guest-entry${art.className}${deferred} flex flex-col items-center text-center px-phi-md py-phi-sm rounded-lg"${art.styleAttribute}>
      <span class="guest-name-row">
        <span class="guest-name font-medium text-phi-sm">${escapeHtml(guest.name)}</span>
        ${renderStatusMark(guest.attending)}
      </span>
      ${renderSongRow(guest)}
    </div>
  `;
  }).join('');
}
