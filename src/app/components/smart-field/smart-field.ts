import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { PresetCategoryKey } from '../../models/prompt.model';
import { PromptService } from '../../services/prompt.service';

/**
 * Signal-based text field with dropdown selector, autocomplete datalist,
 * suggested preset chips and the ability to save custom elements.
 */
@Component({
  selector: 'app-smart-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'field' },
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
    .field-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      gap: 8px;
    }
    .field-head label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--muted, #d6d8e6);
      margin-bottom: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .field-actions {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }
    .preset-select {
      background: var(--bg, #1e1f29);
      color: var(--purple, #bd93f9);
      border: 1px solid var(--line, #44475a);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 6px;
      cursor: pointer;
      max-width: 175px;
      text-overflow: ellipsis;
      outline: none;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .preset-select:hover, .preset-select:focus {
      border-color: var(--purple, #bd93f9);
      background: var(--bg-3, #343746);
    }
    .preset-select option {
      background: #282a36;
      color: #f8f8f2;
    }
    .mini-btn {
      background: var(--bg, #1e1f29);
      border: 1px solid var(--line, #44475a);
      color: var(--muted, #6272a4);
      border-radius: 6px;
      font-size: 11px;
      padding: 3px 7px;
      cursor: pointer;
      transition: all 0.12s ease;
      font-family: inherit;
    }
    .mini-btn:hover {
      color: var(--fg, #f8f8f2);
      border-color: var(--purple, #bd93f9);
    }
    .mini-btn.save {
      color: var(--green, #50fa7b);
      border-color: color-mix(in srgb, var(--green, #50fa7b) 40%, var(--line, #44475a));
    }
    .mini-btn.save:hover {
      background: color-mix(in srgb, var(--green, #50fa7b) 20%, transparent);
    }
    .mini-btn.chip-toggle.active {
      background: color-mix(in srgb, var(--purple, #bd93f9) 25%, transparent);
      color: var(--purple, #bd93f9);
      border-color: var(--purple, #bd93f9);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--bg, #1e1f29);
      border: 1px solid var(--line, #44475a);
      font-size: 11.5px;
      cursor: pointer;
      color: #d6d8e6;
      transition: all 0.12s ease;
      user-select: none;
    }
    .chip:hover {
      border-color: var(--purple, #bd93f9);
      color: #fff;
    }
    .chip.active {
      background: color-mix(in srgb, var(--purple, #bd93f9) 22%, transparent);
      border-color: var(--purple, #bd93f9);
      color: var(--purple, #bd93f9);
      font-weight: 600;
    }
    .chip.custom {
      border-style: dashed;
      border-color: var(--green, #50fa7b);
    }
    .chip-x {
      background: none;
      border: none;
      color: var(--muted, #6272a4);
      cursor: pointer;
      font-size: 13px;
      padding: 0;
      line-height: 1;
    }
    .chip-x:hover {
      color: var(--red, #ff5555);
    }
  `],
  template: `
    <div class="field-head">
      <label [attr.for]="fieldId">{{ label() }}</label>
      @if (category() && options().length > 0) {
        <div class="field-actions">
          <select
            class="preset-select"
            [attr.aria-label]="'Valori predefiniti per ' + label()"
            (change)="onSelectOption($event)"
          >
            <option value="" disabled selected>▾ Valori predefiniti ({{ options().length }})</option>
            @for (opt of options(); track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
          @if (canSave()) {
            <button
              type="button"
              class="mini-btn save"
              title="Salva come elemento personalizzato"
              (click)="saveCustom()"
            >＋ Salva</button>
          }
          <button
            type="button"
            class="mini-btn chip-toggle"
            [class.active]="expanded()"
            [title]="expanded() ? 'Chiudi chips' : 'Mostra chips interattive'"
            (click)="expanded.update((v) => !v)"
          >
            {{ expanded() ? '▴ Chiudi' : '🏷 Chip' }}
          </button>
        </div>
      }
    </div>

    @if (multiline()) {
      <textarea
        [id]="fieldId"
        rows="2"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
      ></textarea>
    } @else {
      <input
        [id]="fieldId"
        type="text"
        [attr.list]="category() ? fieldId + '-list' : null"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (category() && options().length > 0) {
        <datalist [id]="fieldId + '-list'">
          @for (opt of options(); track opt) {
            <option [value]="opt"></option>
          }
        </datalist>
      }
    }

    @if (category() && expanded()) {
      <div class="chips">
        @for (opt of options(); track opt) {
          <span
            class="chip"
            [class.active]="opt === value()"
            [class.custom]="customSet().has(opt)"
            (click)="pick(opt)"
          >
            {{ opt }}
            @if (customSet().has(opt)) {
              <button
                type="button"
                class="chip-x"
                title="Rimuovi elemento personalizzato"
                (click)="removeCustom(opt, $event)"
              >×</button>
            }
          </span>
        }
      </div>
    }
  `,
})
export class SmartField {
  private static nextId = 0;
  private readonly svc = inject(PromptService);

  readonly label = input.required<string>();
  readonly category = input<PresetCategoryKey | null>(null);
  readonly placeholder = input<string>('');
  readonly multiline = input(false);
  readonly value = model<string>('');

  /** Emitted when the user saves the current value as a reusable custom element. */
  readonly customSaved = output<string>();

  readonly expanded = signal(false);
  protected readonly fieldId = `smart-field-${SmartField.nextId++}`;

  readonly options = computed(() => {
    const cat = this.category();
    return cat ? this.svc.getOptions(cat) : [];
  });

  readonly customSet = computed(() => {
    const cat = this.category();
    return new Set(cat ? this.svc.getCustomOptions(cat) : []);
  });

  readonly canSave = computed(() => {
    const v = (this.value() ?? '').trim();
    return !!v && !this.options().includes(v);
  });

  onInput(ev: Event): void {
    this.value.set((ev.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  onSelectOption(ev: Event): void {
    const sel = ev.target as HTMLSelectElement;
    if (sel.value) {
      this.value.set(sel.value);
      sel.selectedIndex = 0;
    }
  }

  pick(opt: string): void {
    this.value.set(opt);
  }

  saveCustom(): void {
    const cat = this.category();
    if (!cat) return;
    this.svc.addCustomOption(cat, this.value());
    this.customSaved.emit(this.value().trim());
    this.expanded.set(true);
  }

  removeCustom(opt: string, ev: Event): void {
    ev.stopPropagation();
    const cat = this.category();
    if (cat) this.svc.removeCustomOption(cat, opt);
  }
}
