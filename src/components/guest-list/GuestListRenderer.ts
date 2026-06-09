export interface GuestRsvp {
  name: string;
  attending: string;
  song_title?: string | null;
  song_artist?: string | null;
  song_spotify_id?: string | null;
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

function renderStatus(attending: string): string {
  return attending === 'yes'
    ? '<span class="guest-status-going text-phi-xs">Going ✓</span>'
    : '<span class="guest-status-not-going text-phi-xs">Not going</span>';
}

function renderSongRow(guest: GuestRsvp): string {
  if (!guest.song_title || !guest.song_artist) {
    return '';
  }

  return `
    <div class="guest-song-row">
      <span class="guest-song-line text-phi-xs">♪ ${escapeHtml(guest.song_title)} - ${escapeHtml(guest.song_artist)}</span>
      <button
        type="button"
        class="guest-song-play"
        title="Play preview"
        data-track-id="${escapeHtml(trackIdFor(guest))}"
        data-title="${escapeHtml(guest.song_title)}"
        data-artist="${escapeHtml(guest.song_artist)}"
      >▶</button>
    </div>
  `;
}

export function renderGuestEntries(rsvps: GuestRsvp[]): string {
  return rsvps.map(guest => `
    <div class="guest-entry flex flex-col items-center text-center px-phi-md py-phi-sm rounded-lg">
      <span class="guest-name font-medium text-phi-sm">${escapeHtml(guest.name)}</span>
      ${renderStatus(guest.attending)}
      ${renderSongRow(guest)}
    </div>
  `).join('');
}
