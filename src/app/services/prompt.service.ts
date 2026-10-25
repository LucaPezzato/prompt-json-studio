import { Injectable, computed, effect, signal } from '@angular/core';
import {
  AiAssistantConfig,
  CharacterSheetBlock,
  CustomOptionsMap,
  DEFAULT_IMAGE_GEN_PROFILES,
  GeneratedImageResult,
  ImageGenConfig,
  ImageGenProfile,
  ImageGenProvider,
  ImagePromptSpec,
  OutputTab,
  PresetCategoryKey,
  PromptTemplate,
  ProviderApiKeys,
  SavedCharacter,
} from '../models/prompt.model';

import {
  IMPORTED_CHARACTERS,
  IMPORTED_DEFAULT_FAL_KEY,
  IMPORTED_DEFAULT_GEMINI_KEY,
  IMPORTED_IMAGE_GEN_PROFILES,
  IMPORTED_PROVIDER_KEYS,
  IMPORTED_USER_PRESETS,
} from '../data/imported-subjects.data';

const USER_PRESETS_STORAGE_KEY = 'prompt_json_studio_user_presets_v1';
const CUSTOM_OPTIONS_STORAGE_KEY = 'prompt_json_studio_custom_options_v1';
const AI_CONFIG_STORAGE_KEY = 'prompt_json_studio_ai_config_v1';
const SAVED_CHARACTERS_STORAGE_KEY = 'prompt_json_studio_saved_characters_v1';
const DEFAULT_OUTPUT_MODEL_STORAGE_KEY = 'prompt_json_studio_default_output_model_v1';
const IMAGE_GEN_CONFIG_STORAGE_KEY = 'prompt_json_studio_image_gen_config_v1';
export const DEFAULT_FAL_KEY = IMPORTED_DEFAULT_FAL_KEY;

export const DEFAULT_CHARACTER_SHEET: CharacterSheetBlock = {
  enabled: false,
  mode: 'sheet_generation',
  consistency_method: 'multimodal_attached_sheet',
  character_name: '',
  gender_and_age: 'Young woman, 26 years old',
  ethnicity_and_skin: 'Warm olive skin with natural subtle freckles across the bridge of the nose',
  eye_details: 'Almond-shaped hazel eyes with amber gold flecks and dark lash line',
  hair_details: 'Chestnut brown wavy shoulder-length hair parted slightly off-center',
  distinctive_marks: 'Tiny faint beauty mark under the left eye, natural skin pores and micro-texture',
  body_build: 'Athletic, slender build, upright posture',
  signature_outfit: 'Textured ivory linen button-up shirt and high-waisted charcoal trousers',
  signature_props: 'Delicate vintage gold signet ring on the right ring finger',
  layout_mode: 'turnaround_4_views',
  views: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view'],
  background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
  cref_url: '',
  cref_weight: 100,
};

export interface ColorPalettePreset {
  name: string;
  colors: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  readonly colorPalettePresets: ColorPalettePreset[] = [
    { name: 'Cyberpunk Neon', colors: ['#00f0ff', '#ff007f', '#bd93f9', '#111118'] },
    { name: 'Dracula Studio', colors: ['#bd93f9', '#ff79c6', '#8be9fd', '#282a36'] },
    { name: 'Teal & Orange Cinema', colors: ['#0d5c75', '#f28c28', '#1a242b', '#f4e1c1'] },
    { name: 'Golden Hour Warmth', colors: ['#ffb347', '#ff6961', '#5b3256', '#fdfbd3'] },
    { name: 'Nordic Minimal', colors: ['#d8dee9', '#88c0d0', '#4c566a', '#2e3440'] },
    { name: 'Emerald Noir', colors: ['#10b981', '#064e3b', '#d4af37', '#090d0b'] },
  ];

  readonly defaultOptions: CustomOptionsMap = {
    primary_entity: [
      'Elderly artisan with weathered expressive face and silver hair',
      'Young woman with natural freckles, untamed curls and gentle smile',
      'Wild snow leopard (Panthera uncia) perched on a jagged alpine ledge',
      'Modernist cantilevered concrete and glass architectural residence',
      'Pan-seared jumbo sea scallop with saffron emulsion on charcoal stoneware',
      'Lagoon fisherman at dawn hauling a dripping hemp net from a wooden boat',
      'Swiss luxury mechanical chronograph with exposed tourbillon mechanism',
      'Minimalist smoked-glass botanical perfume bottle with brass cap',
      'Young female cyberpunk courier in rainy neon alleyway',
      'Cutaway 3D isometric diorama of a two-story Tokyo ramen shop',
      'Lone knight in tarnished silver armor before a gothic cathedral archway',
      'Vintage 1960s sports car parked on a scenic alpine mountain pass',
    ],
    subject_description: [
      'Authentic skin texture with fine laugh lines, natural pores, subtle freckles and subsurface scattering',
      'Intense, luminous eyes with sharp specular catchlights and natural eyelid folds',
      'Dense winter fur with individual hairs visible and tiny frost crystals on whiskers',
      'Tactile architectural surfaces: board-formed concrete grain, tie-holes and low-iron glass',
      'Glistening caramelized sear marks, vibrant herb oil droplets and delicate steam wisps',
      'Weathered hands with defined tendons, salt-sprayed stubble and focused sun-kissed gaze',
      'Precision brushed titanium bevels, synthetic ruby jewel bearings and blued steel hands',
      'Thick faceted crystal glass with micro-condensation droplets on the surface',
    ],
    pose_or_action: [
      'Looking candidly toward the lens with a subtle unposed natural expression',
      'Walking dynamically through the scene, captured in mid-stride street reportage',
      'Three-quarter profile gazing thoughtfully out of a sunlit window',
      'Crouched low in vigilant hunting posture, scanning the horizon',
      'Hands delicately engaged in an intricate artisanal craftsmanship task',
      'Standing statuary and dignified with dramatic side-profile rim light',
      'Resting casually against a textured background wall with relaxed posture',
      'Action-packed motion frozen with crisp high-speed shutter clarity',
    ],
    expression_or_mood: [
      'Calm, authentic, serene with a spontaneous gentle warmth',
      'Intense, focused, solemn contemplation and deep soulfulness',
      'Proud, dignified, resilient with sharp piercing determination',
      'Pensive, melancholic nostalgia, enigmatic and atmospheric',
      'Joyful, vibrant, candid laugh captured in an authentic unscripted moment',
      'Vigilant, wild, untamed majesty of apex nature',
      'Refined, quiet luxury, understated elegance and sensory balance',
    ],
    clothing_or_materials: [
      'Washed indigo cotton chore jacket over an off-white unbleached linen shirt',
      'Heavy ribbed merino wool knit sweater with tactile handcrafted yarn loops',
      'Tailored British herringbone tweed overcoat with a raised lapel',
      'Crisp organic white poplin cotton shirt with natural gentle folds',
      'Heavy-duty yellow rubberized foul-weather bib overalls and deck boots',
      'Dense natural spotted winter fur with thick insulating undercoat',
      'Matte black techwear jacket with sealed waterproof seams and chrome accents',
      'Charcoal volcanic textured stoneware ceramic and gold-plated brass',
      'Weathered tarnished steel plate armor with tattered deep-crimson velvet',
    ],
    placement: [
      'Center frame',
      'Foreground-left (Rule of thirds)',
      'Foreground-right (Rule of thirds)',
      'Midground center',
      'Dynamic diagonal placement',
      'Full-frame close subject',
    ],
    environment: [
      'Sunlit narrow cobblestone alley in Trastevere Rome at golden hour',
      'High-altitude Himalayan mountain ridge at 4500 meters during snow flurries',
      'Cantilevered modernist villa overlooking Lake Como at twilight',
      'Artisanal chef’s table in a Michelin-starred open-concept kitchen',
      'Venetian lagoon at dawn with low-hanging morning mist and calm waters',
      'Rain-slicked Neo-Tokyo alleyway illuminated by multi-colored neon signs',
      'Professional photography studio with hand-painted textured canvas backdrop',
      'Bustling outdoor farmers market with vibrant citrus crates and morning sun',
      'Rugged North Atlantic coastline with jagged basalt cliffs and crashing spray',
      'Minimalist Scandinavian loft interior with exposed brick and industrial steel windows',
      'Ancient moss-covered temperate rainforest with towering old-growth trees',
    ],
    background_details: [
      'Warm terracotta plaster walls, potted basil and softly blurred hanging laundry in creamy bokeh',
      'Towering snow-dusted jagged mountain peaks fading into blizzard clouds',
      'Mirror-like lake surface, distant silhouetted pre-alpine ridges and manicured olive trees',
      'Out-of-focus dark rustic walnut tables, warm copper cookware and dim Edison bulbs',
      'Aged wooden mooring poles (briccole) and distant church campanile silhouettes in the fog',
      'Reflecting puddles with neon kanji, rising steam from street grates and tangled cables',
      'Unfocused pedestrians walking past with subtle organic motion blur',
      'Tall steel-framed loft windows with rain streaks and soft northern daylight',
      'Full-height dark oak library shelves filled with leather-bound antique books',
    ],
    time_of_day: [
      'Golden hour sunset',
      'Blue hour twilight',
      'Dawn / Sunrise mist',
      'Overcast morning (Diffused light)',
      'Midday crisp daylight',
      'High noon harsh sun',
      'Midnight / Deep night',
      'Dappled afternoon sunlight',
    ],
    atmosphere_weather: [
      'Clear crisp air with razor-sharp micro-contrast',
      'Floating dust motes drifting in warm sunbeams',
      'Light drizzle with glossy wet street reflections',
      'Dense volumetric fog & morning mist',
      'Blowing snow flurries with frosty breath condensation',
      'Humid tropical warmth with soft atmospheric haze',
      'Dramatic storm clouds with sun breaking through (Crepuscular rays)',
      'Smoky atmospheric haze with cinematic depth',
    ],
    shot_type: [
      'Medium close-up casual snapshot (Waist-up social framing)',
      'Close-up arm-length front selfie (Natural mobile framing)',
      '0.5x Ultra-wide dynamic angle (Youth social media perspective)',
      'Macro detail shot (1:1 close-up)',
      'Extreme close-up (ECU - Eyes/Textures)',
      'Medium close-up portrait (MCU - Chest up)',
      'Medium shot (Waist up)',
      'Full body shot (Environmental portrait)',
      'Wide environmental shot (Scene establishing)',
      'Extreme wide cinematic panorama',
      'Isometric orthographic view',
    ],
    camera_angle: [
      'Eye-level angle (Natural human perspective)',
      'Casual handheld eye-level angle (Spontaneous phone perspective)',
      'Slightly elevated selfie angle (Arm-length high angle)',
      'Low-angle heroic shot (Looking up)',
      'High-angle looking down (Elevated vantage)',
      'Bird’s-eye overhead view (Top-down 90° flat lay)',
      'Worm’s-eye view (Ground level)',
      'Slight Dutch tilt (Dynamic tension)',
      'Over-the-shoulder shot (Subject framing)',
      '45-degree tabletop angle (Food & product)',
    ],
    lens_focal_length: [
      '24mm f/1.78 iPhone 17 Pro Main Camera (1x Wide-Angle, 48MP)',
      '13mm f/2.2 iPhone 17 Pro Ultra-Wide Lens (0.5x Dynamic Social Snapshot)',
      '120mm f/2.8 iPhone 17 Pro 5x Tetraprism Telephoto (Portrait Mode)',
      '23mm f/1.9 Front TrueDepth Camera (Arm-Length Selfie Perspective)',
      '85mm f/1.4 Prime Portrait Lens',
      '50mm f/1.2 Standard Human Eye Prime',
      '35mm f/1.4 Street & Documentary Lens',
      '100mm f/2.8 1:1 Macro Lens',
      '24mm f/1.4 Wide-Angle Architectural Lens',
      '200mm f/2.8 Telephoto Lens (Background compression)',
      '400mm f/2.8 Super-Telephoto (Wildlife & sports)',
      '14mm Ultra-Wide Panoramic Lens',
      'Anamorphic Cinema Lens (2.39:1 horizontal flare)',
      'Tilt-Shift 45mm Perspective Control Lens',
    ],
    aperture_depth_of_field: [
      'Natural smartphone mobile depth-of-field, crisp foreground subject and authentic subtle mobile sensor falloff',
      'iPhone Portrait Mode computational shallow depth-of-field, realistic lens blur with natural hair edge separation',
      'Deep smartphone focus, crisp edge-to-edge mobile clarity',
      'f/1.2 ultra-shallow DoF, dreamlike creamy spherical bokeh',
      'f/1.4 razor-thin focus on subject iris, soft background falloff',
      'f/2.8 balanced portrait separation with readable context',
      'f/5.6 crisp subject detail and moderate environmental background',
      'f/8 optical sweet-spot, maximum edge-to-edge sharpness',
      'f/11 deep focus, crisp architectural detail front-to-back',
      'f/16 landscape hyperfocal infinity focus',
      'Tilt-shift selective miniature focus plane',
    ],
    camera_body_or_film: [
      'Apple iPhone 17 Pro Max (48MP Fusion Camera, Smart HDR 6, Photonic Engine)',
      'Apple iPhone 17 Pro Front TrueDepth Camera (Candid Social Selfie)',
      'Apple iPhone 17 Pro Ultra-Wide Camera (48MP Sensor, 0.5x Mode)',
      'Leica M11 Rangefinder (Full-Frame 60MP)',
      'Hasselblad H6D-100c / X2D Medium Format (100MP)',
      'Sony A7R V (High-Resolution 61MP)',
      'Canon EOS R5 Professional Digital',
      'Nikon Z9 Flagship Full-Frame',
      'ARRI Alexa 65 Large Format Digital Cinema',
      'Kodak Portra 400 35mm Color Negative Film',
      'Kodak Portra 160 Fine-Grain Film Stock',
      'Kodak Tri-X 400 Classic Black & White Film',
      'CineStill 800T Tungsten Film (Halation glow)',
      'Fujifilm Velvia 50 Vibrant Slide Film',
      'Ilford HP5 Plus 400 Fine-Grain B&W',
      'IMAX 70mm 15-Perf Film Stock',
    ],
    key_light: [
      'Warm directional golden hour sunlight streaming through openings',
      'Large diffused north-facing window softbox light',
      'Dramatic Rembrandt studio key light (45° angle with cheek triangle)',
      'Soft diffused overcast sky daylight (Natural giant softbox)',
      'Pale alpine dawn light cutting through morning clouds',
      'Cyan and magenta neon tube signage glow',
      'Overhead directional theatrical spotlight',
      'Warm tungsten table lamp or candlelight flicker',
      'Cinematic rim / edge backlighting accentuating silhouettes',
    ],
    fill_or_ambient: [
      'Soft warm bounce from sunlit terracotta cobblestones and walls',
      'High-albedo diffuse white bounce from surrounding snowbanks',
      'Subtle white foam-core reflector filling facial shadows cleanly',
      'Cool skylight blue fill on shaded areas (Natural dual-tone contrast)',
      'Warm ambient bounce from sodium streetlamps and wet pavement',
      'Architectural 2700K concealed warm LED cove lighting',
      'Deep negative fill (Black flags absorbing reflections for high contrast)',
      'Minimal ambient light for deep chiaroscuro shadow drama',
    ],
    color_temperature: [
      'Warm golden (3000K - 3200K)',
      'Neutral daylight (5500K - 5600K)',
      'Cool overcast / alpine blue (6500K - 7500K)',
      'Dual-tone warm key / cool fill contrast',
      'Warm candlelit tungsten glow (2200K - 2700K)',
      'High-contrast cybernetic neon (Cyan / Magenta)',
      'Deep twilight indigo (8000K)',
    ],
    shadow_quality: [
      'Soft diffused wrap-around shadows (Feathered gradient edges)',
      'Deep chiaroscuro high-contrast shadows with crisp cutoffs',
      'Clean crisp linear architectural geometric cast shadows',
      'Subtle natural ambient occlusion in crevices and folds',
      'Volumetric god-rays cutting through misty atmospheric shadow',
      'Open translucent shadows retaining full texture and detail',
    ],
    framing_rule: [
      'Rule of thirds (Balanced off-center tension)',
      'Centered symmetrical composition (Harmonious balance)',
      'Golden ratio spiral (Fibonacci natural eye-flow)',
      'Diagonal leading lines guiding the viewer’s eye',
      'Frame within a frame (Archway, doorway, tree branches)',
      'Negative space minimalist framing (Quiet breathing room)',
      'Dynamic triangular composition (Stable yet kinetic)',
    ],
    focal_point: [
      'Sharp iris and natural specular catchlights in subject’s eyes',
      'Tactile hands and textured artisanal tool in sharp focus',
      'Glistening surface sear marks and saffron emulsion drops',
      'The glowing architectural residence reflecting into the still water',
      'Frosted whiskers and piercing predatory gaze of the animal',
      'The tension in the wet hauling net and dripping water beads',
      'Embossed gold foil typography on the center of the bottle',
      'The central intersection of architectural perspective lines',
    ],
    foreground_elements: [
      'Softly blurred wooden workbench corner in the bottom foreground',
      'Wind-blown snow flurries and ice crystals drifting in front of lens',
      'Glass-like dark edge of the infinity reflection pool in low foreground',
      'Micro-drops of water on a transparent glass railing in soft focus',
      'Out-of-focus tree leaves and branches naturally framing the top edges',
      'A delicate scatter of salt crystals and herbs in soft foreground bokeh',
      'Wet dark gunwale of the boat with suspended dripping water droplets',
      'Clean unobstructed foreground with clear direct line of sight',
    ],
    perspective: [
      'Natural 1-point linear human eye perspective',
      'Dramatic 2-point architectural perspective (Shift-lens, straight verticals)',
      '3-point towering perspective looking upward',
      'Isometric 30° parallel orthographic projection',
      'Flat-lay 90° direct top-down view',
      'Compressed telephoto perspective with flattened layers',
    ],
    medium: [
      'Authentic Smartphone Mobile Photography (Apple iPhone 17 Pro)',
      'Candid Social Media Snapshot (Instagram / BeReal style)',
      'Photorealistic photography',
      '35mm Analog Film Photography',
      'Medium Format Editorial Photography',
      'Documentary Photojournalism (Magnum Photos style)',
      'High-End Commercial Studio Photography',
      'Cinematic film still (35mm / 70mm cinema stock)',
      'Macro close-up photography',
      '3D Octane / Unreal Engine 5 Render',
      'Digital concept art illustration',
      'Oil painting with impasto brushstrokes',
    ],
    aesthetic: [
      'Candid Realistic Social Media Lifestyle (Authentic unposed snapshot, true-to-life mobile sensor)',
      'BeReal / Instagram Casual Snapshot (Natural ambient lighting, authentic mobile look)',
      'Candid Realistic Documentary (Unposed, authentic life)',
      'Raw Naturalistic Portraiture (Human imperfections, authentic soul)',
      'Editorial High-Fashion Magazine (Vogue / Harper’s Bazaar)',
      'National Geographic Wildlife & Nature (Documentary authenticity)',
      'Brutalist Architectural Digest (Clean geometry, tactile materials)',
      'Michelin Tabletop Food Photography (Bon Appétit elegance)',
      'Gritty Cyberpunk Noir (Neon rain, high contrast)',
      'Clean Scandinavian Minimalism (Kinfolk simplicity, airy light)',
      'Warm 1970s Nostalgic Cinema (Vintage grain, warm pastels)',
      'Dark Fantasy Souls-like (Elden grandeur, melancholic ruined majesty)',
    ],
    color_grading: [
      'Clean neutral iPhone Photonic Engine color grade (Smart HDR 6, authentic true-to-life skin tones)',
      'Instagram Warm Lifestyle VSCO Mobile Grade (Subtle warm highlights, gentle shadow lift)',
      'Warm nostalgic Kodak Portra film grade (Gentle roll-off, warm skin tones)',
      'Cinematic Teal and Orange (Hollywood blockbuster contrast)',
      'Clean neutral documentary grade (True-to-life colors and white balance)',
      'Rich velvety blacks with crisp vibrant micro-contrast',
      'Muted desaturated bleach bypass (Gritty editorial feel)',
      'High-key bright airy pastel grade (Soft highlights, gentle shadow lift)',
      'Monochrome classic silver-halide black & white (Ilford / Tri-X contrast)',
      'Cool alpine desaturated grade with crisp whites and deep slate blues',
    ],
    quality_tags: [
      'candid mobile snapshot',
      'photonic engine micro-details',
      'authentic phone camera texture',
      'subtle mobile sensor noise',
      'natural skin pores & micro-details',
      'subsurface scattering (SSS)',
      'fine 35mm film grain',
      'hyper-detailed textures',
      '8k resolution',
      'optical bokeh circles',
      'specular catchlights in eyes',
      'physically based rendering (PBR)',
      'ray-traced reflections',
      'anamorphic lens flare',
      'accurate depth of field falloff',
    ],
    font_style: [
      'Bold geometric sans-serif (Futura / Helvetica)',
      'Luxury high-contrast editorial serif (Didot / Bodoni)',
      'Minimalist modernist typography (Grotesk / Akzidenz)',
      'Glowing neon tube cursive signage',
      'Hand-brushed calligraphy & ink lettering',
      'Vintage distressed letterpress & woodblock type',
      'Cyberpunk stenciled holographic HUD',
    ],
    typography_placement: [
      'Hot-stamped gold foil on cream cotton paper label centered on product',
      'Acid-etched brass plaque with recessed black-filled lettering',
      'Vintage convex enameled metal street sign with weathered corners',
      'Clean opaque white silkscreen print directly onto glass container',
      'Black industrial stencil lettering printed onto raw board-formed concrete',
      'Hand-blown neon tube signage mounted onto weathered brick background',
      'Clean modern editorial lower-third title overlay (Swiss design)',
    ],
    aspect_ratio: ['16:9', '9:16', '1:1', '4:5', '3:2', '2:3', '21:9'],
    negative_prompt: [
      'Fotografia Realistica: plastic skin, airbrushed, cartoon, CGI, 3D render, smooth doll skin, oversharpened, fake eyes, deformed hands, extra fingers, watermark, blurry, oversaturated',
      'Fotografia Analogica 35mm: digital video look, modern HDR, CGI, plastic, smooth skin, airbrush, 3d model, sterile lighting, oversaturated colors, watermark',
      'Architettura & Design: crooked verticals, distorted perspective, blurry textures, CGI render look, noisy artifacts, overblown highlights, cluttered scene',
      'Food & Tabletop: plastic food, fake props, dry surface, unappetizing, harsh flash, blurry, dirty dishes, artificial colors',
      'Universal Anti-Artifact: blurry, low resolution, bad anatomy, bad hands, missing fingers, extra limbs, mutated, watermark, signature, username, jpeg artifacts',
    ],
    character_gender_age: [
      'Young woman, 26 years old',
      'Man in early 30s, 32 years old',
      'Distinguished mature man, 54 years old',
      'Teenage protagonist, 18 years old',
      'Elderly artisan / mentor, 68 years old',
      'Athletic young female operative, 24 years old',
    ],
    character_eyes: [
      'Almond-shaped hazel eyes with amber flecks and warm natural catchlight',
      'Piercing pale blue eyes with dark limbal rings and focused gaze',
      'Deep warm espresso brown eyes with subtle smile lines',
      'Intense dark eyes with sharp defined double eyelids',
      'Striking emerald green eyes with subtle gold sectoral heterochromia',
    ],
    character_hair: [
      'Chestnut wavy shoulder-length hair with loose face-framing strands',
      'Short textured crop with clean tapered fade on sides and back',
      'Messy raven-black undercut tied in a small half-bun',
      'Long platinum blonde hair with natural wave and center part',
      'Silver-streaked dark hair with slicked-back gentleman styling',
      'Coily textured natural afro with sculpted edges',
    ],
    character_marks: [
      'Natural delicate freckles dusted across the bridge of the nose and cheekbones',
      'Small faint vertical scar bisecting the right eyebrow',
      'Subtle beauty mark just below the outer corner of the left eye',
      'Distinctive geometric cybernetic neural interface at the left temple',
      'Weathered laugh lines around the eyes and authentic skin micro-pores',
      'Intricate minimalist black-ink geometric tattoo on the right collarbone',
    ],
    character_build: [
      'Slender, athletic build with upright natural posture',
      'Broad-shouldered, muscular athletic build, confident stance',
      'Tall and lean with elegant poised frame',
      'Compact, agile gymnast build with defined musculature',
      'Stocky, rugged, sturdy physique with broad chest',
    ],
    character_outfit: [
      'Neutral heather-grey seamless athletic sports crop top and high-waisted biker shorts',
      'Form-fitting neutral off-white ribbed racerback tank top and dark-grey compression athletic shorts',
      'Minimalist form-fitting neutral grey sleeveless athletic bodysuit / studio leotard',
      'Fitted minimalist white cotton crewneck t-shirt and neutral slate-grey tailored shorts',
      'Textured ivory linen button-up shirt and high-waisted charcoal trousers',
      'Matte black waterproof techwear bomber jacket with sealed seams and dark cargo pants',
    ],
    character_background: [
      'Neutral light-grey seamless studio void with soft natural floor shadow',
      'Pristine seamless white cyclorama studio wall with high-key soft lighting',
      'Minimalist dark charcoal grey studio backdrop with subtle rim illumination',
      'Industrial textured concrete studio wall with neutral diffuse ambient light',
    ],
  };

  readonly builtInTemplates: PromptTemplate[] = [
    {
      id: 'character-sheet-turnaround-360',
      name: 'Character Turnaround 360° Realistico',
      category: 'Schede Personaggio (Consistenza)',
      badgeColor: '#ff79c6',
      description: 'Foglio modello multi-angolo (Frontale, 3/4, Profilo, Posteriore) per consistenza perfetta del personaggio in Midjourney (--cref) e FLUX.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Character Turnaround: Elena Vance (4 Viste)',
          target_engine: 'universal',
        },
        character_sheet: {
          enabled: true,
          mode: 'sheet_generation',
          character_name: 'Elena Vance',
          gender_and_age: 'Young woman, 26 years old',
          ethnicity_and_skin: 'Warm olive skin with natural subtle freckles across the bridge of the nose',
          eye_details: 'Almond-shaped hazel eyes with amber gold flecks and dark lash line',
          hair_details: 'Chestnut brown wavy shoulder-length hair parted slightly off-center',
          distinctive_marks: 'Tiny faint beauty mark under the left eye, natural skin pores and micro-texture',
          body_build: 'Athletic, slender build, upright posture',
          signature_outfit: 'Textured ivory linen button-up shirt and high-waisted charcoal trousers',
          signature_props: 'Delicate vintage gold signet ring on the right ring finger',
          layout_mode: 'turnaround_4_views',
          views: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view'],
          background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
          cref_url: '',
        },
        subject: {
          primary_entity: 'Elena Vance, 26 year old woman',
          description: 'Turnaround character model sheet showing the same woman from four simultaneous angles in a single frame',
          pose_or_action: 'Standing in relaxed model sheet poses: front view, three-quarter view, side profile view, and back view',
          expression_or_mood: 'Calm, neutral, consistent facial expression across all views',
          clothing_or_materials: 'Textured ivory linen button-up shirt and high-waisted charcoal trousers',
          placement: 'Center frame, horizontal lineup',
        },
        additional_subjects: [],
        scene: {
          environment: 'Seamless neutral light-grey studio cyclorama',
          background_details: 'Pure uniform studio void, soft shadow at feet, zero clutter, perfect for character isolation',
          time_of_day: 'Overcast morning (Diffused light)',
          atmosphere_weather: 'Clear crisp air with razor-sharp micro-contrast',
        },
        camera: {
          shot_type: 'Full body shot (Environmental portrait)',
          angle: 'Eye-level angle (Natural human perspective)',
          lens_focal_length: '85mm f/1.4 Prime Portrait Lens',
          aperture_depth_of_field: 'f/8 optical sweet-spot, maximum edge-to-edge sharpness',
          camera_body_or_film: 'Hasselblad H6D-100c / X2D Medium Format (100MP)',
        },
        lighting: {
          key_light: 'Large diffused north-facing window softbox light',
          fill_or_ambient: 'Subtle white foam-core reflector filling facial shadows cleanly',
          color_temperature: 'Neutral daylight (5500K - 5600K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#282a36', '#d6d8e6', '#e0a96d', '#6272a4'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'Consistent facial features and costume details across all four angles',
          foreground_elements: 'Clean unobstructed foreground with clear direct line of sight',
          perspective: 'Natural 1-point linear human eye perspective',
        },
        style_and_rendering: {
          medium: 'Photorealistic photography',
          aesthetic: 'Raw Naturalistic Portraiture (Human imperfections, authentic soul)',
          color_grading: 'Clean neutral documentary grade (True-to-life colors and white balance)',
          quality_tags: [
            'natural skin pores & micro-details',
            '8k resolution',
            'hyper-detailed textures',
            'consistent character turnaround',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Bold geometric sans-serif (Futura / Helvetica)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'inconsistent character, different faces, distorted anatomy, cartoon, blurry, busy background, cropped limbs',
          seed: 104928,
          stylize: 100,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'character-sheet-cyberpunk-agent',
      name: 'Cyberpunk Operative Model Sheet',
      category: 'Schede Personaggio (Consistenza)',
      badgeColor: '#8be9fd',
      description: 'Foglio modello multi-vista di personaggio cyberpunk con impianto neurale e abbigliamento techwear per referenza visiva costante.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Character Turnaround: Ren Takahashi',
          target_engine: 'universal',
        },
        character_sheet: {
          enabled: true,
          mode: 'sheet_generation',
          character_name: 'Ren Takahashi',
          gender_and_age: 'Man in early 30s, 31 years old',
          ethnicity_and_skin: 'East Asian heritage, pale smooth complexion with sharp defined jawline',
          eye_details: 'Sharp hooded dark amber eyes with intense focused gaze',
          hair_details: 'Raven black textured undercut fade with loose strands over forehead',
          distinctive_marks: 'Sleek subcutaneous chrome neural interface glow port at the left temple',
          body_build: 'Lean athletic runner physique, broad shoulders',
          signature_outfit: 'Matte black waterproof techwear bomber jacket with sealed seams and dark cargo pants',
          signature_props: 'Titanium minimalist cuff bracelet on right wrist',
          layout_mode: 'turnaround_4_views',
          views: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view'],
          background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
          cref_url: '',
        },
        subject: {
          primary_entity: 'Ren Takahashi, 31 year old operative',
          description: 'Character design turnaround sheet showing front, 3/4, side, and rear angles in a single frame',
          pose_or_action: 'Standing upright in neutral character model turnaround lineup',
          expression_or_mood: 'Focused, solemn, stoic expression',
          clothing_or_materials: 'Matte black waterproof techwear bomber jacket and tactical dark trousers',
          placement: 'Center frame, horizontal lineup',
        },
        additional_subjects: [],
        scene: {
          environment: 'Minimalist dark grey studio void',
          background_details: 'Clean uniform dark background with subtle floor contact shadow',
          time_of_day: 'Midnight / Deep night',
          atmosphere_weather: 'Clear crisp air with razor-sharp micro-contrast',
        },
        camera: {
          shot_type: 'Full body shot (Environmental portrait)',
          angle: 'Eye-level angle (Natural human perspective)',
          lens_focal_length: '85mm f/1.4 Prime Portrait Lens',
          aperture_depth_of_field: 'f/8 optical sweet-spot, maximum edge-to-edge sharpness',
          camera_body_or_film: 'Sony A7R V (High-Resolution 61MP)',
        },
        lighting: {
          key_light: 'Subtle cool rim / edge backlighting accentuating silhouettes',
          fill_or_ambient: 'Soft diffuse studio fill light',
          color_temperature: 'Dual-tone warm key / cool fill contrast',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#00f0ff', '#bd93f9', '#282a36', '#f8f8f2'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'Consistent face and techwear costume details across all views',
          foreground_elements: 'Clean unobstructed foreground with clear direct line of sight',
          perspective: 'Natural 1-point linear human eye perspective',
        },
        style_and_rendering: {
          medium: 'Cinematic film still',
          aesthetic: 'Gritty Cyberpunk Noir',
          color_grading: 'Rich velvety blacks with crisp vibrant micro-contrast',
          quality_tags: [
            'hyper-detailed textures',
            '8k resolution',
            'character turnaround sheet',
            'subsurface scattering (SSS)',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Cyberpunk stenciled holographic HUD',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'inconsistent character, deformed face, cartoon, blurry, noisy background',
          seed: 492103,
          stylize: 120,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'character-sheet-expressions-grid',
      name: 'Griglia Espressioni Facciali (Expression Sheet)',
      category: 'Schede Personaggio (Consistenza)',
      badgeColor: '#50fa7b',
      description: 'Foglio modello con 6 espressioni facciali dello stesso personaggio (neutra, sorriso, intensa, sorpresa, seria, risata) per consistenza emotiva nelle scene.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Expression Sheet: Elena Vance (6 Espressioni)',
          target_engine: 'universal',
        },
        character_sheet: {
          enabled: true,
          mode: 'sheet_generation',
          character_name: 'Elena Vance',
          gender_and_age: 'Young woman, 26 years old',
          ethnicity_and_skin: 'Warm olive skin with natural subtle freckles across the bridge of the nose',
          eye_details: 'Almond-shaped hazel eyes with amber gold flecks',
          hair_details: 'Chestnut brown wavy shoulder-length hair parted slightly off-center',
          distinctive_marks: 'Tiny faint beauty mark under the left eye, natural skin pores',
          body_build: 'Slender, athletic build',
          signature_outfit: 'Textured ivory linen button-up shirt',
          signature_props: 'Small gold hoop earrings',
          layout_mode: 'expressions_grid',
          views: ['Neutral expression', 'Spontaneous warm smile', 'Serious intense gaze', 'Surprised look', 'Quiet contemplation', 'Genuine laugh'],
          background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
          cref_url: '',
        },
        subject: {
          primary_entity: 'Elena Vance, 26 year old woman',
          description: 'Facial expression sheet showing a 2x3 grid of headshots of the exact same woman with six distinct emotions: neutral, smiling, intense, surprised, pensive, laughing',
          pose_or_action: 'Head-and-shoulders portraits arranged in a clean grid layout',
          expression_or_mood: 'Diverse emotions while keeping identical facial features, eye shape, and hair styling',
          clothing_or_materials: 'Ivory linen collar visible in each portrait',
          placement: 'Center frame, 2x3 grid layout',
        },
        additional_subjects: [],
        scene: {
          environment: 'High-key white cyclorama photo studio',
          background_details: 'Seamless clean white studio background',
          time_of_day: 'Midday crisp daylight',
          atmosphere_weather: 'Clear crisp air with razor-sharp micro-contrast',
        },
        camera: {
          shot_type: 'Medium close-up portrait (MCU)',
          angle: 'Eye-level angle (Natural human perspective)',
          lens_focal_length: '85mm f/1.4 Prime Portrait Lens',
          aperture_depth_of_field: 'f/4 sharp facial features and soft background falloff',
          camera_body_or_film: 'Leica M11 Rangefinder (Full-Frame 60MP)',
        },
        lighting: {
          key_light: 'Large diffused north-facing window softbox light',
          fill_or_ambient: 'Subtle white foam-core reflector filling facial shadows cleanly',
          color_temperature: 'Neutral daylight (5500K - 5600K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#f8fafc', '#e0a96d', '#64748b', '#0f172a'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'Consistent eye shape and facial geometry across all six emotional portraits',
          foreground_elements: 'Clean unobstructed foreground with clear direct line of sight',
          perspective: 'Natural 1-point linear human eye perspective',
        },
        style_and_rendering: {
          medium: 'Photorealistic photography',
          aesthetic: 'Raw Naturalistic Portraiture (Human imperfections, authentic soul)',
          color_grading: 'Clean neutral documentary grade (True-to-life colors and white balance)',
          quality_tags: [
            'natural skin pores & micro-details',
            '8k resolution',
            'expression sheet',
            'specular catchlights in eyes',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Bold geometric sans-serif (Futura / Helvetica)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'inconsistent character, different people, distorted facial features, cartoon, blurry, busy background',
          seed: 739102,
          stylize: 80,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'iphone-17-pro-social-candid',
      name: 'iPhone 17 Pro: Social Candid Snapshot',
      category: 'Fotografia & Ritratti',
      badgeColor: '#50fa7b',
      description: 'Foto realistica da social media (Instagram/TikTok/BeReal) scattata con Apple iPhone 17 Pro Max: texture autentica della pelle, luce naturale diffusa, zero aria da rendering 3D o studio finto.',
      spec: {
        meta: {
          version: '2.0',
          title: 'iPhone 17 Pro Social Candid in Outdoor Cafe',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Attractive 24-year-old person with natural unedited features',
          description: 'Spontaneous casual lifestyle portrait, relaxed natural smile, unposed authenticity, genuine eye warmth',
          pose_or_action: 'Sitting casually at an outdoor bistro table, holding an iced drink, looking slightly off-camera with a genuine laugh',
          expression_or_mood: 'Warm spontaneous laugh, authentic cheerful expression, joyful social media candid vibe',
          clothing_or_materials: 'Oversized beige knit sweater over a simple white tee, minimalist silver hoop earrings',
          placement: 'Slightly off-center right according to rule of thirds',
        },
        additional_subjects: [],
        scene: {
          environment: 'Sunlit outdoor terrace cafe on a lively European pedestrian street',
          background_details: 'Softly blurred cobblestone street, outdoor greenery in terracotta planters, warm ambient afternoon cafe crowd',
          time_of_day: 'Late afternoon golden hour (Soft ambient backlight)',
          atmosphere_weather: 'Warm sunny afternoon with soft clear air',
        },
        camera: {
          shot_type: 'Medium close-up casual snapshot (Waist-up social framing)',
          angle: 'Eye-level natural human perspective (Handheld smartphone angle)',
          lens_focal_length: '24mm f/1.78 iPhone 17 Pro Main Camera (1x Wide-Angle, 48MP)',
          aperture_depth_of_field: 'Natural smartphone mobile depth-of-field, crisp foreground subject and authentic subtle mobile sensor falloff',
          camera_body_or_film: 'Apple iPhone 17 Pro Max (48MP Fusion Camera, Smart HDR 6, Photonic Engine)',
        },
        lighting: {
          key_light: 'Warm natural afternoon sunlight streaming from side-back through cafe awning',
          fill_or_ambient: 'Soft diffuse ambient bounce from light wooden table and sunlit pavement',
          color_temperature: 'Neutral daylight with warm golden undertones (5200K)',
          shadow_quality: 'Natural soft smartphone mobile shadows (Clean feathered edges)',
          color_palette: ['#e0a96d', '#282a36', '#f8f8f2', '#6272a4'],
        },
        composition: {
          framing_rule: 'Casual Rule of Thirds (Authentic unposed framing)',
          focal_point: 'Natural facial features, joyful eyes, and realistic skin micro-pores',
          foreground_elements: 'Softly blurred edge of a ceramic cafe cup in bottom foreground',
          perspective: 'Natural 1-point handheld smartphone perspective',
        },
        style_and_rendering: {
          medium: 'Authentic Smartphone Mobile Photography (Apple iPhone 17 Pro)',
          aesthetic: 'Candid Realistic Social Media Lifestyle (Authentic unposed snapshot, true-to-life mobile sensor)',
          color_grading: 'Clean neutral iPhone Photonic Engine color grade (Smart HDR 6, authentic true-to-life skin tones)',
          quality_tags: [
            'candid mobile snapshot',
            'natural unedited skin pores',
            'photonic engine micro-details',
            'authentic phone camera texture',
            'subtle mobile sensor noise',
            '8k resolution',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Bold geometric sans-serif (Futura / Helvetica)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '4:5',
          negative_prompt: 'plastic skin, airbrushed, cartoon, CGI, 3D render, smooth doll skin, oversharpened, studio lighting backdrop, fake eyes, deformed hands, extra fingers, watermark, blurry',
          seed: 481920,
          stylize: 60,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'street-portrait-analog',
      name: 'Candid 35mm Analog Street Portrait',
      category: 'Fotografia Realistica',
      badgeColor: '#ffb86c',
      description: 'Ritratto realistico su pellicola Kodak Portra 400 a 35mm con luce dorata naturale, texture autentica della pelle, rughe d’espressione e pori visibili.',
      spec: {
        meta: {
          version: '2.0',
          title: '35mm Candid Street Portrait in Trastevere',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Elderly Italian artisan with expressive weathered face and silver hair',
          description: 'Authentic skin texture with fine laugh lines, natural pores, subtle freckles, warm kind brown eyes, silver stubble and realistic subsurface scattering',
          pose_or_action: 'Sitting outside a rustic workshop holding a wooden carving chisel, looking candidly toward the lens with a subtle natural smile',
          expression_or_mood: 'Warm, wise, authentic, contented',
          clothing_or_materials: 'Faded indigo cotton chore jacket over an off-white unbleached linen shirt with rolled-up sleeves',
          placement: 'Foreground-left (Rule of thirds)',
        },
        additional_subjects: [],
        scene: {
          environment: 'Sunlit narrow cobblestone alley in Trastevere Rome at golden hour',
          background_details: 'Warm terracotta plaster walls, potted basil and softly blurred hanging laundry in creamy bokeh',
          time_of_day: 'Golden hour sunset',
          atmosphere_weather: 'Clear crisp air with soft airborne dust in sunbeams',
        },
        camera: {
          shot_type: 'Medium close-up portrait (MCU)',
          angle: 'Eye-level angle',
          lens_focal_length: '50mm Standard Prime Lens',
          aperture_depth_of_field: 'f/2.8 soft background separation',
          camera_body_or_film: 'Leica M11 Rangefinder with Kodak Portra 400 35mm Film',
        },
        lighting: {
          key_light: 'Warm directional golden hour sunlight streaming through openings',
          fill_or_ambient: 'Soft warm bounce from sunlit terracotta cobblestones and walls',
          color_temperature: 'Warm golden (3000K - 3200K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#e0a96d', '#773f1a', '#201e1f', '#f4e9dc'],
        },
        composition: {
          framing_rule: 'Rule of thirds',
          focal_point: 'The expressive eyes and the weathered texture around the temple',
          foreground_elements: 'Softly blurred wooden workbench corner in the bottom foreground',
          perspective: 'Natural 1-point linear perspective',
        },
        style_and_rendering: {
          medium: '35mm Analog Film Photography',
          aesthetic: 'Raw Naturalistic Portraiture (Human imperfections, authentic soul)',
          color_grading: 'Warm nostalgic Kodak Portra film grade',
          quality_tags: [
            'natural skin pores & micro-details',
            'subsurface scattering (SSS)',
            'fine 35mm film grain',
            '8k resolution',
            'hyper-detailed textures',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Vintage distressed letterpress',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '4:5',
          negative_prompt: 'plastic skin, airbrushed, cartoon, CGI, 3D render, smooth doll skin, oversharpened, fake eyes, deformed hands, extra fingers, watermark, blurry, oversaturated',
          seed: 582103,
          stylize: 120,
          chaos: 3,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'wildlife-national-geographic',
      name: 'National Geographic Wildlife Documentary',
      category: 'Fotografia Realistica',
      badgeColor: '#50fa7b',
      description: 'Fotografia naturalistica ultra-dettagliata con teleobiettivo 400mm f/2.8: leopardo delle nevi tra le vette innevate con peli, brina e riflessi glaciali.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Snow Leopard in Himalayan Blizzard',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Wild snow leopard (Panthera uncia) perched on a jagged alpine ledge',
          description: 'Dense thick winter fur with individual hairs visible, microscopic frost crystals on whiskers, intense pale green-gold predatory eyes with sharp specular catchlights',
          pose_or_action: 'Crouched low in vigilant hunting posture, scanning the valley below, thick ringed tail wrapped around paws for warmth',
          expression_or_mood: 'Vigilant, wild, untamed majesty of apex nature',
          clothing_or_materials: 'Dense natural spotted winter fur with thick insulating undercoat, wet black leather nose and sharp claws gripping frozen granite',
          placement: 'Foreground-right (Rule of thirds)',
        },
        additional_subjects: [],
        scene: {
          environment: 'High-altitude Himalayan mountain ridge at 4500 meters during snow flurries',
          background_details: 'Towering snow-dusted jagged mountain peaks fading into blizzard clouds',
          time_of_day: 'Dawn / Sunrise mist',
          atmosphere_weather: 'Blowing snow flurries with frosty breath condensation',
        },
        camera: {
          shot_type: 'Medium shot (Waist up)',
          angle: 'Eye-level angle',
          lens_focal_length: '400mm f/2.8 Super-Telephoto (Wildlife & sports)',
          aperture_depth_of_field: 'f/2.8 balanced portrait separation with readable context',
          camera_body_or_film: 'Nikon Z9 Flagship Full-Frame',
        },
        lighting: {
          key_light: 'Pale alpine dawn light cutting through morning clouds',
          fill_or_ambient: 'High-albedo diffuse white bounce from surrounding snowbanks',
          color_temperature: 'Cool overcast / alpine blue (6500K - 7500K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#d8dee9', '#88c0d0', '#4c566a', '#1e1f29'],
        },
        composition: {
          framing_rule: 'Golden ratio spiral (Fibonacci natural eye-flow)',
          focal_point: 'Frosted whiskers and piercing predatory gaze of the animal',
          foreground_elements: 'Wind-blown snow flurries and ice crystals drifting in front of lens',
          perspective: 'Compressed telephoto perspective with flattened layers',
        },
        style_and_rendering: {
          medium: 'Photorealistic photography',
          aesthetic: 'National Geographic Wildlife & Nature (Documentary authenticity)',
          color_grading: 'Cool alpine desaturated grade with crisp whites and deep slate blues',
          quality_tags: [
            'hyper-detailed textures',
            '8k resolution',
            'specular catchlights in eyes',
            'physically based rendering (PBR)',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Bold geometric sans-serif (Futura / Helvetica)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'zoo, cage, human, cartoon, CGI, blurry, low resolution, stuffed animal, fake fur, oversaturated, painting',
          seed: 923841,
          stylize: 140,
          chaos: 2,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'architectural-digest-modernist',
      name: 'Architectural Digest Modernist Villa',
      category: 'Fotografia Realistica',
      badgeColor: '#8be9fd',
      description: 'Fotografia editoriale d’architettura su medio formato Hasselblad: villa modernista a sbalzo sul lago al crepuscolo, cemento armato e specchi d’acqua.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Minimalist Concrete & Glass Pavilion on Lake Como',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Modernist cantilevered concrete and glass architectural residence',
          description: 'Tactile architectural surfaces: board-formed concrete grain, tie-holes, low-iron structural glass and warm cedar slat louvers',
          pose_or_action: 'Seamless indoor-outdoor living pavilion glowing with warm recessed lighting reflecting into an infinity reflection pool',
          expression_or_mood: 'Serene, timeless, monumental, minimalist sophistication',
          clothing_or_materials: 'Board-formed grey concrete, dark bronze anodized aluminum window mullions, Pietra Serena limestone and oiled oak',
          placement: 'Center frame',
        },
        additional_subjects: [],
        scene: {
          environment: 'Cantilevered modernist villa overlooking Lake Como at twilight',
          background_details: 'Mirror-like lake surface, distant silhouetted pre-alpine ridges and manicured olive trees',
          time_of_day: 'Blue hour twilight',
          atmosphere_weather: 'Clear crisp air with razor-sharp micro-contrast',
        },
        camera: {
          shot_type: 'Wide environmental shot',
          angle: 'Eye-level angle',
          lens_focal_length: '24mm f/1.4 Wide-Angle Architectural Lens',
          aperture_depth_of_field: 'f/11 deep focus, crisp architectural detail front-to-back',
          camera_body_or_film: 'Hasselblad H6D-100c / X2D Medium Format (100MP)',
        },
        lighting: {
          key_light: 'Deep twilight indigo ambient sky light',
          fill_or_ambient: 'Architectural 2700K concealed warm LED cove lighting',
          color_temperature: 'Dual-tone warm key / cool fill contrast',
          shadow_quality: 'Clean crisp linear architectural geometric cast shadows',
          color_palette: ['#1e293b', '#38bdf8', '#fbbf24', '#f8fafc'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'The glowing architectural residence reflecting into the still water',
          foreground_elements: 'Glass-like dark edge of the infinity reflection pool in low foreground',
          perspective: 'Dramatic 2-point architectural perspective (Shift-lens, straight verticals)',
        },
        style_and_rendering: {
          medium: 'Medium Format Editorial Photography',
          aesthetic: 'Brutalist Architectural Digest (Clean geometry, tactile materials)',
          color_grading: 'Clean neutral documentary grade (True-to-life colors and white balance)',
          quality_tags: [
            '8k resolution',
            'hyper-detailed textures',
            'ray-traced reflections',
            'physically based rendering (PBR)',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Minimalist modernist typography (Grotesk / Akzidenz)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'crooked verticals, distorted perspective, blurry textures, CGI render look, noisy artifacts, overblown highlights, cluttered scene, cartoon',
          seed: 341890,
          stylize: 100,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'gourmet-culinary-artisan',
      name: 'Michelin Gastronomy & Food Photography',
      category: 'Fotografia Realistica',
      badgeColor: '#ff79c6',
      description: 'Food photography di alta cucina con lente macro 100mm: piatto gourmet impiattato a mano con crosticina dorata, emulsione lucida e micro-erbe.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Artisanal Seared Scallop with Saffron Foam',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Pan-seared jumbo sea scallop with saffron emulsion on charcoal stoneware',
          description: 'Glistening caramelized sear marks, vibrant herb oil droplets, delicate steam wisps, sea salt flakes and micro-sorrel leaves',
          pose_or_action: 'Artfully plated in the shallow center of the plate with a faint wisp of rising steam',
          expression_or_mood: 'Refined, quiet luxury, understated elegance and sensory balance',
          clothing_or_materials: 'Charcoal volcanic textured stoneware ceramic, golden saffron foam and gold-plated brass cutlery',
          placement: 'Center frame',
        },
        additional_subjects: [],
        scene: {
          environment: 'Artisanal chef’s table in a Michelin-starred open-concept kitchen',
          background_details: 'Out-of-focus dark rustic walnut tables, warm copper cookware and dim Edison bulbs',
          time_of_day: 'Overcast morning (Diffused light)',
          atmosphere_weather: 'Floating dust motes drifting in warm sunbeams',
        },
        camera: {
          shot_type: 'Macro detail shot (1:1 close-up)',
          angle: '45-degree tabletop angle (Food & product)',
          lens_focal_length: '100mm f/2.8 1:1 Macro Lens',
          aperture_depth_of_field: 'f/2.8 soft background separation',
          camera_body_or_film: 'Sony A7R V (High-Resolution 61MP)',
        },
        lighting: {
          key_light: 'Large diffused north-facing window softbox light',
          fill_or_ambient: 'Subtle white foam-core reflector filling facial shadows cleanly',
          color_temperature: 'Neutral daylight (5500K - 5600K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#d97706', '#10b981', '#18181b', '#fef3c7'],
        },
        composition: {
          framing_rule: 'Rule of thirds',
          focal_point: 'Glistening surface sear marks and saffron emulsion drops',
          foreground_elements: 'A delicate scatter of salt crystals and herbs in soft foreground bokeh',
          perspective: 'Natural 1-point linear perspective',
        },
        style_and_rendering: {
          medium: 'High-End Commercial Studio Photography',
          aesthetic: 'Michelin Tabletop Food Photography (Bon Appétit elegance)',
          color_grading: 'Clean neutral documentary grade (True-to-life colors and white balance)',
          quality_tags: [
            'hyper-detailed textures',
            '8k resolution',
            'subsurface scattering (SSS)',
            'optical bokeh circles',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Luxury high-contrast editorial serif (Didot / Bodoni)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '4:5',
          negative_prompt: 'plastic food, fake props, dry surface, unappetizing, harsh flash, blurry, dirty dishes, artificial colors, cartoon',
          seed: 819234,
          stylize: 130,
          chaos: 1,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'cinematic-documentary-fisherman',
      name: 'Cinematic Documentary 35mm Reportage',
      category: 'Fotografia Realistica',
      badgeColor: '#bd93f9',
      description: 'Fotoreportage documentario d’autore stile Magnum Photos: pescatore all’alba nella laguna avvolta da foschia, luce dorata radente e grana fine.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Lagoon Fisherman at Dawn in Venice',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Lagoon fisherman at dawn hauling a dripping hemp net from a wooden boat',
          description: 'Weathered hands with defined tendons, salt-sprayed stubble and focused sun-kissed gaze, fine laugh lines and sea spray droplets',
          pose_or_action: 'Standing in the bow of an aged wooden lagoon boat, hauling the dripping hemp net from the glassy water',
          expression_or_mood: 'Proud, dignified, resilient with sharp piercing determination',
          clothing_or_materials: 'Heavy-duty yellow rubberized foul-weather bib overalls and deck boots over a dark ribbed knit wool sweater',
          placement: 'Foreground-left (Rule of thirds)',
        },
        additional_subjects: [],
        scene: {
          environment: 'Venetian lagoon at dawn with low-hanging morning mist and calm waters',
          background_details: 'Aged wooden mooring poles (briccole) and distant church campanile silhouettes in the fog',
          time_of_day: 'Dawn / Sunrise mist',
          atmosphere_weather: 'Dense volumetric fog & morning mist',
        },
        camera: {
          shot_type: 'Medium shot (Waist up)',
          angle: 'Low-angle heroic shot',
          lens_focal_length: '35mm f/1.4 Street & Documentary Lens',
          aperture_depth_of_field: 'f/5.6 crisp subject detail and moderate environmental background',
          camera_body_or_film: 'Leica M11 Rangefinder (Full-Frame 60MP)',
        },
        lighting: {
          key_light: 'Warm directional golden hour sunlight streaming through openings',
          fill_or_ambient: 'Cool skylight blue fill on shaded areas (Natural dual-tone contrast)',
          color_temperature: 'Dual-tone warm key / cool fill contrast',
          shadow_quality: 'Volumetric god-rays cutting through misty atmospheric shadow',
          color_palette: ['#eab308', '#0284c7', '#334155', '#f8fafc'],
        },
        composition: {
          framing_rule: 'Diagonal leading lines guiding the viewer’s eye',
          focal_point: 'The tension in the wet hauling net and dripping water beads',
          foreground_elements: 'Wet dark gunwale of the boat with suspended dripping water droplets',
          perspective: 'Natural 1-point linear perspective',
        },
        style_and_rendering: {
          medium: 'Documentary Photojournalism (Magnum Photos style)',
          aesthetic: 'Candid Realistic Documentary (Unposed, authentic life)',
          color_grading: 'Cinematic Teal and Orange',
          quality_tags: [
            'fine 35mm film grain',
            'natural skin pores & micro-details',
            '8k resolution',
            'hyper-detailed textures',
          ],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Bold geometric sans-serif (Futura / Helvetica)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'CGI, 3D render, cartoon, digital art, plastic skin, distorted anatomy, modern gadgets, blurry, oversaturated',
          seed: 472910,
          stylize: 150,
          chaos: 4,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'cyberpunk-noir',
      name: 'Cyberpunk Noir Portrait',
      category: 'Cinema & Sci-Fi',
      badgeColor: '#ff79c6',
      description: 'Ritratto cinematografico notturno con neon ciano/magenta, pioggia e lente 85mm f/1.4.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Cyberpunk Courier in Neo-Tokyo',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Young female cyberpunk courier',
          description: 'Sharp features, subtle freckles, cybernetic temple interface glowing soft cyan',
          pose_or_action: 'Leaning against a weathered vending machine, holding a translucent data-slate',
          expression_or_mood: 'Focused, calm, enigmatic',
          clothing_or_materials: 'Wet matte-black techwear jacket with reflective collar and chrome shoulder pads',
          placement: 'Foreground-left (Rule of thirds)',
        },
        additional_subjects: [],
        scene: {
          environment: 'Narrow rain-slicked Neo-Tokyo alleyway',
          background_details: 'Puddles reflecting kanji neon signs, rising steam from manholes, tangled overhead cables',
          time_of_day: 'Midnight / Deep night',
          atmosphere_weather: 'Light rain with wet reflections',
        },
        camera: {
          shot_type: 'Medium close-up portrait (MCU)',
          angle: 'Eye-level angle',
          lens_focal_length: '85mm f/1.4 Prime Portrait Lens',
          aperture_depth_of_field: 'f/1.4 ultra-shallow DoF, creamy bokeh',
          camera_body_or_film: 'ARRI Alexa 65 Digital Cinema',
        },
        lighting: {
          key_light: 'Cyan and magenta neon signage glow',
          fill_or_ambient: 'Warm sodium streetlamp bounce from wet pavement',
          color_temperature: 'High-contrast cybernetic neon',
          shadow_quality: 'Deep chiaroscuro high-contrast shadows',
          color_palette: ['#00f0ff', '#ff007f', '#bd93f9', '#111118'],
        },
        composition: {
          framing_rule: 'Rule of thirds',
          focal_point: 'Her illuminated eyes and the glowing reflection on the visor',
          foreground_elements: 'Out-of-focus raindrops on a glass railing in the bottom-right corner',
          perspective: 'Natural 1-point linear perspective',
        },
        style_and_rendering: {
          medium: 'Cinematic film still',
          aesthetic: 'Gritty Cyberpunk Noir',
          color_grading: 'Rich blacks with vibrant neon accents',
          quality_tags: [
            '8k resolution',
            'natural skin pores & micro-details',
            'anamorphic lens flare',
            'fine 35mm film grain',
          ],
        },
        typography: {
          enabled: true,
          exact_text: 'SECTOR 09',
          font_style: 'Cyberpunk stenciled holographic HUD',
          placement_and_material: 'Printed in glowing cyan stencil on the vending machine glass behind her',
        },
        technical_parameters: {
          aspect_ratio: '16:9',
          negative_prompt: 'cartoon, anime, blurry, plastic skin, extra fingers, watermark, oversaturated',
          seed: 849201,
          stylize: 250,
          chaos: 10,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'luxury-product',
      name: 'Luxury Product Studio Shot',
      category: 'Commercial & Ads',
      badgeColor: '#f1fa8c',
      description: 'Fotografia pubblicitaria macro in studio con materiali pregiati, rim light e tipografia sul flacone.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Artisanal Botanical Perfume Bottle',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Minimalist smoked-glass perfume flacon with a brushed brass cap',
          description: 'Geometric faceted crystal bottle with tiny condensation droplets on the surface',
          pose_or_action: 'Resting on a wet slab of dark green Connemara marble',
          expression_or_mood: 'Luxurious, serene, organic',
          clothing_or_materials: 'Smoked emerald glass, brushed gold metal, textured cotton paper label',
          placement: 'Center frame',
        },
        additional_subjects: [
          {
            id: 'sub-1',
            entity: 'Fresh cedarwood sprig and white orchid petal',
            details: 'Dewdrops catching the light',
            placement: 'Midground left beside the bottle base',
          },
        ],
        scene: {
          environment: 'High-end commercial tabletop studio set',
          background_details: 'Textured dark slate backdrop with subtle water ripples',
          time_of_day: 'Golden hour sunset',
          atmosphere_weather: 'Floating dust motes in sunbeams',
        },
        camera: {
          shot_type: 'Macro detail shot',
          angle: 'Low-angle heroic shot',
          lens_focal_length: '100mm Macro 1:1 Lens',
          aperture_depth_of_field: 'f/2.8 soft background separation',
          camera_body_or_film: 'Hasselblad H6D-100c Medium Format',
        },
        lighting: {
          key_light: 'Dramatic Rembrandt studio softbox',
          fill_or_ambient: 'Warm golden caustic light refracting through the emerald glass',
          color_temperature: 'Warm golden (3200K)',
          shadow_quality: 'Soft diffused wrap-around shadows',
          color_palette: ['#10b981', '#064e3b', '#d4af37', '#090d0b'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'The embossed paper label on the front of the bottle',
          foreground_elements: 'Softly blurred dark moss along the bottom edge',
          perspective: 'Natural 1-point linear perspective',
        },
        style_and_rendering: {
          medium: 'Photorealistic photography',
          aesthetic: 'Clean Apple-style Commercial Studio',
          color_grading: 'Warm nostalgic Kodak film grade',
          quality_tags: ['8k resolution', 'hyper-detailed textures', 'ray-traced reflections'],
        },
        typography: {
          enabled: true,
          exact_text: 'VERDANT N°4',
          font_style: 'Luxury high-contrast serif (Didot/Bodoni)',
          placement_and_material: 'Gold foil hot-stamped on the cream cotton label at the center of the bottle',
        },
        technical_parameters: {
          aspect_ratio: '4:5',
          negative_prompt: 'plastic, cheap, blurry text, misspelled letters, harsh flash, cluttered',
          seed: 421099,
          stylize: 180,
          chaos: 0,
          raw_mode: true,
        },
        custom_properties: [],
      },
    },
    {
      id: 'isometric-diorama',
      name: 'Isometric 3D Cozy Ramen Shop',
      category: '3D & Game Art',
      badgeColor: '#8be9fd',
      description: 'Diorama isometrico 3D in stile Blender/Octane con illuminazione interna calda e dettagli minuziosi.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Isometric Two-Story Tokyo Ramen Corner',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Cutaway isometric 3D diorama of a tiny traditional two-story ramen shop',
          description: 'Wooden sliding doors, red paper lanterns, steaming ramen bowls on the counter, upstairs tatami room',
          pose_or_action: 'Warm interior lights glowing out onto the miniature street corner',
          expression_or_mood: 'Cozy, nostalgic, inviting miniature world',
          clothing_or_materials: 'Warm cedar wood, matte clay tiles, translucent rice paper, glossy ceramic bowls',
          placement: 'Center frame',
        },
        additional_subjects: [],
        scene: {
          environment: 'Isolated miniature floating diorama base on a dark studio background',
          background_details: 'Clean dark matte gradient void surrounding the diorama cube',
          time_of_day: 'Blue hour twilight',
          atmosphere_weather: 'Clear crisp air',
        },
        camera: {
          shot_type: 'Isometric orthographic view',
          angle: 'High-angle looking down',
          lens_focal_length: '50mm Standard Prime Lens',
          aperture_depth_of_field: 'Tilt-shift miniature selective focus',
          camera_body_or_film: 'Hasselblad H6D-100c Medium Format',
        },
        lighting: {
          key_light: 'Warm tungsten lantern glow from inside the shop',
          fill_or_ambient: 'Cool twilight blue global illumination from above',
          color_temperature: 'Dual-tone warm/cool contrast',
          shadow_quality: 'Subtle ambient occlusion',
          color_palette: ['#ffb347', '#ff6961', '#5b3256', '#282a36'],
        },
        composition: {
          framing_rule: 'Centered symmetrical composition',
          focal_point: 'The open ground-floor ramen counter with rising steam',
          foreground_elements: 'Miniature bicycle parked next to a tiny retro vending machine',
          perspective: 'Isometric 30° projection',
        },
        style_and_rendering: {
          medium: '3D Octane / Unreal Engine 5 Render',
          aesthetic: 'Cozy Studio Ghibli / Solarpunk',
          color_grading: 'Cinematic Teal and Orange',
          quality_tags: [
            '8k resolution',
            'physically based rendering (PBR)',
            'subsurface scattering (SSS)',
            'hyper-detailed textures',
          ],
        },
        typography: {
          enabled: true,
          exact_text: 'RAMEN',
          font_style: 'Glowing neon tube cursive signage',
          placement_and_material: 'Warm orange vertical neon sign mounted on the second-floor corner wall',
        },
        technical_parameters: {
          aspect_ratio: '1:1',
          negative_prompt: 'flat 2D, blurry, crooked lines, low poly, noisy background',
          seed: 771200,
          stylize: 300,
          chaos: 5,
          raw_mode: false,
        },
        custom_properties: [],
      },
    },
    {
      id: 'dark-fantasy',
      name: 'Dark Fantasy Souls-like Concept Art',
      category: 'Concept Art & Gaming',
      badgeColor: '#bd93f9',
      description: 'Concept art epica in stile Elden Ring / Dark Souls con prospettiva dal basso e nebbia volumetrica.',
      spec: {
        meta: {
          version: '2.0',
          title: 'Cathedral of the Eclipsed Sun',
          target_engine: 'universal',
        },
        character_sheet: structuredClone(DEFAULT_CHARACTER_SHEET),
        subject: {
          primary_entity: 'Lone knight in tarnished silver armor with a tattered crimson cloak',
          description: 'Intricate filigree engravings on armor, holding a greatsword resting on the stone floor',
          pose_or_action: 'Standing before a colossal gothic archway looking up at an eclipsed sky',
          expression_or_mood: 'Solemn, awe-inspiring, melancholic grandeur',
          clothing_or_materials: 'Weathered steel, frayed velvet fabric, wet obsidian stone',
          placement: 'Foreground-left (Rule of thirds)',
        },
        additional_subjects: [],
        scene: {
          environment: 'Ruined gothic cathedral courtyard suspended on a jagged cliff',
          background_details: 'Shattered flying buttresses, floating embers, giant solar eclipse in the sky',
          time_of_day: 'Blue hour twilight',
          atmosphere_weather: 'Dense volumetric fog & mist',
        },
        camera: {
          shot_type: 'Extreme wide establishing shot',
          angle: 'Low-angle heroic shot',
          lens_focal_length: '24mm Wide-Angle Lens',
          aperture_depth_of_field: 'f/11 deep focus, sharp front-to-back',
          camera_body_or_film: 'ARRI Alexa 65 Digital Cinema',
        },
        lighting: {
          key_light: 'Cinematic rim / edge backlighting',
          fill_or_ambient: 'Cold silver moonlight filtering through ruined arches',
          color_temperature: 'Dual-tone warm/cool contrast',
          shadow_quality: 'Volumetric god-rays cutting through shadow',
          color_palette: ['#bd93f9', '#ff79c6', '#4c566a', '#1e1f29'],
        },
        composition: {
          framing_rule: 'Diagonal leading lines',
          focal_point: 'The silhouette of the knight framed against the glowing eclipse corona',
          foreground_elements: 'Broken stone gargoyle and scattered white lilies in the lower foreground',
          perspective: '3-point towering perspective',
        },
        style_and_rendering: {
          medium: 'Digital concept art illustration',
          aesthetic: 'Dark Fantasy Souls-like',
          color_grading: 'Muted desaturated bleach bypass',
          quality_tags: ['8k resolution', 'hyper-detailed textures'],
        },
        typography: {
          enabled: false,
          exact_text: '',
          font_style: 'Luxury high-contrast serif (Didot/Bodoni)',
          placement_and_material: '',
        },
        technical_parameters: {
          aspect_ratio: '21:9',
          negative_prompt: 'bright cartoon colors, modern buildings, low detail, flat lighting',
          seed: 903112,
          stylize: 400,
          chaos: 15,
          raw_mode: false,
        },
        custom_properties: [],
      },
    },
  ];

  // ---------- Reactive state (signals) ----------

  private readonly customOptions = signal<CustomOptionsMap>(this.loadCustomOptions());
  readonly userPresets = signal<PromptTemplate[]>(this.loadUserPresets());
  readonly savedCharacters = signal<SavedCharacter[]>(this.loadSavedCharacters());
  readonly aiConfig = signal<AiAssistantConfig>(this.loadAiConfig());
  readonly defaultOutputModel = signal<OutputTab>(this.loadDefaultOutputModel());
  readonly imageGenConfig = signal<ImageGenConfig>(this.loadImageGenConfig());

  readonly allTemplates = computed<PromptTemplate[]>(() => [...this.builtInTemplates, ...this.userPresets()]);

  constructor() {
    effect(() => this.persist(CUSTOM_OPTIONS_STORAGE_KEY, this.customOptions()));
    effect(() => this.persist(USER_PRESETS_STORAGE_KEY, this.userPresets()));
    effect(() => this.persist(SAVED_CHARACTERS_STORAGE_KEY, this.savedCharacters()));
    effect(() => this.persist(AI_CONFIG_STORAGE_KEY, this.aiConfig()));
    effect(() => this.persist(DEFAULT_OUTPUT_MODEL_STORAGE_KEY, this.defaultOutputModel()));
    effect(() => this.persist(IMAGE_GEN_CONFIG_STORAGE_KEY, this.imageGenConfig()));
    this.tryLoadEnvConfig();
  }

  private async tryLoadEnvConfig(): Promise<void> {
    try {
      const res = await fetch('/env.json');
      if (res.ok) {
        const data = await res.json();
        const geminiKey = data.GEMINI_API_KEY || '';
        const falKey = data.FAL_KEY || '';
        if (geminiKey) {
          this.aiConfig.update((c) => ({
            ...c,
            apiKey: c.apiKey || geminiKey,
            model: (c.model === 'imagen-3.0-generate-002' || !c.model || c.model === 'gemini-2.5-flash' || c.model === 'gemini-1.5-flash' || c.model === 'gemini-pro')
              ? (data.DEFAULT_MODEL || 'gemini-3.8-flash')
              : c.model,
          }));
        }
        if (geminiKey || falKey) {
          this.imageGenConfig.update((c) => {
            const providerApiKeys: ProviderApiKeys = {
              ...(c.providerApiKeys || {}),
              gemini_imagen: c.providerApiKeys?.gemini_imagen || geminiKey,
              fal_ai: c.providerApiKeys?.fal_ai || falKey,
            };
            return {
              ...c,
              providerApiKeys,
              apiKey: (c.provider === 'gemini_imagen' && !c.apiKey)
                ? geminiKey
                : ((c.provider === 'fal_ai' && !c.apiKey) ? falKey : c.apiKey),
              model: (c.model === 'imagen-3.0-generate-002' || !c.model) ? 'fal-ai/nano-banana-pro' : c.model,
            };
          });
        }
      }
    } catch {}
  }

  createEmptySpec(): ImagePromptSpec {
    return structuredClone(this.builtInTemplates[0].spec);
  }

  saveUserPreset(name: string, category: string, description: string, spec: ImagePromptSpec): PromptTemplate {
    const preset: PromptTemplate = {
      id: 'user-' + Date.now(),
      name: name.trim() || 'Preset Personalizzato',
      category: category.trim() || 'Personali',
      badgeColor: '#50fa7b',
      description: description.trim() || 'Preset salvato localmente',
      isUserPreset: true,
      spec: structuredClone(spec),
    };
    this.userPresets.update((list) => [preset, ...list]);
    return preset;
  }

  deleteUserPreset(id: string): void {
    this.userPresets.update((list) => list.filter((p) => p.id !== id));
  }

  saveCharacter(name: string, sheet: CharacterSheetBlock, imageDataUrl?: string): SavedCharacter {
    const summary = `${sheet.gender_and_age} · ${sheet.hair_details.split(',')[0]} · ${sheet.signature_outfit.split(',')[0]}`;
    const img = imageDataUrl || sheet.image_data_url || '';
    const charSheet = structuredClone({ ...sheet, character_name: name.trim() || sheet.character_name, image_data_url: img });
    const char: SavedCharacter = {
      id: 'char-' + Date.now(),
      name: name.trim() || sheet.character_name || 'Nuovo Personaggio',
      summary,
      sheet: charSheet,
      imageDataUrl: img,
      createdAt: Date.now(),
    };
    this.savedCharacters.update((list) => [char, ...list.filter((c) => c.name !== char.name)]);
    return char;
  }

  updateCharacter(id: string, sheet: CharacterSheetBlock, newName?: string, imageDataUrl?: string): SavedCharacter | null {
    let updatedChar: SavedCharacter | null = null;
    const name = (newName || sheet.character_name).trim() || 'Personaggio';
    const summary = `${sheet.gender_and_age} · ${sheet.hair_details.split(',')[0]} · ${sheet.signature_outfit.split(',')[0]}`;
    this.savedCharacters.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          const img = imageDataUrl !== undefined ? imageDataUrl : (sheet.image_data_url || c.imageDataUrl || '');
          const charSheet = structuredClone({ ...sheet, character_name: name, image_data_url: img });
          updatedChar = {
            ...c,
            name,
            summary,
            sheet: charSheet,
            imageDataUrl: img,
          };
          return updatedChar;
        }
        return c;
      })
    );
    return updatedChar;
  }

  deleteCharacter(id: string): void {
    this.savedCharacters.update((list) => list.filter((c) => c.id !== id));
  }

  /** Reactive when read inside a computed()/template: custom elements first, then built-in presets. */
  getOptions(category: PresetCategoryKey): string[] {
    const base = this.defaultOptions[category] || [];
    const custom = this.customOptions()[category] || [];
    return [...custom, ...base.filter((item) => !custom.includes(item))];
  }

  getCustomOptions(category: PresetCategoryKey): string[] {
    return this.customOptions()[category] || [];
  }

  addCustomOption(category: PresetCategoryKey, value: string): void {
    const clean = value.trim();
    if (!clean) return;
    this.customOptions.update((map) => {
      const list = map[category] || [];
      return list.includes(clean) ? map : { ...map, [category]: [clean, ...list] };
    });
  }

  removeCustomOption(category: PresetCategoryKey, value: string): void {
    this.customOptions.update((map) => ({
      ...map,
      [category]: (map[category] || []).filter((item) => item !== value),
    }));
  }

  /**
   * Builds a clean, structured JSON object ready for AI image generators.
   */
  private stripEmptyValues(obj: unknown): unknown {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }
    if (Array.isArray(obj)) {
      const cleaned = obj.map((i) => this.stripEmptyValues(i)).filter((item) => item !== undefined);
      return cleaned.length > 0 ? cleaned : undefined;
    }
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        const val = this.stripEmptyValues(v);
        if (val !== undefined) {
          cleaned[k] = val;
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    return obj;
  }

  /**
   * Builds the clean JSON representation of the prompt.
   * Empty strings, nulls, empty arrays, and unpopulated sections are stripped cleanly.
   */
  buildCleanJsonObject(spec: ImagePromptSpec): Record<string, unknown> {
    const customBySection = (sec: string): Record<string, string> => {
      const out: Record<string, string> = {};
      for (const prop of spec.custom_properties) {
        if (
          prop.section === sec &&
          prop.key.trim() &&
          prop.key !== 'character_sheet' &&
          prop.key !== 'image_data_url' &&
          !prop.value?.startsWith('data:image/') &&
          !prop.value?.includes(';base64,')
        ) {
          out[prop.key.trim()] = prop.value;
        }
      }
      return out;
    };

    const raw: Record<string, unknown> = {
      meta: {
        title: spec.meta.title || 'Untitled Prompt',
        aspect_ratio: spec.technical_parameters.aspect_ratio,
      },
      subject: {
        primary_entity: spec.subject.primary_entity,
        description: spec.subject.description,
        pose_or_action: spec.subject.pose_or_action,
        expression_or_mood: spec.subject.expression_or_mood,
        clothing_or_materials:
          spec.character_sheet?.enabled && spec.character_sheet.mode === 'sheet_generation'
            ? spec.character_sheet.signature_outfit
            : (spec.subject.clothing_or_materials?.trim() || spec.character_sheet?.signature_outfit || ''),
        placement: spec.subject.placement,
        ...customBySection('subject'),
      },
      ...(spec.additional_subjects.length > 0
        ? {
            additional_subjects: spec.additional_subjects.map((s) => ({
              entity: s.entity,
              details: s.details,
              placement: s.placement,
            })),
          }
        : {}),
      scene:
        spec.character_sheet?.enabled && spec.character_sheet.mode === 'sheet_generation'
          ? {
              environment: 'Solid clean white seamless photo studio cyclorama backdrop',
              background_details: 'Clean high-key studio void, soft diffuse floor contact shadow, zero scene clutter, 100% visual isolation',
            }
          : {
              environment: spec.scene.environment,
              time_of_day: spec.scene.time_of_day,
              atmosphere_weather: spec.scene.atmosphere_weather,
              ...customBySection('scene'),
            },
      camera: {
        shot_type: spec.camera.shot_type,
        angle: spec.camera.angle,
        lens_focal_length: spec.camera.lens_focal_length,
        aperture_depth_of_field: spec.camera.aperture_depth_of_field,
        camera_body_or_film: spec.camera.camera_body_or_film,
        ...customBySection('camera'),
      },
      lighting: {
        key_light: spec.lighting.key_light,
        fill_or_ambient: spec.lighting.fill_or_ambient,
        color_temperature: spec.lighting.color_temperature,
        shadow_quality: spec.lighting.shadow_quality,
        color_palette: spec.lighting.color_palette,
        ...customBySection('lighting'),
      },
      composition: {
        framing_rule: spec.composition.framing_rule,
        focal_point: spec.composition.focal_point,
        foreground_elements: spec.composition.foreground_elements,
        perspective: spec.composition.perspective,
        ...customBySection('composition'),
      },
      style_and_rendering: {
        medium: spec.style_and_rendering.medium,
        aesthetic: spec.style_and_rendering.aesthetic,
        color_grading: spec.style_and_rendering.color_grading,
        quality_tags: spec.style_and_rendering.quality_tags,
        ...customBySection('style'),
      },
      ...(spec.typography.enabled && spec.typography.exact_text.trim()
        ? {
            typography: {
              exact_text: spec.typography.exact_text,
              font_style: spec.typography.font_style,
              placement_and_material: spec.typography.placement_and_material,
            },
          }
        : {}),
      ...(spec.character_sheet?.enabled && spec.character_sheet.character_name.trim()
        ? {
            character_sheet: {
              character_name: spec.character_sheet.character_name,
              workflow_mode: spec.character_sheet.mode || 'sheet_generation',
              ...(spec.character_sheet.mode === 'scene_with_character'
                ? {
                    consistency_method: spec.character_sheet.consistency_method || 'multimodal_attached_sheet',
                    visual_reference_anchor:
                      spec.character_sheet.consistency_method === 'text_biometrics_only'
                        ? 'textual_biometrics_dna'
                        : 'attached_character_sheet_image',
                    grounding_instruction:
                      spec.character_sheet.consistency_method === 'text_biometrics_only'
                        ? 'Generate character strictly adhering to somatic biometrics described in this brief.'
                        : 'Anchor facial bone structure, eye shape, skin tone, and hair strictly to the attached character sheet image.',
                    biometrics: {
                      gender_and_age: spec.character_sheet.gender_and_age,
                      ethnicity_and_skin: spec.character_sheet.ethnicity_and_skin,
                      eye_details: spec.character_sheet.eye_details,
                      hair_details: spec.character_sheet.hair_details,
                      distinctive_marks: spec.character_sheet.distinctive_marks,
                      body_build: spec.character_sheet.body_build,
                    },
                    scene_attire: spec.subject.clothing_or_materials || spec.character_sheet.signature_outfit,
                    ...(spec.character_sheet.cref_url?.trim() && !spec.character_sheet.cref_url.startsWith('data:') && !spec.character_sheet.cref_url.includes(';base64,')
                      ? {
                          midjourney_cref: spec.character_sheet.cref_url.trim(),
                          cref_weight: spec.character_sheet.cref_weight ?? 100,
                        }
                      : {}),
                  }
                : {
                    layout_mode: spec.character_sheet.layout_mode,
                    layout_summary:
                      spec.character_sheet.layout_mode === 'expressions_grid'
                        ? 'Facial expression sheet showing a 2x3 headshot grid of distinct emotions'
                        : spec.character_sheet.layout_mode === 'outfit_study'
                        ? 'Character wardrobe and costume variations study sheet'
                        : spec.character_sheet.layout_mode === 'full_body_and_portraits'
                        ? 'Full-body character lineup alongside portrait studies'
                        : spec.character_sheet.layout_mode === 'turnaround_3_views'
                        ? '3-view character model turnaround sheet'
                        : '4-view character model turnaround sheet (Front, 3/4, Profile, Back)',
                    views: spec.character_sheet.views,
                    attire_or_outfit: spec.character_sheet.signature_outfit,
                    ...(spec.character_sheet.signature_props ? { props: spec.character_sheet.signature_props } : {}),
                    background_style: spec.character_sheet.background_style,
                  }),
            },
          }
        : {}),
      technical_parameters: {
        aspect_ratio: spec.technical_parameters.aspect_ratio,
        ...(spec.technical_parameters.negative_prompt.trim()
          ? { negative_prompt: spec.technical_parameters.negative_prompt }
          : {}),
        ...(spec.technical_parameters.seed !== null ? { seed: spec.technical_parameters.seed } : {}),
      },
      ...customBySection('root'),
    };

    return (this.stripEmptyValues(raw) as Record<string, unknown>) || {};
  }

  /**
   * Compiles the structured JSON spec into FLUX.1 / FLUX.2 hierarchical natural prompt.
   */
  compileForFlux(spec: ImagePromptSpec): string {
    if (spec.character_sheet?.enabled && spec.character_sheet.character_name.trim()) {
      const cs = spec.character_sheet;

      // MODE: SCENE WITH BOUND CHARACTER
      if (cs.mode === 'scene_with_character') {
        const attire = spec.subject.clothing_or_materials.trim() || cs.signature_outfit;
        const parts: string[] = [];
        const med = spec.style_and_rendering.medium || 'Photograph';
        const shot = spec.camera.shot_type ? `${spec.camera.shot_type} of ` : '';
        const charName = cs.character_name.trim();
        const hasSheet = !!(cs.image_data_url || cs.cref_url || cs.consistency_method === 'multimodal_attached_sheet');
        const groundingClause = hasSheet
          ? `[Character Sheet Grounding]: Strictly anchored to the multi-angle character model sheet of "${charName}". Faithfully preserve 100% identical facial bone structure, facial identity, eye morphology, distinct gaze, skin micro-texture, and somatic likeness from the reference turnaround sheet. This is the exact same human person across all scenes, zero facial distortion or altered identity.`
          : `[Character Sheet Biometric Anchor]: Strictly anchored to the deterministic biometric DNA and character model sheet of "${charName}". Maintain 100% identical facial bone structure, facial identity, eye details (${cs.eye_details}), skin texture (${cs.ethnicity_and_skin}), and somatic likeness from the character model sheet. The subject is the exact same person across all scenes.`;

        parts.push(
          `${med} (${spec.style_and_rendering.aesthetic}). ${shot}${charName}, a ${cs.gender_and_age} with ${cs.ethnicity_and_skin}, eye details: ${cs.eye_details}, hairstyle: ${cs.hair_details}, ${cs.distinctive_marks}, physique: ${cs.body_build}.`
        );
        parts.push(groundingClause);
        parts.push(`Attire & clothing: ${attire}.`);
        if (spec.subject.pose_or_action || spec.subject.expression_or_mood) {
          parts.push(
            `Action & mood: ${spec.subject.pose_or_action} (${spec.subject.expression_or_mood}), positioned at ${spec.subject.placement}.`
          );
        }
        for (const sec of spec.additional_subjects) {
          if (sec.entity.trim()) {
            parts.push(`Secondary element: ${sec.entity} (${sec.details}) at ${sec.placement}.`);
          }
        }
        parts.push(
          `Environment: ${spec.scene.environment} during ${spec.scene.time_of_day}, ${spec.scene.atmosphere_weather}. Background features ${spec.scene.background_details}.`
        );
        parts.push(
          `Camera & Optics: ${spec.camera.angle}, shot on ${spec.camera.camera_body_or_film} with ${spec.camera.lens_focal_length}, ${spec.camera.aperture_depth_of_field}.`
        );
        const palette =
          spec.lighting.color_palette.length > 0 ? ` Color palette: ${spec.lighting.color_palette.join(', ')}.` : '';
        parts.push(
          `Lighting: ${spec.lighting.key_light}, ${spec.lighting.fill_or_ambient}, ${spec.lighting.color_temperature}, ${spec.lighting.shadow_quality}.${palette}`
        );
        parts.push(
          `Composition: ${spec.composition.framing_rule}, ${spec.composition.perspective}. Focal point on ${spec.composition.focal_point}. Foreground: ${spec.composition.foreground_elements}.`
        );
        if (spec.typography.enabled && spec.typography.exact_text.trim()) {
          parts.push(
            `Text rendering: The exact text "${spec.typography.exact_text}" written in ${spec.typography.font_style}, ${spec.typography.placement_and_material}.`
          );
        }
        const qualityTags = [...spec.style_and_rendering.quality_tags];
        if (!qualityTags.some((t) => /character (sheet|consistency)|same person/i.test(t))) {
          qualityTags.push('character sheet consistency', 'identical facial likeness', 'same person across scenes');
        }
        if (qualityTags.length > 0) {
          parts.push(
            `Color grade: ${spec.style_and_rendering.color_grading}. ${qualityTags.join(', ')}.`
          );
        }
        return parts.join(' ');
      }

      // MODE: CHARACTER SHEET GENERATION
      const views = cs.views.length > 0 ? cs.views.join(', ') : 'Front view, 3/4 Profile view, Side profile view, Back view';
      let layoutIntro = '';
      if (cs.layout_mode === 'expressions_grid') {
        layoutIntro = `EDITORIAL STUDIO PHOTOGRAPHY - CHARACTER MODEL SHEET COMPOSITE of ${cs.character_name}. The image is a multi-panel photographic portrait grid displaying distinct emotional expressions of the exact same real human person in a single frame: ${views}. Facial features, natural skin pores, eye reflections, and hairstyle remain 100% consistent across all portraits.`;
      } else if (cs.layout_mode === 'outfit_study') {
        layoutIntro = `EDITORIAL STUDIO PHOTOGRAPHY - WARDROBE CHARACTER MODEL SHEET of ${cs.character_name}. The image displays the same real person in multiple simultaneous outfits in a single photographic contact sheet: ${views}.`;
      } else if (cs.layout_mode === 'full_body_and_portraits') {
        layoutIntro = `EDITORIAL STUDIO PHOTOGRAPHY - CHARACTER MODEL SHEET COMPOSITE of ${cs.character_name} combining full-body studio lineup and high-resolution facial close-ups: ${views}.`;
      } else if (cs.layout_mode === 'turnaround_3_views') {
        layoutIntro = `EDITORIAL STUDIO PHOTOGRAPHY - 3-VIEW CHARACTER MODEL SHEET of ${cs.character_name}. The image displays three simultaneous photographic angles of the same real human being in a single frame: ${views}.`;
      } else {
        layoutIntro = `EDITORIAL STUDIO PHOTOGRAPHY - CHARACTER MODEL SHEET COMPOSITE of ${cs.character_name}. The image displays multiple simultaneous photographic angles of the same real human person in a single clean contact sheet: ${views}.`;
      }

      const hasFaceCloseUp = cs.views.some((v) => /close-?up|face|portrait|vis[oa]|primo\s*piano|macro/i.test(v));
      const marginClause = hasFaceCloseUp
        ? 'Safe canvas margins: every pose and the facial close-up portrait must be 100% completely contained within the frame with generous padding margins from all canvas borders. Absolutely no cropped faces, no half faces at the edge, no figures bleeding off canvas.'
        : 'Safe canvas margins: all figures must be 100% completely visible inside the frame with comfortable safe margins from the borders, zero cropping at edges.';

      return `${layoutIntro} Character Somatic DNA: ${cs.gender_and_age}, ${cs.ethnicity_and_skin}, eye details: ${cs.eye_details}, hairstyle: ${cs.hair_details}, distinctive features: ${cs.distinctive_marks}, physique: ${cs.body_build}. Signature attire: ${cs.signature_outfit}${cs.signature_props ? ', accessories: ' + cs.signature_props : ''}. Studio setting: ${cs.background_style}, even shadowless high-key studio softbox lighting. ${marginClause} Style: ${spec.style_and_rendering.medium} (${spec.style_and_rendering.aesthetic}), authentic human skin micro-texture, visible pores, Hasselblad medium format camera optics. Strict constraints: 100% authentic raw photography of a real human being. No 3D render, no video game asset, no CGI, no digital illustration, no cropped heads or truncated faces.`;
    }

    const parts: string[] = [];
    const med = spec.style_and_rendering.medium || 'Photograph';
    const shot = spec.camera.shot_type ? `${spec.camera.shot_type} of ` : '';
    parts.push(
      `${med} (${spec.style_and_rendering.aesthetic}). ${shot}${spec.subject.primary_entity}, ${spec.subject.description}.`
    );

    if (spec.subject.clothing_or_materials) {
      parts.push(`Materials & attire: ${spec.subject.clothing_or_materials}.`);
    }
    if (spec.subject.pose_or_action || spec.subject.expression_or_mood) {
      parts.push(
        `Action & mood: ${spec.subject.pose_or_action} (${spec.subject.expression_or_mood}), positioned at ${spec.subject.placement}.`
      );
    }
    for (const sec of spec.additional_subjects) {
      if (sec.entity.trim()) {
        parts.push(`Secondary element: ${sec.entity} (${sec.details}) at ${sec.placement}.`);
      }
    }
    parts.push(
      `Environment: ${spec.scene.environment} during ${spec.scene.time_of_day}, ${spec.scene.atmosphere_weather}. Background features ${spec.scene.background_details}.`
    );
    parts.push(
      `Camera & Optics: ${spec.camera.angle}, shot on ${spec.camera.camera_body_or_film} with ${spec.camera.lens_focal_length}, ${spec.camera.aperture_depth_of_field}.`
    );
    const palette =
      spec.lighting.color_palette.length > 0 ? ` Color palette: ${spec.lighting.color_palette.join(', ')}.` : '';
    parts.push(
      `Lighting: ${spec.lighting.key_light}, ${spec.lighting.fill_or_ambient}, ${spec.lighting.color_temperature}, ${spec.lighting.shadow_quality}.${palette}`
    );
    parts.push(
      `Composition: ${spec.composition.framing_rule}, ${spec.composition.perspective}. Focal point on ${spec.composition.focal_point}. Foreground: ${spec.composition.foreground_elements}.`
    );
    if (spec.typography.enabled && spec.typography.exact_text.trim()) {
      parts.push(
        `Text rendering: The exact text "${spec.typography.exact_text}" written in ${spec.typography.font_style}, ${spec.typography.placement_and_material}.`
      );
    }
    if (spec.style_and_rendering.quality_tags.length > 0) {
      parts.push(
        `Color grade: ${spec.style_and_rendering.color_grading}. ${spec.style_and_rendering.quality_tags.join(', ')}.`
      );
    }
    return parts.join(' ');
  }

  /**
   * Compiles the structured JSON spec into Midjourney v6/v7 prompt with CLI parameters.
   */
  compileForMidjourney(spec: ImagePromptSpec): string {
    if (spec.character_sheet?.enabled && spec.character_sheet.character_name.trim()) {
      const cs = spec.character_sheet;

      // MODE: SCENE WITH BOUND CHARACTER
      if (cs.mode === 'scene_with_character') {
        const attire = spec.subject.clothing_or_materials.trim() || cs.signature_outfit;
        const charName = cs.character_name.trim();
        const tokens: string[] = [
          `${spec.style_and_rendering.medium} of ${charName}`,
          `character consistency strictly anchored to reference character model sheet of ${charName}`,
          `identical facial likeness and features from character turnaround sheet`,
          `same person across scenes`,
          `a ${cs.gender_and_age}`,
          cs.ethnicity_and_skin,
          `eyes: ${cs.eye_details}`,
          `hair: ${cs.hair_details}`,
          cs.distinctive_marks,
          cs.body_build,
          `wearing ${attire}`,
          spec.subject.pose_or_action,
          spec.subject.expression_or_mood ? `${spec.subject.expression_or_mood} expression` : '',
          spec.subject.placement ? `positioned at ${spec.subject.placement}` : '',
          ...spec.additional_subjects.filter((s) => s.entity.trim()).map((s) => `${s.entity} (${s.details})`),
          spec.scene.environment,
          spec.scene.background_details,
          spec.scene.time_of_day,
          spec.scene.atmosphere_weather,
          spec.camera.shot_type,
          spec.camera.angle,
          spec.camera.lens_focal_length,
          spec.camera.aperture_depth_of_field,
          spec.camera.camera_body_or_film,
          spec.lighting.key_light,
          spec.lighting.fill_or_ambient,
          spec.lighting.shadow_quality,
          spec.composition.framing_rule,
          spec.style_and_rendering.aesthetic,
          spec.style_and_rendering.color_grading,
          ...spec.style_and_rendering.quality_tags,
        ];

        if (spec.typography.enabled && spec.typography.exact_text.trim()) {
          tokens.push(`text "${spec.typography.exact_text}" in ${spec.typography.font_style}`);
        }

        const body = tokens
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .join(', ');

        const flags: string[] = [`--ar ${spec.technical_parameters.aspect_ratio || '16:9'}`];
        if (spec.technical_parameters.raw_mode) flags.push('--style raw');
        if (spec.technical_parameters.stylize > 0) flags.push(`--s ${spec.technical_parameters.stylize}`);
        if (spec.technical_parameters.chaos > 0) flags.push(`--c ${spec.technical_parameters.chaos}`);
        if (spec.technical_parameters.seed !== null) flags.push(`--seed ${spec.technical_parameters.seed}`);
        if (cs.cref_url?.trim() && !cs.cref_url.startsWith('data:') && !cs.cref_url.includes(';base64,')) {
          const cw = cs.cref_weight !== undefined ? cs.cref_weight : 100;
          flags.push(`--cref ${cs.cref_url.trim()} --cw ${cw}`);
        }
        if (spec.technical_parameters.negative_prompt.trim()) {
          flags.push(`--no ${spec.technical_parameters.negative_prompt.trim()}`);
        }

        return `${body} ${flags.join(' ')}`;
      }

      // MODE: CHARACTER SHEET GENERATION
      const views = cs.views.length > 0 ? cs.views.join(', ') : 'front view, 3/4 view, side profile, back view';

      let titleToken = '';
      let layoutToken = '';
      if (cs.layout_mode === 'expressions_grid') {
        titleToken = `Facial expression model sheet of ${cs.character_name}`;
        layoutToken = `2x3 grid of headshots showing distinct emotional expressions: ${views}, consistent face and hair across all portraits`;
      } else if (cs.layout_mode === 'outfit_study') {
        titleToken = `Character outfit and wardrobe study sheet of ${cs.character_name}`;
        layoutToken = `multiple simultaneous outfits in a single frame: ${views}`;
      } else if (cs.layout_mode === 'full_body_and_portraits') {
        titleToken = `Character model sheet of ${cs.character_name}`;
        layoutToken = `full-body lineup and facial close-up studies in a single frame: ${views}`;
      } else if (cs.layout_mode === 'turnaround_3_views') {
        titleToken = `Character 3-view turnaround model sheet of ${cs.character_name}`;
        layoutToken = `3 simultaneous angles in a single frame: ${views}`;
      } else {
        titleToken = `Character design turnaround model sheet of ${cs.character_name}`;
        layoutToken = `multiple angles in a single frame: ${views}`;
      }

      const charTokens = [
        titleToken,
        cs.gender_and_age,
        cs.ethnicity_and_skin,
        `eyes: ${cs.eye_details}`,
        `hair: ${cs.hair_details}`,
        cs.distinctive_marks,
        cs.body_build,
        `wearing ${cs.signature_outfit}`,
        cs.signature_props ? `accessories: ${cs.signature_props}` : '',
        layoutToken,
        cs.background_style,
        'editorial studio casting photography composite of a real human being, Hasselblad medium format portraiture, realistic human skin pores, authentic natural textures',
        cs.views.some((v) => /close-?up|face|portrait|vis[oa]|primo\s*piano|macro/i.test(v))
          ? 'generous outer margins, fully contained frame composition, complete uncropped facial portrait, safe border padding'
          : 'generous outer margins, fully contained frame composition, safe border padding',
        spec.style_and_rendering.medium,
        spec.style_and_rendering.aesthetic,
        spec.style_and_rendering.color_grading,
        ...spec.style_and_rendering.quality_tags,
      ];
      const body = charTokens.filter((t) => t && t.trim()).join(', ');
      const flags: string[] = [`--ar ${spec.technical_parameters.aspect_ratio || '16:9'}`];
      if (spec.technical_parameters.raw_mode) flags.push('--style raw');
      if (spec.technical_parameters.stylize > 0) flags.push(`--s ${spec.technical_parameters.stylize}`);
      if (spec.technical_parameters.chaos > 0) flags.push(`--c ${spec.technical_parameters.chaos}`);
      if (spec.technical_parameters.seed !== null) flags.push(`--seed ${spec.technical_parameters.seed}`);
      if (cs.cref_url?.trim() && !cs.cref_url.startsWith('data:') && !cs.cref_url.includes(';base64,')) {
        const cw = cs.cref_weight !== undefined ? cs.cref_weight : 100;
        flags.push(`--cref ${cs.cref_url.trim()} --cw ${cw}`);
      }
      const antiCropTokens = 'cropped face, half face at border, cut off head, out of frame, figure bleeding off canvas';
      const existingNeg = spec.technical_parameters.negative_prompt.trim();
      const combinedNeg = existingNeg ? `${existingNeg}, ${antiCropTokens}` : antiCropTokens;
      flags.push(`--no ${combinedNeg}`);
      return `${body} ${flags.join(' ')}`;
    }

    const tokens: string[] = [
      `${spec.style_and_rendering.medium} of ${spec.subject.primary_entity}`,
      spec.subject.description,
      spec.subject.clothing_or_materials,
      spec.subject.pose_or_action,
      `${spec.subject.expression_or_mood} expression`,
      ...spec.additional_subjects.filter((s) => s.entity.trim()).map((s) => `${s.entity} (${s.details})`),
      spec.scene.environment,
      spec.scene.background_details,
      spec.scene.time_of_day,
      spec.scene.atmosphere_weather,
      spec.camera.shot_type,
      spec.camera.angle,
      spec.camera.lens_focal_length,
      spec.camera.aperture_depth_of_field,
      spec.camera.camera_body_or_film,
      spec.lighting.key_light,
      spec.lighting.fill_or_ambient,
      spec.lighting.shadow_quality,
      spec.composition.framing_rule,
      spec.style_and_rendering.aesthetic,
      spec.style_and_rendering.color_grading,
      ...spec.style_and_rendering.quality_tags,
    ];

    if (spec.typography.enabled && spec.typography.exact_text.trim()) {
      tokens.push(`text "${spec.typography.exact_text}" in ${spec.typography.font_style}`);
    }

    const body = tokens
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .join(', ');

    const flags: string[] = [`--ar ${spec.technical_parameters.aspect_ratio || '16:9'}`];
    if (spec.technical_parameters.raw_mode) {
      flags.push('--style raw');
    }
    if (spec.technical_parameters.stylize > 0) {
      flags.push(`--s ${spec.technical_parameters.stylize}`);
    }
    if (spec.technical_parameters.chaos > 0) {
      flags.push(`--c ${spec.technical_parameters.chaos}`);
    }
    if (spec.technical_parameters.seed !== null) {
      flags.push(`--seed ${spec.technical_parameters.seed}`);
    }
    if (spec.character_sheet?.cref_url?.trim() && !spec.character_sheet.cref_url.startsWith('data:') && !spec.character_sheet.cref_url.includes(';base64,')) {
      flags.push(`--cref ${spec.character_sheet.cref_url.trim()} --cw 100`);
    }
    if (spec.technical_parameters.negative_prompt.trim()) {
      flags.push(`--no ${spec.technical_parameters.negative_prompt.trim()}`);
    }

    return `${body} ${flags.join(' ')}`;
  }

  /**
   * Compiles a hybrid instruction + JSON prompt ideal for Google Gemini (Imagen 3 / Nano Banana) and ChatGPT / GPT-4o.
   */
  compileForGpt4oAndGemini(spec: ImagePromptSpec): string {
    const naturalPrompt = this.compileForFlux(spec);

    if (
      spec.character_sheet?.enabled &&
      spec.character_sheet.character_name.trim() &&
      spec.character_sheet.mode === 'scene_with_character'
    ) {
      const cs = spec.character_sheet;
      const charName = cs.character_name.trim();
      const isAttachedSheet = (cs.consistency_method || 'multimodal_attached_sheet') === 'multimodal_attached_sheet';

      if (isAttachedSheet) {
        return (
          `[CRITICAL VISUAL GROUNDING INSTRUCTION FOR GEMINI / MULTIMODAL LLM]\n` +
          `The attached image is the definitive multi-angle character model sheet for the primary subject "${charName}".\n` +
          `You MUST strictly preserve ${charName}'s facial bone structure, facial identity, eye shape/color (${cs.eye_details || 'as shown in sheet'}), ` +
          `skin tone/texture (${cs.ethnicity_and_skin || 'as shown in sheet'}), hairstyle (${cs.hair_details || 'as shown in sheet'}), ` +
          `distinctive features (${cs.distinctive_marks || 'as shown in sheet'}), and build (${cs.body_build || 'as shown in sheet'}).\n` +
          `Do not invent a new face or alter ${charName}'s somatic identity. Only alter the scene setting, pose, expression, and attire as specified below.\n\n` +
          `[SCENE PRODUCTION SPECIFICATION]\n` +
          naturalPrompt
        );
      } else {
        return (
          `[CHARACTER CONSISTENCY DIRECTIVE - TEXTUAL BIOMETRICS]\n` +
          `Render the character "${charName}" strictly adhering to the deterministic biometric DNA defined in the brief:\n\n` +
          naturalPrompt
        );
      }
    }

    return naturalPrompt;
  }

  /**
   * Compiles Positive + Negative prompt tags for Stable Diffusion XL (SDXL).
   */
  compileForSdxl(spec: ImagePromptSpec): { positive: string; negative: string } {
    if (spec.character_sheet?.enabled && spec.character_sheet.character_name.trim()) {
      const cs = spec.character_sheet;

      if (cs.mode === 'scene_with_character') {
        const attire = spec.subject.clothing_or_materials.trim() || cs.signature_outfit;
        const charName = cs.character_name.trim();
        const pos = [
          `(masterpiece, best quality:1.2)`,
          spec.style_and_rendering.medium,
          spec.style_and_rendering.aesthetic,
          `(${charName}:1.25)`,
          `(character consistency strictly anchored to reference character model sheet of ${charName}:1.3)`,
          `(identical facial features and somatic likeness from reference sheet:1.25)`,
          `(same person across scenes:1.2)`,
          cs.gender_and_age,
          cs.ethnicity_and_skin,
          `(${cs.eye_details}:1.1)`,
          `(${cs.hair_details}:1.1)`,
          cs.distinctive_marks,
          cs.body_build,
          `wearing ${attire}`,
          spec.subject.pose_or_action,
          spec.subject.expression_or_mood ? `${spec.subject.expression_or_mood} expression` : '',
          ...spec.additional_subjects.filter((s) => s.entity.trim()).map((s) => `${s.entity}`),
          spec.scene.environment,
          spec.scene.background_details,
          spec.scene.time_of_day,
          spec.scene.atmosphere_weather,
          spec.camera.shot_type,
          spec.camera.angle,
          spec.camera.lens_focal_length,
          spec.camera.aperture_depth_of_field,
          spec.lighting.key_light,
          spec.lighting.shadow_quality,
          spec.style_and_rendering.color_grading,
          ...spec.style_and_rendering.quality_tags,
        ]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', ');

        return {
          positive: pos,
          negative:
            spec.technical_parameters.negative_prompt ||
            'lowres, bad anatomy, bad hands, distorted face, inconsistent character, cropped, text, watermark, signature, blurry, low quality',
        };
      }

      const views = cs.views.join(', ');
      let modeTag = '(character model sheet, turnaround sheet:1.35), (multiple angles in one frame:1.25)';
      if (cs.layout_mode === 'expressions_grid') {
        modeTag = '(facial expression sheet, emotion grid:1.35), (multiple facial expressions in one frame:1.25)';
      } else if (cs.layout_mode === 'outfit_study') {
        modeTag = '(character wardrobe study sheet, outfit variations:1.35), (multiple outfits in one frame:1.25)';
      } else if (cs.layout_mode === 'full_body_and_portraits') {
        modeTag = '(character model sheet, full body and close-up portraits:1.35)';
      }
      const hasFaceCloseUp = cs.views.some((v) => /close-?up|face|portrait|vis[oa]|primo\s*piano|macro/i.test(v));
      const marginPos = hasFaceCloseUp
        ? '(fully contained in frame:1.3), (complete uncropped face portrait:1.3), (wide safe studio padding margins:1.2)'
        : '(fully contained in frame:1.2), (wide safe studio padding margins:1.2)';
      const antiCropNeg = 'cropped face, half face at border, cut-off head, partial portrait, figure bleeding off canvas, out of frame';
      const baseNeg = spec.technical_parameters.negative_prompt.trim();
      const finalNeg = baseNeg
        ? `${baseNeg}, ${antiCropNeg}`
        : `bad anatomy, inconsistent character, different faces, ${antiCropNeg}, cropped, blurry, dark background, complex background, text, watermark, signature, jpeg artifacts`;

      return {
        positive: `${modeTag}, (${views}:1.2), (${cs.character_name}:1.2), ${marginPos}, ${cs.gender_and_age}, ${cs.ethnicity_and_skin}, (${cs.eye_details}:1.1), (${cs.hair_details}:1.1), ${cs.distinctive_marks}, ${cs.body_build}, ${cs.signature_outfit}, ${cs.background_style}, even studio lighting, high resolution, 8k, best quality`,
        negative: finalNeg,
      };
    }

    const pos = [
      `(masterpiece, best quality:1.2)`,
      spec.style_and_rendering.medium,
      spec.style_and_rendering.aesthetic,
      `(${spec.subject.primary_entity}:1.15)`,
      spec.subject.description,
      spec.subject.clothing_or_materials,
      spec.subject.pose_or_action,
      spec.scene.environment,
      spec.scene.background_details,
      spec.scene.time_of_day,
      spec.scene.atmosphere_weather,
      spec.camera.shot_type,
      spec.camera.angle,
      spec.camera.lens_focal_length,
      spec.camera.aperture_depth_of_field,
      spec.lighting.key_light,
      spec.lighting.shadow_quality,
      spec.style_and_rendering.color_grading,
      ...spec.style_and_rendering.quality_tags,
    ]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');

    return {
      positive: pos,
      negative:
        spec.technical_parameters.negative_prompt ||
        'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, watermark, blurry',
    };
  }

  /**
   * Offline smart heuristic expander + optional LLM API expander for "Magic Expand".
   */
  async magicExpandIdea(idea: string, currentSpec: ImagePromptSpec, config: AiAssistantConfig): Promise<ImagePromptSpec> {
    const cleanIdea = idea.trim();
    if (!cleanIdea) return currentSpec;

    if (config.apiKey.trim() || config.provider === 'ollama') {
      try {
        return await this.callLlmExpander(cleanIdea, currentSpec, config);
      } catch (err: any) {
        console.error('LLM API call failed in magicExpandIdea:', err);
        throw err;
      }
    }

    return this.heuristicExpand(cleanIdea, currentSpec);
  }

  private heuristicExpand(idea: string, base: ImagePromptSpec): ImagePromptSpec {
    const next = structuredClone(base);
    const lower = idea.toLowerCase();
    const isCharacterSheetMode = base.character_sheet.enabled && base.character_sheet.mode !== 'scene_with_character';
    const isSceneWithCharacter = base.character_sheet.enabled && base.character_sheet.mode === 'scene_with_character';

    if (isCharacterSheetMode) {
      if (lower.includes('capelli') || lower.includes('hair') || lower.includes('biond') || lower.includes('castan') || lower.includes('mor') || lower.includes('ross')) {
        next.character_sheet.hair_details = idea;
      } else if (lower.includes('abito') || lower.includes('vestit') || lower.includes('outfit') || lower.includes('giacca') || lower.includes('pelle')) {
        next.character_sheet.signature_outfit = idea;
      } else if (lower.includes('cicatric') || lower.includes('tatuagg') || lower.includes('mark') || lower.includes('scar')) {
        next.character_sheet.distinctive_marks = (next.character_sheet.distinctive_marks ? `${next.character_sheet.distinctive_marks}, ` : '') + idea;
      } else if (lower.includes('occhi') || lower.includes('eyes') || lower.includes('sguardo')) {
        next.character_sheet.eye_details = idea;
      } else {
        next.character_sheet.signature_outfit = idea;
      }
      return next;
    }

    if (isSceneWithCharacter) {
      next.subject.pose_or_action = idea;
      if (lower.includes('notte') || lower.includes('night')) next.scene.time_of_day = 'Midnight / Deep night';
      if (lower.includes('tramonto') || lower.includes('sunset') || lower.includes('golden')) next.scene.time_of_day = 'Golden hour sunset';
      if (lower.includes('pioggia') || lower.includes('rain')) next.scene.atmosphere_weather = 'Heavy rain, wet reflective pavement';
      next.scene.environment = idea;
      return next;
    }

    next.meta.title = idea.slice(0, 48);
    next.subject.primary_entity = idea;
    next.subject.description = `Detailed visual representation of ${idea}, intricate surface textures and realistic proportions`;

    if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('futur')) {
      next.scene.environment = 'Futuristic cyberpunk megacity street with holographic billboards';
      next.scene.time_of_day = 'Midnight / Deep night';
      next.scene.atmosphere_weather = 'Light rain with wet reflections';
      next.lighting.key_light = 'Cyan and magenta neon signage glow';
      next.lighting.color_palette = ['#00f0ff', '#ff007f', '#bd93f9', '#111118'];
      next.style_and_rendering.aesthetic = 'Gritty Cyberpunk Noir';
    } else if (lower.includes('3d') || lower.includes('isometric') || lower.includes('isometrico')) {
      next.camera.shot_type = 'Isometric orthographic view';
      next.camera.angle = 'High-angle looking down';
      next.composition.perspective = 'Isometric 30° projection';
      next.style_and_rendering.medium = '3D Octane / Unreal Engine 5 Render';
      next.style_and_rendering.aesthetic = 'Cozy Studio Ghibli / Solarpunk';
    } else if (lower.includes('prodotto') || lower.includes('product') || lower.includes('studio')) {
      next.scene.environment = 'High-end commercial tabletop studio set';
      next.camera.shot_type = 'Macro detail shot';
      next.camera.lens_focal_length = '100mm Macro 1:1 Lens';
      next.lighting.key_light = 'Dramatic Rembrandt studio softbox';
      next.style_and_rendering.aesthetic = 'Clean Apple-style Commercial Studio';
    } else if (lower.includes('anime') || lower.includes('manga') || lower.includes('ghibli')) {
      next.style_and_rendering.medium = 'Anime cel-shaded key visual';
      next.style_and_rendering.aesthetic = 'Cozy Studio Ghibli / Solarpunk';
      next.lighting.key_light = 'Warm golden hour sunlight';
    } else if (lower.includes('fantasy') || lower.includes('drago') || lower.includes('cavaliere')) {
      next.style_and_rendering.medium = 'Digital concept art illustration';
      next.style_and_rendering.aesthetic = 'Dark Fantasy Souls-like';
      next.camera.angle = 'Low-angle heroic shot';
      next.scene.atmosphere_weather = 'Dense volumetric fog & mist';
    } else {
      next.scene.environment = `Atmospheric setting matching "${idea}" with rich contextual props`;
      next.scene.time_of_day = 'Golden hour sunset';
      next.lighting.key_light = 'Warm golden hour sunlight';
      next.style_and_rendering.medium = 'Photorealistic photography';
    }

    return next;
  }

  private async callLlmExpander(
    idea: string,
    base: ImagePromptSpec,
    config: AiAssistantConfig
  ): Promise<ImagePromptSpec> {
    const isCharacterSheetMode = base.character_sheet.enabled && base.character_sheet.mode !== 'scene_with_character';
    const isSceneWithCharacter = base.character_sheet.enabled && base.character_sheet.mode === 'scene_with_character';
    const charName = base.character_sheet.character_name?.trim() || '';

    let contextInstruction = '';
    if (isCharacterSheetMode) {
      contextInstruction = `CRITICAL DIRECTIVE - YOU ARE EDITING AN EXISTING CHARACTER MODEL SHEET:
The user is modifying and refining the character "${charName || 'Current Character'}".
1. DO NOT replace this character with another entity. Preserve character_sheet.character_name as "${charName || 'Character'}".
2. Update ONLY the biometric/appearance traits that are mentioned or implied by the user's idea ("${idea}"). Keep all other existing traits in character_sheet (skin, eyes, hair, marks, body, outfit) exactly as they are.
3. Keep character_sheet.enabled = true, character_sheet.mode = 'sheet_generation', and character_sheet.background_style = 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting'.
4. Keep scene.environment as 'Solid clean white seamless photo studio cyclorama backdrop'.
5. Update subject.description and subject.primary_entity to match the updated character turnaround.`;
    } else if (isSceneWithCharacter) {
      contextInstruction = `CRITICAL DIRECTIVE - YOU ARE COMPOSING A SCENE WITH A LOCKED CHARACTER:
The character "${charName}" is strictly LOCKED.
1. DO NOT change the character's biometric DNA in character_sheet (preserve character_name, gender_and_age, ethnicity_and_skin, eye_details, hair_details, distinctive_marks, body_build, image_data_url exactly).
2. Apply the user's idea ("${idea}") exclusively to:
   - subject.pose_or_action and subject.expression_or_mood
   - subject.clothing_or_materials (the outfit worn in this specific scene)
   - scene (environment, background_details, time_of_day, atmosphere_weather)
   - camera, lighting, composition, style_and_rendering.`;
    } else {
      contextInstruction = `CRITICAL DIRECTIVE - YOU ARE EXPANDING / REFINING AN IMAGE PROMPT:
Modify and enrich the CURRENT SPECIFICATION according to the user's idea ("${idea}").
Preserve existing detailed camera, lighting, and style choices unless the user's idea modifies them.`;
    }

    // Sanitize spec for LLM: strip large base64 image data URLs to avoid blowing up the token context window (>1M tokens)
    const specForLlm = structuredClone(base);
    if (specForLlm.character_sheet?.image_data_url) {
      delete specForLlm.character_sheet.image_data_url;
    }
    if (specForLlm.custom_properties) {
      specForLlm.custom_properties = specForLlm.custom_properties.filter(
        (p) => !p.value.startsWith('data:image') && p.value.length < 5000
      );
    }

    const systemPrompt = `You are an elite Computer Vision Director and AI Prompt Engineer.
${contextInstruction}

CURRENT SPECIFICATION (JSON):
${JSON.stringify(specForLlm, null, 2)}

USER IDEA / MODIFICATION REQUEST:
"${idea}"

TASK:
Return the full updated ImagePromptSpec JSON object reflecting these changes.
Return ONLY valid JSON matching the schema. No markdown fences, no conversational text.`;

    let rawJson = '';
    if (config.provider === 'gemini') {
      let model = config.model?.trim() || 'gemini-3.8-flash';
      if (model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash' || model === 'gemini-pro') {
        model = 'gemini-3.8-flash';
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        config.apiKey
      )}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser idea: ${idea}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let message = `Errore API Gemini (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) message = parsed.error.message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (config.provider === 'openai' || config.provider === 'openrouter') {
      const endpoint =
        config.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: idea },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let message = `Errore API OpenAI (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) message = parsed.error.message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      rawJson = data?.choices?.[0]?.message?.content || '';
    } else if (config.provider === 'ollama') {
      const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3.2',
          prompt: `${systemPrompt}\n\nUser idea: ${idea}`,
          format: 'json',
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Errore server Ollama (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      rawJson = data?.response || '';
    }

    const clean = rawJson.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
    if (!clean) {
      throw new Error('Nessuna risposta JSON valida ricevuta dal modello di intelligenza artificiale.');
    }
    const parsed = JSON.parse(clean);
    const result: ImagePromptSpec = { ...structuredClone(base), ...parsed };

    if (isSceneWithCharacter) {
      result.character_sheet = structuredClone(base.character_sheet);
      result.character_sheet.mode = 'scene_with_character';
      result.character_sheet.enabled = true;
    } else if (isCharacterSheetMode) {
      result.character_sheet = {
        ...structuredClone(base.character_sheet),
        ...(parsed.character_sheet || {}),
        mode: 'sheet_generation',
        enabled: true,
      };
      if (base.character_sheet.character_name) {
        result.character_sheet.character_name = base.character_sheet.character_name;
      }
      if (base.character_sheet.image_data_url) {
        result.character_sheet.image_data_url = base.character_sheet.image_data_url;
      }
    }

    return result;
  }

  /**
   * Reverse-engineers an uploaded photo into a full ImagePromptSpec using multimodal vision AI.
   * If custom instructions are provided, the AI applies requested variations.
   */
  async reverseEngineerImage(
    imageDataUrl: string,
    customInstructions: string,
    currentSpec: ImagePromptSpec,
    config: AiAssistantConfig,
    detectedAspect = '16:9'
  ): Promise<ImagePromptSpec> {
    if (!config.apiKey.trim() && config.provider !== 'ollama') {
      throw new Error('Chiave API non configurata. Apri le impostazioni ⚙ per inserire la tua chiave Google Gemini o OpenAI.');
    }

    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato immagine non valido o non riconosciuto');
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const base = this.createEmptySpec();
    base.technical_parameters.aspect_ratio = detectedAspect;

    const instructionsText = customInstructions.trim()
      ? `\n\nUSER MODIFICATION INSTRUCTIONS: ${customInstructions.trim()}.\nApply these requested changes and variations to the extracted prompt while keeping the overall technical style and composition consistent.`
      : '\n\nGoal: Reverse-engineer this photo into a technical prompt specification to recreate it with 100% photographic fidelity.';

    const systemPrompt = `You are an elite Computer Vision Director and AI Prompt Engineer specializing in Midjourney v6/v7, FLUX.1/FLUX.2, and Stable Diffusion XL.
Analyze this image in rigorous technical detail and output a structured JSON prompt matching this schema:
${JSON.stringify(base, null, 2)}

Instructions:
1. "meta": set "title" to a descriptive 4-6 word title (e.g. "Recreated: [Entity Name]").
2. "subject": analyze the primary subject in depth (primary_entity, detailed somatic/texture description, pose_or_action, expression_or_mood, clothing_or_materials, placement).
3. "scene": environment, background_details, time_of_day, atmosphere_weather.
4. "camera": infer exact optical parameters: shot_type, angle, lens_focal_length (e.g. "50mm Standard Prime Lens", "85mm f/1.4", "35mm Street Lens"), aperture_depth_of_field, camera_body_or_film (e.g. "Leica M11 Rangefinder", "Hasselblad H6D-100c", "Kodak Portra 400").
5. "lighting": key_light, fill_or_ambient, color_temperature, shadow_quality, and extract exactly 4 hex color strings in color_palette matching dominant tones in the photo.
6. "composition": framing_rule, focal_point, foreground_elements, perspective.
7. "style_and_rendering": medium (e.g. "Photorealistic photography", "35mm Analog Film Photography"), aesthetic, color_grading, and quality_tags.
8. "typography": if text or typography is visible, set enabled: true and extract exact_text, font_style, and placement_and_material. Otherwise enabled: false.
9. "technical_parameters": aspect_ratio should be "${detectedAspect}", provide a specific negative_prompt, and set raw_mode: true.${instructionsText}

Return ONLY valid JSON matching the schema. No markdown code fences, no introductory or concluding text.`;

    let rawJson = '';
    if (config.provider === 'gemini') {
      const model = config.model || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        config.apiKey
      )}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: systemPrompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Errore Google Gemini API (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (config.provider === 'openai' || config.provider === 'openrouter') {
      const endpoint =
        config.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: systemPrompt },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Errore OpenAI API (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.choices?.[0]?.message?.content || '';
    } else if (config.provider === 'ollama') {
      const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3.2-vision',
          prompt: systemPrompt,
          images: [base64Data],
          format: 'json',
          stream: false,
        }),
      });
      if (!res.ok) {
        throw new Error(`Errore Ollama Vision (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.response || '';
    }

    const clean = rawJson.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
    if (!clean) throw new Error('Nessuna risposta valida ricevuta dal modello di visione.');

    const parsed = JSON.parse(clean);
    return {
      ...structuredClone(base),
      ...parsed,
      subject: { ...base.subject, ...(parsed.subject || {}) },
      scene: { ...base.scene, ...(parsed.scene || {}) },
      camera: { ...base.camera, ...(parsed.camera || {}) },
      lighting: { ...base.lighting, ...(parsed.lighting || {}) },
      composition: { ...base.composition, ...(parsed.composition || {}) },
      style_and_rendering: { ...base.style_and_rendering, ...(parsed.style_and_rendering || {}) },
      typography: { ...base.typography, ...(parsed.typography || {}) },
      character_sheet: { ...base.character_sheet, ...(parsed.character_sheet || {}) },
      technical_parameters: { ...base.technical_parameters, ...(parsed.technical_parameters || {}) },
      additional_subjects: parsed.additional_subjects || [],
      custom_properties: parsed.custom_properties || [],
    };
  }

  /**
   * Synthesizes 1 to 5 photos of a person into a consistent CharacterSheetBlock using multimodal AI.
   * Cross-references multiple angles to extract invariant biometric DNA, facial features, and style.
   */
  async extractCharacterFromPhotos(
    photoDataUrls: string[],
    contextHint: string,
    config: AiAssistantConfig
  ): Promise<CharacterSheetBlock> {
    if (!photoDataUrls || photoDataUrls.length === 0) {
      throw new Error('Nessuna foto selezionata per l’analisi');
    }

    if (!config.apiKey.trim() && config.provider !== 'ollama') {
      throw new Error('Chiave API non configurata. Apri le impostazioni ⚙ per inserire la tua chiave Google Gemini o OpenAI.');
    }

    const defaultSheet = structuredClone(DEFAULT_CHARACTER_SHEET);

    const systemPrompt = `You are an elite Character Designer, Biometrics Specialist, and AI Prompt Engineer specializing in Midjourney v6/v7 (--cref), FLUX.1/FLUX.2, and photorealistic multi-angle character turnarounds.
You are provided with ${photoDataUrls.length} reference photo(s) of an individual.
Analyze the photo(s) in deep technical detail. Cross-reference across all angles and lighting to isolate their invariant biometric DNA, facial structure, skin micro-texture, and signature style.

Output ONLY a JSON object strictly adhering to this schema:
{
  "character_name": "Full name (use the provided hint if given, otherwise create a fitting realistic name)",
  "gender_and_age": "Gender and specific age/age-range (e.g. 'Woman in her late 20s, approx 28 years old')",
  "ethnicity_and_skin": "Detailed ethnicity, skin tone, undertone, natural pores, texture, finish (e.g. 'Warm olive skin with subtle freckles across the bridge of the nose and natural skin pores')",
  "eye_details": "Exact eye shape, iris color, flecks, lash line, eyebrow arch and thickness (e.g. 'Almond-shaped hazel eyes with amber gold flecks and well-defined natural brows')",
  "hair_details": "Hair color with undertones, natural texture (wavy/curly/straight), haircut, length, parting (e.g. 'Chestnut brown wavy shoulder-length hair parted slightly off-center')",
  "distinctive_marks": "Unique facial features: jawline structure, cheekbones, nose profile, beauty marks, scars, smile lines, dimples",
  "body_build": "Estimated frame, height impression, posture, shoulder width and build (e.g. 'Slender athletic build with upright posture')",
  "signature_outfit": "Signature cohesive clothing style synthesized from the photos (garments, fabrics, colors, textures)",
  "signature_props": "Recurring accessories, jewelry, glasses, or items (or empty if none)",
  "layout_mode": "turnaround_4_views",
  "views": ["Front view", "3/4 Profile view", "Side profile view", "Back view"],
  "background_style": "Neutral light-grey seamless studio backdrop with soft floor shadow",
  "cref_url": ""
}
${contextHint.trim() ? `\nUSER CONTEXT & INSTRUCTIONS: ${contextHint.trim()}` : ''}

Instructions:
1. Synthesize consistent biometric traits from the photos to create a cohesive, photorealistic character identity.
2. Provide rich, concrete descriptive language for image generation models (avoid vague adjectives).
3. Return ONLY valid JSON matching the schema. No markdown code fences, no extra text.`;

    let rawJson = '';

    if (config.provider === 'gemini') {
      const model = config.model || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        config.apiKey
      )}`;

      const parts: any[] = [];
      for (const dataUrl of photoDataUrls) {
        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      parts.push({ text: systemPrompt });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Errore Google Gemini API (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (config.provider === 'openai' || config.provider === 'openrouter') {
      const endpoint =
        config.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';

      const content: any[] = [{ type: 'text', text: systemPrompt }];
      for (const dataUrl of photoDataUrls) {
        content.push({ type: 'image_url', image_url: { url: dataUrl } });
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Errore OpenAI API (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.choices?.[0]?.message?.content || '';
    } else if (config.provider === 'ollama') {
      const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
      const images: string[] = [];
      for (const dataUrl of photoDataUrls) {
        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
        if (match) images.push(match[2]);
      }

      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3.2-vision',
          prompt: systemPrompt,
          images,
          format: 'json',
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Errore Ollama Vision (${res.status})`);
      }
      const data = await res.json();
      rawJson = data?.response || '';
    }

    const clean = rawJson.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
    if (!clean) throw new Error('Nessuna risposta ricevuta dal modello per la scheda personaggio.');

    const parsed = JSON.parse(clean);
    return {
      enabled: true,
      mode: 'sheet_generation',
      character_name: parsed.character_name || 'Nuovo Personaggio',
      gender_and_age: parsed.gender_and_age || defaultSheet.gender_and_age,
      ethnicity_and_skin: parsed.ethnicity_and_skin || defaultSheet.ethnicity_and_skin,
      eye_details: parsed.eye_details || defaultSheet.eye_details,
      hair_details: parsed.hair_details || defaultSheet.hair_details,
      distinctive_marks: parsed.distinctive_marks || defaultSheet.distinctive_marks,
      body_build: parsed.body_build || defaultSheet.body_build,
      signature_outfit: parsed.signature_outfit || defaultSheet.signature_outfit,
      signature_props: parsed.signature_props || defaultSheet.signature_props,
      layout_mode: parsed.layout_mode || 'turnaround_4_views',
      views: Array.isArray(parsed.views) && parsed.views.length > 0 ? parsed.views : defaultSheet.views,
      background_style: parsed.background_style || defaultSheet.background_style,
      cref_url: parsed.cref_url || '',
      cref_weight: 100,
    };
  }

  private loadAiConfig(): AiAssistantConfig {
    try {
      const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.apiKey) {
          parsed.apiKey = IMPORTED_DEFAULT_GEMINI_KEY;
        }
        return parsed;
      }
    } catch {}
    return {
      provider: 'gemini',
      apiKey: IMPORTED_DEFAULT_GEMINI_KEY,
      model: 'gemini-3.8-flash',
      ollamaUrl: 'http://localhost:11434',
    };
  }

  private persist(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  private loadCustomOptions(): CustomOptionsMap {
    const empty: CustomOptionsMap = {
      primary_entity: [],
      subject_description: [],
      pose_or_action: [],
      expression_or_mood: [],
      clothing_or_materials: [],
      placement: [],
      environment: [],
      background_details: [],
      time_of_day: [],
      atmosphere_weather: [],
      shot_type: [],
      camera_angle: [],
      lens_focal_length: [],
      aperture_depth_of_field: [],
      camera_body_or_film: [],
      key_light: [],
      fill_or_ambient: [],
      color_temperature: [],
      shadow_quality: [],
      framing_rule: [],
      focal_point: [],
      foreground_elements: [],
      perspective: [],
      medium: [],
      aesthetic: [],
      color_grading: [],
      quality_tags: [],
      font_style: [],
      typography_placement: [],
      aspect_ratio: [],
      negative_prompt: [],
      character_gender_age: [],
      character_eyes: [],
      character_hair: [],
      character_marks: [],
      character_build: [],
      character_outfit: [],
      character_background: [],
    };
    try {
      const raw = localStorage.getItem(CUSTOM_OPTIONS_STORAGE_KEY);
      if (raw) {
        return { ...empty, ...JSON.parse(raw) };
      }
    } catch {}
    return empty;
  }

  setDefaultOutputModel(model: OutputTab): void {
    if (['gpt', 'json', 'flux', 'midjourney', 'sdxl'].includes(model)) {
      this.defaultOutputModel.set(model);
    }
  }

  private loadDefaultOutputModel(): OutputTab {
    try {
      const raw = localStorage.getItem(DEFAULT_OUTPUT_MODEL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (['gpt', 'json', 'flux', 'midjourney', 'sdxl'].includes(parsed)) {
          return parsed as OutputTab;
        }
      }
    } catch {}
    return 'gpt';
  }

  private loadUserPresets(): PromptTemplate[] {
    try {
      const raw = localStorage.getItem(USER_PRESETS_STORAGE_KEY);
      if (raw) {
        const parsed: PromptTemplate[] = JSON.parse(raw);
        const existingIds = new Set(parsed.map((p) => p.id));
        for (const imp of IMPORTED_USER_PRESETS) {
          if (!existingIds.has(imp.id)) {
            parsed.unshift(imp);
          }
        }
        return parsed;
      }
    } catch {}
    return [...IMPORTED_USER_PRESETS];
  }

  private loadSavedCharacters(): SavedCharacter[] {
    try {
      const raw = localStorage.getItem(SAVED_CHARACTERS_STORAGE_KEY);
      if (raw) {
        const parsed: SavedCharacter[] = JSON.parse(raw);
        const existingNames = new Set(parsed.map((c) => c.name.toLowerCase()));
        for (const imp of IMPORTED_CHARACTERS) {
          if (!existingNames.has(imp.name.toLowerCase())) {
            parsed.unshift(imp);
          }
        }
        return parsed;
      }
    } catch {}
    return [...IMPORTED_CHARACTERS];
  }

  setImageGenConfig(cfg: ImageGenConfig): void {
    this.imageGenConfig.set(cfg);
  }

  private loadImageGenConfig(): ImageGenConfig {
    const defaultProfiles = [...IMPORTED_IMAGE_GEN_PROFILES];
    const defaultGeminiKey = this.loadAiConfig()?.apiKey || IMPORTED_DEFAULT_GEMINI_KEY;
    const defaultProviderKeys: ProviderApiKeys = {
      fal_ai: IMPORTED_DEFAULT_FAL_KEY,
      gemini_imagen: defaultGeminiKey,
      openai_dalle: '',
      custom: '',
    };

    try {
      const raw = localStorage.getItem(IMAGE_GEN_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const providerApiKeys: ProviderApiKeys = {
          ...defaultProviderKeys,
          ...(parsed.providerApiKeys || {}),
        };
        if (!providerApiKeys.fal_ai) {
          providerApiKeys.fal_ai = IMPORTED_DEFAULT_FAL_KEY;
        }
        if (!providerApiKeys.gemini_imagen) {
          providerApiKeys.gemini_imagen = defaultGeminiKey;
        }

        const savedProfiles: ImageGenProfile[] = Array.isArray(parsed.profiles) && parsed.profiles.length > 0
          ? parsed.profiles
          : defaultProfiles;

        const existingProfileIds = new Set(savedProfiles.map((p) => p.id));
        for (const imp of IMPORTED_IMAGE_GEN_PROFILES) {
          if (!existingProfileIds.has(imp.id)) {
            savedProfiles.push(imp);
          }
        }

        const activeProfileId = parsed.activeProfileId || 'custom-1792929838032';
        const activeProfile = savedProfiles.find((p) => p.id === activeProfileId) || savedProfiles[0] || defaultProfiles[0];

        return {
          provider: parsed.provider || activeProfile.provider,
          model: parsed.model || activeProfile.model,
          apiKey: parsed.apiKey || providerApiKeys[parsed.provider as keyof ProviderApiKeys] || activeProfile.apiKey || '',
          endpointUrl: parsed.endpointUrl || activeProfile.endpointUrl || 'http://127.0.0.1:7860/sdapi/v1/txt2img',
          activeProfileId,
          profiles: savedProfiles,
          providerApiKeys,
          loraUrl: parsed.loraUrl || activeProfile.loraUrl || '',
          loraScale: parsed.loraScale ?? activeProfile.loraScale ?? 1.0,
        };
      }
    } catch {}

    const nanoProfile = defaultProfiles.find((p) => p.id === 'custom-1792929838032') || defaultProfiles[0];
    return {
      provider: nanoProfile.provider,
      model: nanoProfile.model,
      apiKey: IMPORTED_DEFAULT_FAL_KEY,
      endpointUrl: 'http://127.0.0.1:7860/sdapi/v1/txt2img',
      activeProfileId: nanoProfile.id,
      profiles: defaultProfiles,
      providerApiKeys: defaultProviderKeys,
      loraUrl: '',
      loraScale: 1.0,
    };
  }

  reimportWebData(): void {
    // 1. Merge characters
    const currentChars = [...this.savedCharacters()];
    const existingNames = new Set(currentChars.map((c) => c.name.toLowerCase()));
    for (const imp of IMPORTED_CHARACTERS) {
      if (!existingNames.has(imp.name.toLowerCase())) {
        currentChars.unshift(imp);
      }
    }
    this.savedCharacters.set(currentChars);

    // 2. Merge user presets
    const currentPresets = [...this.userPresets()];
    const existingPresetIds = new Set(currentPresets.map((p) => p.id));
    for (const imp of IMPORTED_USER_PRESETS) {
      if (!existingPresetIds.has(imp.id)) {
        currentPresets.unshift(imp);
      }
    }
    this.userPresets.set(currentPresets);

    // 3. Update imageGenConfig
    const curImg = this.imageGenConfig();
    const existingProfileIds = new Set((curImg.profiles || []).map((p) => p.id));
    const mergedProfiles = [...(curImg.profiles || [])];
    for (const imp of IMPORTED_IMAGE_GEN_PROFILES) {
      if (!existingProfileIds.has(imp.id)) {
        mergedProfiles.push(imp);
      }
    }
    const providerKeys: ProviderApiKeys = {
      ...(curImg.providerApiKeys || {}),
      fal_ai: IMPORTED_DEFAULT_FAL_KEY,
      gemini_imagen: curImg.providerApiKeys?.gemini_imagen || IMPORTED_DEFAULT_GEMINI_KEY,
    };
    this.imageGenConfig.set({
      ...curImg,
      provider: 'fal_ai',
      model: 'fal-ai/nano-banana-pro',
      activeProfileId: 'custom-1792929838032',
      profiles: mergedProfiles,
      providerApiKeys: providerKeys,
      apiKey: IMPORTED_DEFAULT_FAL_KEY,
    });

    // 4. Update aiConfig (Gemini)
    const curAi = this.aiConfig();
    if (!curAi.apiKey) {
      this.aiConfig.set({
        ...curAi,
        apiKey: IMPORTED_DEFAULT_GEMINI_KEY,
      });
    }
  }

  switchActiveProfile(profileId: string): void {
    const cur = this.imageGenConfig();
    const profiles = cur.profiles && cur.profiles.length ? cur.profiles : DEFAULT_IMAGE_GEN_PROFILES;
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    const defaultGeminiKey = this.aiConfig().apiKey || '';
    const providerKeys: ProviderApiKeys = cur.providerApiKeys || {
      fal_ai: DEFAULT_FAL_KEY,
      gemini_imagen: defaultGeminiKey,
      openai_dalle: '',
      custom: '',
    };
    const effectiveApiKey = profile.apiKey ||
      providerKeys[profile.provider as keyof ProviderApiKeys] ||
      (profile.provider === 'fal_ai' ? DEFAULT_FAL_KEY : (profile.provider === 'gemini_imagen' ? defaultGeminiKey : ''));

    this.imageGenConfig.set({
      ...cur,
      activeProfileId: profile.id,
      provider: profile.provider,
      model: profile.model,
      apiKey: effectiveApiKey,
      endpointUrl: profile.endpointUrl || cur.endpointUrl,
      loraUrl: profile.loraUrl || '',
      loraScale: profile.loraScale ?? 1.0,
    });
  }

  saveProfile(profile: ImageGenProfile): void {
    const cur = this.imageGenConfig();
    const profiles = [...(cur.profiles || DEFAULT_IMAGE_GEN_PROFILES)];
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile };
    } else {
      profiles.push(profile);
    }
    this.imageGenConfig.set({
      ...cur,
      profiles,
    });
  }

  deleteProfile(profileId: string): void {
    const cur = this.imageGenConfig();
    const existing = cur.profiles && cur.profiles.length > 0 ? cur.profiles : [...DEFAULT_IMAGE_GEN_PROFILES];
    const profiles = existing.filter((p) => p.id !== profileId);
    if (profiles.length === 0) {
      profiles.push(DEFAULT_IMAGE_GEN_PROFILES[0]);
    }
    let nextActiveId = cur.activeProfileId;
    if (cur.activeProfileId === profileId) {
      nextActiveId = profiles[0].id;
    }
    this.imageGenConfig.set({
      ...cur,
      profiles,
      activeProfileId: nextActiveId,
    });
    if (nextActiveId) {
      this.switchActiveProfile(nextActiveId);
    }
  }

  resetDefaultProfiles(): void {
    const cur = this.imageGenConfig();
    this.imageGenConfig.set({
      ...cur,
      profiles: [...DEFAULT_IMAGE_GEN_PROFILES],
      activeProfileId: DEFAULT_IMAGE_GEN_PROFILES[0].id,
    });
    this.switchActiveProfile(DEFAULT_IMAGE_GEN_PROFILES[0].id);
  }

  setProviderApiKey(provider: ImageGenProvider, key: string): void {
    const cur = this.imageGenConfig();
    const keys: ProviderApiKeys = {
      ...(cur.providerApiKeys || {}),
      [provider]: key.trim(),
    };
    const updateActiveKey = cur.provider === provider;
    this.imageGenConfig.set({
      ...cur,
      providerApiKeys: keys,
      apiKey: updateActiveKey ? key.trim() : cur.apiKey,
    });
  }

  async testFalApiKey(key?: string): Promise<{ success: boolean; name?: string; email?: string; error?: string }> {
    const curKey = key?.trim() || this.imageGenConfig().providerApiKeys?.fal_ai || this.imageGenConfig().apiKey || DEFAULT_FAL_KEY;
    if (!curKey) {
      return { success: false, error: 'Chiave API fal.ai vuota o non inserita.' };
    }
    try {
      const res = await fetch('https://rest.alpha.fal.ai/users/current', {
        headers: {
          'Authorization': `Key ${curKey}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return { success: false, error: 'Chiave fal.ai non valida o non autorizzata (401/403).' };
        }
        return { success: false, error: `Errore verifica API (${res.status}): ${await res.text()}` };
      }
      const data = await res.json();
      return {
        success: true,
        name: data.full_name || data.nickname || 'Utente fal.ai',
        email: data.email,
      };
    } catch (e: any) {
      return { success: false, error: 'Impossibile contattare i server di fal.ai: ' + (e.message || String(e)) };
    }
  }

  async testGeminiApiKey(key?: string): Promise<{ success: boolean; modelsCount?: number; error?: string }> {
    const curKey = key?.trim() || this.imageGenConfig().providerApiKeys?.gemini_imagen || this.aiConfig().apiKey || '';
    if (!curKey) {
      return { success: false, error: 'Chiave API Google Gemini vuota o non inserita.' };
    }
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(curKey)}`);
      if (!res.ok) {
        if (res.status === 400) {
          return { success: false, error: 'Chiave Gemini non valida o non autorizzata (400).' };
        }
        return { success: false, error: `Errore verifica API Gemini (${res.status}): ${await res.text()}` };
      }
      const data = await res.json();
      const count = Array.isArray(data.models) ? data.models.length : 0;
      return {
        success: true,
        modelsCount: count,
      };
    } catch (e: any) {
      return { success: false, error: 'Impossibile contattare i server Google Gemini: ' + (e.message || String(e)) };
    }
  }

  getImageGenerationPrompt(spec: ImagePromptSpec, provider?: ImageGenProvider): string {
    const prov = provider || this.imageGenConfig().provider;

    if (prov === 'fal_ai' || prov === 'openai_dalle') {
      return this.compileForFlux(spec);
    }

    if (prov === 'gemini_imagen') {
      return this.compileForGpt4oAndGemini(spec);
    }

    if (prov === 'comfyui' || prov === 'custom') {
      return this.compileForSdxl(spec).positive;
    }

    return this.compileForGpt4oAndGemini(spec);
  }

  async generateImage(spec: ImagePromptSpec, customConfig?: ImageGenConfig, signal?: AbortSignal): Promise<GeneratedImageResult> {
    const config = customConfig || this.imageGenConfig();
    const prompt = this.getImageGenerationPrompt(spec, config.provider);
    const aspect = spec.technical_parameters.aspect_ratio || '16:9';
    const startTime = Date.now();
    const isSceneWithCharacter = spec.character_sheet?.enabled && spec.character_sheet?.mode === 'scene_with_character';

    if (config.provider === 'fal_ai') {
      const apiKey = config.apiKey || this.imageGenConfig().providerApiKeys?.fal_ai || DEFAULT_FAL_KEY;
      if (!apiKey) {
        throw new Error('API Key fal.ai mancante. Inseriscila nelle impostazioni (icona ⚙).');
      }

      const model = config.model?.trim() || 'fal-ai/flux-realism';
      const url = `https://fal.run/${model}`;

      // Aspect ratio mapping for fal.ai FLUX
      let imageSize: any = 'landscape_16_9';
      if (aspect === '16:9') {
        imageSize = 'landscape_16_9';
      } else if (aspect === '4:5') {
        imageSize = { width: 896, height: 1152 }; // Standard 4:5 vertical portrait (Instagram/Social)
      } else if (aspect === '9:16') {
        imageSize = 'portrait_16_9';
      } else if (aspect === '1:1') {
        imageSize = 'square_hd';
      } else if (aspect === '4:3') {
        imageSize = 'landscape_4_3';
      } else if (aspect === '3:4') {
        imageSize = 'portrait_4_3';
      } else if (aspect === '21:9') {
        imageSize = { width: 1280, height: 544 };
      } else if (aspect === '2:3') {
        imageSize = { width: 768, height: 1152 };
      } else if (aspect === '3:2') {
        imageSize = { width: 1152, height: 768 };
      }

      const bodyPayload: any = {
        prompt,
        image_size: imageSize,
        num_images: 1,
        enable_safety_checker: false,
        sync_mode: true,
      };

      if (config.loraUrl?.trim()) {
        bodyPayload.loras = [
          {
            path: config.loraUrl.trim(),
            scale: config.loraScale ?? 1.0,
          },
        ];
      }

      if (model.includes('schnell')) {
        bodyPayload.num_inference_steps = 4;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        let message = `Errore generazione fal.ai (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.detail) {
            if (typeof parsed.detail === 'string') message = parsed.detail;
            else if (Array.isArray(parsed.detail)) message = parsed.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
          } else if (parsed.message) {
            message = parsed.message;
          }
        } catch {}
        if (res.status === 401 || res.status === 403) {
          message = 'Chiave fal.ai non valida o non autorizzata. Verifica la tua chiave nelle impostazioni (⚙).';
        } else if (res.status === 402) {
          message = 'Credito fal.ai esaurito. Ricarica il tuo conto su fal.ai.';
        }
        throw new Error(message);
      }

      const data = await res.json();
      const imgItem = data?.images?.[0];
      if (!imgItem?.url) {
        throw new Error('Nessuna immagine restituita dal modello fal.ai.');
      }

      // Convert image to local dataUrl so it can be saved locally, cached, and used for character sheet bindings
      let dataUrl = imgItem.url;
      try {
        const imgRes = await fetch(imgItem.url);
        const blob = await imgRes.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Fallback to remote fal.media URL:', e);
      }

      return {
        dataUrl,
        mimeType: imgItem.content_type || 'image/jpeg',
        model,
        prompt,
        aspectRatio: aspect,
        timeMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } else if (config.provider === 'gemini_imagen') {
      const apiKey = config.apiKey || this.aiConfig().apiKey;
      if (!apiKey) {
        throw new Error('API Key mancante per Google Gemini / Imagen. Inseriscila nelle impostazioni (icona ⚙).');
      }

      let model = config.model?.trim() || 'gemini-2.5-flash-image';
      if (model === 'imagen-3.0-generate-002') {
        model = 'gemini-2.5-flash-image';
      }

      // Check whether to use generateContent (standard for gemini multimodal models) or predict (for legacy vertex/imagen models)
      const isGenerateContent = model.startsWith('gemini') || !model.startsWith('imagen');

      if (isGenerateContent) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const parts: any[] = [];
        // Only attach reference sheet image when composing a SCENE with a locked character!
        // In sheet generation mode (Character Studio), we generate the character from scratch and must NOT attach an old turnaround image.
        if (isSceneWithCharacter && spec.character_sheet?.image_data_url) {
          const match = spec.character_sheet.image_data_url.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }

        parts.push({ text: prompt });

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
          }),
          signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          let message = `Errore generazione Gemini Image (${res.status})`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.message) {
              message = parsed.error.message;
              if (res.status === 400 && message.toLowerCase().includes('api key')) {
                message = 'API Key non valida o non autorizzata. Verifica la chiave nelle impostazioni (⚙).';
              } else if (res.status === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('resource_exhausted')) {
                message = `Quota API superata o rate-limit attivo per "${model}". Prova a selezionare "gemini-2.5-flash-image" (quota più elevata) o attendi qualche minuto.`;
              } else if (res.status === 404 || message.toLowerCase().includes('not found')) {
                message = `Il modello "${model}" non è stato trovato su Gemini API v1beta. Usa "gemini-2.5-flash-image" (consigliato).`;
              }
            }
          } catch {}
          throw new Error(message);
        }

        const data = await res.json();
        const candidateParts: any[] = data?.candidates?.[0]?.content?.parts || [];
        const imagePart = candidateParts.find((p: any) => p.inlineData && p.inlineData.data);

        if (!imagePart) {
          const promptBlock = data?.promptFeedback?.blockReason;
          const finishReason = data?.candidates?.[0]?.finishReason;
          const textPart = candidateParts.find((p: any) => p.text)?.text;
          let reason = '';
          if (promptBlock) {
            reason = `Generazione bloccata dalle policy di sicurezza Google Gemini (${promptBlock}). Modifica i termini del prompt o del soggetto.`;
          } else if (finishReason && finishReason === 'SAFETY') {
            reason = 'Generazione interrotta per policy visive di sicurezza (SAFETY). Riformula i dettagli della scena o del vestiario.';
          } else if (finishReason && finishReason !== 'STOP') {
            reason = `Generazione interrotta dal modello: ${finishReason}.`;
          } else if (textPart) {
            reason = `Il modello ha risposto: "${textPart.slice(0, 150)}" ma non ha restituito dati grafici. Prova con gemini-2.5-flash-image.`;
          } else {
            reason = 'Nessuna immagine restituita dal modello Gemini. Verifica la compatibilità del modello nelle impostazioni.';
          }
          throw new Error(reason);
        }

        const mime = imagePart.inlineData.mimeType || 'image/png';
        const dataUrl = `data:${mime};base64,${imagePart.inlineData.data}`;

        return {
          dataUrl,
          mimeType: mime,
          model,
          prompt,
          aspectRatio: aspect,
          timeMs: Date.now() - startTime,
          timestamp: Date.now(),
        };
      } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`;

        // Map aspect ratio for Imagen: valid values are "1:1", "3:4", "4:3", "9:16", "16:9"
        let imagenAspect = '16:9';
        if (aspect === '1:1') imagenAspect = '1:1';
        else if (aspect === '9:16' || aspect === '2:3') imagenAspect = '9:16';
        else if (aspect === '4:3') imagenAspect = '4:3';
        else if (aspect === '3:4' || aspect === '4:5') imagenAspect = '3:4';
        else imagenAspect = '16:9';

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: imagenAspect,
              personGeneration: 'ALLOW_ADULT',
              outputMimeType: 'image/jpeg',
            },
          }),
          signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          let message = `Errore generazione Imagen (${res.status})`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.message) message = parsed.error.message;
          } catch {}
          throw new Error(message);
        }

        const data = await res.json();
        const prediction = data?.predictions?.[0];
        if (!prediction?.bytesBase64Encoded) {
          throw new Error('Nessuna immagine restituita dal modello Imagen.');
        }

        const mime = prediction.mimeType || 'image/jpeg';
        const dataUrl = `data:${mime};base64,${prediction.bytesBase64Encoded}`;

        return {
          dataUrl,
          mimeType: mime,
          model,
          prompt,
          aspectRatio: imagenAspect,
          timeMs: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
    } else if (config.provider === 'openai_dalle') {
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error('API Key OpenAI mancante per DALL-E 3. Inseriscila nelle impostazioni.');
      }

      const model = config.model.trim() || 'dall-e-3';
      let size = '1792x1024';
      if (aspect === '1:1') size = '1024x1024';
      else if (aspect === '9:16' || aspect === '2:3' || aspect === '4:5') size = '1024x1792';
      else size = '1792x1024';

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size,
          response_format: 'b64_json',
        }),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        let message = `Errore generazione DALL-E 3 (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) message = parsed.error.message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) throw new Error('Nessuna immagine restituita da DALL-E 3.');

      return {
        dataUrl: `data:image/png;base64,${b64}`,
        mimeType: 'image/png',
        model,
        prompt,
        aspectRatio: size,
        timeMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } else if (config.provider === 'comfyui' || config.provider === 'custom') {
      const endpoint = config.endpointUrl.trim() || 'http://127.0.0.1:7860/sdapi/v1/txt2img';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
      }

      let width = 1024;
      let height = 576;
      if (aspect === '1:1') { width = 1024; height = 1024; }
      else if (aspect === '9:16') { width = 576; height = 1024; }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          negative_prompt: spec.technical_parameters.negative_prompt || '',
          steps: 25,
          width,
          height,
          ...(isSceneWithCharacter && spec.character_sheet?.image_data_url ? { reference_image: spec.character_sheet.image_data_url, init_images: [spec.character_sheet.image_data_url] } : {}),
        }),
        signal,
      });

      if (!res.ok) {
        throw new Error(`Errore endpoint locale (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      const imgB64 = data?.images?.[0] || data?.image || data?.output;
      if (!imgB64) throw new Error('Nessuna immagine nel payload di risposta.');

      const dataUrl = imgB64.startsWith('data:') ? imgB64 : `data:image/png;base64,${imgB64}`;
      return {
        dataUrl,
        mimeType: 'image/png',
        model: config.model || 'local-sd',
        prompt,
        aspectRatio: `${width}x${height}`,
        timeMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    throw new Error(`Provider di generazione non supportato: ${config.provider}`);
  }
}
