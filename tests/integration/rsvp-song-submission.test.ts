import { describe, test, expect, beforeEach } from 'vitest';

const TEST_API_BASE = 'http://localhost:4321';

describe('RSVP Song Submission Integration', () => {
  const createFormData = (data: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  };

  test('RSVP submission with song data should save to database', async () => {
    const songData = {
      title: 'Test Song',
      artist: 'Test Artist',
      year: 2023,
      spotifyUrl: 'https://open.spotify.com/track/test123',
      spotifyId: 'test123'
    };

    const formData = createFormData({
      name: 'Integration Test User',
      attending: 'yes',
      message: 'Test RSVP with song',
      favoriteSong: JSON.stringify(songData)
    });

    const response = await fetch(`${TEST_API_BASE}/api/rsvp`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.entry.name).toBe('Integration Test User');
    expect(result.entry.favoriteSong).toMatchObject(songData);
  });

  test('RSVP submission without song data should work', async () => {
    const formData = createFormData({
      name: 'No Song User',
      attending: 'yes',
      message: 'Test RSVP without song'
    });

    const response = await fetch(`${TEST_API_BASE}/api/rsvp`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.entry.name).toBe('No Song User');
    expect(result.entry.favoriteSong).toBeNull();
  });

  test('RSVP submission with malformed song JSON should handle gracefully', async () => {
    const formData = createFormData({
      name: 'Malformed JSON User',
      attending: 'yes',
      message: 'Test with bad JSON',
      favoriteSong: 'invalid-json{'
    });

    const response = await fetch(`${TEST_API_BASE}/api/rsvp`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.entry.favoriteSong).toBeNull();
  });

  test('saved RSVP should appear in GET list with song data', async () => {
    // First submit an RSVP with song data
    const songData = {
      title: 'List Test Song',
      artist: 'List Test Artist',
      year: 2023,
      spotifyUrl: 'https://open.spotify.com/track/listtest',
      spotifyId: 'listtest'
    };

    const formData = createFormData({
      name: 'List Test User',
      attending: 'yes',
      favoriteSong: JSON.stringify(songData)
    });

    await fetch(`${TEST_API_BASE}/api/rsvp`, {
      method: 'POST',
      body: formData
    });

    // Then check if it appears in the list
    const listResponse = await fetch(`${TEST_API_BASE}/api/rsvp`);
    expect(listResponse.status).toBe(200);

    const listResult = await listResponse.json();
    expect(listResult.rsvps).toBeInstanceOf(Array);

    // Find our test RSVP
    const testRsvp = listResult.rsvps.find((rsvp: any) => rsvp.name === 'List Test User');
    expect(testRsvp).toBeDefined();
    expect(testRsvp.song_title).toBe('List Test Song');
    expect(testRsvp.song_artist).toBe('List Test Artist');
  });
});