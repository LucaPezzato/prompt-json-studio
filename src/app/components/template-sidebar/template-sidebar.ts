import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PromptTemplate } from '../../models/prompt.model';

/** Template library sidebar: pure presentational component (inputs in, outputs out). */
@Component({
  selector: 'app-template-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sidebar' },
  template: `
    <h2>📚 Libreria Template</h2>
    <input
      type="search"
      class="tpl-search"
      placeholder="🔍 Cerca template…"
      [value]="query()"
      (input)="query.set($any($event.target).value)"
    />
    <div class="cat-filter">
      @for (c of categories(); track c) {
        <button type="button" class="pill" [class.active]="filter() === c" (click)="filter.set(c)">{{ c }}</button>
      }
    </div>
    <div class="template-list">
      @for (t of filtered(); track t.id) {
        <div class="template-card" tabindex="0" [title]="t.description" [style.--badge]="t.badgeColor" (click)="selected.emit(t)" (keydown.enter)="selected.emit(t)">
          <div class="tc-head">
            <span class="tc-badge">{{ t.category }}</span>
            @if (t.isUserPreset) {
              <button type="button" class="chip-x" title="Elimina preset" (click)="onDelete(t, $event)">×</button>
            }
          </div>
          <strong>{{ t.name }}</strong>
          <p>{{ t.description }}</p>
          <div class="tc-palette">
            @for (c of t.spec.lighting.color_palette; track $index) {
              <span [style.background]="c"></span>
            }
            <em>{{ t.spec.technical_parameters.aspect_ratio }}</em>
          </div>
        </div>
      } @empty {
        <p class="muted">Nessun template in questa categoria.</p>
      }
    </div>
  `,
})
export class TemplateSidebar {
  readonly templates = input.required<PromptTemplate[]>();
  readonly selected = output<PromptTemplate>();
  readonly deleted = output<PromptTemplate>();

  readonly filter = signal('Tutti');
  readonly query = signal('');
  readonly categories = computed(() => ['Tutti', ...new Set(this.templates().map((t) => t.category))]);
  readonly filtered = computed(() => {
    const f = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.templates().filter(
      (t) =>
        (f === 'Tutti' || t.category === f) &&
        (!q || `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q)),
    );
  });

  onDelete(t: PromptTemplate, ev: Event): void {
    ev.stopPropagation();
    this.deleted.emit(t);
  }
}
