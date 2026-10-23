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
}

export interface SavedCharacter {
  id: string;
  name: string;
  summary: string;
  sheet: CharacterSheetBlock;
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
  | 'character_background';

export type CustomOptionsMap = Record<PresetCategoryKey, string[]>;

export interface AiAssistantConfig {
  provider: 'gemini' | 'openai' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  ollamaUrl: string;
}
