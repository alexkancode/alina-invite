import { describe, expect, test } from 'vitest';
import { succinctSongTitle } from '../../src/lib/songTitle';

describe('succinctSongTitle', () => {
  test.each([
    ['Bohemian Rhapsody - Remastered 2011', 'Bohemian Rhapsody'],
    ['Le Freak - 2018 Remaster', 'Le Freak'],
    ['Dancing Queen - Single Version', 'Dancing Queen'],
    ['Stayin\' Alive - Radio Edit', 'Stayin\' Alive'],
    ['Good Times - Live', 'Good Times'],
    ['September (2009 Remaster)', 'September'],
    ['Heart of Glass [Special Mix]', 'Heart of Glass'],
    ['Disco Inferno (Single Edit)', 'Disco Inferno'],
    ['Night Fever - From "Saturday Night Fever"', 'Night Fever'],
    ['Funky Town - Mono Version', 'Funky Town'],
    ['Song - Live - 2011 Remaster', 'Song'],
    ['Track (Live) [2020 Remix]', 'Track'],
    ['I Will Survive - Re-Recorded', 'I Will Survive'],
    ['Hot Stuff - Acoustic', 'Hot Stuff'],
    ['Y.M.C.A. - Instrumental', 'Y.M.C.A.']
  ])('strips the qualifier: %s -> %s', (input, expected) => {
    expect(succinctSongTitle(input)).toBe(expected);
  });

  test.each([
    ['Dancing Queen'],
    ['Rocket Man (I Think It\'s Going to Be a Long, Long Time)'],
    ['Ob-La-Di, Ob-La-Da'],
    ['(Shake, Shake, Shake) Shake Your Booty'],
    ['Mix Tape'],
    ['The Remix'],
    ['Living for the City'],
    ['Ain\'t No Stoppin\' Us Now']
  ])('leaves a clean title untouched: %s', (input) => {
    expect(succinctSongTitle(input)).toBe(input);
  });

  test('a qualifier-only title is left as-is rather than emptied', () => {
    expect(succinctSongTitle('Remix')).toBe('Remix');
    expect(succinctSongTitle('(Live)')).toBe('(Live)');
  });

  test('whitespace around the result is trimmed', () => {
    expect(succinctSongTitle('  Le Freak - 2018 Remaster  ')).toBe('Le Freak');
  });
});
