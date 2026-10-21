import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SmartField } from './components/smart-field/smart-field';
import { SectionBlock } from './components/section-block/section-block';
import { Modal } from './components/modal/modal';
import { TemplateSidebar } from './components/template-sidebar/template-sidebar';
import { OutputPanel, OutputTab, CompiledOutputs } from './components/output-panel/output-panel';
import { PromptStore } from './services/prompt.store';
import { PromptService } from './services/prompt.service';
import { CustomProperty, PromptTemplate } from './models/prompt.model';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SmartField,
    SectionBlock,
    Modal,
    TemplateSidebar,
    OutputPanel,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:keydown)': 'onKeydown($event)',
  },
})
export class App {
  readonly store = inject(PromptStore);
  readonly svc = inject(PromptService);

  readonly spec = this.store.spec;
  readonly templates = this.svc.allTemplates;

  // View state signals
  readonly activeOutputTab = signal<OutputTab>('json');
  readonly mobileView = signal<'builder' | 'output'>('builder');
  readonly toastMessage = signal<string>('');

  // Modals signals
  readonly showSettings = signal(false);
  readonly showSavePreset = signal(false);
  readonly showImport = signal(false);

  // Form input signals for modals / tools
  readonly magicIdea = signal('');
  readonly magicLoading = signal(false);
  readonly importText = signal('');
  readonly newCustomTag = signal('');
  readonly presetName = signal('');
  readonly presetCategory = signal('Personali');
  readonly presetDescription = signal('');

  // Sections collapse state
  readonly sectionSubjectOpen = signal(true);
  readonly sectionSceneOpen = signal(true);
  readonly sectionCameraOpen = signal(true);
  readonly sectionLightingOpen = signal(true);
  readonly sectionCompositionOpen = signal(false);
  readonly sectionStyleOpen = signal(true);
  readonly sectionTypographyOpen = signal(false);
  readonly sectionTechnicalOpen = signal(true);
  readonly sectionCustomOpen = signal(false);

  // Compiled outputs bundle for OutputPanel
  readonly compiledOutputs = computed<CompiledOutputs>(() => ({
    json: this.store.cleanJson(),
    flux: this.store.fluxPrompt(),
    midjourney: this.store.midjourneyPrompt(),
    gpt: this.store.gptPrompt(),
    sdxl: this.store.sdxlPrompt(),
  }));

  readonly customSections: { key: CustomProperty['section']; label: string }[] = [
    { key: 'root', label: 'Radice (nuovo blocco)' },
    { key: 'subject', label: 'Soggetto' },
    { key: 'scene', label: 'Scena' },
    { key: 'camera', label: 'Camera' },
    { key: 'lighting', label: 'Luci' },
    { key: 'composition', label: 'Composizione' },
    { key: 'style', label: 'Stile' },
  ];

  readonly qualityTags = computed(() => {
    const defaultList = this.svc.getOptions('quality_tags');
    const current = this.spec().style_and_rendering.quality_tags;
    return [...new Set([...defaultList, ...current])];
  });

  collapseAll(): void {
    this.sectionSubjectOpen.set(false);
    this.sectionSceneOpen.set(false);
    this.sectionCameraOpen.set(false);
    this.sectionLightingOpen.set(false);
    this.sectionCompositionOpen.set(false);
    this.sectionStyleOpen.set(false);
    this.sectionTypographyOpen.set(false);
    this.sectionTechnicalOpen.set(false);
    this.sectionCustomOpen.set(false);
  }

  expandAll(): void {
    this.sectionSubjectOpen.set(true);
    this.sectionSceneOpen.set(true);
    this.sectionCameraOpen.set(true);
    this.sectionLightingOpen.set(true);
    this.sectionCompositionOpen.set(true);
    this.sectionStyleOpen.set(true);
    this.sectionTypographyOpen.set(true);
    this.sectionTechnicalOpen.set(true);
    this.sectionCustomOpen.set(true);
  }

  // Actions
  onTemplateSelected(t: PromptTemplate): void {
    this.store.replace(t.spec);
    this.showToast(`Template "${t.name}" caricato`);
  }

  onTemplateDeleted(t: PromptTemplate): void {
    if (confirm(`Eliminare il preset "${t.name}"?`)) {
      this.svc.deleteUserPreset(t.id);
      this.showToast('Preset eliminato');
    }
  }

  resetPrompt(): void {
    this.store.reset();
    this.showToast('Nuovo prompt vuoto inizializzato');
  }

  async copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('📋 Copiato negli appunti!');
    } catch {
      this.showToast('Impossibile accedere agli appunti');
    }
  }

  exportJsonFile(): void {
    const raw = JSON.stringify(this.spec(), null, 2);
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (this.spec().meta.title || 'prompt')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${slug || 'prompt'}.prompt.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('💾 File JSON esportato');
  }

  onImportFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then((txt) => {
      this.importText.set(txt);
      this.applyImport();
    });
    (ev.target as HTMLInputElement).value = '';
  }

  applyImport(): void {
    const text = this.importText().trim();
    if (!text) return;
    try {
      const cleaned = text.replace(/^[\s\S]*?```json\s*|\s*```[\s\S]*$/g, '').trim();
      const parsed = JSON.parse(cleaned || text);
      this.store.replace(parsed);
      this.showImport.set(false);
      this.importText.set('');
      this.showToast('📥 JSON importato con successo!');
    } catch (e) {
      this.showToast('JSON non valido: ' + (e as Error).message);
    }
  }

  savePreset(): void {
    const name = this.presetName().trim() || this.spec().meta.title;
    const cat = this.presetCategory().trim() || 'Personali';
    const desc = this.presetDescription().trim();
    const p = this.svc.saveUserPreset(name, cat, desc, this.spec());
    this.showSavePreset.set(false);
    this.presetName.set('');
    this.presetDescription.set('');
    this.showToast(`Preset "${p.name}" salvato`);
  }

  async runMagicExpand(): Promise<void> {
    const idea = this.magicIdea().trim();
    if (!idea || this.magicLoading()) return;
    this.magicLoading.set(true);
    try {
      const cfg = this.svc.aiConfig();
      const nextSpec = await this.svc.magicExpandIdea(idea, this.spec(), cfg);
      this.store.replace(nextSpec);
      const isLlm = !!cfg.apiKey.trim() || cfg.provider === 'ollama';
      this.showToast(isLlm ? `✨ Espanso con ${cfg.provider}` : '✨ Espansione offline applicata');
    } catch (e) {
      this.showToast('Errore espansione: ' + (e as Error).message);
    } finally {
      this.magicLoading.set(false);
    }
  }

  // AI Settings modal signals
  readonly aiProvider = signal<string>('gemini');
  readonly aiModel = signal<string>('gemini-2.5-flash');
  readonly aiApiKey = signal<string>('');
  readonly aiOllamaUrl = signal<string>('http://localhost:11434');

  openAiSettings(): void {
    const cfg = this.svc.aiConfig();
    this.aiProvider.set(cfg.provider);
    this.aiModel.set(cfg.model);
    this.aiApiKey.set(cfg.apiKey);
    this.aiOllamaUrl.set(cfg.ollamaUrl);
    this.showSettings.set(true);
  }

  saveAiSettings(): void {
    this.svc.aiConfig.set({
      provider: this.aiProvider() as any,
      model: this.aiModel().trim(),
      apiKey: this.aiApiKey().trim(),
      ollamaUrl: this.aiOllamaUrl().trim() || 'http://localhost:11434',
    });
    this.showSettings.set(false);
    this.showToast('⚙ Configurazione AI salvata');
  }

  randomizeSeed(): void {
    const s = Math.floor(Math.random() * 4_294_967_295);
    this.store.set('technical_parameters', 'seed', s);
  }

  addTag(): void {
    const tag = this.newCustomTag().trim();
    if (!tag) return;
    this.svc.addCustomOption('quality_tags', tag);
    this.store.addTag(tag);
    this.newCustomTag.set('');
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set('');
    }, 2800);
  }

  onKeydown(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === 'c') {
      ev.preventDefault();
      this.copyText(this.compiledOutputs()[this.activeOutputTab()]);
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      this.exportJsonFile();
    }
  }
}
