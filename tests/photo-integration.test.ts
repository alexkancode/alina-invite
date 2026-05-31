import { test, expect } from '@playwright/test';

// Integration Tests for Dynamic Photo System
test.describe('Photo Integration System', () => {

  test.describe('API Endpoints', () => {

    test('disco-ball endpoint returns valid photos', async ({ request }) => {
      const response = await request.get('/api/photos/disco-ball?count=10');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.photos).toBeDefined();
      expect(Array.isArray(data.photos)).toBe(true);
      expect(data.photos.length).toBeGreaterThan(0);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.source).toMatch(/^(dynamic|fallback)$/);
    });

    test('minigame endpoint returns valid photos', async ({ request }) => {
      const response = await request.get('/api/photos/minigame?count=8');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.photos).toBeDefined();
      expect(Array.isArray(data.photos)).toBe(true);
      expect(data.photos.length).toBeGreaterThan(0);
      expect(data.metadata).toBeDefined();
      expect(['dynamic', 'fallback']).toContain(data.metadata.source);
    });

    test('validates game type parameter', async ({ request }) => {
      const response = await request.get('/api/photos/invalid-game?count=5');
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid game type');
    });

    test('validates count parameter bounds', async ({ request }) => {
      const tooManyResponse = await request.get('/api/photos/disco-ball?count=150');
      expect(tooManyResponse.status()).toBe(400);

      const tooFewResponse = await request.get('/api/photos/disco-ball?count=0');
      expect(tooFewResponse.status()).toBe(400);
    });

    test('supports different selection strategies', async ({ request }) => {
      const strategies = ['balanced', 'prefer-user', 'random'];

      for (const strategy of strategies) {
        const response = await request.get(`/api/photos/disco-ball?count=5&strategy=${strategy}`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.metadata.strategy).toBe(strategy);
      }
    });

    test('includes photo type metadata', async ({ request }) => {
      const response = await request.get('/api/photos/disco-ball?count=10');
      const data = await response.json();

      expect(typeof data.metadata.userPhotos).toBe('number');
      expect(typeof data.metadata.originalPhotos).toBe('number');
      expect(data.metadata.userPhotos).toBeGreaterThanOrEqual(0);
      expect(data.metadata.originalPhotos).toBeGreaterThanOrEqual(0);

      // If dynamic, should have admin photos info
      if (data.metadata.source === 'dynamic') {
        expect(typeof data.metadata.adminPhotos).toBe('number');
        expect(data.metadata.adminPhotos).toBeGreaterThanOrEqual(0);
      }
    });

  });

  test.describe('Frontend Integration', () => {

    test('disco ball loads with dynamic photos', async ({ page }) => {
      await page.goto('/');

      // Wait for disco ball to be built
      await page.waitForTimeout(2000);

      // Check console for dynamic photo loading message
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      await page.reload();
      await page.waitForTimeout(2000);

      const dynamicPhotoLog = consoleLogs.find(log =>
        log.includes('Disco Ball: Using') && log.includes('photos')
      );
      expect(dynamicPhotoLog).toBeDefined();

      // Verify disco ball container exists and has photo tiles
      const discoBall = page.locator('#discoBall');
      await expect(discoBall).toBeVisible();

      const photoTiles = page.locator('#discoBall .mirror-tile').filter({
        has: page.locator('[style*="background-image"]')
      });
      await expect(photoTiles.first()).toBeVisible();
    });

    test('tile game loads with dynamic photos', async ({ page }) => {
      await page.goto('/');

      // Open tile game
      await page.locator('#disco-ball-click').click();
      await page.waitForSelector('#game-modal');

      // Check console for dynamic photo loading
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      // Start a game to trigger photo loading
      await page.locator('[data-diff="medium"]').click();
      await page.waitForTimeout(1000);

      const dynamicPhotoLog = consoleLogs.find(log =>
        log.includes('Tile Game: Using') && log.includes('photos')
      );
      expect(dynamicPhotoLog).toBeDefined();

      // Verify game tiles exist
      const gameTiles = page.locator('#game-board .tile');
      await expect(gameTiles.first()).toBeVisible();
    });

    test('handles API failures gracefully', async ({ page }) => {
      // Mock API failure by intercepting requests
      await page.route('/api/photos/**', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'Service unavailable' })
        });
      });

      await page.goto('/');

      // Check console for fallback messages
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      await page.waitForTimeout(3000);

      const fallbackLog = consoleLogs.find(log =>
        log.includes('using static fallback') || log.includes('fallback')
      );
      expect(fallbackLog).toBeDefined();

      // Disco ball should still work with static photos
      const discoBall = page.locator('#discoBall');
      await expect(discoBall).toBeVisible();
    });

  });

  test.describe('Admin Gallery Integration', () => {

    test('admin gallery photo selection works', async ({ page }) => {
      await page.goto('/admin?password=admin123');
      await page.waitForLoadState('networkidle');

      // Wait for photos to load
      await page.waitForSelector('.photo-card', { timeout: 10000 });

      // Test photo selection
      await page.locator('#selectModeBtn').click();

      // Try to click a photo (should not error)
      const selectablePhoto = page.locator('.photo-card.selectable').first();
      if (await selectablePhoto.count() > 0) {
        await selectablePhoto.click();

        // Check that photo got selected
        await expect(selectablePhoto).toHaveClass(/selected/);
      }
    });

    test('admin gallery displays folder information', async ({ page }) => {
      await page.goto('/admin?password=admin123');
      await page.waitForSelector('.photo-card');

      // Check that folder overlays are present
      const folderOverlays = page.locator('.photo-folder');
      await expect(folderOverlays.first()).toBeVisible();

      // Check that resolution overlays are present
      const resolutionOverlays = page.locator('.photo-resolution');
      await expect(resolutionOverlays.first()).toBeVisible();
    });

  });

  test.describe('Photo Upload Integration', () => {

    test('admin upload page loads correctly', async ({ page }) => {
      await page.goto('/admin/upload?password=admin123');

      // Check upload interface elements
      await expect(page.locator('.upload-area')).toBeVisible();
      await expect(page.locator('#fileInput')).toBeAttached();
    });

    test('upload area responds to drag and drop simulation', async ({ page }) => {
      await page.goto('/admin/upload?password=admin123');

      const uploadArea = page.locator('.upload-area');
      await expect(uploadArea).toBeVisible();

      // Simulate drag enter
      await uploadArea.dispatchEvent('dragenter');
      await expect(uploadArea).toHaveClass(/drag-over/);

      // Simulate drag leave
      await uploadArea.dispatchEvent('dragleave');
    });

  });

  test.describe('Performance Tests', () => {

    test('photo API responds within reasonable time', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get('/api/photos/disco-ball?count=20');
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Under 2 seconds
    });

    test('admin gallery loads without performance issues', async ({ page }) => {
      await page.goto('/admin?password=admin123');

      // Measure load time
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation');
      });

      const loadTime = performanceEntries[0]?.loadEventEnd - performanceEntries[0]?.loadEventStart;
      expect(loadTime).toBeLessThan(5000); // Under 5 seconds
    });

  });

});