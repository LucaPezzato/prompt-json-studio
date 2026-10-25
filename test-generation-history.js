const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/pez/.gemini/antigravity-cli/brain/f94d9553-2fbd-4991-8b35-f7c321e87cae';

(async () => {
  console.log('🚀 Verifying Automatic Generation History & Subject Archive...');
  const browser = await chromium.launch({
    executablePath: '/sbin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('1. Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  // 2. Check Topbar Gallery Button
  console.log('2. Checking Gallery button in topbar...');
  const galleryBtn = page.locator('button.gallery-open-btn');
  await galleryBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Gallery button visible in topbar!');

  // 3. Add test generations via IndexedDB in page context
  console.log('3. Injecting test generation items into IndexedDB...');
  await page.evaluate(async () => {
    const testItem1 = {
      id: 'gen-test-1',
      timestamp: Date.now() - 3600000,
      subjectName: 'Elena Vance',
      mode: 'scene_with_character',
      model: 'fal-ai/flux-realism',
      prompt: 'Candid handheld iPhone 17 Pro snapshot of Elena Vance in a vintage leather bomber jacket walking down 6th Avenue in Manhattan...',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      aspectRatio: '4:5',
      timeMs: 4200,
      specSnapshot: {
        meta: { version: '2.0', title: 'Elena in NYC Golden Hour', target_engine: 'universal' },
        subject: { primary_entity: 'Elena Vance', description: 'Restored Elena Vance test description', pose_or_action: 'Walking', expression_or_mood: 'Smiling', clothing_or_materials: 'Bomber jacket', placement: 'Center' },
        additional_subjects: [],
        scene: { environment: 'Manhattan 6th Ave', background_details: 'Skyscrapers', time_of_day: 'Golden Hour', atmosphere_weather: 'Brisk' },
        camera: { shot_type: 'Medium close-up', angle: 'Eye level', lens_focal_length: '24mm', aperture_depth_of_field: 'f/1.78', camera_body_or_film: 'iPhone 17 Pro' },
        lighting: { key_light: 'Sun', fill_or_ambient: 'Sky fill', color_temperature: '4800K', shadow_quality: 'Soft', color_palette: [] },
        composition: { framing_rule: 'Rule of thirds', focal_point: 'Eyes', foreground_elements: 'None', perspective: '1st person' },
        style_and_rendering: { medium: 'Photograph', aesthetic: 'Raw realism', color_grading: 'Natural', quality_tags: [] },
        typography: { enabled: false, exact_text: '', font_style: '', placement_and_material: '' },
        character_sheet: { enabled: true, mode: 'scene_with_character', consistency_method: 'multimodal_attached_sheet', character_name: 'Elena Vance', gender_and_age: 'Woman, 26', ethnicity_and_skin: 'Olive', eye_details: 'Hazel', hair_details: 'Brown', distinctive_marks: '', body_build: 'Athletic', signature_outfit: 'Bomber', signature_props: '', layout_mode: 'turnaround_4_views', views: [], background_style: '', cref_url: '', cref_weight: 100 },
        technical_parameters: { aspect_ratio: '4:5', negative_prompt: '', seed: 12345, stylize: 100, chaos: 0, raw_mode: true },
        custom_properties: []
      }
    };

    const testItem2 = {
      id: 'gen-test-2',
      timestamp: Date.now() - 1800000,
      subjectName: 'Blonde Influencer',
      mode: 'scene_with_character',
      model: 'gemini-2.5-flash-image',
      prompt: 'iPhone 17 Pro casual selfie of Blonde Influencer with heterochromia enjoying street food in Tokyo...',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      aspectRatio: '9:16',
      timeMs: 2800,
      specSnapshot: {
        meta: { version: '2.0', title: 'Tokyo Street Food', target_engine: 'universal' },
        subject: { primary_entity: 'Blonde Influencer', description: 'Blonde model with heterochromia', pose_or_action: 'Holding doner', expression_or_mood: 'Laughing', clothing_or_materials: 'Henley shirt', placement: 'Center' },
        additional_subjects: [],
        scene: { environment: 'Tokyo street', background_details: 'Neon signs', time_of_day: 'Dusk', atmosphere_weather: 'Clear' },
        camera: { shot_type: 'Close-up', angle: 'Eye level', lens_focal_length: '24mm', aperture_depth_of_field: 'f/1.78', camera_body_or_film: 'iPhone 17 Pro' },
        lighting: { key_light: 'Neon', fill_or_ambient: 'Ambient', color_temperature: 'Warm', shadow_quality: 'Soft', color_palette: [] },
        composition: { framing_rule: 'Portrait', focal_point: 'Eyes', foreground_elements: 'Food', perspective: 'Selfie' },
        style_and_rendering: { medium: 'Photograph', aesthetic: 'Candid', color_grading: 'Vibrant', quality_tags: [] },
        typography: { enabled: false, exact_text: '', font_style: '', placement_and_material: '' },
        character_sheet: { enabled: true, mode: 'scene_with_character', consistency_method: 'multimodal_attached_sheet', character_name: 'Blonde Influencer', gender_and_age: 'Woman, 24', ethnicity_and_skin: 'Fair', eye_details: 'Heterochromia', hair_details: 'Blonde', distinctive_marks: '', body_build: 'Hourglass', signature_outfit: 'Henley', signature_props: '', layout_mode: 'turnaround_4_views', views: [], background_style: '', cref_url: '', cref_weight: 100 },
        technical_parameters: { aspect_ratio: '9:16', negative_prompt: '', seed: 67890, stylize: 100, chaos: 0, raw_mode: true },
        custom_properties: []
      }
    };

    // Open IndexedDB and insert
    const req = indexedDB.open('prompt_json_studio_generations_db_v1', 1);
    await new Promise((resolve) => {
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('generations', 'readwrite');
        const store = tx.objectStore('generations');
        store.put(testItem1);
        store.put(testItem2);
        tx.oncomplete = () => resolve();
      };
    });
  });

  // Reload page to let Angular service load IndexedDB
  console.log('4. Reloading page to load IndexedDB items...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Check Gallery count badge
  const countBadge = page.locator('.gallery-count-badge');
  await countBadge.waitFor({ state: 'visible', timeout: 5000 });
  const countText = await countBadge.innerText();
  console.log(`Gallery count badge: "${countText}"`);

  // Open Gallery modal
  console.log('5. Opening Gallery modal...');
  await page.locator('button.gallery-open-btn').click();
  await page.waitForTimeout(500);

  const galleryModal = page.locator('app-modal[title*="Archivio Scatti"]');
  await galleryModal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✔ Gallery modal opened!');

  // Check cards count
  const cards = galleryModal.locator('.gallery-card');
  const cardsCount = await cards.count();
  console.log(`Cards count in gallery: ${cardsCount}`);
  if (cardsCount !== 2) {
    throw new Error(`Expected 2 cards in gallery, found ${cardsCount}!`);
  }

  // Check Subject Filter
  console.log('6. Testing Subject Filter...');
  const subjectSelect = galleryModal.locator('.gallery-filter-item select').first();
  await subjectSelect.selectOption('Elena Vance');
  await page.waitForTimeout(300);

  const filteredCount = await galleryModal.locator('.gallery-card').count();
  console.log(`Cards after filtering for Elena Vance: ${filteredCount}`);
  if (filteredCount !== 1) {
    throw new Error(`Expected 1 card for Elena Vance, got ${filteredCount}`);
  }

  // Test Restore Setup
  console.log('7. Testing "↺ Ripristina Setup"...');
  const restoreBtn = galleryModal.locator('.gallery-card .gc-restore-btn').first();
  await restoreBtn.click();
  await page.waitForTimeout(500);

  // Verify that the spec was restored!
  const boundName = await page.locator('.char-bound-banner .bound-name').innerText();
  console.log(`Restored bound character name: "${boundName}"`);
  if (!boundName.includes('Elena Vance')) {
    throw new Error(`Expected Elena Vance to be restored, got ${boundName}`);
  }
  console.log('✔ Configuration successfully restored from generation archive!');

  // Reopen gallery to capture screenshot
  await page.locator('button.gallery-open-btn').click();
  await page.waitForTimeout(500);

  const screenshotPath = path.join(ARTIFACT_DIR, 'verify-generation-history-gallery.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('✅ ALL GENERATION HISTORY & ARCHIVE TESTS PASSED!');
})();
