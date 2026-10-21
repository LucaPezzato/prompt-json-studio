import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CustomProperty, ImagePromptSpec, SecondarySubject } from '../models/prompt.model';
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
