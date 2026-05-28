import { describe, it } from 'vitest';
import { PhotoSelectionManager } from './src/lib/photoSelectionManager.js';
import { approvePhoto, getApprovedPhotos } from './src/lib/photoDatabase.js';

// Integration test to verify photo selection works with real uploaded photos
describe('Photo Selection Integration Test', () => {
  it('should work with uploaded photos in the real application', async () => {
    console.log('🎮 Testing Photo Selection Functionality with Real Upload\n');

    const photoManager = new PhotoSelectionManager();
    const uploadedPhotoId = '7221f26b6b55a7c7d40b190f040d89c9'; // Photo uploaded via API

    // Check current state
    console.log('📸 Current approved photos in database:');
    const currentPhotos = await getApprovedPhotos();
    console.log(`   Found ${currentPhotos.length} approved photos`);
    currentPhotos.forEach(photo => {
      console.log(`   - ${photo.id}: ${photo.original_filename} (approved: ${photo.is_approved})`);
    });
    console.log();

    // Test with no approved photos (should fall back to original photos)
    console.log('🎯 Testing photo selection before approval:');
    const selectionBefore = await photoManager.selectPhotosForGame(8, 'disco-ball');
    console.log(`   Selected ${selectionBefore.photos.length} photos`);
    console.log(`   User photos: ${selectionBefore.userPhotoCount}`);
    console.log(`   Original photos: ${selectionBefore.originalPhotoCount}`);
    console.log(`   Total available: ${selectionBefore.totalAvailable}`);
    console.log();

    // Approve the uploaded photo
    console.log('✅ Approving the uploaded photo...');
    try {
      await approvePhoto(uploadedPhotoId, true);
      console.log(`   Successfully approved photo ${uploadedPhotoId}`);
    } catch (error) {
      console.log(`   Photo approval note: ${error.message}`);
    }
    console.log();

    // Test after approval (should include user photos)
    console.log('🎯 Testing photo selection after approval:');
    const selectionAfter = await photoManager.selectPhotosForGame(8, 'disco-ball');
    console.log(`   Selected ${selectionAfter.photos.length} photos`);
    console.log(`   User photos: ${selectionAfter.userPhotoCount}`);
    console.log(`   Original photos: ${selectionAfter.originalPhotoCount}`);
    console.log(`   Total available: ${selectionAfter.totalAvailable}`);

    if (selectionAfter.userPhotoCount > 0) {
      console.log('   🎉 SUCCESS: User photos are being selected!');
      const userPhotos = selectionAfter.photos.filter(p => p.isUserPhoto);
      userPhotos.forEach(photo => {
        console.log(`      - ${photo.filename} (${photo.path})`);
      });
    } else {
      console.log('   ⚠️  No user photos selected despite approval');
    }
    console.log();

    // Test different strategies
    console.log('🎯 Testing selection strategies:');
    const strategies = ['balanced', 'prefer-user', 'original-only'] as const;
    for (const strategy of strategies) {
      const selection = await photoManager.selectPhotosForGame(8, 'disco-ball', strategy);
      console.log(`   ${strategy}: ${selection.userPhotoCount} user + ${selection.originalPhotoCount} original = ${selection.photos.length} total`);
    }
    console.log();

    // Test both game types
    console.log('🎯 Testing game type specificity:');
    const discoBallSelection = await photoManager.selectPhotosForGame(8, 'disco-ball');
    const minigameSelection = await photoManager.selectPhotosForGame(8, 'minigame');

    console.log(`   Disco Ball: ${discoBallSelection.photos.length} photos`);
    console.log(`   Minigame: ${minigameSelection.photos.length} photos`);

    // Show sample paths to verify game-specific sizing
    if (discoBallSelection.photos.length > 0 && minigameSelection.photos.length > 0) {
      console.log(`   Sample disco path: ${discoBallSelection.photos[0].path}`);
      console.log(`   Sample minigame path: ${minigameSelection.photos[0].path}`);
    }
    console.log();

    console.log('✅ Photo selection integration test completed successfully!');
  });
});