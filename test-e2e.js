const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Starting Playwright E2E verification...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('Browser console error:', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('Browser uncaught error:', err.message);
  });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  console.log('✔ Page loaded');

  // 1. Verify Title Card
  const titleCard = page.locator('.title-card');
  await titleCard.waitFor({ state: 'visible', timeout: 5000 });
  const titleLabel = await page.locator('.title-card-label').innerText();
  const titleInputValue = await page.locator('.title-input').inputValue();
  console.log(`✔ Title card found: "${titleLabel.trim()}" with prompt title: "${titleInputValue}"`);

  // 2. Verify Section Blocks
  const blocks = await page.locator('app-section-block').all();
  console.log(`✔ Found ${blocks.length} app-section-block components`);
  if (blocks.length !== 10) {
    throw new Error(`Expected 10 blocks, found ${blocks.length}`);
  }

  // 3. Test "Comprimi tutto"
  console.log('👉 Testing "Comprimi tutto"...');
  const collapseAllBtn = page.locator('button:has-text("Comprimi tutto")');
  await collapseAllBtn.click();
  await page.waitForTimeout(300);

  for (let i = 0; i < blocks.length; i++) {
    const headBtn = blocks[i].locator('.head-btn');
    const box = await headBtn.boundingBox();
    const title = await blocks[i].locator('.title-text').innerText();
    const isExpanded = await headBtn.getAttribute('aria-expanded');
    console.log(`  Block #${i + 1} [${title}]: aria-expanded=${isExpanded}, height=${box.height.toFixed(1)}px`);
    if (isExpanded !== 'false') {
      throw new Error(`Block #${i + 1} expected to be collapsed but was ${isExpanded}`);
    }
    if (box.height < 45) {
      throw new Error(`Block #${i + 1} collapsed height is squished: ${box.height}px < 45px!`);
    }
  }
  console.log('✔ All blocks collapsed cleanly with full min-height of ~48px and clear visible titles');

  // Screenshot when all collapsed
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-all-collapsed.png'), fullPage: false });
  console.log('📸 Captured e2e-all-collapsed.png');

  // 4. Test clicking individual accordion to open and close
  console.log('👉 Testing individual toggle on Block #1 (Soggetto principale)...');
  const firstHead = blocks[0].locator('.head-btn');
  await firstHead.click();
  await page.waitForTimeout(300);
  let expanded1 = await firstHead.getAttribute('aria-expanded');
  let hostBox1 = await blocks[0].boundingBox();
  console.log(`  Block #1 reopened: aria-expanded=${expanded1}, total card height=${hostBox1.height.toFixed(1)}px`);
  if (expanded1 !== 'true' || hostBox1.height < 150) {
    throw new Error(`Block #1 did not reopen properly!`);
  }

  // Close it back
  await firstHead.click();
  await page.waitForTimeout(300);
  let collapsedAgain = await firstHead.getAttribute('aria-expanded');
  console.log(`  Block #1 closed again: aria-expanded=${collapsedAgain}`);
  if (collapsedAgain !== 'false') {
    throw new Error(`Block #1 did not close!`);
  }

  // 5. Test "Espandi tutto"
  console.log('👉 Testing "Espandi tutto"...');
  const expandAllBtn = page.locator('button:has-text("Espandi tutto")');
  await expandAllBtn.click();
  await page.waitForTimeout(300);

  for (let i = 0; i < blocks.length; i++) {
    const headBtn = blocks[i].locator('.head-btn');
    const isExpanded = await headBtn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      throw new Error(`Block #${i + 1} expected to be expanded!`);
    }
  }
  console.log('✔ All 10 blocks expanded smoothly!');

  // Screenshot when all expanded
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-all-expanded.png'), fullPage: false });
  console.log('📸 Captured e2e-all-expanded.png');

  // 6. Test Title Input reactivity
  console.log('👉 Testing prompt title editing...');
  const titleInput = page.locator('.title-input');
  await titleInput.fill('Cyberpunk Detective in Rain - Special Edition');
  await page.waitForTimeout(200);
  
  // Verify output JSON updates
  let jsonPreview = await page.locator('pre.code').innerText();
  if (!jsonPreview.includes('Cyberpunk Detective in Rain - Special Edition')) {
    throw new Error('Title change was not reflected in the output JSON!');
  }
  console.log('✔ Title editing reactively updated JSON output preview!');

  // 7. Test Realistic Templates in Sidebar
  console.log('👉 Testing realistic photography templates in sidebar...');
  const realisticTemplateCard = page.locator('.template-card:has-text("Candid 35mm Analog Street Portrait")');
  await realisticTemplateCard.waitFor({ state: 'visible', timeout: 5000 });
  await realisticTemplateCard.click();
  await page.waitForTimeout(400);

  const updatedTitle = await titleInput.inputValue();
  console.log(`  Loaded template title: "${updatedTitle}"`);
  if (!updatedTitle.includes('Trastevere')) {
    throw new Error(`Expected Trastevere street portrait title, got: ${updatedTitle}`);
  }

  jsonPreview = await page.locator('pre.code').innerText();
  if (!jsonPreview.includes('Kodak Portra 400') || !jsonPreview.includes('Leica M11')) {
    throw new Error('Realistic photography parameters missing from compiled JSON!');
  }
  console.log('✔ Realistic template loaded with Kodak Portra 400 and Leica M11 parameters!');

  // 8. Test Preset Dropdowns on smart fields
  console.log('👉 Testing preset dropdown select elements on fields...');
  const presetSelects = await page.locator('select.preset-select').all();
  console.log(`  Found ${presetSelects.length} preset dropdown selects across fields`);
  if (presetSelects.length < 15) {
    throw new Error(`Expected at least 15 preset selects, found ${presetSelects.length}`);
  }

  // Select a preset from the first dropdown (in Genere & Età or primary_entity)
  const firstSelect = presetSelects[0];
  const options = await firstSelect.locator('option').allInnerTexts();
  console.log(`  First dropdown options count: ${options.length} (sample: "${options[1]}")`);
  await firstSelect.selectOption({ index: 1 });
  await page.waitForTimeout(300);

  const parentField = page.locator('app-smart-field:has(select.preset-select)').first();
  const firstInputValue = await parentField.locator('input').inputValue();
  console.log(`  First input value after dropdown selection: "${firstInputValue}"`);
  if (firstInputValue !== options[1]) {
    throw new Error(`Expected input to be "${options[1]}", but was "${firstInputValue}"`);
  }
  console.log('✔ Preset dropdown selection successfully populated input!');

  // Capture final realistic screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-realistic-preset.png'), fullPage: false });
  console.log('📸 Captured e2e-realistic-preset.png');

  // 9. Test Reverse Image to Prompt
  console.log('👉 Testing Reverse Image to Prompt feature...');
  const reverseBtn = page.locator('button.reverse-btn');
  await reverseBtn.click();
  await page.waitForTimeout(300);

  const modal = page.locator('.modal-backdrop .modal h3:has-text("Reverse")');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // Create temporary test image
  const testImgPath = '/tmp/test-photo-e2e.png';
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA1zSURBVHic7d1BDQAwDMCw50+92uADUjK7mQWw4/gDAODfFgAAAA==';
  const fs = require('fs');
  fs.writeFileSync(testImgPath, Buffer.from(base64Png, 'base64'));

  const fileInput = page.locator('.upload-dropzone input[type="file"]').first();
  await fileInput.setInputFiles(testImgPath);
  await page.waitForTimeout(300);

  const previewImg = page.locator('.preview-img');
  await previewImg.waitFor({ state: 'visible', timeout: 3000 });

  const extractBtn = page.locator('button:has-text("Estrai & Ricrea Prompt")');
  await extractBtn.click();

  await page.waitForFunction(() => {
    return !document.querySelector('.modal-backdrop');
  }, { timeout: 25000 });

  const refBanner = page.locator('.ref-banner');
  await refBanner.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Reference Banner active on canvas after reverse extraction!');

  fs.unlinkSync(testImgPath);

  // 10. Test Character Sheet & Visual Consistency
  console.log('👉 Testing Character Sheet & Consistency section...');
  const charTemplateCard = page.locator('.template-card:has-text("Character Turnaround 360° Realistico")');
  await charTemplateCard.waitFor({ state: 'visible', timeout: 5000 });
  await charTemplateCard.click();
  await page.waitForTimeout(400);

  // Verify Character Sheet block is visible and populated
  const charBlock = page.locator('app-section-block:has-text("Scheda Personaggio")');
  await charBlock.waitFor({ state: 'visible', timeout: 5000 });
  
  // Make sure it's opened
  const charHead = charBlock.locator('.head-btn');
  const isCharOpen = await charHead.getAttribute('aria-expanded');
  if (isCharOpen !== 'true') {
    await charHead.click();
    await page.waitForTimeout(300);
  }

  // Check saved characters in library bar
  const charPills = await charBlock.locator('.char-pill').all();
  console.log(`  Found ${charPills.length} saved characters in library bar`);
  if (charPills.length < 2) {
    throw new Error(`Expected at least 2 pre-seeded characters, found ${charPills.length}`);
  }

  // Click Ren Takahashi pill
  const renPill = charBlock.locator('.char-pill:has-text("Ren Takahashi")');
  await renPill.click();
  await page.waitForTimeout(300);

  // Check that character name input updated to Ren Takahashi
  const charNameInput = charBlock.locator('app-smart-field[label="Nome del Personaggio"] input');
  const loadedName = await charNameInput.inputValue();
  console.log(`  Loaded character into sheet: "${loadedName}"`);
  if (!loadedName.includes('Ren Takahashi')) {
    throw new Error(`Expected Ren Takahashi, got: ${loadedName}`);
  }

  // Test "Inietta nel Soggetto della Scena"
  const injectBtn = charBlock.locator('button.char-apply-btn');
  await injectBtn.click();
  await page.waitForTimeout(300);

  const subjectEntityInput = page.locator('app-section-block:has-text("Soggetto principale") app-smart-field[label="Entità principale"] input');
  const injectedEntity = await subjectEntityInput.inputValue();
  console.log(`  Subject primary entity after injection: "${injectedEntity}"`);
  if (!injectedEntity.includes('Ren Takahashi')) {
    throw new Error(`Expected Ren Takahashi injected into subject, got: ${injectedEntity}`);
  }

  // Test adding cref URL and verifying Midjourney output
  const crefInput = charBlock.locator('app-smart-field:has-text("--cref") input');
  await crefInput.fill('https://cdn.example.com/ren-turnaround.jpg');
  await page.waitForTimeout(200);

  // Switch to Midjourney tab
  const mjTabBtn = page.locator('button.tab:has-text("Midjourney")');
  await mjTabBtn.click();
  await page.waitForTimeout(300);

  const mjPromptText = await page.locator('pre.code').innerText();
  console.log('  Midjourney output sample:', mjPromptText.slice(0, 140));
  if (!mjPromptText.includes('--cref https://cdn.example.com/ren-turnaround.jpg') || !mjPromptText.includes('--cw 100')) {
    throw new Error('Midjourney output does not contain --cref or --cw 100!');
  }
  console.log('✔ Character Sheet --cref correctly compiled into Midjourney prompt!');

  // Capture character sheet screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-character-sheet.png'), fullPage: false });
  console.log('📸 Captured e2e-character-sheet.png');

  // 11. Test Character Profile Creation from Photos (AI Vision Multi-Image)
  console.log('👉 Testing Character Profile Creation from Photos modal...');
  const charExtractBtn = charBlock.locator('button.char-extract-btn');
  await charExtractBtn.waitFor({ state: 'visible', timeout: 5000 });
  await charExtractBtn.click();
  await page.waitForTimeout(300);

  const charPhotoModal = page.locator('.modal-backdrop .modal h3:has-text("Crea Profilo Personaggio da Foto")');
  await charPhotoModal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Character Photo Upload modal opened');

  // Create two temporary test images
  const testImg1 = '/tmp/test-char-1.png';
  const testImg2 = '/tmp/test-char-2.png';
  const testCharPng = 'iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA1zSURBVHic7d1BDQAwDMCw50+92uADUjK7mQWw4/gDAODfFgAAAA==';
  fs.writeFileSync(testImg1, Buffer.from(testCharPng, 'base64'));
  fs.writeFileSync(testImg2, Buffer.from(testCharPng, 'base64'));

  const charFileInput = page.locator('.char-dropzone input[type="file"]').first();
  await charFileInput.setInputFiles([testImg1, testImg2]);
  await page.waitForTimeout(400);

  // Check thumbnails
  const thumbCards = await page.locator('.char-thumb-card').all();
  console.log(`  Uploaded ${thumbCards.length} photo thumbnails in modal`);
  if (thumbCards.length !== 2) {
    throw new Error(`Expected 2 thumbnail cards, found ${thumbCards.length}`);
  }

  // Set character context hint
  const charHintInput = page.locator('.char-photo-modal-body input[type="text"]');
  await charHintInput.fill('Maya Lin, 28 years old, modernist architect');
  await page.waitForTimeout(200);

  // Click Analizza & Genera Scheda Personaggio
  const runCharExtractBtn = page.locator('.modal-actions button.btn.primary:has-text("Analizza")');
  await runCharExtractBtn.click();

  // Wait for modal to complete and close
  await page.waitForFunction(() => {
    return !document.querySelector('.char-photo-modal-body');
  }, { timeout: 30000 });
  console.log('✔ Multimodal photo analysis completed and modal closed');

  // Verify Character Sheet updated with the extracted character
  const newCharName = await charNameInput.inputValue();
  console.log(`  Character sheet updated to: "${newCharName}"`);
  if (!newCharName.toLowerCase().includes('maya')) {
    throw new Error(`Expected Character name to contain Maya, got: ${newCharName}`);
  }

  // Verify saved in library pills
  const newPill = page.locator('.char-pill:has-text("Maya")');
  await newPill.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ New character auto-saved to library pills bar!');

  // Cleanup test images
  fs.unlinkSync(testImg1);
  fs.unlinkSync(testImg2);

  // Capture final screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-character-from-photos.png'), fullPage: false });
  console.log('📸 Captured e2e-character-from-photos.png');

  if (errors.length > 0) {
    throw new Error(`Browser encountered ${errors.length} errors: ${errors.join('; ')}`);
  }

  console.log('🎉 ALL PLAYWRIGHT VERIFICATION CHECKS (INCLUDING MULTI-PHOTO CHARACTER SHEET) PASSED PERFECTLY!');
  await browser.close();
})();
