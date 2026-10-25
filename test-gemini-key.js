const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Verifying Gemini API Key Configuration & Live Connection...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open AI Settings modal
  console.log('👉 Opening AI Models & API Keys modal...');
  await page.locator('.btn-config-engine').click();
  await page.waitForTimeout(400);

  const modal = page.locator('app-modal[title*="Generatore Immagini"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // Navigate to API Keys tab
  console.log('👉 Navigating to "Gestione Chiavi API" tab...');
  await modal.locator('.mtab-btn:has-text("Gestione Chiavi API")').click();
  await page.waitForTimeout(400);

  // Check Gemini input has key
  const geminiCard = modal.locator('.key-card:has-text("Google Gemini")');
  const geminiInputVal = await geminiCard.locator('input').inputValue();
  console.log(`  Gemini Key present in input: ${geminiInputVal.length > 20 ? 'YES (length ' + geminiInputVal.length + ')' : 'NO'}`);
  if (geminiInputVal.length < 20) {
    throw new Error(`Expected Gemini key in input, got: "${geminiInputVal}"`);
  }

  // Click "Verifica Chiave" on Gemini card
  console.log('👉 Testing live connection to Google Gemini API...');
  const verifyGeminiBtn = geminiCard.locator('button:has-text("Verifica Chiave")');
  await verifyGeminiBtn.click();

  const feedbackBox = geminiCard.locator('.key-test-feedback:not(:has-text("in corso"))');
  await feedbackBox.waitFor({ state: 'visible', timeout: 10000 });
  const feedbackText = await feedbackBox.innerText();
  console.log(`  Live Gemini verification result: "${feedbackText}"`);
  if (!feedbackText.includes('Connessione Gemini verificata')) {
    throw new Error(`Gemini live verification failed: ${feedbackText}`);
  }
  console.log('✔ Google Gemini API Key verified live with 100% success!');

  // Also check fal.ai key
  const falCard = modal.locator('.key-card:has-text("fal.ai")');
  const falInputVal = await falCard.locator('input').inputValue();
  console.log(`  fal.ai Key present in input: ${falInputVal.startsWith('fal_sk_') ? 'YES (' + falInputVal.slice(0, 15) + '...)' : 'NO'}`);
  if (!falInputVal.startsWith('fal_sk_')) {
    throw new Error(`Expected fal.ai key in input, got: "${falInputVal}"`);
  }

  // Toggle show keys in clear
  await modal.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(200);

  // Screenshot the verified API Keys tab
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-gemini-and-fal-api-keys.png'), fullPage: false });
  console.log('📸 Captured verify-gemini-and-fal-api-keys.png');

  console.log('🎉 ALL GEMINI & FAL.AI API KEY CHECKS PASSED WITH 100% SUCCESS!');
  await browser.close();
})();
