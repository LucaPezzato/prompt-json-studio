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
import { CharacterLayoutMode, CharacterPhotoItem, CharacterSheetBlock, CharacterWorkflowMode, CustomProperty, GeneratedImageResult, ImageGenConfig, ImageGenProvider, LAYOUT_MODE_VIEWS, PromptTemplate, SavedCharacter } from './models/prompt.model';

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
  readonly activeOutputTab = signal<OutputTab>(this.svc.defaultOutputModel());
  readonly selectedDefaultModel = signal<OutputTab>(this.svc.defaultOutputModel());
  readonly mobileView = signal<'builder' | 'output'>('builder');
  readonly toastMessage = signal<string>('');

  // Modals signals
  readonly showSettings = signal(false);
  readonly showSavePreset = signal(false);
  readonly showImport = signal(false);
  readonly showTemplatesModal = signal(false);

  // Direct Image Generation signals
  readonly generatingImage = signal<boolean>(false);
  readonly generatedImage = signal<GeneratedImageResult | null>(null);
  readonly imageGenError = signal<string | null>(null);
  readonly elapsedGenSeconds = signal<number>(0);
  readonly showImageGenSettings = signal<boolean>(false);
  readonly showImageLightbox = signal<boolean>(false);
  readonly imgProvider = signal<ImageGenProvider>('gemini_imagen');
  readonly imgModel = signal<string>('gemini-2.5-flash-image');
  readonly imgApiKey = signal<string>('');
  readonly imgEndpointUrl = signal<string>('');
  private abortGenController: AbortController | null = null;
  private genTimerId: any = null;

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
  readonly magicError = signal('');
  readonly showMagicModal = signal(false);
  readonly showProjectMenu = signal(false);
  readonly importText = signal('');
  readonly newCustomTag = signal('');
  readonly presetName = signal('');
  readonly presetCategory = signal('Personali');
  readonly presetDescription = signal('');

  readonly aspectRatios: string[] = ['16:9', '1:1', '9:16', '4:5', '3:2', '21:9', '2:3'];

  setAspectRatio(ar: string): void {
    this.store.set('technical_parameters', 'aspect_ratio', ar);
  }

  toggleProjectMenu(): void {
    this.showProjectMenu.update((v) => !v);
  }

  closeProjectMenu(): void {
    this.showProjectMenu.set(false);
  }

  // Sections collapse state
  readonly sectionCharacterOpen = signal(false);
  readonly sectionSubjectOpen = signal(true);
  readonly sectionSceneOpen = signal(true);
  readonly sectionCameraOpen = signal(true);
  readonly sectionLightingOpen = signal(true);
  readonly sectionCompositionOpen = signal(false);
  readonly sectionStyleOpen = signal(true);
  readonly sectionTypographyOpen = signal(false);
  readonly sectionTechnicalOpen = signal(false);
  readonly sectionNegativeOpen = signal(false);
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

  readonly isSheetMode = computed<boolean>(() => {
    return this.spec().character_sheet.enabled && this.spec().character_sheet.mode !== 'scene_with_character';
  });

  readonly isCrowdedSheet = computed<boolean>(() => {
    if (!this.isSheetMode()) return false;
    const views = this.spec().character_sheet.views || [];
    const hasFace = views.some((v) => /close-?up|face|portrait|vis[oa]|primo\s*piano|macro/i.test(v));
    return views.length >= 5 && hasFace;
  });

  optimizeToThreeViewsAndFace(): void {
    this.store.setLayoutMode('turnaround_3_views');
    this.store.setCharacterViews(['Front view', 'Side profile view', 'Back view', 'Close-up face']);
    this.showToast('✨ Ottimizzato a 4 elementi: 3 viste corpo + 1 primo piano viso (proporzioni ideali 16:9)!');
  }

  switchToFullBodyAndPortraits(): void {
    this.store.setLayoutMode('full_body_and_portraits');
    this.showToast('✨ Layout "Figura Intera + Ritratti" attivato!');
  }

  readonly studioMode = computed<'scene' | 'character'>(() => {
    return this.isSheetMode() ? 'character' : 'scene';
  });

  setStudio(mode: 'scene' | 'character'): void {
    if (mode === 'character') {
      this.setWorkflowMode('sheet_generation');
    } else {
      if (this.spec().character_sheet.character_name.trim()) {
        this.setWorkflowMode('scene_with_character');
      } else {
        this.store.setPromptKind('free');
      }
    }
  }

  switchToSceneStudio(): void {
    this.setWorkflowMode('scene_with_character');
  }

  switchToCharacterStudio(): void {
    this.setWorkflowMode('sheet_generation');
  }

  setSignatureOutfit(outfit: string): void {
    this.store.updateCharacterSheet({ signature_outfit: outfit });
    this.store.set('subject', 'clothing_or_materials', outfit);
    const current = this.currentSavedCharacter();
    if (current) {
      this.svc.updateCharacter(current.id, { ...this.spec().character_sheet, signature_outfit: outfit }, current.name);
    }
    this.showToast(`Abito aggiornato: ${outfit.split(',')[0]}…`);
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
    this.sectionNegativeOpen.set(false);
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
    this.sectionNegativeOpen.set(true);
    this.sectionCustomOpen.set(true);
  }

  // Active character tracking
  readonly activeCharacterId = signal<string | null>('char-default-1');

  readonly currentSavedCharacter = computed(() => {
    const id = this.activeCharacterId();
    const name = this.spec().character_sheet.character_name.trim();
    if (id) {
      const match = this.savedCharacters().find((c) => c.id === id);
      if (match) return match;
    }
    if (name) {
      const matchName = this.savedCharacters().find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (matchName) return matchName;
    }
    return null;
  });

  // Edit Character Modal state
  readonly showEditCharacterModal = signal(false);
  readonly editCharId = signal<string | null>(null);
  readonly editCharName = signal('');
  readonly editCharGenderAge = signal('');
  readonly editCharBuild = signal('');
  readonly editCharEyes = signal('');
  readonly editCharHair = signal('');
  readonly editCharSkin = signal('');
  readonly editCharMarks = signal('');
  readonly editCharOutfit = signal('');
  readonly editCharProps = signal('');
  readonly editCharImage = signal('');

  // Character Sheet Attachment computeds
  readonly boundCharacterImage = computed(() => this.spec().character_sheet.image_data_url || null);
  readonly boundCharacterName = computed(() => this.spec().character_sheet.character_name || '');
  readonly isSceneWithCharacter = computed(() => this.spec().character_sheet.enabled && this.spec().character_sheet.mode === 'scene_with_character');

  openEditCharacterModal(char: SavedCharacter, ev?: Event): void {
    if (ev) ev.stopPropagation();
    this.editCharId.set(char.id);
    this.editCharName.set(char.name);
    this.editCharGenderAge.set(char.sheet.gender_and_age || '');
    this.editCharBuild.set(char.sheet.body_build || '');
    this.editCharEyes.set(char.sheet.eye_details || '');
    this.editCharHair.set(char.sheet.hair_details || '');
    this.editCharSkin.set(char.sheet.ethnicity_and_skin || '');
    this.editCharMarks.set(char.sheet.distinctive_marks || '');
    this.editCharOutfit.set(char.sheet.signature_outfit || '');
    this.editCharProps.set(char.sheet.signature_props || '');
    this.editCharImage.set(char.imageDataUrl || char.sheet.image_data_url || '');
    this.showEditCharacterModal.set(true);
  }

  openEditCurrentCharacter(): void {
    const active = this.currentSavedCharacter();
    if (active) {
      this.openEditCharacterModal(active);
    } else {
      const cs = this.spec().character_sheet;
      const temp: SavedCharacter = {
        id: 'char-current',
        name: cs.character_name || 'Personaggio Corrente',
        summary: '',
        sheet: cs,
        createdAt: Date.now(),
      };
      this.openEditCharacterModal(temp);
    }
  }

  saveEditedCharacterModal(): void {
    const id = this.editCharId();
    const name = this.editCharName().trim();
    if (!name) {
      this.showToast('Il nome del personaggio non può essere vuoto');
      return;
    }

    const partialSheet: Partial<CharacterSheetBlock> = {
      character_name: name,
      gender_and_age: this.editCharGenderAge(),
      body_build: this.editCharBuild(),
      eye_details: this.editCharEyes(),
      hair_details: this.editCharHair(),
      ethnicity_and_skin: this.editCharSkin(),
      distinctive_marks: this.editCharMarks(),
      signature_outfit: this.editCharOutfit(),
      signature_props: this.editCharProps(),
      image_data_url: this.editCharImage(),
    };

    if (id && id !== 'char-current') {
      const existing = this.savedCharacters().find((c) => c.id === id);
      if (existing) {
        const updated = this.svc.updateCharacter(id, { ...existing.sheet, ...partialSheet }, name, this.editCharImage());
        if (updated) {
          if (this.spec().character_sheet.character_name === existing.name || this.activeCharacterId() === id) {
            this.store.updateCharacterSheet(partialSheet);
          }
          this.showToast(`Personaggio "${updated.name}" aggiornato nella libreria!`);
        }
      }
    } else {
      const cs = this.spec().character_sheet;
      const saved = this.svc.saveCharacter(name, { ...cs, ...partialSheet }, this.editCharImage());
      this.activeCharacterId.set(saved.id);
      this.store.updateCharacterSheet(partialSheet);
      this.showToast(`Personaggio "${saved.name}" salvato nella libreria!`);
    }

    this.showEditCharacterModal.set(false);
  }

  saveCurrentCharacter(): void {
    const cs = this.spec().character_sheet;
    if (!cs.character_name.trim()) {
      this.showToast('Inserisci il nome del personaggio prima di salvarlo');
      return;
    }
    const current = this.currentSavedCharacter();
    if (current) {
      this.svc.updateCharacter(current.id, cs, cs.character_name, cs.image_data_url);
      this.showToast(`Personaggio "${cs.character_name}" aggiornato nella libreria!`);
    } else {
      const saved = this.svc.saveCharacter(cs.character_name, cs, cs.image_data_url);
      this.activeCharacterId.set(saved.id);
      this.showToast(`Personaggio "${saved.name}" salvato nella libreria!`);
    }
  }

  saveAsNewCharacter(): void {
    const cs = this.spec().character_sheet;
    const baseName = cs.character_name.trim() || 'Personaggio';
    const newName = prompt('Nome per la nuova copia del personaggio:', `${baseName} (Nuovo)`);
    if (!newName || !newName.trim()) return;

    const saved = this.svc.saveCharacter(newName.trim(), { ...cs, character_name: newName.trim() }, cs.image_data_url);
    this.activeCharacterId.set(saved.id);
    this.store.updateCharacterSheet({ character_name: newName.trim() });
    this.showToast(`Nuovo personaggio "${saved.name}" salvato nella libreria!`);
  }

  loadSavedCharacter(c: SavedCharacter): void {
    this.activeCharacterId.set(c.id);
    const img = c.imageDataUrl || c.sheet.image_data_url || '';
    this.store.updateCharacterSheet({
      ...c.sheet,
      image_data_url: img,
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
      if (this.activeCharacterId() === id) {
        this.activeCharacterId.set(null);
      }
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

  openMagicModal(): void {
    this.magicError.set('');
    this.showMagicModal.set(true);
  }

  async runMagicExpand(): Promise<void> {
    const idea = this.magicIdea().trim();
    if (!idea || this.magicLoading()) return;
    this.magicLoading.set(true);
    this.magicError.set('');
    try {
      const cfg = this.svc.aiConfig();
      const nextSpec = await this.svc.magicExpandIdea(idea, this.spec(), cfg);
      this.store.replace(nextSpec);

      // If we are editing a saved character in Character Studio, synchronize the character library
      if (this.isSheetMode()) {
        const cur = this.currentSavedCharacter();
        if (cur) {
          this.svc.updateCharacter(
            cur.id,
            nextSpec.character_sheet,
            nextSpec.character_sheet.character_name || cur.name,
            nextSpec.character_sheet.image_data_url || cur.imageDataUrl
          );
        }
      }

      const isLlm = !!cfg.apiKey.trim() || cfg.provider === 'ollama';
      const modeLabel = this.isSheetMode()
        ? 'Scheda Personaggio aggiornata'
        : this.isSceneWithCharacter()
        ? 'Scena arricchita con personaggio vincolato'
        : 'Prompt espanso';
      this.showToast(isLlm ? `✨ ${modeLabel} con ${cfg.model || cfg.provider}` : `✨ ${modeLabel} (offline)`);
      this.magicIdea.set('');
      this.showMagicModal.set(false);
    } catch (e) {
      const msg = (e as Error).message || 'Errore sconosciuto';
      this.magicError.set(msg);
      this.showToast('Errore espansione: ' + msg);
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
    this.selectedDefaultModel.set(this.svc.defaultOutputModel());
    this.showSettings.set(true);
  }

  saveAiSettings(): void {
    this.svc.aiConfig.set({
      provider: this.aiProvider() as any,
      model: this.aiModel().trim(),
      apiKey: this.aiApiKey().trim(),
      ollamaUrl: this.aiOllamaUrl().trim() || 'http://localhost:11434',
    });
    this.svc.setDefaultOutputModel(this.selectedDefaultModel());
    this.activeOutputTab.set(this.selectedDefaultModel());
    this.showSettings.set(false);
    this.showToast('⚙ Impostazioni salvate (Formato predefinito aggiornato)');
  }

  setDefaultOutputModel(tab: OutputTab): void {
    this.svc.setDefaultOutputModel(tab);
    const labels: Record<OutputTab, string> = {
      gpt: '✨ Gemini / GPT-4o',
      json: '{ } JSON',
      flux: 'FLUX',
      midjourney: 'Midjourney',
      sdxl: 'SDXL',
    };
    this.showToast(`★ Formato predefinito per la copia impostato su: ${labels[tab]}`);
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

  // ============ DIRECT IMAGE GENERATION METHODS ============

  openImageGenSettings(): void {
    const cfg = this.svc.imageGenConfig();
    this.imgProvider.set(cfg.provider);
    this.imgModel.set(
      cfg.model === 'imagen-3.0-generate-002' || !cfg.model ? 'gemini-2.5-flash-image' : cfg.model
    );
    this.imgApiKey.set(cfg.apiKey);
    this.imgEndpointUrl.set(cfg.endpointUrl);
    this.showImageGenSettings.set(true);
  }

  onImgProviderChange(prov: ImageGenProvider): void {
    this.imgProvider.set(prov);
    if (prov === 'gemini_imagen' && (!this.imgModel() || this.imgModel() === 'dall-e-3' || this.imgModel() === 'imagen-3.0-generate-002')) {
      this.imgModel.set('gemini-2.5-flash-image');
    } else if (prov === 'openai_dalle' && (!this.imgModel() || this.imgModel() === 'imagen-3.0-generate-002' || this.imgModel() === 'gemini-2.5-flash-image')) {
      this.imgModel.set('dall-e-3');
    } else if (prov === 'comfyui' && !this.imgEndpointUrl()) {
      this.imgEndpointUrl.set('http://127.0.0.1:7860/sdapi/v1/txt2img');
    }
  }

  saveImageGenSettings(): void {
    this.svc.setImageGenConfig({
      provider: this.imgProvider(),
      model: this.imgModel().trim(),
      apiKey: this.imgApiKey().trim(),
      endpointUrl: this.imgEndpointUrl().trim(),
    });
    this.showImageGenSettings.set(false);
    this.showToast('⚙ Configurazione motore di generazione salvata');
  }

  async runGenerateImage(): Promise<void> {
    if (this.generatingImage()) return;

    // Guard: check Gemini API key
    const cfg = this.svc.imageGenConfig();
    const apiKey = (cfg.provider === 'gemini_imagen') ? (cfg.apiKey || this.svc.aiConfig().apiKey) : cfg.apiKey;
    if (cfg.provider === 'gemini_imagen' && !apiKey) {
      this.showImageGenSettings.set(true);
      this.showToast('⚠️ Inserisci la tua API Key Gemini nelle impostazioni per generare');
      return;
    }

    this.generatingImage.set(true);
    this.imageGenError.set(null);
    this.elapsedGenSeconds.set(0);

    // Scroll image workspace to top immediately so loading card is visible
    if (typeof document !== 'undefined') {
      const ws = document.querySelector('.image-workspace');
      if (ws) ws.scrollTop = 0;
    }

    const start = Date.now();
    this.genTimerId = setInterval(() => {
      this.elapsedGenSeconds.set(Math.floor((Date.now() - start) / 100));
    }, 100);

    this.abortGenController = new AbortController();

    try {
      const res = await this.svc.generateImage(this.spec(), undefined, this.abortGenController.signal);
      this.generatedImage.set(res);
      this.imageGenError.set(null);
      if (this.isSheetMode() || this.spec().character_sheet.mode === 'sheet_generation') {
        const charName = this.spec().character_sheet.character_name.trim();
        const optimized = await this.optimizeImageDataUrl(res.dataUrl);
        this.store.updateCharacterSheet({ image_data_url: optimized });
        const existing = this.currentSavedCharacter();
        if (existing) {
          this.svc.updateCharacter(existing.id, this.spec().character_sheet, charName || existing.name, optimized);
        } else if (charName) {
          const saved = this.svc.saveCharacter(charName, this.spec().character_sheet, optimized);
          this.activeCharacterId.set(saved.id);
        }
        this.showToast(`🎨 Scheda generata e associata a "${charName || 'Personaggio'}"!`);
      } else {
        this.showToast(`🎨 Immagine generata con successo (${(res.timeMs / 1000).toFixed(1)}s)`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.showToast('⏹ Generazione immagine annullata');
        return;
      }
      console.error('Image generation error:', err);
      const msg = err?.message || 'Errore imprevisto durante la generazione';
      this.imageGenError.set(msg);
      this.showToast(`❌ ${msg}`);
    } finally {
      if (this.genTimerId) {
        clearInterval(this.genTimerId);
        this.genTimerId = null;
      }
      this.abortGenController = null;
      this.generatingImage.set(false);
    }
  }

  cancelGenerateImage(): void {
    if (this.abortGenController) {
      this.abortGenController.abort();
    }
  }

  switchModelAndRetry(modelName: string): void {
    this.imgModel.set(modelName);
    this.svc.setImageGenConfig({
      ...this.svc.imageGenConfig(),
      model: modelName,
    });
    this.runGenerateImage();
  }

  downloadGeneratedImage(): void {
    const img = this.generatedImage();
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.dataUrl;
    const ext = img.mimeType.includes('png') ? 'png' : 'jpg';
    const slug = (this.spec().character_sheet?.character_name || this.spec().meta?.title || 'generated-image').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 32);
    a.download = `${slug}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast('💾 Download immagine avviato');
  }

  async copyGeneratedImage(): Promise<void> {
    const img = this.generatedImage();
    if (!img) return;
    try {
      const res = await fetch(img.dataUrl);
      const blob = await res.blob();
      if (blob.type === 'image/png') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        this.showToast('📋 Immagine copiata negli appunti!');
      } else {
        const canvas = document.createElement('canvas');
        const image = new Image();
        image.src = img.dataUrl;
        await new Promise((resolve) => { image.onload = resolve; });
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(image, 0, 0);
        canvas.toBlob(async (pngBlob) => {
          if (pngBlob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': pngBlob })
            ]);
            this.showToast('📋 Immagine copiata negli appunti!');
          }
        }, 'image/png');
      }
    } catch {
      await navigator.clipboard.writeText(img.prompt);
      this.showToast('📋 Prompt immagine copiato negli appunti');
    }
  }

  openImageLightbox(): void {
    this.showImageLightbox.set(true);
  }

  // ============ CHARACTER SHEET IMAGE ATTACHMENT METHODS ============

  async optimizeImageDataUrl(dataUrl: string, maxDim = 1024, quality = 0.85): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async onUploadSheetImage(ev: Event): Promise<void> {
    const target = ev.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const rawUrl = reader.result as string;
        const optimized = await this.optimizeImageDataUrl(rawUrl);
        this.store.updateCharacterSheet({ image_data_url: optimized });
        const charName = this.spec().character_sheet.character_name.trim();
        const existing = this.currentSavedCharacter();
        if (existing) {
          this.svc.updateCharacter(existing.id, this.spec().character_sheet, charName || existing.name, optimized);
        } else if (charName) {
          const saved = this.svc.saveCharacter(charName, this.spec().character_sheet, optimized);
          this.activeCharacterId.set(saved.id);
        }
        this.showToast(`📸 Immagine scheda associata a "${charName || 'Personaggio'}"!`);
      };
      reader.readAsDataURL(file);
      target.value = '';
    }
  }

  async onSheetImageDrop(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    if (ev.dataTransfer?.files && ev.dataTransfer.files[0]) {
      const file = ev.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        this.showToast('Il file rilasciato non è un\'immagine valida');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const rawUrl = reader.result as string;
        const optimized = await this.optimizeImageDataUrl(rawUrl);
        this.store.updateCharacterSheet({ image_data_url: optimized });
        const charName = this.spec().character_sheet.character_name.trim();
        const existing = this.currentSavedCharacter();
        if (existing) {
          this.svc.updateCharacter(existing.id, this.spec().character_sheet, charName || existing.name, optimized);
        } else if (charName) {
          const saved = this.svc.saveCharacter(charName, this.spec().character_sheet, optimized);
          this.activeCharacterId.set(saved.id);
        }
        this.showToast(`📸 Immagine scheda associata a "${charName || 'Personaggio'}"!`);
      };
      reader.readAsDataURL(file);
    }
  }

  async copyBoundSheetImage(): Promise<void> {
    const imgUrl = this.spec().character_sheet.image_data_url;
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      if (blob.type === 'image/png') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = imgUrl;
        await new Promise((r) => { img.onload = r; });
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        canvas.toBlob(async (b) => {
          if (b) await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
        }, 'image/png');
      }
      this.showToast('📋 Immagine scheda copiata negli appunti!');
    } catch {
      this.showToast('❌ Impossibile copiare l\'immagine negli appunti');
    }
  }

  downloadBoundSheetImage(): void {
    const imgUrl = this.spec().character_sheet.image_data_url;
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    const charName = (this.spec().character_sheet.character_name || 'character').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    a.download = `${charName}-model-sheet.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast('💾 Download scheda avviato');
  }

  removeBoundSheetImage(): void {
    this.store.updateCharacterSheet({ image_data_url: '' });
    const existing = this.currentSavedCharacter();
    if (existing) {
      this.svc.updateCharacter(existing.id, this.spec().character_sheet, undefined, '');
    }
    this.showToast('Immagine scheda rimossa');
  }

  openBoundSheetLightbox(): void {
    const imgUrl = this.spec().character_sheet.image_data_url;
    if (!imgUrl) return;
    this.generatedImage.set({
      dataUrl: imgUrl,
      mimeType: 'image/jpeg',
      model: `Scheda: ${this.spec().character_sheet.character_name || 'Personaggio'}`,
      prompt: `Model Sheet di riferimento per ${this.spec().character_sheet.character_name || 'Personaggio'}`,
      aspectRatio: this.spec().character_sheet.layout_mode === 'expressions_grid' ? '1:1' : '16:9',
      timeMs: 0,
      timestamp: Date.now(),
    });
    this.showImageLightbox.set(true);
  }

  async saveGeneratedAsSheetImage(dataUrl: string): Promise<void> {
    const charName = this.spec().character_sheet.character_name.trim();
    const optimized = await this.optimizeImageDataUrl(dataUrl);
    this.store.updateCharacterSheet({ image_data_url: optimized });
    const existing = this.currentSavedCharacter();
    if (existing) {
      this.svc.updateCharacter(existing.id, this.spec().character_sheet, charName || existing.name, optimized);
    } else if (charName) {
      const saved = this.svc.saveCharacter(charName, this.spec().character_sheet, optimized);
      this.activeCharacterId.set(saved.id);
    }
    this.showToast(`📌 Immagine salvata come scheda ufficiale di "${charName || 'Personaggio'}"!`);
  }

  async onUploadEditCharImage(ev: Event): Promise<void> {
    const target = ev.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const rawUrl = reader.result as string;
        const optimized = await this.optimizeImageDataUrl(rawUrl);
        this.editCharImage.set(optimized);
        this.showToast('📸 Nuova immagine caricata');
      };
      reader.readAsDataURL(file);
      target.value = '';
    }
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
      const imgFirst = photos[0]?.dataUrl || '';
      const optimizedImg = imgFirst ? await this.optimizeImageDataUrl(imgFirst) : '';
      this.store.updateCharacterSheet({ ...extracted, enabled: true, image_data_url: optimizedImg });
      const saved = this.svc.saveCharacter(extracted.character_name, extracted, optimizedImg);
      this.activeCharacterId.set(saved.id);
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
