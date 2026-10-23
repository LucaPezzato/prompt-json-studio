import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type OutputTab = 'json' | 'flux' | 'midjourney' | 'gpt' | 'sdxl';
export type CompiledOutputs = Record<OutputTab, string>;

const TABS: { key: OutputTab; label: string; hint: string }[] = [
  { key: 'json', label: '{ } JSON', hint: 'JSON strutturato puro — incollalo in GPT-4o, Gemini, FLUX.2 o in pipeline ComfyUI.' },
  { key: 'flux', label: 'FLUX', hint: 'Prompt narrativo gerarchico ottimizzato per l’encoder T5 di FLUX.1 / FLUX.2.' },
  { key: 'midjourney', label: 'Midjourney', hint: 'Sintassi a token + parametri nativi (--ar, --s, --c, --seed, --no, --style raw).' },
  { key: 'gpt', label: 'Gemini / GPT-4o', hint: 'Istruzione in inglese con grounding su sheet allegato + brief JSON: ottimizzato per Google Gemini e ChatGPT.' },
  { key: 'sdxl', label: 'SDXL', hint: 'Prompt positivo con pesi + prompt negativo per Stable Diffusion XL / Automatic1111 / ComfyUI.' },
];

/** Live multi-model output viewer with Dracula syntax highlighting. */
@Component({
  selector: 'app-output-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'output' },
  template: `
    <div class="tabs" role="tablist">
      @for (t of tabs; track t.key) {
        <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button>
      }
    </div>
    <p class="hint">{{ hint() }}</p>
    <pre class="code" [innerHTML]="highlighted()"></pre>
    <div class="out-footer">
      <span class="muted">{{ stats() }}</span>
      <button type="button" class="btn primary" (click)="copy.emit(current())">📋 Copia (Ctrl+Shift+C)</button>
    </div>
  `,
})
export class OutputPanel {
  protected readonly tabs = TABS;
  private readonly sanitizer = inject(DomSanitizer);

  readonly outputs = input.required<CompiledOutputs>();
  readonly tab = model<OutputTab>('json');
  readonly copy = output<string>();

  readonly current = computed(() => this.outputs()[this.tab()]);
  readonly hint = computed(() => TABS.find((t) => t.key === this.tab())?.hint ?? '');
  readonly stats = computed(() => {
    const out = this.current();
    return `${out.length} caratteri · ${out.split(/\s+/).filter(Boolean).length} parole`;
  });

  /**
   * Lightweight JSON / CLI-flag syntax highlighter (Dracula palette).
   * Input is fully HTML-escaped first and swatch colors are regex-validated HEX values,
   * so bypassing the sanitizer (needed to keep inline swatch styles) is safe.
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
