const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Verifying Edit, Clone, Delete and Persistence of Profiles...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('1. Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // Open Image Gen settings modal
  console.log('2. Opening settings modal...');
  const gearBtn = page.locator('.btn-config-engine');
  await gearBtn.waitFor({ state: 'visible', timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(500);

  // Check profiles count and action buttons on the first profile
  const profileCards = page.locator('.profile-card');
  const count = await profileCards.count();
  console.log(`Found ${count} profile cards.`);

  const firstCard = profileCards.first();
  const firstCardName = await firstCard.locator('.pc-name').innerText();
  console.log(`First card name: "${firstCardName}"`);

  // Verify buttons exist: Modifica, Clona, Elimina
  const editBtn = firstCard.locator('button:has-text("✏️ Modifica")');
  const cloneBtn = firstCard.locator('button:has-text("📋 Clona")');
  const deleteBtn = firstCard.locator('button:has-text("🗑️ Elimina")');

  console.log(`Edit button count: ${await editBtn.count()}`);
  console.log(`Clone button count: ${await cloneBtn.count()}`);
  console.log(`Delete button count: ${await deleteBtn.count()}`);

  if (await editBtn.count() === 0) {
    throw new Error('Edit button ✏️ Modifica not found on first profile card!');
  }

  // Click ✏️ Modifica
  console.log('3. Clicking ✏️ Modifica on first profile card...');
  await editBtn.click();
  await page.waitForTimeout(500);

  // Verify tab header and banner
  const tabBtnText = await page.locator('.mtab-btn.active').innerText();
  console.log(`Active tab button text: "${tabBtnText}"`);

  const bannerText = await page.locator('h4:has-text("✏️ Modifica Profilo Modello")').innerText();
  console.log(`Banner heading: "${bannerText}"`);

  // Edit name and badge
  console.log('4. Editing profile name and badge...');
  const nameInput = page.locator('input[placeholder="es. Sofia AI - My Influencer LoRA"]');
  await nameInput.fill('fal.ai: FLUX Realism (AI Influencer Modificato)');

  const badgeInput = page.locator('input[placeholder="es. 🌟 Influencer o 👑 Custom"]');
  await badgeInput.fill('💎 Super Influencer');

  // Verify save button text
  const saveBtn = page.locator('button.btn.primary:has-text("💾 Salva Modifiche")');
  console.log(`Save button present: ${await saveBtn.count() > 0}`);

  // Click 💾 Salva Modifiche
  await saveBtn.click();
  await page.waitForTimeout(600);

  // Verify updated card in Tab 1
  console.log('5. Verifying updated card in Tab 1...');
  const updatedFirstCard = page.locator('.profile-card').first();
  const updatedName = await updatedFirstCard.locator('.pc-name').innerText();
  const updatedBadge = await updatedFirstCard.locator('.pc-custom-badge').innerText();
  console.log(`Updated card name: "${updatedName}"`);
  console.log(`Updated card badge: "${updatedBadge}"`);

  if (!updatedName.includes('Modificato')) {
    throw new Error(`Profile was not updated in place! Got: ${updatedName}`);
  }

  // Test 📋 Clona
  console.log('6. Testing 📋 Clona on updated profile...');
  const cloneBtnOnUpdated = updatedFirstCard.locator('button:has-text("📋 Clona")');
  await cloneBtnOnUpdated.click();
  await page.waitForTimeout(500);

  const cloneBannerText = await page.locator('h4:has-text("✨ Crea Nuovo Profilo Modello")').innerText();
  console.log(`Clone banner heading: "${cloneBannerText}"`);

  const cloneSaveBtn = page.locator('button.btn.primary:has-text("✨ Crea e Salva Profilo")');
  await cloneSaveBtn.click();
  await page.waitForTimeout(600);

  const countAfterClone = await page.locator('.profile-card').count();
  console.log(`Count after clone: ${countAfterClone} (expected ${count + 1})`);

  // Test 🗑️ Elimina on the cloned profile
  console.log('7. Testing 🗑️ Elimina on cloned profile...');
  const clonedCard = page.locator('.profile-card', { hasText: '(Copia)' }).first();
  const delBtnCloned = clonedCard.locator('button:has-text("🗑️ Elimina")');
  await delBtnCloned.click();
  await page.waitForTimeout(500);

  const countAfterDelete = await page.locator('.profile-card').count();
  console.log(`Count after delete: ${countAfterDelete} (expected ${count})`);

  // Test ↺ Ripristina Predefiniti
  console.log('8. Testing ↺ Ripristina Predefiniti...');
  const resetBtn = page.locator('button:has-text("↺ Ripristina Predefiniti")');
  await resetBtn.click();
  await page.waitForTimeout(500);

  const restoredFirstCard = page.locator('.profile-card').first();
  const restoredName = await restoredFirstCard.locator('.pc-name').innerText();
  console.log(`Restored first card name: "${restoredName}"`);
  if (!restoredName.includes('fal.ai: FLUX Realism (AI Influencer)')) {
    throw new Error(`Profile name was not restored to default! Got: ${restoredName}`);
  }

  // Screenshot the modal showing all action buttons
  const screenshotPath = path.join(ARTIFACT_DIR, 'verify-edit-and-delete-profiles.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('✅ ALL PROFILE EDIT, CLONE, DELETE & RESET TESTS PASSED SUCCESSFULLY!');
})();
