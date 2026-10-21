import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-section-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'section-card',
    '[class.open]': 'open()',
    '[style.--accent]': 'accent()',
  },
  styles: [`
    :host {
      display: block;
      flex-shrink: 0;
      background: var(--bg-2, #282a36);
      border: 1px solid var(--line, #44475a);
      border-radius: var(--radius, 12px);
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    :host(:hover) {
      border-color: color-mix(in srgb, var(--accent, #bd93f9) 60%, var(--line, #44475a));
    }
    :host(.open) {
      border-top: 3px solid var(--accent, #bd93f9);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
    }
    .head-btn {
      width: 100%;
      min-height: 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      border: none;
      color: var(--fg, #f8f8f2);
      padding: 12px 18px;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      user-select: none;
      transition: background 0.12s ease;
    }
    .head-btn:hover {
      background: var(--bg-3, #343746);
    }
    .head-btn:focus-visible {
      outline: 2px solid var(--purple, #bd93f9);
      outline-offset: -2px;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--accent, #bd93f9) 18%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent, #bd93f9) 35%, transparent);
      font-size: 15px;
    }
    .badge {
      font-style: normal;
      font-size: 11px;
      font-weight: 700;
      background: var(--accent, #bd93f9);
      color: #1e1f29;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }
    .head-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .summary-hint {
      font-size: 12px;
      color: var(--comment, #6272a4);
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chev {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent, #bd93f9);
      transition: transform 0.18s ease;
      display: inline-block;
    }
    :host(.open) .chev {
      transform: rotate(90deg);
    }
    .body-wrap {
      padding: 6px 18px 20px;
      border-top: 1px solid color-mix(in srgb, var(--line, #44475a) 50%, transparent);
      background: rgba(30, 31, 41, 0.4);
    }
  `],
  template: `
    <button
      type="button"
      class="head-btn"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <div class="title-group">
        @if (icon()) {
          <span class="icon-badge">{{ icon() }}</span>
        }
        <span class="title-text">{{ title() }}</span>
        @if (badge()) {
          <em class="badge">{{ badge() }}</em>
        }
      </div>

      <div class="head-right">
        @if (!open() && summary()) {
          <span class="summary-hint">{{ summary() }}</span>
        }
        <span class="chev">▸</span>
      </div>
    </button>

    @if (open()) {
      <div class="body-wrap">
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
  readonly summary = input<string>('');
  readonly open = model(true);

  toggle(): void {
    this.open.update((v) => !v);
  }
}
