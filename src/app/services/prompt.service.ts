import { Injectable, computed, effect, signal } from '@angular/core';
import {
  AiAssistantConfig,
  CustomOptionsMap,
  ImagePromptSpec,
  PresetCategoryKey,
  PromptTemplate,
} from '../models/prompt.model';

const USER_PRESETS_STORAGE_KEY = 'prompt_json_studio_user_presets_v1';
const CUSTOM_OPTIONS_STORAGE_KEY = 'prompt_json_studio_custom_options_v1';
const AI_CONFIG_STORAGE_KEY = 'prompt_json_studio_ai_config_v1';

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
      'Low-angle heroic shot (Looking up)',
      'High-angle looking down (Elevated vantage)',
      'Bird’s-eye overhead view (Top-down 90° flat lay)',
      'Worm’s-eye view (Ground level)',
      'Slight Dutch tilt (Dynamic tension)',
      'Over-the-shoulder shot (Subject framing)',
      '45-degree tabletop angle (Food & product)',
    ],
    lens_focal_length: [
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
  };

  readonly builtInTemplates: PromptTemplate[] = [
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
  readonly aiConfig = signal<AiAssistantConfig>(this.loadAiConfig());

  readonly allTemplates = computed<PromptTemplate[]>(() => [...this.builtInTemplates, ...this.userPresets()]);

  constructor() {
    effect(() => this.persist(CUSTOM_OPTIONS_STORAGE_KEY, this.customOptions()));
    effect(() => this.persist(USER_PRESETS_STORAGE_KEY, this.userPresets()));
    effect(() => this.persist(AI_CONFIG_STORAGE_KEY, this.aiConfig()));
    this.tryLoadEnvConfig();
  }

  private async tryLoadEnvConfig(): Promise<void> {
    if (this.aiConfig().apiKey) return;
    try {
      const res = await fetch('/env.json');
      if (res.ok) {
        const data = await res.json();
        if (data.GEMINI_API_KEY && !this.aiConfig().apiKey) {
          this.aiConfig.update((c) => ({
            ...c,
            apiKey: data.GEMINI_API_KEY,
            model: data.DEFAULT_MODEL || c.model || 'gemini-3.8-flash',
          }));
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
  buildCleanJsonObject(spec: ImagePromptSpec): Record<string, unknown> {
    const customBySection = (sec: string): Record<string, string> => {
      const out: Record<string, string> = {};
      for (const prop of spec.custom_properties) {
        if (prop.section === sec && prop.key.trim()) {
          out[prop.key.trim()] = prop.value;
        }
      }
      return out;
    };

    const result: Record<string, unknown> = {
      meta: {
        version: spec.meta.version || '2.0',
        title: spec.meta.title || 'Untitled Prompt',
        aspect_ratio: spec.technical_parameters.aspect_ratio,
      },
      subject: {
        primary_entity: spec.subject.primary_entity,
        description: spec.subject.description,
        pose_or_action: spec.subject.pose_or_action,
        expression_or_mood: spec.subject.expression_or_mood,
        clothing_or_materials: spec.subject.clothing_or_materials,
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
      scene: {
        environment: spec.scene.environment,
        background_details: spec.scene.background_details,
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
      technical_parameters: {
        aspect_ratio: spec.technical_parameters.aspect_ratio,
        ...(spec.technical_parameters.negative_prompt.trim()
          ? { negative_prompt: spec.technical_parameters.negative_prompt }
          : {}),
        ...(spec.technical_parameters.seed !== null ? { seed: spec.technical_parameters.seed } : {}),
        model_hints: {
          stylize: spec.technical_parameters.stylize,
          chaos: spec.technical_parameters.chaos,
          raw_mode: spec.technical_parameters.raw_mode,
        },
      },
      ...customBySection('root'),
    };

    return result;
  }

  /**
   * Compiles the structured JSON spec into FLUX.1 / FLUX.2 hierarchical natural prompt.
   */
  compileForFlux(spec: ImagePromptSpec): string {
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
    if (spec.technical_parameters.negative_prompt.trim()) {
      flags.push(`--no ${spec.technical_parameters.negative_prompt.trim()}`);
    }

    return `${body} ${flags.join(' ')}`;
  }

  /**
   * Compiles a hybrid instruction + JSON prompt ideal for GPT-4o, Gemini Imagen 3 / Nano Banana.
   */
  compileForGpt4oAndGemini(spec: ImagePromptSpec): string {
    const jsonStr = JSON.stringify(this.buildCleanJsonObject(spec), null, 2);
    return (
      `Generate an image strictly following every visual, camera, lighting, and composition parameter specified in this structured JSON production brief:\n\n` +
      '```json\n' +
      jsonStr +
      '\n```'
    );
  }

  /**
   * Compiles Positive + Negative prompt tags for Stable Diffusion XL (SDXL).
   */
  compileForSdxl(spec: ImagePromptSpec): { positive: string; negative: string } {
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
      } catch (err) {
        console.warn('LLM API call failed, falling back to built-in heuristic expander:', err);
      }
    }

    return this.heuristicExpand(cleanIdea, currentSpec);
  }

  private heuristicExpand(idea: string, base: ImagePromptSpec): ImagePromptSpec {
    const next = structuredClone(base);
    const lower = idea.toLowerCase();

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
    const systemPrompt = `You are an expert AI Image Director. Convert the user's short idea into a rich, structured JSON object matching the exact keys of this template: ${JSON.stringify(
      base
    )}. Return ONLY valid JSON without markdown fences.`;

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
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser idea: ${idea}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
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
      const data = await res.json();
      rawJson = data?.response || '';
    }

    const parsed = JSON.parse(rawJson.replace(/^```json\s*|\s*```$/g, ''));
    return { ...structuredClone(base), ...parsed };
  }

  private loadAiConfig(): AiAssistantConfig {
    try {
      const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      provider: 'gemini',
      apiKey: '',
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
    };
    try {
      const raw = localStorage.getItem(CUSTOM_OPTIONS_STORAGE_KEY);
      if (raw) {
        return { ...empty, ...JSON.parse(raw) };
      }
    } catch {}
    return empty;
  }

  private loadUserPresets(): PromptTemplate[] {
    try {
      const raw = localStorage.getItem(USER_PRESETS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }
}
