export interface SubjectBlock {
  primary_entity: string;
  description: string;
  pose_or_action: string;
  expression_or_mood: string;
  clothing_or_materials: string;
  placement: string;
}

export interface SecondarySubject {
  id: string;
  entity: string;
  details: string;
  placement: string;
}

export interface SceneBlock {
  environment: string;
  background_details: string;
  time_of_day: string;
  atmosphere_weather: string;
}

export interface CameraBlock {
  shot_type: string;
  angle: string;
  lens_focal_length: string;
  aperture_depth_of_field: string;
  camera_body_or_film: string;
}

export interface LightingBlock {
  key_light: string;
  fill_or_ambient: string;
  color_temperature: string;
  shadow_quality: string;
  color_palette: string[];
}

export interface CompositionBlock {
  framing_rule: string;
  focal_point: string;
  foreground_elements: string;
  perspective: string;
}

export interface StyleBlock {
  medium: string;
  aesthetic: string;
  color_grading: string;
  quality_tags: string[];
}

export interface TypographyBlock {
  enabled: boolean;
  exact_text: string;
  font_style: string;
  placement_and_material: string;
}

export type CharacterLayoutMode =
  | 'turnaround_4_views'
  | 'turnaround_3_views'
  | 'expressions_grid'
  | 'full_body_and_portraits'
  | 'outfit_study';

export const LAYOUT_MODE_VIEWS: Record<
  CharacterLayoutMode,
  { label: string; defaultViews: string[]; availableViews: string[] }
> = {
  turnaround_4_views: {
    label: 'Turnaround 4 Viste',
    defaultViews: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view'],
    availableViews: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view', 'Close-up face'],
  },
  turnaround_3_views: {
    label: 'Turnaround 3 Viste',
    defaultViews: ['Front view', 'Side profile view', 'Back view'],
    availableViews: ['Front view', '3/4 Profile view', 'Side profile view', 'Back view', 'Close-up face'],
  },
  expressions_grid: {
    label: 'Griglia Espressioni (6 Emozioni)',
    defaultViews: [
      'Neutral expression',
      'Spontaneous warm smile',
      'Serious intense gaze',
      'Surprised look',
      'Quiet contemplation',
      'Genuine laugh',
    ],
    availableViews: [
      'Neutral expression',
      'Spontaneous warm smile',
      'Serious intense gaze',
      'Surprised look',
      'Quiet contemplation',
      'Genuine laugh',
      'Subtle confident smirk',
      'Determined fierce look',
    ],
  },
  full_body_and_portraits: {
    label: 'Figura Intera + Ritratti',
    defaultViews: ['Full body front standing', 'Waist-up portrait', 'Close-up face profile', 'Tight macro expression'],
    availableViews: [
      'Full body front standing',
      'Full body 3/4 walking',
      'Waist-up portrait',
      'Close-up face profile',
      'Tight macro expression',
    ],
  },
  outfit_study: {
    label: 'Studio Outfit & Costumi',
    defaultViews: ['Signature iconic outfit', 'Casual everyday wear', 'Formal evening attire', 'Action / outerwear jacket'],
    availableViews: [
      'Signature iconic outfit',
      'Casual everyday wear',
      'Formal evening attire',
      'Action / outerwear jacket',
      'Minimalist studio basics',
    ],
  },
};

export type CharacterWorkflowMode = 'sheet_generation' | 'scene_with_character';
export type CharacterConsistencyMethod = 'multimodal_attached_sheet' | 'text_biometrics_only';

export interface CharacterSheetBlock {
  enabled: boolean;
  mode: CharacterWorkflowMode;
  consistency_method?: CharacterConsistencyMethod;
  character_name: string;
  gender_and_age: string;
  ethnicity_and_skin: string;
  eye_details: string;
  hair_details: string;
  distinctive_marks: string;
  body_build: string;
  signature_outfit: string;
  signature_props: string;
  layout_mode: CharacterLayoutMode;
  views: string[];
  background_style: string;
  cref_url?: string;
  cref_weight?: number;
  image_data_url?: string;
}

export interface SavedCharacter {
  id: string;
  name: string;
  summary: string;
  sheet: CharacterSheetBlock;
  imageDataUrl?: string;
  createdAt: number;
}

export interface CharacterPhotoItem {
  id: string;
  dataUrl: string;
  name: string;
  size: string;
  width: number;
  height: number;
}

export interface TechnicalParametersBlock {
  aspect_ratio: string;
  negative_prompt: string;
  seed: number | null;
  stylize: number;
  chaos: number;
  raw_mode: boolean;
}

export interface CustomProperty {
  id: string;
  section: 'root' | 'subject' | 'scene' | 'camera' | 'lighting' | 'composition' | 'style';
  key: string;
  value: string;
}

export interface ImagePromptSpec {
  meta: {
    version: string;
    title: string;
    target_engine: 'universal' | 'flux' | 'midjourney' | 'gpt4o_gemini' | 'sdxl';
  };
  subject: SubjectBlock;
  additional_subjects: SecondarySubject[];
  scene: SceneBlock;
  camera: CameraBlock;
  lighting: LightingBlock;
  composition: CompositionBlock;
  style_and_rendering: StyleBlock;
  typography: TypographyBlock;
  character_sheet: CharacterSheetBlock;
  technical_parameters: TechnicalParametersBlock;
  custom_properties: CustomProperty[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  badgeColor: string;
  description: string;
  isUserPreset?: boolean;
  spec: ImagePromptSpec;
}

export type PresetCategoryKey =
  | 'primary_entity'
  | 'subject_description'
  | 'pose_or_action'
  | 'expression_or_mood'
  | 'clothing_or_materials'
  | 'placement'
  | 'environment'
  | 'background_details'
  | 'time_of_day'
  | 'atmosphere_weather'
  | 'shot_type'
  | 'camera_angle'
  | 'lens_focal_length'
  | 'aperture_depth_of_field'
  | 'camera_body_or_film'
  | 'key_light'
  | 'fill_or_ambient'
  | 'color_temperature'
  | 'shadow_quality'
  | 'framing_rule'
  | 'focal_point'
  | 'foreground_elements'
  | 'perspective'
  | 'medium'
  | 'aesthetic'
  | 'color_grading'
  | 'quality_tags'
  | 'font_style'
  | 'typography_placement'
  | 'aspect_ratio'
  | 'negative_prompt'
  | 'character_gender_age'
  | 'character_eyes'
  | 'character_hair'
  | 'character_marks'
  | 'character_build'
  | 'character_outfit'
  | 'character_background';

export type CustomOptionsMap = Record<PresetCategoryKey, string[]>;

export interface AiAssistantConfig {
  provider: 'gemini' | 'openai' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  ollamaUrl: string;
}

export type OutputTab = 'gpt' | 'json' | 'flux' | 'midjourney' | 'sdxl';
export type CompiledOutputs = Record<OutputTab, string>;

export type ImageGenProvider = 'fal_ai' | 'gemini_imagen' | 'openai_dalle' | 'comfyui' | 'custom';

export interface ImageGenProfile {
  id: string;
  name: string;
  provider: ImageGenProvider;
  model: string;
  apiKey?: string;
  endpointUrl?: string;
  loraUrl?: string;
  loraScale?: number;
  badge?: string;
  description?: string;
  isBuiltIn?: boolean;
}

export interface ProviderApiKeys {
  fal_ai?: string;
  gemini_imagen?: string;
  openai_dalle?: string;
  custom?: string;
}

export interface ImageGenConfig {
  provider: ImageGenProvider;
  model: string;
  apiKey: string;
  endpointUrl: string;
  activeProfileId?: string;
  profiles?: ImageGenProfile[];
  providerApiKeys?: ProviderApiKeys;
  loraUrl?: string;
  loraScale?: number;
}

export const DEFAULT_IMAGE_GEN_PROFILES: ImageGenProfile[] = [
  {
    id: 'fal-flux-realism',
    name: 'fal.ai: FLUX Realism (AI Influencer)',
    provider: 'fal_ai',
    model: 'fal-ai/flux-realism',
    badge: '🌟 Top Influencer',
    description: 'FLUX.1 [dev] con LoRA Realism: texture pelle autentica, pori e illuminazione naturale smartphone.',
    isBuiltIn: true,
  },
  {
    id: 'fal-flux-dev',
    name: 'fal.ai: FLUX.1 [dev]',
    provider: 'fal_ai',
    model: 'fal-ai/flux/dev',
    badge: '🎨 Pro 12B',
    description: 'Modello 12B di Black Forest Labs ad altissima fedeltà e composizione artistica.',
    isBuiltIn: true,
  },
  {
    id: 'fal-flux-schnell',
    name: 'fal.ai: FLUX Schnell (Ultra-Fast)',
    provider: 'fal_ai',
    model: 'fal-ai/flux/schnell',
    badge: '⚡ Fast 0.8s',
    description: 'Rendering ultra-rapido in 4 passi (~0.8s), perfetto per test e bozze immediate.',
    isBuiltIn: true,
  },
  {
    id: 'fal-flux-pro',
    name: 'fal.ai: FLUX 1.1 Pro',
    provider: 'fal_ai',
    model: 'fal-ai/flux-pro/v1.1',
    badge: '👑 Pro 1.1',
    description: 'Massima aderenza a prompt narrativi complessi e risoluzione ultra-nitida.',
    isBuiltIn: true,
  },
  {
    id: 'gemini-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'gemini_imagen',
    model: 'gemini-2.5-flash-image',
    badge: '✨ Multimodale',
    description: 'Google Gemini con grounding visivo nativo della scheda personaggio allegata.',
    isBuiltIn: true,
  },
  {
    id: 'gemini-pro-image',
    name: 'Gemini 3 Pro Image',
    provider: 'gemini_imagen',
    model: 'gemini-3-pro-image',
    badge: '💎 Pro',
    description: 'Modello Google ad alta risoluzione per composizioni complesse.',
    isBuiltIn: true,
  },
  {
    id: 'openai-dalle-3',
    name: 'OpenAI DALL-E 3',
    provider: 'openai_dalle',
    model: 'dall-e-3',
    badge: '🤖 OpenAI',
    description: 'Motore semantico OpenAI per illustrazioni e stili narrativi.',
    isBuiltIn: true,
  },
  {
    id: 'comfyui-local',
    name: 'ComfyUI / SD WebUI Locale',
    provider: 'comfyui',
    model: 'local-sd',
    endpointUrl: 'http://127.0.0.1:7860/sdapi/v1/txt2img',
    badge: '🖥️ Locale',
    description: 'Esecuzione locale su GPU tramite WebUI o ComfyUI (default porta 7860).',
    isBuiltIn: true,
  },
];

export interface GeneratedImageResult {
  dataUrl: string;
  mimeType: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  timeMs: number;
  timestamp: number;
}

export interface SavedGenerationItem {
  id: string;
  timestamp: number;
  subjectName: string;
  characterId?: string;
  mode: 'sheet_generation' | 'scene_with_character' | 'standard_scene';
  model: string;
  prompt: string;
  dataUrl: string;
  mimeType: string;
  aspectRatio: string;
  timeMs: number;
  specSnapshot: ImagePromptSpec;
  favorite?: boolean;
}
