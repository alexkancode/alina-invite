const QUALIFIER_KEYWORDS =
  /\b(remaster(?:ed)?|version|edit|mix|remix|live|mono|stereo|single|radio|deluxe|anniversary|demo|bonus|re-?recorded|acoustic|instrumental|from)\b/i;

function stripTrailingGroup(title: string): string {
  const grouped = title.match(/^(.*?)\s*[([]([^()[\]]*)[)\]]\s*$/);
  if (grouped && QUALIFIER_KEYWORDS.test(grouped[2])) {
    return grouped[1];
  }

  const dashIndex = title.lastIndexOf(' - ');
  if (dashIndex > 0 && QUALIFIER_KEYWORDS.test(title.slice(dashIndex + 3))) {
    return title.slice(0, dashIndex);
  }

  return title;
}

export function succinctSongTitle(title: string): string {
  let result = title.trim();

  while (true) {
    const stripped = stripTrailingGroup(result).trim();
    if (stripped === result || stripped === '') {
      break;
    }
    result = stripped;
  }

  return result === '' ? title.trim() : result;
}
