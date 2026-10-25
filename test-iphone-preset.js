const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Starting Verification: iPhone 17 Pro Camera Presets...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Switch to Scene Studio Mode (for creating realistic social scenes)
  console.log('👉 Switching to Scene Studio mode for social photography...');
  const sceneStudioBtn = page.locator('.studio-workspace-bar .sw-btn:has-text("Componi Scena")');
  await sceneStudioBtn.click();
  await page.waitForTimeout(400);

  // 2. Expand Camera & Optics block if not already open
  console.log('👉 Ensuring Camera & Ottica block is open...');
  const cameraBlock = page.locator('app-section-block').nth(3);
  const isExpanded = await cameraBlock.locator('.head-btn').getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await cameraBlock.locator('.head-btn').click();
    await page.waitForTimeout(300);
  }

  // 3. Verify Quick Hardware Presets Bar is visible
  const presetsBar = cameraBlock.locator('.camera-hardware-presets');
  await presetsBar.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Camera Hardware Presets bar is visible inside Camera block!');

  // 3. Test clicking "📱 iPhone 17 Pro (Social Candid)"
  console.log('👉 Testing 1-click "📱 iPhone 17 Pro (Social Candid)" preset...');
  const candidBtn = presetsBar.locator('.chp-chip:has-text("iPhone 17 Pro (Social Candid)")');
  await candidBtn.click();
  await page.waitForTimeout(300);

  // Verify camera fields updated
  const cameraBodyInput = cameraBlock.locator('app-smart-field[label*="Corpo macchina"] input');
  const cameraBodyVal = await cameraBodyInput.inputValue();
  console.log(`  Camera body value: "${cameraBodyVal}"`);
  if (!cameraBodyVal.includes('iPhone 17 Pro Max') || !cameraBodyVal.includes('Photonic Engine')) {
    throw new Error(`Expected iPhone 17 Pro Max in camera body, got: ${cameraBodyVal}`);
  }

  const lensInput = cameraBlock.locator('app-smart-field[label*="Obiettivo"] input');
  const lensVal = await lensInput.inputValue();
  console.log(`  Lens value: "${lensVal}"`);
  if (!lensVal.includes('24mm') || !lensVal.includes('iPhone 17 Pro')) {
    throw new Error(`Expected 24mm iPhone 17 Pro in lens, got: ${lensVal}`);
  }

  // Verify style section updated
  const styleBlock = page.locator('app-section-block').nth(6);
  if (await styleBlock.locator('.head-btn').getAttribute('aria-expanded') === 'false') {
    await styleBlock.locator('.head-btn').click();
    await page.waitForTimeout(200);
  }

  const mediumInput = styleBlock.locator('app-smart-field[label*="Medium"] input');
  const mediumVal = await mediumInput.inputValue();
  console.log(`  Medium value: "${mediumVal}"`);
  if (!mediumVal.includes('iPhone 17 Pro')) {
    throw new Error(`Expected iPhone 17 Pro in medium, got: ${mediumVal}`);
  }

  // Verify aspect ratio is 4:5
  const activeAspect = await page.locator('.quick-aspect-ratio-bar .qar-pill.active').innerText();
  console.log(`  Aspect ratio value: "${activeAspect.trim()}"`);
  if (!activeAspect.includes('4:5')) {
    throw new Error(`Expected aspect ratio 4:5 for social media, got: ${activeAspect}`);
  }
  console.log('✔ iPhone 17 Pro Candid preset configured camera, 24mm optics, social styling, and 4:5 ratio!');

  // 4. Test "🤳 iPhone 17 Pro Selfie" preset
  console.log('👉 Testing 1-click "🤳 iPhone 17 Pro Selfie" preset...');
  const selfieBtn = presetsBar.locator('.chp-chip:has-text("iPhone 17 Pro Selfie")');
  await selfieBtn.click();
  await page.waitForTimeout(300);

  const selfieCameraVal = await cameraBodyInput.inputValue();
  console.log(`  Selfie camera body value: "${selfieCameraVal}"`);
  if (!selfieCameraVal.includes('TrueDepth') || !selfieCameraVal.includes('Selfie')) {
    throw new Error(`Expected TrueDepth Selfie in camera body, got: ${selfieCameraVal}`);
  }

  const selfieLensVal = await lensInput.inputValue();
  console.log(`  Selfie lens value: "${selfieLensVal}"`);
  if (!selfieLensVal.includes('Front TrueDepth') || !selfieLensVal.includes('23mm')) {
    throw new Error(`Expected Front TrueDepth 23mm in lens, got: ${selfieLensVal}`);
  }
  console.log('✔ iPhone 17 Pro Selfie preset configured front TrueDepth camera and arm-length perspective!');

  // 5. Test Template Library Modal has the iPhone 17 Pro Social template
  console.log('👉 Testing Template Library Modal for iPhone 17 Pro preset...');
  const templateBtn = page.locator('button.template-modal-btn');
  if (await templateBtn.isVisible()) {
    await templateBtn.click();
    await page.waitForTimeout(300);
  }

  const iphoneTemplateCard = page.locator('.template-card:has-text("iPhone 17 Pro: Social Candid")');
  await iphoneTemplateCard.waitFor({ state: 'visible', timeout: 5000 });
  const cardTitle = await iphoneTemplateCard.locator('strong').innerText();
  console.log(`✔ Found template card in modal: "${cardTitle}"`);

  // Load the template
  await iphoneTemplateCard.click();
  await page.waitForTimeout(500);

  // Check prompt output in sidebar
  await page.locator('.panel-mode-switcher .mode-btn:has-text("Prompt & Codice")').click();
  await page.waitForTimeout(300);
  const promptOutput = await page.locator('pre.code').innerText();
  if (!promptOutput.includes('iPhone 17 Pro') || !promptOutput.includes('Photonic Engine')) {
    throw new Error('Prompt output does not reflect iPhone 17 Pro template!');
  }
  console.log('✔ Template loaded and prompt compiled with iPhone 17 Pro parameters!');

  // Capture screenshot of iPhone 17 Pro Camera Setup
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-iphone-17-pro-preset.png'), fullPage: false });
  console.log('📸 Captured verify-iphone-17-pro-preset.png');

  console.log('🎉 ALL IPHONE 17 PRO CAMERA PRESET CHECKS PASSED WITH 100% SUCCESS!');
  await browser.close();
})();
