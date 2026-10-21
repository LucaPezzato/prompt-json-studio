import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Collapsible builder block with a colored accent. `open` is a two-way `model()`. */
@Component({
  selector: 'app-section-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.open]': 'open()',
    '[style.--accent]': 'accent()',
  },
  template: `
    <button type="button" class="block-head" [attr.aria-expanded]="open()" (click)="open.update((v) => !v)">
      <span>{{ icon() }} {{ title() }} @if (badge()) {<em class="badge">{{ badge() }}</em>}</span>
      <span class="chev">{{ open() ? '▾' : '▸' }}</span>
    </button>
    @if (open()) {
      <div class="block-body">
        <ng-content />
      </div>
    }
  `,
})
export class SectionBlock {
  readonly title = input.required<string>();
  readonly icon = input('');
  readonly accent = input('#bd93f9');
  readonly badge = input<string | number | null>(null);
  readonly open = model(true);
}
