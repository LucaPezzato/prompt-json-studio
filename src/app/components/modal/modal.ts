import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Generic modal dialog. Visibility is a two-way `model()`; content is projected. */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'open.set(false)' },
  styles: [`
    :host {
      display: contents;
    }
  `],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="open.set(false)">
        <div class="modal" [class.wide]="wide()" [class.extra-wide]="extraWide()" [class.gallery-modal]="gallery()" role="dialog" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
          <h3>{{ title() }}</h3>
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly wide = input(false);
  readonly extraWide = input(false);
  readonly gallery = input(false);
  readonly open = model(false);
}
