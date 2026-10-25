const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Verifying Character Sheet Grounding references in compiled prompts...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('1. Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // 2. Switch to Character Studio Mode
  console.log('2. Switching to Character Studio Mode...');
  const charStudioBtn = page.locator('.studio-workspace-bar .sw-btn:has-text("Scheda Personaggio")').first();
  await charStudioBtn.waitFor({ state: 'visible', timeout: 5000 });
  await charStudioBtn.click();
  await page.waitForTimeout(500);

  // 3. Click Hero CTA to use this character in a scene
  console.log('3. Clicking "Usa questo personaggio in una Scena"...');
  const heroSceneBtn = page.locator('.btn-hero-scene').first();
  await heroSceneBtn.waitFor({ state: 'visible', timeout: 5000 });
  await heroSceneBtn.click();
  await page.waitForTimeout(500);

  // 4. Switch to Prompt & Codice view mode in Output Panel
  console.log('4. Switching to Prompt & Codice view...');
  const promptModeBtn = page.locator('.panel-mode-switcher .mode-btn:has-text("Prompt & Codice")');
  await promptModeBtn.waitFor({ state: 'visible', timeout: 5000 });
  await promptModeBtn.click();
  await page.waitForTimeout(400);

  // 5. Check FLUX option in other-models-select
  console.log('5. Selecting FLUX in other-models dropdown...');
  const otherSelect = page.locator('select.other-models-select');
  await otherSelect.waitFor({ state: 'visible', timeout: 5000 });
  await otherSelect.selectOption('flux');
  await page.waitForTimeout(400);

  const fluxPromptText = await page.locator('pre.code').innerText();
  console.log(`FLUX Prompt snippet: "${fluxPromptText.slice(0, 320)}..."`);

  if (!fluxPromptText.includes('Character Sheet Grounding') && !fluxPromptText.includes('character model sheet')) {
    throw new Error('Character Sheet Grounding reference missing from FLUX prompt!');
  }
  console.log('✔ FLUX prompt contains explicit Character Sheet Grounding directive!');

  // 6. Check Midjourney in other-models dropdown
  console.log('6. Selecting Midjourney in other-models dropdown...');
  await otherSelect.selectOption('midjourney');
  await page.waitForTimeout(400);

  const mjPromptText = await page.locator('pre.code').innerText();
  console.log(`Midjourney Prompt snippet: "${mjPromptText.slice(0, 320)}..."`);

  if (!mjPromptText.includes('character model sheet') && !mjPromptText.includes('turnaround sheet')) {
    throw new Error('Character Sheet reference missing from Midjourney prompt!');
  }
  console.log('✔ Midjourney prompt contains explicit character model sheet tokens!');

  // 7. Check Gemini / GPT-4o Tab
  console.log('7. Checking Gemini / GPT-4o Tab prompt...');
  const gptTab = page.locator('.tabs button.tab:has-text("Gemini")');
  await gptTab.waitFor({ state: 'visible', timeout: 5000 });
  await gptTab.click();
  await page.waitForTimeout(400);

  const gptPromptText = await page.locator('pre.code').innerText();
  console.log(`Gemini Prompt snippet: "${gptPromptText.slice(0, 320)}..."`);

  if (!gptPromptText.includes('GROUNDING') && !gptPromptText.includes('character model sheet')) {
    throw new Error('Grounding instruction missing from Gemini prompt!');
  }
  console.log('✔ Gemini prompt contains VISUAL GROUNDING INSTRUCTION!');

  // Take screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, 'verify-sheet-grounding-in-prompts.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('✅ ALL CHARACTER SHEET GROUNDING TESTS PASSED!');
})();
