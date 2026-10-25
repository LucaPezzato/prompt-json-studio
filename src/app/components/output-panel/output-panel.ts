import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompiledOutputs, GeneratedImageResult, ImageGenConfig, ImageGenProfile, OutputTab } from '../../models/prompt.model';

export type { OutputTab, CompiledOutputs };

const TABS: { key: OutputTab; label: string; hint: string }[] = [
  { key: 'gpt', label: '✨ Prompt Universale (FLUX & Gemini)', hint: 'Prompt narrativo naturale ad alta risoluzione con grounding: ideale per Google Gemini, FLUX.1/2, ChatGPT e DALL-E 3.' },
  { key: 'json', label: '{ } JSON', hint: 'JSON strutturato puro — incollalo in ComfyUI o usalo per integrazioni API programmatiche.' },
  { key: 'flux', label: 'FLUX.1 / FLUX.2', hint: 'Prompt narrativo gerarchico ottimizzato per l’encoder T5 di FLUX.1 / FLUX.2.' },
  { key: 'midjourney', label: 'Midjourney', hint: 'Sintassi a token + parametri nativi (--ar, --s, --c, --seed, --no, --style raw).' },
  { key: 'sdxl', label: 'SDXL', hint: 'Prompt positivo con pesi + prompt negativo per Stable Diffusion XL / Automatic1111 / ComfyUI.' },
];

/** Live multi-model output viewer & direct AI image generator with Dracula palette. */
@Component({
  selector: 'app-output-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'output' },
  template: `
    <!-- Top Mode Switcher (Image vs Prompt) -->
    <div class="panel-mode-switcher" role="tablist">
      <button
        type="button"
        role="tab"
        class="mode-btn"
        [class.active]="viewMode() === 'image'"
        (click)="viewMode.set('image')"
      >
        <span class="mode-icon">🎨</span>
        <span>Immagine</span>
        @if (generatedImage()) {
          <span class="active-badge-dot" title="Rendering generato presente">●</span>
        }
      </button>

      <button
        type="button"
        role="tab"
        class="mode-btn"
        [class.active]="viewMode() === 'prompt'"
        (click)="viewMode.set('prompt')"
      >
        <span class="mode-icon">📝</span>
        <span>Prompt &amp; Codice</span>
      </button>
    </div>

    <!-- Hero Action Bar for Direct Image Generation -->
    <div class="gen-action-bar">
      <button
        type="button"
        class="btn-generate-hero"
        [disabled]="generating()"
        (click)="onGenerateClick()"
        [title]="generating() ? 'Generazione in corso...' : 'Lancia generazione immagine con ' + activeProviderLabel()"
      >
        @if (generating()) {
          <span class="spinner-dot"></span>
          <span>Generazione in corso…</span>
        } @else {
          <span class="hero-icon">🎨</span>
          <span class="hero-text">Genera Immagine</span>
        }
      </button>

      <button
        type="button"
        class="btn-config-engine"
        (click)="openSettings.emit()"
        [title]="'Configura motore AI, API key e parametri (' + activeProviderLabel() + ')'"
      >
        <span class="cfg-icon">⚙</span>
        <span class="cfg-text">{{ activeEngineLabel() }}</span>
      </button>
    </div>

    <!-- Quick Engine / Profile Switcher Strip -->
    @if (profiles().length) {
      <div class="quick-profile-bar" role="toolbar" aria-label="Cambio rapido modello AI">
        <div class="qpb-header">
          <span class="qpb-label">⚡ Switch Modello al Volo:</span>
          <button type="button" class="qpb-manage-link" (click)="openSettings.emit()">Gestisci ⚙</button>
        </div>
        <div class="qpb-chips">
          @for (p of profiles(); track p.id) {
            <button
              type="button"
              class="qpb-chip"
              [class.active]="activeProfileId() === p.id"
              (click)="switchProfile.emit(p.id)"
              [title]="(p.description || p.name) + ' (' + p.provider + ')'"
            >
              @if (p.badge) {
                <span class="qpb-badge">{{ p.badge }}</span>
              }
              <span class="qpb-name">{{ p.name.replace('fal.ai: ', '').replace('Gemini ', '').replace('OpenAI ', '') }}</span>
            </button>
          }
        </div>
      </div>
    }

    <!-- Attached Character Sheet Strip (Visible when in Scene Mode with an attached sheet) -->
    @if (isSceneWithCharacter() && characterSheetImage()) {
      <div class="attached-sheet-strip">
        <div
          class="sheet-strip-thumb-wrap"
          (click)="openSheetLightbox.emit()"
          title="Clicca per ingrandire la scheda del personaggio allegata"
        >
          <img [src]="characterSheetImage()!" alt="Scheda {{ characterName() }}" class="sheet-strip-thumb" />
          <span class="sheet-strip-badge">📎 Scheda</span>
        </div>
        <div class="sheet-strip-info">
          <span class="sheet-strip-title">Scheda di Riferimento Allegata</span>
          <strong class="sheet-strip-name">{{ characterName() || 'Personaggio' }}</strong>
        </div>
        <div class="sheet-strip-actions">
          <button
            type="button"
            class="btn-sheet-strip-action"
            (click)="copySheetImage.emit()"
            title="Copia l'immagine della scheda negli appunti per incollarla in Gemini o ChatGPT"
          >
            📋 Copia
          </button>
          <button
            type="button"
            class="btn-sheet-strip-action"
            (click)="openSheetLightbox.emit()"
            title="Ingrandisci scheda a schermo intero"
          >
            🔍
          </button>
        </div>
      </div>
    }

    <!-- VIEW MODE: IMAGE WORKSPACE -->
    @if (viewMode() === 'image') {
      <div class="image-workspace">
        @if (generating()) {
          <div class="image-loading-card">
            <div class="loading-pulse-ring">
              <div class="spinner-radar"></div>
            </div>
            <h4 class="loading-title">Creazione rendering in corso…</h4>
            <div class="loading-timer-badge">
              ⏱️ {{ (elapsedGenTime() / 10).toFixed(1) }}s trascorsi
            </div>
            <p class="loading-desc">
              {{ loadingStageText() }}
            </p>
            <div class="loading-bar-track">
              <div class="loading-bar-progress"></div>
            </div>
            <div class="loading-engine-tag">
              <span>Motore: <b>{{ activeEngineLabel() }}</b></span>
            </div>
            <button
              type="button"
              class="btn-cancel-gen"
              (click)="cancelGenerate.emit()"
              title="Annulla la richiesta di generazione"
            >
              ⏹ Annulla operazione
            </button>
          </div>
        } @else if (imageGenError()) {
          <div class="image-error-card">
            <div class="error-badge-icon">⚠️</div>
            <h3 class="error-title">Generazione Non Riuscita</h3>
            <div class="error-msg-box">
              <p class="error-text">{{ imageGenError() }}</p>
            </div>
            <div class="error-actions-group">
              <button
                type="button"
                class="btn-err-action btn-retry"
                (click)="onGenerateClick()"
                title="Riprova a generare con i parametri attuali"
              >
                🔄 Riprova Generazione
              </button>
              @if (activeEngineLabel() !== 'gemini-2.5-flash-image') {
                <button
                  type="button"
                  class="btn-err-action btn-fallback"
                  (click)="switchModelAndRetry.emit('gemini-2.5-flash-image')"
                  title="Passa a gemini-2.5-flash-image (modello stabile, veloce e con quota generosa)"
                >
                  ⚡ Passa a gemini-2.5-flash-image (Consigliato)
                </button>
              }
              <button
                type="button"
                class="btn-err-action btn-config"
                (click)="openSettings.emit()"
                title="Controlla la tua API Key e il modello configurato"
              >
                ⚙ Controlla API Key / Impostazioni
              </button>
            </div>
          </div>
        } @else if (generatedImage()) {
          <div class="image-result-card">
            <div
              class="img-preview-container"
              (click)="openLightbox.emit()"
              title="Clicca per ingrandire a schermo intero"
            >
              <img
                [src]="generatedImage()!.dataUrl"
                alt="Immagine generata dall'AI"
                class="result-img"
              />
              <div class="img-zoom-hint">
                <span>🔍 Clicca per ingrandire</span>
              </div>
            </div>

            <div class="img-meta-strip">
              <span class="meta-tag model-tag">🤖 {{ generatedImage()!.model }}</span>
              <span class="meta-tag aspect-tag">📐 {{ generatedImage()!.aspectRatio }}</span>
              <span class="meta-tag time-tag">⚡ {{ (generatedImage()!.timeMs / 1000).toFixed(1) }}s</span>
            </div>

            <div class="img-actions-grid">
              <button
                type="button"
                class="img-action-btn"
                (click)="openLightbox.emit()"
                title="Visualizza a schermo intero"
              >
                🔍 Ingrandisci
              </button>
              <button
                type="button"
                class="img-action-btn"
                (click)="download.emit()"
                title="Scarica file sul tuo disco"
              >
                💾 Scarica
              </button>
              <button
                type="button"
                class="img-action-btn"
                (click)="copyImage.emit()"
                title="Copia negli appunti"
              >
                📋 Copia
              </button>
              <button
                type="button"
                class="img-action-btn regen-btn"
                (click)="onGenerateClick()"
                title="Genera una nuova variazione"
              >
                🔄 Rigenera
              </button>
            </div>

            @if (isSheetMode()) {
              <div class="sheet-save-prompt-bar">
                <button
                  type="button"
                  class="btn-save-as-sheet"
                  (click)="saveAsCharacterSheetImage.emit(generatedImage()!.dataUrl)"
                  title="Salva questa immagine generata come scheda ufficiale associata al personaggio"
                >
                  📌 Salva come Immagine Scheda di {{ characterName() || 'questo Personaggio' }}
                </button>
              </div>
            }

            <div class="img-prompt-disclosure">
              <div class="prompt-disclosure-header">
                <button
                  type="button"
                  class="btn-toggle-prompt"
                  (click)="showFullPrompt.set(!showFullPrompt())"
                >
                  <span>{{ showFullPrompt() ? '▼ Nascondi Prompt Inviato' : '▶ Mostra Prompt Inviato al Modello' }}</span>
                </button>
                @if (showFullPrompt()) {
                  <button
                    type="button"
                    class="btn-goto-prompt-tab"
                    (click)="viewMode.set('prompt')"
                    title="Apri la vista completa Prompt & Codice con sintassi colorata"
                  >
                    📝 Apri vista Prompt &amp; Codice ↗
                  </button>
                }
              </div>

              @if (showFullPrompt()) {
                <div class="prompt-snippet-box">
                  <div class="prompt-snippet-scroll">
                    <p class="prompt-text">{{ displayGeneratedPrompt() }}</p>
                  </div>
                  <div class="prompt-snippet-footer">
                    <span class="snippet-chars-count">{{ displayGeneratedPrompt().length }} caratteri</span>
                    <button
                      type="button"
                      class="btn-copy-snippet"
                      (click)="copy.emit(displayGeneratedPrompt())"
                      title="Copia il prompt negli appunti"
                    >
                      📋 Copia Prompt
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="image-empty-card">
            <div class="empty-icon-wrap">🎨</div>
            <h3 class="empty-title">Pronto per Generare</h3>
            <p class="empty-desc">
              Imposta il soggetto e la scena nell'editor a sinistra, poi clicca sul pulsante <b>Genera Immagine</b> in alto per visualizzare qui il rendering creato da <b>{{ activeEngineLabel() }}</b>.
            </p>
            <div class="empty-provider-info">
              <span>Motore: <b>{{ activeProviderLabel() }}</b></span>
              <button type="button" class="btn-link" (click)="openSettings.emit()">Modifica ⚙</button>
            </div>
            <button type="button" class="btn-empty-generate" (click)="onGenerateClick()">
              ✨ Avvia Generazione con {{ activeEngineLabel() }}
            </button>
          </div>
        }
      </div>
    } @else {
      <!-- VIEW MODE: PROMPT & CODE INSPECTION -->
      @if (tab() === 'gpt' && isSceneWithCharacter() && characterSheetImage()) {
        <div class="gemini-sheet-alert">
          <div class="alert-top">
            <span class="alert-icon">📎</span>
            <strong class="alert-title">Scheda Visiva di "{{ characterName() }}" pronta da allegare</strong>
          </div>
          <p class="alert-desc">
            Questo prompt contiene le istruzioni di grounding visivo per Gemini. Copia l'immagine della scheda e incollala nella chat con Gemini assieme al prompt:
          </p>
          <div class="alert-actions">
            <button type="button" class="btn-copy-sheet-alert" (click)="copySheetImage.emit()">
              📋 Copia Immagine Scheda
            </button>
            <button type="button" class="btn-view-sheet-alert" (click)="openSheetLightbox.emit()">
              🔍 Visualizza Scheda
            </button>
          </div>
        </div>
      }

      <div class="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab tab-primary"
          [class.active]="tab() === 'gpt'"
          (click)="tab.set('gpt')"
        >
          ✨ Prompt Universale (FLUX &amp; Gemini)
          @if (defaultModel() === 'gpt') {
            <span class="tab-star" title="Formato predefinito">★</span>
          }
        </button>

        <button
          type="button"
          role="tab"
          class="tab"
          [class.active]="tab() === 'json'"
          (click)="tab.set('json')"
        >
          {{ '{ }' }} JSON
          @if (defaultModel() === 'json') {
            <span class="tab-star" title="Formato predefinito">★</span>
          }
        </button>

        <div class="other-models-wrap">
          <select
            class="other-models-select"
            [class.active]="isOtherActive()"
            (change)="onOtherModelChange($any($event.target).value)"
          >
            <option value="" disabled [selected]="!isOtherActive()">Altri modelli ▾</option>
            <option value="flux" [selected]="tab() === 'flux'">FLUX.1 / FLUX.2 {{ defaultModel() === 'flux' ? '★' : '' }}</option>
            <option value="midjourney" [selected]="tab() === 'midjourney'">Midjourney v6 {{ defaultModel() === 'midjourney' ? '★' : '' }}</option>
            <option value="sdxl" [selected]="tab() === 'sdxl'">SDXL {{ defaultModel() === 'sdxl' ? '★' : '' }}</option>
          </select>
        </div>
      </div>
      <p class="hint">{{ hint() }}</p>
      <pre class="code" [innerHTML]="highlighted()"></pre>
      <div class="out-footer">
        <div class="out-footer-left">
          <span class="muted">{{ stats() }}</span>
          @if (defaultModel()) {
            @if (tab() === defaultModel()) {
              <span class="default-badge" title="Questo formato è impostato come predefinito per la copia rapida">
                ★ Predefinito
              </span>
            } @else {
              <button
                type="button"
                class="btn-make-default"
                [title]="'Imposta ' + currentTabShortLabel() + ' come formato predefinito all’avvio e per la copia'"
                (click)="setDefault.emit(tab())"
              >
                ☆ Rendi predefinito
              </button>
            }
          }
        </div>
        <button type="button" class="btn primary copy-btn" (click)="copy.emit(current())">
          📋 Copia {{ currentTabShortLabel() }} (Ctrl+Shift+C)
        </button>
      </div>
    }
  `,
})
export class OutputPanel {
  protected readonly tabs = TABS;
  private readonly sanitizer = inject(DomSanitizer);

  // Inputs
  readonly outputs = input.required<CompiledOutputs>();
  readonly tab = model<OutputTab>('gpt');
  readonly defaultModel = input<OutputTab>('gpt');
  readonly generating = input<boolean>(false);
  readonly generatedImage = input<GeneratedImageResult | null>(null);
  readonly imageGenConfig = input<ImageGenConfig | null>(null);
  readonly profiles = input<ImageGenProfile[]>([]);
  readonly activeProfileId = input<string>('');
  readonly imageGenError = input<string | null>(null);
  readonly elapsedGenTime = input<number>(0);

  // Character Sheet Attachment inputs
  readonly characterSheetImage = input<string | null>(null);
  readonly characterName = input<string>('');
  readonly isSceneWithCharacter = input<boolean>(false);
  readonly isSheetMode = input<boolean>(false);

  // Outputs
  readonly setDefault = output<OutputTab>();
  readonly copy = output<string>();
  readonly generate = output<void>();
  readonly cancelGenerate = output<void>();
  readonly switchModelAndRetry = output<string>();
  readonly switchProfile = output<string>();
  readonly openSettings = output<void>();
  readonly openLightbox = output<void>();
  readonly download = output<void>();
  readonly copyImage = output<void>();

  // Character Sheet Attachment outputs
  readonly openSheetLightbox = output<void>();
  readonly copySheetImage = output<void>();
  readonly saveAsCharacterSheetImage = output<string>();

  // Internal state
  readonly viewMode = signal<'image' | 'prompt'>('image');
  readonly showFullPrompt = signal<boolean>(false);

  stripBase64ForDisplay(text: string): string {
    if (!text) return '';
    return text.replace(
      /data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]{30,}/g,
      '[allegato: immagine base64 omessa]'
    );
  }

  readonly current = computed(() => {
    const raw = this.outputs()[this.tab()] || '';
    return this.stripBase64ForDisplay(raw);
  });

  readonly displayGeneratedPrompt = computed(() => {
    const p = this.generatedImage()?.prompt || '';
    return this.stripBase64ForDisplay(p);
  });

  readonly hint = computed(() => TABS.find((t) => t.key === this.tab())?.hint ?? '');
  readonly isOtherActive = computed(() => ['flux', 'midjourney', 'sdxl'].includes(this.tab()));
  readonly stats = computed(() => {
    const out = this.current();
    return `${out.length} caratteri · ${out.split(/\s+/).filter(Boolean).length} parole`;
  });

  readonly currentTabShortLabel = computed(() => {
    switch (this.tab()) {
      case 'gpt': return 'Universale';
      case 'json': return 'JSON';
      case 'flux': return 'FLUX';
      case 'midjourney': return 'Midjourney';
      case 'sdxl': return 'SDXL';
      default: return '';
    }
  });

  readonly activeProviderLabel = computed(() => {
    const cfg = this.imageGenConfig();
    if (!cfg) return 'fal.ai FLUX';
    switch (cfg.provider) {
      case 'fal_ai': return 'fal.ai FLUX';
      case 'gemini_imagen': return 'Google Gemini';
      case 'openai_dalle': return 'OpenAI DALL-E 3';
      case 'comfyui': return 'ComfyUI / Local WebUI';
      case 'custom': return 'Endpoint Personalizzato';
      default: return 'AI Generator';
    }
  });

  readonly activeEngineLabel = computed(() => {
    const cfg = this.imageGenConfig();
    if (!cfg) return 'FLUX Realism';
    const activeProf = this.profiles().find((p) => p.id === this.activeProfileId() || p.model === cfg.model);
    if (activeProf) {
      return activeProf.name.replace('fal.ai: ', '');
    }
    if (cfg.provider === 'fal_ai') return cfg.model || 'FLUX';
    if (cfg.provider === 'gemini_imagen') return cfg.model || 'gemini-2.5-flash-image';
    if (cfg.provider === 'openai_dalle') return cfg.model || 'dall-e-3';
    if (cfg.provider === 'comfyui') return cfg.model || 'ComfyUI';
    return cfg.model || 'Custom';
  });

  readonly loadingStageText = computed(() => {
    const sec = this.elapsedGenTime() / 10;
    if (sec < 3) return 'Invio istruzioni e staging parametri al modello AI…';
    if (sec < 7) return 'Elaborazione semantica, studio luci e fisionomia…';
    if (sec < 14) return 'Sintesi neurale del rendering ad alta risoluzione in corso…';
    return 'Finalizzazione dettagli e codifica dati grafici…';
  });

  onGenerateClick(): void {
    this.viewMode.set('image');
    this.generate.emit();
  }

  onOtherModelChange(val: string): void {
    if (val && ['flux', 'midjourney', 'sdxl'].includes(val)) {
      this.tab.set(val as OutputTab);
    }
  }

  /**
   * Lightweight JSON / CLI-flag syntax highlighter (Dracula palette).
   */
  readonly highlighted = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.highlight()));

  private highlight(): string {
    const escaped = this.current().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tab = this.tab();
    if (tab !== 'json' && tab !== 'gpt') {
      return escaped
        .replace(/(--[a-z]+(?: [^\s-][^\s]*)?)/g, '<span class="tok-flag">$1</span>')
        .replace(/(POSITIVE PROMPT:|NEGATIVE PROMPT:)/g, '<span class="tok-key">$1</span>');
    }
    return escaped.replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
      (match, str: string | undefined, colon: string | undefined, bool: string | undefined, num: string | undefined) => {
        if (str) {
          if (colon) return `<span class="tok-key">${str}</span>${colon}`;
          if (/^"#[0-9a-fA-F]{3,8}"$/.test(str)) {
            return `<span class="tok-str"><span class="swatch" style="background:${str.slice(1, -1)}"></span>${str}</span>`;
          }
          return `<span class="tok-str">${str}</span>`;
        }
        if (bool) return `<span class="tok-bool">${bool}</span>`;
        if (num) return `<span class="tok-num">${num}</span>`;
        return match;
      }
    );
  }
}
