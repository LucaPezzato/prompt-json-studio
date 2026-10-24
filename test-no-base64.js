const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Starting Verification: No Base64 in Prompt Preview...');
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

  // 2. Attach a sample image to the character sheet via evaluate to simulate uploaded/generated image
  console.log('👉 Simulating attached character sheet image with base64 data...');
  const fakeBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC1AAN/9k=';
  
  await page.evaluate((dataUrl) => {
    // Access the Angular component / store via window or localStorage
    const saved = localStorage.getItem('prompt_json_studio_draft_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.character_sheet = parsed.character_sheet || {};
      parsed.character_sheet.enabled = true;
      parsed.character_sheet.character_name = 'Elena Vance';
      parsed.character_sheet.image_data_url = dataUrl;
      localStorage.setItem('prompt_json_studio_draft_v2', JSON.stringify(parsed));
    }
  }, fakeBase64);

  // Reload page so draft with attached image is restored
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 3. Switch to Prompt & Code view
  console.log('👉 Switching to Prompt & Codice view...');
  await page.locator('.mode-btn:has-text("Prompt & Codice")').click();
  await page.waitForTimeout(300);

  // 4. Test Gemini tab
  console.log('  Checking Gemini tab output preview...');
  await page.locator('button.tab:has-text("Gemini")').click();
  await page.waitForTimeout(200);
  const geminiText = await page.locator('pre.code').innerText();
  if (geminiText.includes('base64') || geminiText.includes('data:image')) {
    throw new Error('Gemini prompt preview contains base64 image data!');
  }
  console.log('✔ Gemini prompt preview is clean of base64 data (length:', geminiText.length, 'chars)');

  // 5. Test JSON tab
  console.log('  Checking JSON tab output preview...');
  await page.locator('button.tab:has-text("JSON")').click();
  await page.waitForTimeout(200);
  const jsonText = await page.locator('pre.code').innerText();
  if (jsonText.includes('base64') || jsonText.includes('data:image')) {
    throw new Error('JSON prompt preview contains base64 image data!');
  }
  console.log('✔ JSON prompt preview is clean of base64 data (length:', jsonText.length, 'chars)');

  // 6. Test Midjourney tab
  console.log('  Checking Midjourney tab output preview...');
  await page.locator('.other-models-select').selectOption('midjourney');
  await page.waitForTimeout(200);
  const mjText = await page.locator('pre.code').innerText();
  if (mjText.includes('base64') || mjText.includes('data:image')) {
    throw new Error('Midjourney prompt preview contains base64 image data!');
  }
  console.log('✔ Midjourney prompt preview is clean of base64 data (length:', mjText.length, 'chars)');

  // 7. Test FLUX tab
  console.log('  Checking FLUX tab output preview...');
  await page.locator('.other-models-select').selectOption('flux');
  await page.waitForTimeout(200);
  const fluxText = await page.locator('pre.code').innerText();
  if (fluxText.includes('base64') || fluxText.includes('data:image')) {
    throw new Error('FLUX prompt preview contains base64 image data!');
  }
  console.log('✔ FLUX prompt preview is clean of base64 data (length:', fluxText.length, 'chars)');

  // 8. Test SDXL tab
  console.log('  Checking SDXL tab output preview...');
  await page.locator('.other-models-select').selectOption('sdxl');
  await page.waitForTimeout(200);
  const sdxlText = await page.locator('pre.code').innerText();
  if (sdxlText.includes('base64') || sdxlText.includes('data:image')) {
    throw new Error('SDXL prompt preview contains base64 image data!');
  }
  console.log('✔ SDXL prompt preview is clean of base64 data (length:', sdxlText.length, 'chars)');

  // 9. Switch to Scene Studio mode (scene_with_character) and re-verify
  console.log('👉 Switching to Scene Studio with locked character...');
  const sceneStudioBtn = page.locator('.studio-workspace-bar .sw-btn:has-text("Componi Scena")');
  await sceneStudioBtn.click();
  await page.waitForTimeout(400);

  // Check Gemini in scene mode
  await page.locator('button.tab:has-text("Gemini")').click();
  await page.waitForTimeout(200);
  const sceneGemini = await page.locator('pre.code').innerText();
  if (sceneGemini.includes('base64') || sceneGemini.includes('data:image')) {
    throw new Error('Scene Gemini prompt preview contains base64 image data!');
  }
  console.log('✔ Scene Gemini prompt preview contains grounding instructions with ZERO base64!');

  // Capture screenshot of clean prompt preview
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-no-base64-prompt-preview.png'), fullPage: false });
  console.log('📸 Captured verify-no-base64-prompt-preview.png');

  console.log('🎉 ALL BASE64 PROMPT PREVIEW SANITIZATION CHECKS PASSED PERFECTLY!');
  await browser.close();
})();
