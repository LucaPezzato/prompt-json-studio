const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Starting Verification: fal.ai Integration & Model Profile Switcher...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify Quick Profile Switcher Bar in Output Panel
  console.log('👉 Checking Quick Profile Bar in Output Panel...');
  const quickBar = page.locator('.quick-profile-bar');
  await quickBar.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Quick Profile Switcher Bar is visible!');

  // Check chips
  const chips = quickBar.locator('.qpb-chip');
  const chipCount = await chips.count();
  console.log(`  Found ${chipCount} engine profiles in quick bar.`);
  if (chipCount < 5) {
    throw new Error(`Expected at least 5 profiles, found ${chipCount}`);
  }

  // 2. Test switching profiles "al volo"
  console.log('👉 Testing switching to "FLUX.1 [dev]" on the fly...');
  const fluxDevChip = quickBar.locator('.qpb-chip:has-text("FLUX.1 [dev]")');
  await fluxDevChip.click();
  await page.waitForTimeout(300);

  // Verify active engine button updated
  const engineBtnText = await page.locator('.btn-config-engine .cfg-text').innerText();
  console.log(`  Active engine label: "${engineBtnText}"`);
  if (!engineBtnText.includes('FLUX.1 [dev]')) {
    throw new Error(`Expected active engine FLUX.1 [dev], got: ${engineBtnText}`);
  }
  console.log('✔ Successfully switched to FLUX.1 [dev] on the fly!');

  // Switch back to "FLUX Realism" (AI Influencer top choice)
  console.log('👉 Testing switching to "FLUX Realism (AI Influencer)" on the fly...');
  const realismChip = quickBar.locator('.qpb-chip:has-text("FLUX Realism")');
  await realismChip.click();
  await page.waitForTimeout(300);

  const realismLabel = await page.locator('.btn-config-engine .cfg-text').innerText();
  console.log(`  Active engine label: "${realismLabel}"`);
  if (!realismLabel.includes('FLUX Realism')) {
    throw new Error(`Expected active engine FLUX Realism, got: ${realismLabel}`);
  }
  console.log('✔ Successfully switched to FLUX Realism on the fly!');

  // 3. Open Configuration Modal
  console.log('👉 Opening AI Models & API Keys modal...');
  await page.locator('.btn-config-engine').click();
  await page.waitForTimeout(400);

  const modal = page.locator('app-modal[title*="Motori AI"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Modal opened!');

  // 4. Test Tab 2: API Keys Management & Live fal.ai key verification
  console.log('👉 Navigating to API Keys tab...');
  await modal.locator('.mtab-btn:has-text("Gestione Chiavi API")').click();
  await page.waitForTimeout(300);

  // Check that fal.ai input has the key pre-filled
  const falInputVal = await modal.locator('.key-card:has-text("fal.ai") input').inputValue();
  console.log(`  fal.ai key present: ${falInputVal.startsWith('fal_sk_') ? 'YES (' + falInputVal.slice(0, 15) + '...)' : 'NO'}`);
  if (!falInputVal.startsWith('fal_sk_')) {
    throw new Error('fal.ai key was not pre-filled in configuration!');
  }

  // Click live verify button
  console.log('👉 Testing live connection to fal.ai API with user key...');
  const verifyBtn = modal.locator('button:has-text("Verifica Chiave")');
  await verifyBtn.click();

  // Wait for result feedback box to finish loading
  const feedbackBox = modal.locator('.key-test-feedback:not(:has-text("in corso"))');
  await feedbackBox.waitFor({ state: 'visible', timeout: 10000 });
  const feedbackText = await feedbackBox.innerText();
  console.log(`  Live fal.ai API verification result: "${feedbackText}"`);
  if (!feedbackText.includes('Connessione fal.ai verificata') || !feedbackText.includes('Luca Pezzato')) {
    throw new Error(`fal.ai live verification failed: ${feedbackText}`);
  }
  console.log('✔ fal.ai API Key verified live with 100% success!');

  // 5. Test Tab 3: Create Custom Profile (e.g. AI Influencer LoRA)
  console.log('👉 Navigating to "Nuovo Profilo Modello" tab...');
  await modal.locator('.mtab-btn:has-text("Nuovo Profilo Modello")').click();
  await page.waitForTimeout(300);

  await modal.locator('input[placeholder*="Sofia AI"]').fill('Sofia AI - Influencer LoRA');
  await modal.locator('input[placeholder*="fal-ai/flux-realism"]').fill('fal-ai/flux-lora');
  await modal.locator('input[placeholder*="https://v3.fal.media"]').fill('https://v3.fal.media/files/influencer/sofia_lora.safetensors');
  await modal.locator('button:has-text("Salva Profilo")').click();
  await page.waitForTimeout(500);

  // Verify new profile is active in quick bar
  const customChip = quickBar.locator('.qpb-chip:has-text("Sofia AI")');
  await customChip.waitFor({ state: 'visible', timeout: 3000 });
  console.log('✔ Custom AI Influencer LoRA profile created, saved, and active in Quick Bar!');

  // Capture screenshot of quick bar & modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-fal-profiles-and-quick-switch.png'), fullPage: false });
  console.log('📸 Captured verify-fal-profiles-and-quick-switch.png');

  console.log('🎉 ALL FAL.AI & MODEL PROFILE SWITCHER TESTS PASSED WITH 100% SUCCESS!');
  await browser.close();
})();
