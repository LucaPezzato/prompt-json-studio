const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Verifying Profile Deletion & Restoration...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Open AI Settings modal
  console.log('👉 Opening AI Settings modal...');
  await page.locator('.btn-config-engine').click();
  await page.waitForTimeout(400);

  const modal = page.locator('app-modal[title*="Generatore Immagini"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // 2. Count initial profiles
  const initialCards = modal.locator('.profile-card');
  const initialCount = await initialCards.count();
  console.log(`  Initial profiles count: ${initialCount}`);

  // Check ComfyUI card has delete button
  const comfyCard = modal.locator('.profile-card:has-text("ComfyUI")');
  await comfyCard.waitFor({ state: 'visible', timeout: 3000 });
  const deleteBtn = comfyCard.locator('button:has-text("Elimina")');
  if (await deleteBtn.count() === 0) {
    throw new Error('Delete button 🗑️ Elimina not found on ComfyUI card!');
  }
  console.log('✔ Delete button 🗑️ Elimina is visible on model card!');

  // 3. Delete ComfyUI profile
  console.log('👉 Deleting ComfyUI profile...');
  await deleteBtn.click();
  await page.waitForTimeout(400);

  const afterDeleteCount = await modal.locator('.profile-card').count();
  console.log(`  Profiles count after deletion: ${afterDeleteCount}`);
  if (afterDeleteCount !== initialCount - 1) {
    throw new Error(`Expected count ${initialCount - 1}, got ${afterDeleteCount}`);
  }
  console.log('✔ ComfyUI successfully deleted from list!');

  // Also delete OpenAI DALL-E 3
  console.log('👉 Deleting OpenAI DALL-E 3 profile...');
  const dalleCard = modal.locator('.profile-card:has-text("DALL-E 3")');
  await dalleCard.locator('button:has-text("Elimina")').click();
  await page.waitForTimeout(400);

  const afterSecondDelete = await modal.locator('.profile-card').count();
  console.log(`  Profiles count after second delete: ${afterSecondDelete}`);
  if (afterSecondDelete !== initialCount - 2) {
    throw new Error(`Expected count ${initialCount - 2}, got ${afterSecondDelete}`);
  }

  // Close modal
  await modal.locator('button:has-text("Chiudi")').click();
  await page.waitForTimeout(400);

  // 4. Verify quick switcher bar no longer has deleted models
  const quickChips = await page.locator('.quick-profile-bar .qpb-chip').allInnerTexts();
  console.log(`  Quick bar chips after deletion: ${quickChips.join(' | ')}`);
  if (quickChips.some(c => c.includes('ComfyUI') || c.includes('DALL-E'))) {
    throw new Error('Deleted models still present in quick switcher bar!');
  }
  console.log('✔ Quick bar reflects deleted models on the fly!');

  // 5. Reload page to verify persistence
  console.log('👉 Reloading page to verify persistence of deleted state...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const reloadedChips = await page.locator('.quick-profile-bar .qpb-chip').allInnerTexts();
  console.log(`  Quick bar chips after reload: ${reloadedChips.join(' | ')}`);
  if (reloadedChips.some(c => c.includes('ComfyUI') || c.includes('DALL-E'))) {
    throw new Error('Deleted models reappeared after page reload!');
  }
  console.log('✔ Persistence verified: deleted models do NOT reappear on reload!');

  // 6. Test Reset Default Profiles button
  console.log('👉 Opening modal to test "Ripristina Predefiniti"...');
  await page.locator('.btn-config-engine').click();
  await page.waitForTimeout(400);

  const resetBtn = modal.locator('button:has-text("Ripristina Predefiniti")');
  await resetBtn.click();
  await page.waitForTimeout(400);

  const restoredCount = await modal.locator('.profile-card').count();
  console.log(`  Profiles count after restoring defaults: ${restoredCount}`);
  if (restoredCount !== initialCount) {
    throw new Error(`Expected ${initialCount} profiles after reset, got ${restoredCount}`);
  }
  console.log('✔ All default models successfully restored!');

  // Capture screenshot of profile cards with delete buttons
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-delete-profiles.png'), fullPage: false });
  console.log('📸 Captured verify-delete-profiles.png');

  console.log('🎉 ALL PROFILE DELETION & RESTORATION CHECKS PASSED WITH 100% SUCCESS!');
  await browser.close();
})();
