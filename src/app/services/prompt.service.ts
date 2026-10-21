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
    placement: [
      'Center frame',
      'Foreground-left (Rule of thirds)',
      'Foreground-right (Rule of thirds)',
      'Midground center',
      'Dynamic diagonal placement',
      'Full-frame close subject',
    ],
    time_of_day: [
      'Golden hour sunset',
      'Blue hour twilight',
      'Midnight / Deep night',
      'High noon harsh sun',
      'Overcast morning',
      'Dawn / Sunrise mist',
    ],
    atmosphere_weather: [
      'Clear crisp air',
      'Light rain with wet reflections',
      'Dense volumetric fog & mist',
      'Floating dust motes in sunbeams',
      'Snowfall & frost',
      'Smoky atmospheric haze',
    ],
    shot_type: [
      'Extreme close-up (ECU)',
      'Medium close-up portrait (MCU)',
      'Medium shot (Waist up)',
      'Full body shot',
      'Wide environmental shot',
      'Extreme wide establishing shot',
      'Macro detail shot',
      'Isometric orthographic view',
    ],
    camera_angle: [
      'Eye-level angle',
      'Low-angle heroic shot',
      'High-angle looking down',
      'Bird’s-eye overhead view (Top-down)',
      'Worm’s-eye view',
      'Slight Dutch tilt (Dynamic)',
      'Over-the-shoulder shot',
    ],
    lens_focal_length: [
      '85mm f/1.4 Prime Portrait Lens',
      '35mm Street & Documentary Lens',
      '50mm Standard Prime Lens',
      '24mm Wide-Angle Lens',
      '14mm Ultra-Wide Lens',
      '100mm Macro 1:1 Lens',
      '200mm Telephoto Compression',
      'Anamorphic Cinema Lens (2.39:1)',
    ],
    aperture_depth_of_field: [
      'f/1.4 ultra-shallow DoF, creamy bokeh',
      'f/2.8 soft background separation',
      'f/5.6 balanced subject & context',
      'f/11 deep focus, sharp front-to-back',
      'Tilt-shift miniature selective focus',
    ],
    camera_body_or_film: [
      'ARRI Alexa 65 Digital Cinema',
      'Hasselblad H6D-100c Medium Format',
      'Leica M11 Rangefinder',
      'Kodak Portra 400 35mm Film',
      'CineStill 800T Tungsten Film',
      'Fujifilm Velvia 50 Slide Film',
      'IMAX 70mm Film Stock',
    ],
    key_light: [
      'Soft directional window light',
      'Cyan and magenta neon signage glow',
      'Warm golden hour sunlight',
      'Dramatic Rembrandt studio softbox',
      'Harsh overhead spotlight',
      'Bioluminescent natural glow',
      'Cinematic rim / edge backlighting',
    ],
    color_temperature: [
      'Warm golden (3200K)',
      'Neutral daylight (5600K)',
      'Cool moonlight blue (7500K)',
      'Dual-tone warm/cool contrast',
      'High-contrast cybernetic neon',
    ],
    shadow_quality: [
      'Deep chiaroscuro high-contrast shadows',
      'Soft diffused wrap-around shadows',
      'Harsh geometric cast shadows',
      'Subtle ambient occlusion',
      'Volumetric god-rays cutting through shadow',
    ],
    framing_rule: [
      'Rule of thirds',
      'Centered symmetrical composition',
      'Golden ratio spiral (Fibonacci)',
      'Diagonal leading lines',
      'Frame within a frame',
      'Negative space minimalist framing',
    ],
    perspective: [
      'Natural 1-point linear perspective',
      'Dramatic 2-point architectural perspective',
      '3-point towering perspective',
      'Isometric 30° projection',
      'Flat-lay 90° overhead',
    ],
    medium: [
      'Photorealistic photography',
      'Cinematic film still',
      '3D Octane / Unreal Engine 5 Render',
      'Digital concept art illustration',
      'Oil painting with impasto brushstrokes',
      'Anime cel-shaded key visual',
      'Minimalist flat vector illustration',
      'Watercolor & ink botanical sketch',
    ],
    aesthetic: [
      'Gritty Cyberpunk Noir',
      'Clean Apple-style Commercial Studio',
      'Dark Fantasy Souls-like',
      'Retro 1980s Synthwave / Sci-Fi',
      'Editorial High-Fashion Magazine',
      'Cozy Studio Ghibli / Solarpunk',
      'Brutalist Architectural Digest',
    ],
    color_grading: [
      'Cinematic Teal and Orange',
      'Rich blacks with vibrant neon accents',
      'Muted desaturated bleach bypass',
      'Warm nostalgic Kodak film grade',
      'High-key bright pastel airy grade',
      'Monochrome high-contrast black & white',
    ],
    quality_tags: [
      '8k resolution',
      'hyper-detailed textures',
      'natural skin pores & micro-details',
      'subsurface scattering (SSS)',
      'physically based rendering (PBR)',
      'anamorphic lens flare',
      'fine 35mm film grain',
      'ray-traced reflections',
    ],
    font_style: [
      'Bold geometric sans-serif (Futura/Helvetica)',
      'Glowing neon tube cursive signage',
      'Luxury high-contrast serif (Didot/Bodoni)',
      'Hand-brushed calligraphy',
      'Cyberpunk stenciled holographic HUD',
      'Vintage distressed letterpress',
    ],
    aspect_ratio: ['16:9', '9:16', '1:1', '4:5', '3:2', '2:3', '21:9'],
  };

  readonly builtInTemplates: PromptTemplate[] = [
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
      const model = config.model || 'gemini-2.5-flash';
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
      model: 'gemini-2.5-flash',
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
      placement: [],
      time_of_day: [],
      atmosphere_weather: [],
      shot_type: [],
      camera_angle: [],
      lens_focal_length: [],
      aperture_depth_of_field: [],
      camera_body_or_film: [],
      key_light: [],
      color_temperature: [],
      shadow_quality: [],
      framing_rule: [],
      perspective: [],
      medium: [],
      aesthetic: [],
      color_grading: [],
      quality_tags: [],
      font_style: [],
      aspect_ratio: [],
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
