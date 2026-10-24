const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Starting Anti-Crop & Safe Margin multi-view verification...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Switch to Character Studio
  console.log('👉 Navigating to Character Studio...');
  const charStudioBtn = page.locator('.studio-workspace-bar .sw-btn:has-text("Scheda Personaggio")');
  await charStudioBtn.click();
  await page.waitForTimeout(400);

  // 2. Select turnaround 4 views
  const turnaround4Btn = page.locator('.char-mode-btn:has-text("Turnaround 4 Viste")');
  await turnaround4Btn.click();
  await page.waitForTimeout(300);

  // 3. Add "Close-up face" so there are 5 views
  console.log('👉 Activating "Close-up face" chip to create 5 views...');
  const closeUpChip = page.locator('.char-view-chip:has-text("Close-up face")');
  await closeUpChip.click();
  await page.waitForTimeout(300);

  // 4. Verify views count badge and warning
  const countBadge = page.locator('.views-count-pill');
  const countText = await countBadge.innerText();
  console.log(`  Count badge text: "${countText}"`);
  if (!countText.includes('5')) {
    throw new Error(`Expected 5 views in count badge, got: ${countText}`);
  }

  // 5. Verify the Crowded Density Alert is visible!
  const alert = page.locator('.views-crowded-alert');
  await alert.waitFor({ state: 'visible', timeout: 5000 });
  const alertTitle = await alert.locator('.vca-title').innerText();
  console.log(`✔ Crowded views alert visible with title: "${alertTitle}"`);

  // Ensure Code tab is active
  await page.locator('.mode-btn:has-text("Prompt & Codice")').click();
  await page.waitForTimeout(200);

  // 6. Inspect compiled Gemini prompt for anti-crop directives
  await page.locator('button.tab:has-text("Gemini")').click();
  await page.waitForTimeout(200);
  const geminiPrompt = await page.locator('pre.code').innerText();
  console.log('  Checking Gemini prompt anti-crop directives...');
  if (!geminiPrompt.includes('SAFE CANVAS MARGINS') || !geminiPrompt.includes('ABSOLUTELY ZERO figures or faces cut in half')) {
    throw new Error('Gemini prompt missing anti-crop safe margin directives!');
  }
  if (!geminiPrompt.includes('uncropped, 100% complete headshot')) {
    throw new Error('Gemini prompt missing headshot complete containment directive!');
  }
  if (!geminiPrompt.includes('STRICT ANTI-CROPPING & SAFE BOUNDARIES')) {
    throw new Error('Gemini prompt missing anti-cropping negatives!');
  }
  console.log('✔ Gemini prompt compiles strict safe canvas margins and anti-crop directives!');

  // 7. Inspect compiled Midjourney prompt
  await page.locator('.other-models-select').selectOption('midjourney');
  await page.waitForTimeout(200);
  const mjPrompt = await page.locator('pre.code').innerText();
  if (!mjPrompt.includes('generous outer margins') || !mjPrompt.includes('cropped face, half face at border')) {
    throw new Error('Midjourney prompt missing safe margin tokens or --no anti-crop flags!');
  }
  console.log('✔ Midjourney prompt compiles safe margin tokens and --no anti-crop flags!');

  // 8. Inspect compiled FLUX prompt
  await page.locator('.other-models-select').selectOption('flux');
  await page.waitForTimeout(200);
  const fluxPrompt = await page.locator('pre.code').innerText();
  if (!fluxPrompt.includes('Safe canvas margins') || !fluxPrompt.includes('no cropped faces, no half faces at the edge')) {
    throw new Error('FLUX prompt missing safe canvas margin clause!');
  }
  console.log('✔ FLUX prompt compiles safe canvas margin clause!');

  // Capture screenshot of the Crowded Alert in Character Studio
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-crowded-views-alert.png'), fullPage: false });
  console.log('📸 Captured verify-crowded-views-alert.png');

  // 9. Click "[🎯 3 Viste Corpo + 1 Viso]" 1-click optimization button
  console.log('👉 Testing 1-click optimization to 3 Viste Corpo + 1 Viso...');
  const optBtn = page.locator('.btn-vca-opt:has-text("3 Viste Corpo + 1 Viso")');
  await optBtn.click();
  await page.waitForTimeout(400);

  // 10. Verify that views count is now 4 and alert is dismissed
  const newCount = await page.locator('.views-count-pill').innerText();
  console.log(`  New views count badge: "${newCount}"`);
  if (!newCount.includes('4')) {
    throw new Error(`Expected 4 views after optimization, got: ${newCount}`);
  }

  const alertAfterOpt = page.locator('.views-crowded-alert');
  const isAlertVisible = await alertAfterOpt.isVisible();
  if (isAlertVisible) {
    throw new Error('Crowded views alert should be dismissed when views count is 4!');
  }
  console.log('✔ 1-click optimization set 4 views (3 bodies + 1 face) and dismissed crowded alert!');

  // Capture screenshot after optimization
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-optimized-4-views.png'), fullPage: false });
  console.log('📸 Captured verify-optimized-4-views.png');

  console.log('🎉 ALL MULTI-VIEW & ANTI-CROP TESTS PASSED WITH 100% SUCCESS!');
  await browser.close();
})();
