import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CustomProperty, ImagePromptSpec, SecondarySubject, CharacterLayoutMode, CharacterWorkflowMode, LAYOUT_MODE_VIEWS } from '../models/prompt.model';
import { PromptService } from './prompt.service';

const DRAFT_STORAGE_KEY = 'prompt_json_studio_draft_v1';

/** Blocks of the spec that are plain objects and can be patched field-by-field. */
export type SpecBlockKey =
  | 'meta'
  | 'subject'
  | 'scene'
  | 'camera'
  | 'lighting'
  | 'composition'
  | 'style_and_rendering'
  | 'typography'
  | 'character_sheet'
  | 'technical_parameters';

/**
 * Single source of truth for the prompt being edited.
 * All mutations are immutable `signal.update()` calls, outputs are `computed()`,
 * and the draft is auto-persisted via `effect()`.
 */
@Injectable({ providedIn: 'root' })
export class PromptStore {
  private readonly svc = inject(PromptService);

  readonly spec = signal<ImagePromptSpec>(this.loadDraft());

  readonly cleanJson = computed(() => JSON.stringify(this.svc.buildCleanJsonObject(this.spec()), null, 2));
  readonly fluxPrompt = computed(() => this.svc.compileForFlux(this.spec()));
  readonly midjourneyPrompt = computed(() => this.svc.compileForMidjourney(this.spec()));
  readonly gptPrompt = computed(() => this.svc.compileForGpt4oAndGemini(this.spec()));
  readonly sdxlPrompt = computed(() => {
    const sd = this.svc.compileForSdxl(this.spec());
    return `POSITIVE PROMPT:\n${sd.positive}\n\nNEGATIVE PROMPT:\n${sd.negative}`;
  });

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(this.spec()));
      } catch {}
    });
  }

  // ---------- Generic field patching ----------

  set<K extends SpecBlockKey, F extends keyof ImagePromptSpec[K]>(block: K, field: F, value: ImagePromptSpec[K][F]): void {
    this.spec.update((s) => ({ ...s, [block]: { ...s[block], [field]: value } }));
  }

  replace(spec: ImagePromptSpec): void {
    this.spec.set(this.normalize(spec));
  }

  // ---------- Secondary subjects ----------

  addSecondarySubject(): void {
    const sub: SecondarySubject = { id: 'sub-' + Date.now(), entity: '', details: '', placement: '' };
    this.spec.update((s) => ({ ...s, additional_subjects: [...s.additional_subjects, sub] }));
  }

  updateSecondarySubject(id: string, field: keyof Omit<SecondarySubject, 'id'>, value: string): void {
    this.spec.update((s) => ({
      ...s,
      additional_subjects: s.additional_subjects.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }));
  }

  removeSecondarySubject(id: string): void {
    this.spec.update((s) => ({ ...s, additional_subjects: s.additional_subjects.filter((x) => x.id !== id) }));
  }

  // ---------- Palette ----------

  setPalette(colors: string[]): void {
    this.set('lighting', 'color_palette', [...colors]);
  }

  setColor(index: number, value: string): void {
    this.setPalette(this.spec().lighting.color_palette.map((c, i) => (i === index ? value : c)));
  }

  addColor(): void {
    this.setPalette([...this.spec().lighting.color_palette, '#bd93f9']);
  }

  removeColor(index: number): void {
    this.setPalette(this.spec().lighting.color_palette.filter((_, i) => i !== index));
  }

  // ---------- Quality tags ----------

  toggleTag(tag: string): void {
    const tags = this.spec().style_and_rendering.quality_tags;
    this.set('style_and_rendering', 'quality_tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  addTag(tag: string): void {
    const tags = this.spec().style_and_rendering.quality_tags;
    if (!tags.includes(tag)) this.set('style_and_rendering', 'quality_tags', [...tags, tag]);
  }

  // ---------- Custom properties ----------

  addCustomProperty(): void {
    const cp: CustomProperty = { id: 'cp-' + Date.now(), section: 'root', key: '', value: '' };
    this.spec.update((s) => ({ ...s, custom_properties: [...s.custom_properties, cp] }));
  }

  updateCustomProperty<F extends keyof Omit<CustomProperty, 'id'>>(id: string, field: F, value: CustomProperty[F]): void {
    this.spec.update((s) => ({
      ...s,
      custom_properties: s.custom_properties.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }));
  }

  removeCustomProperty(id: string): void {
    this.spec.update((s) => ({ ...s, custom_properties: s.custom_properties.filter((x) => x.id !== id) }));
  }

  // ---------- Character Sheet ----------

  /**
   * High-level prompt kind used by the UI:
   * - 'free'  → classic prompt, no character module
   * - 'sheet' → character model sheet / turnaround generation
   * - 'scene' → narrative scene with a bound (locked) character
   */
  readonly promptKind = computed<'free' | 'sheet' | 'scene'>(() => {
    const cs = this.spec().character_sheet;
    if (!cs.enabled) return 'free';
    return cs.mode === 'scene_with_character' ? 'scene' : 'sheet';
  });

  setPromptKind(kind: 'free' | 'sheet' | 'scene'): void {
    if (kind === 'free') {
      this.updateCharacterSheet({ enabled: false });
    } else if (kind === 'sheet') {
      this.updateCharacterSheet({ enabled: true });
      this.setWorkflowMode('sheet_generation');
      // Re-sync subject/camera with the sheet layout
      this.setLayoutMode(this.spec().character_sheet.layout_mode);
    } else {
      this.setWorkflowMode('scene_with_character');
    }
  }

  setWorkflowMode(mode: CharacterWorkflowMode): void {
    this.spec.update((s) => {
      const cs = s.character_sheet;
      const charName = cs.character_name.trim() || 'Elena Vance';

      if (mode === 'scene_with_character') {
        // Values produced by the sheet layouts make no sense in a narrative scene:
        // replace them with neutral, editable scene defaults.
        const SHEET_RE = /turnaround|model sheet|reference sheet|expression sheet|2x3|grid layout|lineup|simultaneous angles|all views|emotional expressions|wardrobe variations|cyclorama|studio void|seamless|across all|multi-angle|inset portrait/i;
        const fix = (v: string, fallback: string) => (!v.trim() || SHEET_RE.test(v) ? fallback : v);
        const details = [
          cs.ethnicity_and_skin,
          cs.eye_details ? `eyes: ${cs.eye_details}` : '',
          cs.hair_details ? `hair: ${cs.hair_details}` : '',
          cs.distinctive_marks,
          cs.body_build,
        ].filter(Boolean).join(', ');

        return {
          ...s,
          meta: {
            ...s.meta,
            title: s.meta.title.includes('Turnaround') || s.meta.title.includes('Expression')
              ? `Scene with ${charName}`
              : s.meta.title,
          },
          character_sheet: {
            ...cs,
            enabled: true,
            mode: 'scene_with_character',
          },
          subject: {
            ...s.subject,
            primary_entity: `${charName}, ${cs.gender_and_age}`,
            description: details,
            pose_or_action: fix(s.subject.pose_or_action, 'Natural candid pose with relaxed body language'),
            expression_or_mood: fix(s.subject.expression_or_mood, 'Calm, natural, authentic'),
            placement: fix(s.subject.placement, 'Foreground-left (Rule of thirds)'),
            clothing_or_materials: s.subject.clothing_or_materials || cs.signature_outfit,
          },
          scene: {
            ...s.scene,
            environment: fix(s.scene.environment, 'Sunlit cobblestone street in a historic European old town'),
            background_details: fix(s.scene.background_details, 'Softly blurred storefronts, potted plants and warm bokeh'),
          },
          camera: {
            ...s.camera,
            shot_type: fix(s.camera.shot_type, 'Medium shot (Waist up)'),
          },
          composition: {
            ...s.composition,
            focal_point: fix(s.composition.focal_point, "The character's eyes and facial expression"),
          },
          style_and_rendering: {
            ...s.style_and_rendering,
            quality_tags: s.style_and_rendering.quality_tags.filter((t) => !SHEET_RE.test(t)),
          },
        };
      } else {
        return {
          ...s,
          character_sheet: {
            ...cs,
            enabled: true,
            mode: 'sheet_generation',
            background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
          },
        };
      }
    });
    if (mode === 'sheet_generation') {
      this.setLayoutMode(this.spec().character_sheet.layout_mode);
    }
  }

  setLayoutMode(mode: CharacterLayoutMode): void {
    const layout = LAYOUT_MODE_VIEWS[mode];
    const defaultViews = layout ? [...layout.defaultViews] : [];

    this.spec.update((s) => {
      const charName = s.character_sheet.character_name.trim() || 'Character';
      let subjectDesc = s.subject.description;
      let subjectPose = s.subject.pose_or_action;
      let subjectMood = s.subject.expression_or_mood;
      let subjectPlacement = s.subject.placement;
      let cameraShot = s.camera.shot_type;
      let title = s.meta.title;

      if (mode === 'expressions_grid') {
        subjectDesc = `Facial expression sheet showing a 2x3 grid of headshots of the exact same character with distinct emotions: ${defaultViews.join(', ')}`;
        subjectPose = `Head-and-shoulders portraits arranged in a clean 2x3 grid layout`;
        subjectMood = `Six distinct emotional expressions (${defaultViews.join(', ')}) with 100% consistent facial features, eye shape, and hair styling`;
        subjectPlacement = `Center frame, 2x3 grid layout`;
        cameraShot = `Medium close-up portrait (MCU)`;
        title = `Expression Sheet: ${charName} (6 Espressioni)`;
      } else if (mode === 'turnaround_4_views') {
        subjectDesc = `Turnaround character model sheet showing the same character from four simultaneous angles in a single frame: front view, three-quarter view, side profile view, and back view`;
        subjectPose = `Standing in relaxed model sheet poses: front view, three-quarter view, side profile view, and back view`;
        subjectMood = `Calm, neutral, consistent facial expression across all views`;
        subjectPlacement = `Center frame, horizontal lineup`;
        cameraShot = `Full-body shot (Head to toe)`;
        title = `Character Turnaround: ${charName} (4 Viste)`;
      } else if (mode === 'turnaround_3_views') {
        subjectDesc = `Turnaround character model sheet showing the same character from three simultaneous angles in a single frame: front view, side profile view, and back view`;
        subjectPose = `Standing in relaxed model sheet poses: front view, side profile view, and back view`;
        subjectMood = `Calm, neutral, consistent facial expression across all views`;
        subjectPlacement = `Center frame, horizontal lineup`;
        cameraShot = `Full-body shot (Head to toe)`;
        title = `Character Turnaround: ${charName} (3 Viste)`;
      } else if (mode === 'full_body_and_portraits') {
        subjectDesc = `Character model reference sheet combining full-body lineup alongside close-up facial portrait studies: ${defaultViews.join(', ')}`;
        subjectPose = `Full-body standing pose on the left alongside detailed head-and-shoulders portrait studies on the right`;
        subjectMood = `Consistent character identity across both full-body and close-up views`;
        subjectPlacement = `Full body on left, multi-angle portraits on right`;
        cameraShot = `Wide establishing shot with inset portrait close-ups`;
        title = `Character Reference Sheet: ${charName} (Full Body + Portraits)`;
      } else if (mode === 'outfit_study') {
        subjectDesc = `Character costume and wardrobe study sheet showing the same character in multiple outfits in a single frame: ${defaultViews.join(', ')}`;
        subjectPose = `Multiple full-body poses wearing distinct outfits and attire variations`;
        subjectMood = `Consistent character identity across all wardrobe variations`;
        subjectPlacement = `Center frame, horizontal lineup`;
        cameraShot = `Full-body shot (Head to toe)`;
        title = `Outfit Study: ${charName} (Wardrobe Variations)`;
      }

      return {
        ...s,
        meta: {
          ...s.meta,
          title,
        },
        character_sheet: {
          ...s.character_sheet,
          layout_mode: mode,
          views: defaultViews.length > 0 ? defaultViews : s.character_sheet.views,
          background_style: 'Solid clean white seamless photo studio cyclorama backdrop, soft diffuse floor shadow, high-key even lighting',
        },
        subject: {
          ...s.subject,
          description: subjectDesc,
          pose_or_action: subjectPose,
          expression_or_mood: subjectMood,
          placement: subjectPlacement,
        },
        camera: {
          ...s.camera,
          shot_type: cameraShot,
        },
      };
    });
  }

  updateCharacterSheet(partial: Partial<import('../models/prompt.model').CharacterSheetBlock>): void {
    this.spec.update((s) => ({
      ...s,
      character_sheet: { ...s.character_sheet, ...partial },
    }));
  }

  toggleCharacterView(view: string): void {
    const current = this.spec().character_sheet.views || [];
    const next = current.includes(view) ? current.filter((v) => v !== view) : [...current, view];
    this.spec.update((s) => {
      let subjectDesc = s.subject.description;
      if (s.character_sheet.layout_mode === 'expressions_grid') {
        subjectDesc = `Facial expression sheet showing a grid of headshots of the exact same character with distinct emotions: ${next.join(', ')}`;
      } else if (s.character_sheet.layout_mode.startsWith('turnaround')) {
        subjectDesc = `Turnaround character model sheet showing the same character from simultaneous angles in a single frame: ${next.join(', ')}`;
      } else if (s.character_sheet.layout_mode === 'outfit_study') {
        subjectDesc = `Character costume and wardrobe study sheet showing the same character in multiple outfits in a single frame: ${next.join(', ')}`;
      } else if (s.character_sheet.layout_mode === 'full_body_and_portraits') {
        subjectDesc = `Character model reference sheet combining full-body lineup alongside close-up facial portrait studies: ${next.join(', ')}`;
      }
      return {
        ...s,
        character_sheet: {
          ...s.character_sheet,
          views: next,
        },
        subject: {
          ...s.subject,
          description: subjectDesc,
        },
      };
    });
  }

  applyCharacterToSubject(): void {
    const cs = this.spec().character_sheet;
    if (!cs.character_name.trim()) return;
    this.set('subject', 'primary_entity', `${cs.character_name}, ${cs.gender_and_age}`);
    const details = [
      cs.ethnicity_and_skin,
      cs.eye_details ? `eyes: ${cs.eye_details}` : '',
      cs.hair_details ? `hair: ${cs.hair_details}` : '',
      cs.distinctive_marks,
      cs.body_build,
    ].filter(Boolean).join(', ');
    this.set('subject', 'description', details);
    if (cs.signature_outfit) {
      this.set('subject', 'clothing_or_materials', cs.signature_outfit + (cs.signature_props ? `, with ${cs.signature_props}` : ''));
    }
  }

  // ---------- Reset ----------

  reset(): void {
    const blank = this.svc.createEmptySpec();
    const clear = <T extends object>(o: T): T =>
      Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? '' : v])) as T;
    this.spec.set({
      ...blank,
      meta: { ...blank.meta, title: 'Nuovo Prompt' },
      subject: clear(blank.subject),
      scene: clear(blank.scene),
      composition: clear(blank.composition),
      additional_subjects: [],
      custom_properties: [],
      typography: { enabled: false, exact_text: '', font_style: '', placement_and_material: '' },
      technical_parameters: { ...blank.technical_parameters, negative_prompt: '', seed: null },
    });
  }

  // ---------- Import / normalization ----------

  /**
   * Accepts either a full studio spec or any "clean" structured JSON prompt (even from other tools),
   * merging known blocks and converting unknown keys into custom properties.
   */
  normalize(raw: unknown): ImagePromptSpec {
    const out = this.svc.createEmptySpec();
    out.custom_properties = [];
    out.additional_subjects = [];
    if (!raw || typeof raw !== 'object') return out;
    const obj = raw as Record<string, any>;
    const rid = () => 'cp-' + Math.random().toString(36).slice(2);

    const mergeBlock = <T extends object>(target: T, src: unknown, section: CustomProperty['section'] | null) => {
      if (!src || typeof src !== 'object') return;
      for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
        if (k in target) {
          (target as Record<string, unknown>)[k] = v;
        } else if (section) {
          out.custom_properties.push({ id: rid(), section, key: k, value: typeof v === 'string' ? v : JSON.stringify(v) });
        }
      }
    };

    mergeBlock(out.meta, obj['meta'], null);
    mergeBlock(out.subject, obj['subject'], 'subject');
    mergeBlock(out.scene, obj['scene'], 'scene');
    mergeBlock(out.camera, obj['camera'], 'camera');
    mergeBlock(out.lighting, obj['lighting'], 'lighting');
    mergeBlock(out.composition, obj['composition'], 'composition');
    mergeBlock(out.style_and_rendering, obj['style_and_rendering'] ?? obj['style'], 'style');

    if (obj['typography']) {
      mergeBlock(out.typography, obj['typography'], null);
      if (obj['typography'].enabled === undefined) out.typography.enabled = !!obj['typography'].exact_text;
    }

    if (obj['character_sheet']) {
      mergeBlock(out.character_sheet, obj['character_sheet'], null);
      if (Array.isArray(obj['character_sheet'].views)) {
        out.character_sheet.views = [...obj['character_sheet'].views];
      }
      if (!out.character_sheet.mode) {
        out.character_sheet.mode = 'sheet_generation';
      }
      if (out.character_sheet.cref_weight === undefined) {
        out.character_sheet.cref_weight = 100;
      }
    }

    const tech = obj['technical_parameters'];
    if (tech && typeof tech === 'object') {
      mergeBlock(out.technical_parameters, tech, null);
      const hints = tech['model_hints'];
      if (hints && typeof hints === 'object') {
        if (typeof hints.stylize === 'number') out.technical_parameters.stylize = hints.stylize;
        if (typeof hints.chaos === 'number') out.technical_parameters.chaos = hints.chaos;
        if (typeof hints.raw_mode === 'boolean') out.technical_parameters.raw_mode = hints.raw_mode;
      }
    }
    if (obj['meta']?.aspect_ratio) out.technical_parameters.aspect_ratio = obj['meta'].aspect_ratio;

    if (Array.isArray(obj['additional_subjects'])) {
      out.additional_subjects = obj['additional_subjects'].map((s: any, i: number) => ({
        id: s.id ?? 'sub-' + i,
        entity: s.entity ?? '',
        details: s.details ?? '',
        placement: s.placement ?? '',
      }));
    }
    if (Array.isArray(obj['custom_properties'])) out.custom_properties.push(...obj['custom_properties']);

    const known = new Set([
      'meta', 'subject', 'additional_subjects', 'scene', 'camera', 'lighting', 'composition',
      'style_and_rendering', 'style', 'typography', 'technical_parameters', 'custom_properties', '$schema',
    ]);
    for (const [k, v] of Object.entries(obj)) {
      if (!known.has(k)) {
        out.custom_properties.push({ id: rid(), section: 'root', key: k, value: typeof v === 'string' ? v : JSON.stringify(v) });
      }
    }

    if (!Array.isArray(out.lighting.color_palette)) out.lighting.color_palette = [];
    if (!Array.isArray(out.style_and_rendering.quality_tags)) {
      const qt = out.style_and_rendering.quality_tags as unknown;
      out.style_and_rendering.quality_tags =
        typeof qt === 'string' ? qt.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
    return out;
  }

  private loadDraft(): ImagePromptSpec {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) return this.normalize(JSON.parse(raw));
    } catch {}
    return this.svc.createEmptySpec();
  }
}
