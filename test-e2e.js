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
  if (blocks.length !== 9) {
    throw new Error(`Expected 9 blocks, found ${blocks.length}`);
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
  console.log('✔ All 9 blocks expanded smoothly!');

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

  // Select a preset from the first dropdown (primary_entity)
  const firstSelect = presetSelects[0];
  const options = await firstSelect.locator('option').allInnerTexts();
  console.log(`  First dropdown options count: ${options.length} (sample: "${options[1]}")`);
  await firstSelect.selectOption({ index: 1 });
  await page.waitForTimeout(300);

  const firstInputValue = await page.locator('app-smart-field input').first().inputValue();
  console.log(`  First input value after dropdown selection: "${firstInputValue}"`);
  if (firstInputValue !== options[1]) {
    throw new Error(`Expected input to be "${options[1]}", but was "${firstInputValue}"`);
  }
  console.log('✔ Preset dropdown selection successfully populated input!');

  // Capture final realistic screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e-realistic-preset.png'), fullPage: false });
  console.log('📸 Captured e2e-realistic-preset.png');

  if (errors.length > 0) {
    throw new Error(`Browser encountered ${errors.length} errors: ${errors.join('; ')}`);
  }

  console.log('🎉 ALL PLAYWRIGHT VERIFICATION CHECKS PASSED PERFECTLY!');
  await browser.close();
})();
