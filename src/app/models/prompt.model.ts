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
  | 'placement'
  | 'time_of_day'
  | 'atmosphere_weather'
  | 'shot_type'
  | 'camera_angle'
  | 'lens_focal_length'
  | 'aperture_depth_of_field'
  | 'camera_body_or_film'
  | 'key_light'
  | 'color_temperature'
  | 'shadow_quality'
  | 'framing_rule'
  | 'perspective'
  | 'medium'
  | 'aesthetic'
  | 'color_grading'
  | 'quality_tags'
  | 'font_style'
  | 'aspect_ratio';

export type CustomOptionsMap = Record<PresetCategoryKey, string[]>;

export interface AiAssistantConfig {
  provider: 'gemini' | 'openai' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  ollamaUrl: string;
}
