const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Testing Live Image Generation with fal.ai in Prompt JSON Studio...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Switch to Scene Studio Mode
  console.log('👉 Switching to Scene Studio...');
  await page.locator('.studio-workspace-bar .sw-btn:has-text("Componi Scena")').click();
  await page.waitForTimeout(300);

  // 2. Select FLUX Schnell for rapid ~1s verification
  console.log('👉 Switching to FLUX Schnell via Quick Switcher...');
  const schnellChip = page.locator('.quick-profile-bar .qpb-chip:has-text("FLUX Schnell")');
  await schnellChip.click();
  await page.waitForTimeout(300);

  // 3. Click "Genera Immagine"
  console.log('👉 Clicking "Genera Immagine" with fal.ai FLUX Schnell...');
  const genBtn = page.locator('.btn-generate-hero');
  await genBtn.click();

  // 4. Wait for generation to complete (loading card -> result card with img.result-img)
  console.log('👉 Waiting for image to be returned from fal.ai...');
  const mainImg = page.locator('.image-result-card img.result-img');
  await mainImg.waitFor({ state: 'visible', timeout: 35000 });

  const imgSrc = await mainImg.getAttribute('src');
  console.log(`✔ Image generated successfully! Data URL starts with: ${imgSrc.slice(0, 30)}... (length: ${imgSrc.length})`);

  // Check timings badge
  const timeTag = await page.locator('.image-result-card .time-tag').innerText();
  console.log(`✔ Generation time reported: ${timeTag}`);

  // Take screenshot of generated result
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-fal-live-generation.png'), fullPage: false });
  console.log('📸 Captured verify-fal-live-generation.png');

  console.log('🎉 LIVE FAL.AI GENERATION COMPLETED WITH 100% SUCCESS!');
  await browser.close();
})();
