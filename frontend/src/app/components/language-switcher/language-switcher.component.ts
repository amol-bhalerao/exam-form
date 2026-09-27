import { Component, Input, inject } from '@angular/core';
import { I18nService, SUPPORTED_LANGUAGES, LanguageCode } from '../../core/i18n.service';

/**
 * Segmented मराठी / English / हिंदी control.
 * Changing it updates the whole UI immediately and, when signed in,
 * saves the choice to the account so it is restored on the next login.
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div class="lang-switch" [class.on-dark]="tone === 'dark'" [class.compact]="compact" role="radiogroup" [attr.aria-label]="i18n.t('selectLanguage')">
      @for (lang of languages; track lang.code) {
        <button
          type="button"
          role="radio"
          class="lang-option"
          [class.active]="i18n.language() === lang.code"
          [attr.aria-checked]="i18n.language() === lang.code"
          [attr.lang]="lang.code"
          [attr.title]="lang.label"
          (click)="choose(lang.code)">
          {{ compact ? lang.short : lang.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      border-radius: 999px;
      background: var(--hsc-surface-muted, #eef2f7);
      border: 1px solid var(--hsc-border, #dbe2ea);
    }
    .lang-option {
      appearance: none;
      border: 0;
      background: transparent;
      color: var(--hsc-text-muted, #475569);
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1;
      padding: 7px 12px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    }
    .lang-option:hover { color: var(--hsc-text, #0f172a); }
    .lang-option:focus-visible { outline: 2px solid var(--hsc-primary, #1e40af); outline-offset: 1px; }
    .lang-option.active {
      background: var(--hsc-surface, #fff);
      color: var(--hsc-primary, #1e40af);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
    }
    .compact .lang-option { padding: 6px 9px; font-size: 0.78rem; }
    .on-dark {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.22);
    }
    .on-dark .lang-option { color: rgba(255, 255, 255, 0.85); }
    .on-dark .lang-option:hover { color: #fff; }
    .on-dark .lang-option.active { background: #fff; color: #1e3a8a; }
  `]
})
export class LanguageSwitcherComponent {
  /** 'light' for light backgrounds (default), 'dark' for coloured headers. */
  @Input() tone: 'light' | 'dark' = 'light';
  /** Short labels (मरा / EN / हिं) for tight spaces such as the mobile toolbar. */
  @Input() compact = false;

  protected readonly i18n = inject(I18nService);
  protected readonly languages = SUPPORTED_LANGUAGES;

  choose(code: LanguageCode) {
    if (code === this.i18n.language()) return;
    this.i18n.setLanguage(code);
  }
}
