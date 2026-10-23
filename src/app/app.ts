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
import { CharacterLayoutMode, CharacterPhotoItem, CharacterWorkflowMode, CustomProperty, LAYOUT_MODE_VIEWS, PromptTemplate, SavedCharacter } from './models/prompt.model';

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
  readonly showTemplatesModal = signal(false);

  // Reverse Image to Prompt signals
  readonly showReverseModal = signal(false);
  readonly reverseLoading = signal(false);
  readonly reverseImageDataUrl = signal<string | null>(null);
  readonly reverseImageInfo = signal<{ name: string; size: string; width: number; height: number; aspect: string } | null>(null);
  readonly reverseInstructions = signal('');
  readonly referenceImage = signal<string | null>(null);
  readonly referenceImageInfo = signal<{ name: string; size: string; width: number; height: number; aspect: string } | null>(null);
  readonly showLightbox = signal(false);
  readonly isDragging = signal(false);

  // Character Photos to Profile signals
  readonly showCharPhotoModal = signal(false);
  readonly charPhotoLoading = signal(false);
  readonly charPhotos = signal<CharacterPhotoItem[]>([]);
  readonly charPhotoContext = signal('');
  readonly isCharPhotoDragging = signal(false);

  // Form input signals for modals / tools
  readonly magicIdea = signal('');
  readonly magicLoading = signal(false);
  readonly importText = signal('');
  readonly newCustomTag = signal('');
  readonly presetName = signal('');
  readonly presetCategory = signal('Personali');
  readonly presetDescription = signal('');

  // Sections collapse state
  readonly sectionCharacterOpen = signal(false);
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

  // Character Sheet signals & library
  readonly savedCharacters = this.svc.savedCharacters;
  readonly availableViews = computed(() => {
    const mode = this.spec().character_sheet.layout_mode;
    return (
      LAYOUT_MODE_VIEWS[mode]?.availableViews ?? [
        'Front view',
        '3/4 Profile view',
        'Side profile view',
        'Back view',
        'Close-up face',
      ]
    );
  });

  setCharacterLayoutMode(mode: CharacterLayoutMode): void {
    this.store.setLayoutMode(mode);
    const label = LAYOUT_MODE_VIEWS[mode]?.label || mode;
    this.showToast(`Layout impostato: ${label}`);
  }

  setWorkflowMode(mode: CharacterWorkflowMode): void {
    this.store.setWorkflowMode(mode);
    if (mode === 'scene_with_character') {
      this.sectionCharacterOpen.set(false);
      this.sectionSubjectOpen.set(true);
      this.sectionSceneOpen.set(true);
      this.showToast('🎬 Modalità Scena Attiva: Personaggio vincolato al prompt!');
    } else {
      this.sectionCharacterOpen.set(true);
      this.showToast('📐 Modalità Scheda Attiva: Generazione foglio modello / turnaround.');
    }
  }

  collapseAll(): void {
    this.sectionCharacterOpen.set(false);
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
    this.sectionCharacterOpen.set(true);
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

  saveCurrentCharacter(): void {
    const cs = this.spec().character_sheet;
    if (!cs.character_name.trim()) {
      this.showToast('Inserisci il nome del personaggio prima di salvarlo');
      return;
    }
    const saved = this.svc.saveCharacter(cs.character_name, cs);
    this.showToast(`Personaggio "${saved.name}" salvato nella libreria!`);
  }

  loadSavedCharacter(c: SavedCharacter): void {
    this.store.updateCharacterSheet({
      ...c.sheet,
      enabled: true,
    });
    this.sectionCharacterOpen.set(true);
    this.showToast(`Caricato personaggio: ${c.name}`);
  }

  deleteSavedCharacter(id: string, ev?: Event): void {
    if (ev) ev.stopPropagation();
    const c = this.savedCharacters().find((x) => x.id === id);
    if (confirm(`Eliminare il personaggio "${c?.name || 'selezionato'}" dalla libreria?`)) {
      this.svc.deleteCharacter(id);
      this.showToast('Personaggio rimosso');
    }
  }

  injectCharacterIntoSubject(): void {
    this.store.applyCharacterToSubject();
    this.sectionSubjectOpen.set(true);
    this.showToast('Identità personaggio iniettata nel blocco Soggetto!');
  }

  // Actions
  onTemplateSelected(t: PromptTemplate): void {
    this.store.replace(t.spec);
    this.showTemplatesModal.set(false);
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
  readonly aiModel = signal<string>('gemini-3.8-flash');
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

  // ============ REVERSE IMAGE TO PROMPT METHODS ============

  openReverseModal(): void {
    this.showReverseModal.set(true);
  }

  clearReferenceImage(): void {
    this.referenceImage.set(null);
    this.referenceImageInfo.set(null);
    this.showToast('Miniatura foto di riferimento rimossa');
  }

  async handleImageFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.showToast('Il file selezionato non è un\'immagine valida.');
      return;
    }
    try {
      const processed = await this.processImageFile(file);
      this.reverseImageDataUrl.set(processed.dataUrl);
      this.reverseImageInfo.set({
        name: processed.name,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        aspect: processed.aspect,
      });
    } catch (e) {
      this.showToast('Errore elaborazione immagine: ' + (e as Error).message);
    }
  }

  onReverseFileSelect(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleImageFile(file);
      input.value = '';
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragging.set(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) {
      this.handleImageFile(file);
    }
  }

  onPasteImage(ev: ClipboardEvent): void {
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          this.handleImageFile(file);
          break;
        }
      }
    }
  }

  setReversePresetInstruction(text: string): void {
    this.reverseInstructions.set(text);
  }

  async runReverseEngineer(): Promise<void> {
    const dataUrl = this.reverseImageDataUrl();
    if (!dataUrl || this.reverseLoading()) return;
    this.reverseLoading.set(true);
    try {
      const cfg = this.svc.aiConfig();
      const info = this.reverseImageInfo();
      const detectedAspect = info?.aspect || '16:9';
      const instructions = this.reverseInstructions();

      const extractedSpec = await this.svc.reverseEngineerImage(
        dataUrl,
        instructions,
        this.spec(),
        cfg,
        detectedAspect
      );

      this.store.replace(extractedSpec);
      this.referenceImage.set(dataUrl);
      this.referenceImageInfo.set(info);
      this.showReverseModal.set(false);
      this.showToast('✨ Foto analizzata: prompt estratto e pronto per le modifiche!');
      this.expandAll();
    } catch (e) {
      this.showToast('Errore estrazione prompt: ' + (e as Error).message);
    } finally {
      this.reverseLoading.set(false);
    }
  }

  // Character Photos from file/drop methods
  openCharPhotoModal(): void {
    this.showCharPhotoModal.set(true);
  }

  closeCharPhotoModal(): void {
    if (this.charPhotoLoading()) return;
    this.showCharPhotoModal.set(false);
  }

  onCharPhotoDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.isCharPhotoDragging.set(true);
  }

  onCharPhotoDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    this.isCharPhotoDragging.set(false);
  }

  async onCharPhotosDrop(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    this.isCharPhotoDragging.set(false);
    if (ev.dataTransfer?.files) {
      await this.addCharPhotoFiles(ev.dataTransfer.files);
    }
  }

  async onCharFilesSelected(ev: Event): Promise<void> {
    const target = ev.target as HTMLInputElement;
    if (target.files) {
      await this.addCharPhotoFiles(target.files);
      target.value = '';
    }
  }

  async addCharPhotoFiles(files: FileList | File[]): Promise<void> {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) {
      this.showToast('Seleziona file immagine validi (PNG, JPG, WEBP)');
      return;
    }
    const current = this.charPhotos();
    const remainingSlots = Math.max(0, 5 - current.length);
    if (remainingSlots <= 0) {
      this.showToast('Hai già raggiunto il limite massimo di 5 foto');
      return;
    }
    const toProcess = list.slice(0, remainingSlots);
    for (const f of toProcess) {
      try {
        const processed = await this.processImageFile(f);
        this.charPhotos.update((prev) => [
          ...prev,
          {
            id: 'cp-' + Math.random().toString(36).substring(2, 9),
            dataUrl: processed.dataUrl,
            name: processed.name,
            size: processed.size,
            width: processed.width,
            height: processed.height,
          },
        ]);
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }
    if (list.length > remainingSlots) {
      this.showToast(`Caricate ${remainingSlots} foto (massimo 5 per personaggio)`);
    }
  }

  removeCharPhoto(id: string): void {
    this.charPhotos.update((prev) => prev.filter((p) => p.id !== id));
  }

  clearCharPhotos(): void {
    this.charPhotos.set([]);
  }

  async runExtractCharacterFromPhotos(): Promise<void> {
    const photos = this.charPhotos();
    if (photos.length === 0 || this.charPhotoLoading()) return;
    this.charPhotoLoading.set(true);
    try {
      const cfg = this.svc.aiConfig();
      const extracted = await this.svc.extractCharacterFromPhotos(
        photos.map((p) => p.dataUrl),
        this.charPhotoContext(),
        cfg
      );
      this.store.updateCharacterSheet({ ...extracted, enabled: true });
      const saved = this.svc.saveCharacter(extracted.character_name, extracted);
      this.sectionCharacterOpen.set(true);
      this.showCharPhotoModal.set(false);
      this.charPhotos.set([]);
      this.charPhotoContext.set('');
      this.showToast(`✨ Scheda di "${saved.name}" estratta da ${photos.length} foto e salvata!`);
    } catch (e) {
      this.showToast('Errore analisi foto: ' + (e as Error).message);
    } finally {
      this.charPhotoLoading.set(false);
    }
  }

  private async processImageFile(file: File): Promise<{
    dataUrl: string;
    name: string;
    size: string;
    width: number;
    height: number;
    aspect: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Impossibile leggere il file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Immagine non valida'));
        img.onload = () => {
          const origW = img.width;
          const origH = img.height;
          const maxDim = 1600;
          let w = origW;
          let h = origH;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: reader.result as string,
              name: file.name,
              size: this.formatBytes(file.size),
              width: origW,
              height: origH,
              aspect: this.inferAspectRatio(origW, origH),
            });
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve({
            dataUrl,
            name: file.name,
            size: this.formatBytes(file.size),
            width: origW,
            height: origH,
            aspect: this.inferAspectRatio(origW, origH),
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  private inferAspectRatio(w: number, h: number): string {
    const r = w / h;
    if (Math.abs(r - 1) < 0.08) return '1:1';
    if (Math.abs(r - 16 / 9) < 0.12) return '16:9';
    if (Math.abs(r - 9 / 16) < 0.12) return '9:16';
    if (Math.abs(r - 4 / 5) < 0.1) return '4:5';
    if (Math.abs(r - 3 / 2) < 0.1) return '3:2';
    if (Math.abs(r - 2 / 3) < 0.1) return '2:3';
    if (Math.abs(r - 21 / 9) < 0.15) return '21:9';
    return r > 1 ? '16:9' : '4:5';
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
