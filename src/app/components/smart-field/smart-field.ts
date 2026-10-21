import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { PresetCategoryKey } from '../../models/prompt.model';
import { PromptService } from '../../services/prompt.service';

/**
 * Signal-based text field with suggested preset chips and the ability to save
 * your own custom elements (persisted, shown first in the suggestions).
 *
 * Usage: <app-smart-field label="…" category="shot_type" [value]="x()" (valueChange)="setX($event)" />
 *    or: <app-smart-field label="…" [(value)]="writableSignal" />
 */
@Component({
  selector: 'app-smart-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'field' },
  template: `
    <div class="field-head">
      <label [attr.for]="fieldId">{{ label() }}</label>
      @if (category()) {
        <div class="field-actions">
          @if (canSave()) {
            <button type="button" class="mini-btn save" title="Salva come elemento personalizzato" (click)="saveCustom()">＋ Salva</button>
          }
          <button type="button" class="mini-btn" (click)="expanded.update((v) => !v)">
            {{ expanded() ? '▴ Chiudi' : '▾ Preset (' + options().length + ')' }}
          </button>
        </div>
      }
    </div>

    @if (multiline()) {
      <textarea [id]="fieldId" rows="2" [placeholder]="placeholder()" [value]="value()" (input)="onInput($event)"></textarea>
    } @else {
      <input [id]="fieldId" type="text" [placeholder]="placeholder()" [value]="value()" (input)="onInput($event)" />
    }

    @if (category() && expanded()) {
      <div class="chips">
        @for (opt of options(); track opt) {
          <span class="chip" [class.active]="opt === value()" [class.custom]="customSet().has(opt)" (click)="pick(opt)">
            {{ opt }}
            @if (customSet().has(opt)) {
              <button type="button" class="chip-x" title="Rimuovi elemento personalizzato" (click)="removeCustom(opt, $event)">×</button>
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
