import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { API_BASE_URL } from '../../core/api';
import { I18nService } from '../../core/i18n.service';

type Localized = { en: string; mr: string; hi: string };

export type SchemeSubject = {
  code: string;
  subjectId: number | null;
  available: boolean;
  kind: string;
  name: Localized;
  theory: number | null;
  internal: number | null;
  graded: boolean;
  papers: number;
};

export type SchemeGroup = {
  key: 'A' | 'A_CHOICE' | 'B' | 'C' | 'FOUNDATION' | 'OPTIONAL';
  label: Localized;
  pick: { min: number; max: number };
  subjects: SchemeSubject[];
};

export type SubjectScheme = { stream: string | null; reference: string; groups: SchemeGroup[]; rules: Localized[] };

type Issue = { code: string; message: Localized };
type Validation = {
  ok: boolean;
  stream: string | null;
  errors: Issue[];
  warnings: Issue[];
  summary: { papers: number; groupA: string[]; aChoice: string[]; groupB: string[]; groupC: string[]; optional?: string[]; foundation?: string[]; unlisted: string[] };
};

const COMPULSORY_CODES = ['1', '30', '31'];

/**
 * Guided subject picker for the HSC exam form, driven by the 2019 GR scheme
 * (GET /api/masters/subject-scheme) with live rule checks
 * (POST /api/masters/subject-scheme/validate). Messages come back from the
 * API in English, Marathi and Hindi and follow the selected UI language.
 *
 * The parent form stays the source of truth: this component only emits
 * (add)/(remove) with a subject id.
 */
@Component({
  selector: 'app-gr-subject-guide',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <section class="guide" [attr.aria-label]="i18n.t('grTitle')">
      <header class="guide-head">
        <div class="head-text">
          <h4>{{ i18n.t('grTitle') }}</h4>
          <p>{{ i18n.t('grIntro') }}</p>
        </div>
        @if (scheme()?.stream) {
          <div class="meter" [class.meter-ok]="validation()?.ok" role="status" aria-live="polite">
            <div class="meter-top">
              <span>{{ i18n.t('grPapers') }}</span>
              <strong>{{ papers() }}/8</strong>
            </div>
            <div class="meter-bar"><span [style.width.%]="meterWidth()"></span></div>
          </div>
        }
      </header>

      @if (!stream) {
        <div class="notice"><mat-icon>info</mat-icon><span>{{ i18n.t('grStreamMissing') }}</span></div>
      } @else if (loadFailed()) {
        <div class="notice"><mat-icon>cloud_off</mat-icon><span>{{ i18n.t('grLoadFailed') }}</span></div>
      } @else if (scheme() && !scheme()!.stream) {
        <div class="notice"><mat-icon>info</mat-icon><span>{{ i18n.t('grStreamNotCovered') }}</span></div>
      } @else if (scheme()) {
        <div class="groups">
          @for (group of scheme()!.groups; track group.key) {
            <div class="group" [class.group-done]="groupCount(group) >= group.pick.min && groupCount(group) <= group.pick.max">
              <div class="group-head">
                <div class="group-title">{{ i18n.pick(group.label) }}</div>
                <div class="group-hint">
                  <span class="hint-text">{{ pickHint(group) }}</span>
                  <span class="count" [class.count-ok]="groupCount(group) >= group.pick.min && groupCount(group) <= group.pick.max">
                    {{ groupCount(group) }}
                  </span>
                </div>
              </div>
              <div class="chips">
                @for (s of group.subjects; track s.code) {
                  @let state = chipState(group, s);
                  <button
                    type="button"
                    class="chip"
                    [class.chip-selected]="state === 'counted'"
                    [class.chip-elsewhere]="state === 'elsewhere'"
                    [class.chip-locked]="state === 'locked'"
                    [class.chip-off]="state === 'unavailable'"
                    [disabled]="!editable || state === 'unavailable' || state === 'locked'"
                    [attr.aria-pressed]="isSelected(s)"
                    [matTooltip]="chipTooltip(s, state)"
                    (click)="toggle(s)">
                    <span class="chip-code">{{ s.code }}</span>
                    <span class="chip-name">{{ i18n.pick(s.name) }}</span>
                    @if (s.papers > 1) {
                      <span class="chip-papers">{{ s.papers }} {{ i18n.t('grPapersSuffix') }}</span>
                    }
                    @if (state === 'counted' || state === 'locked') {
                      <mat-icon class="chip-icon">{{ state === 'locked' ? 'lock' : 'check' }}</mat-icon>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <div class="issues" aria-live="polite">
          @if (validation(); as v) {
            @if (v.ok && !v.warnings.length) {
              <div class="issue issue-ok"><mat-icon>check_circle</mat-icon><span>{{ i18n.t('grAllGood') }}</span></div>
            }
            @for (e of v.errors; track $index) {
              <div class="issue issue-error"><mat-icon>error</mat-icon><span>{{ i18n.pick(e.message) }}</span></div>
            }
            @for (w of v.warnings; track $index) {
              <div class="issue issue-warn"><mat-icon>warning</mat-icon><span>{{ i18n.pick(w.message) }}</span></div>
            }
          }
        </div>

        @if (scheme()!.rules.length) {
          <details class="rules">
            <summary>{{ i18n.t('grRules') }} <span class="ref">· {{ scheme()!.reference }}</span></summary>
            <ul>
              @for (r of scheme()!.rules; track $index) { <li>{{ i18n.pick(r) }}</li> }
            </ul>
          </details>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .guide {
      border: 1px solid var(--hsc-border, #dde3ec);
      border-radius: var(--hsc-radius-lg, 14px);
      background: var(--hsc-surface, #fff);
      padding: 18px;
      margin: 8px 0 20px;
    }
    .guide-head { display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; margin-bottom: 14px; }
    .head-text h4 { margin: 0; font-size: 1.02rem; font-weight: 700; color: var(--hsc-text, #0f172a); }
    .head-text p { margin: 4px 0 0; font-size: 0.86rem; color: var(--hsc-text-muted, #475569); }

    .meter { min-width: 180px; }
    .meter-top { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--hsc-text-muted, #475569); margin-bottom: 6px; gap: 12px; }
    .meter-top strong { color: var(--hsc-text, #0f172a); font-variant-numeric: tabular-nums; }
    .meter-bar { height: 6px; border-radius: 99px; background: var(--hsc-surface-muted, #eef2f7); overflow: hidden; }
    .meter-bar span { display: block; height: 100%; background: var(--hsc-primary, #1d4ed8); border-radius: 99px; transition: width 0.25s ease; }
    .meter-ok .meter-bar span { background: var(--hsc-success, #047857); }

    .notice { display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 10px; background: var(--hsc-surface-muted, #eef2f7); color: var(--hsc-text-muted, #475569); font-size: 0.9rem; }

    .groups { display: grid; gap: 12px; }
    .group { border: 1px solid var(--hsc-border, #dde3ec); border-radius: 12px; padding: 12px 14px; background: #fbfcfe; }
    .group-done { border-color: #b7e3cf; background: #f7fcf9; }
    .group-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
    .group-title { font-weight: 600; font-size: 0.92rem; color: var(--hsc-text, #0f172a); }
    .group-hint { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--hsc-text-subtle, #64748b); white-space: nowrap; }
    .count { min-width: 24px; height: 24px; padding: 0 6px; border-radius: 99px; display: inline-grid; place-items: center; font-weight: 700; background: var(--hsc-surface-muted, #eef2f7); color: var(--hsc-text-muted, #475569); font-variant-numeric: tabular-nums; }
    .count-ok { background: var(--hsc-success-soft, #e8f7f0); color: var(--hsc-success, #047857); }

    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 8px;
      min-height: 36px; padding: 6px 12px 6px 6px;
      border-radius: 8px; border: 1px solid var(--hsc-border-strong, #c5cedb);
      background: var(--hsc-surface, #fff); color: var(--hsc-text, #0f172a);
      font: inherit; font-size: 0.86rem; text-align: left; cursor: pointer;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .chip:hover:not(:disabled) { border-color: var(--hsc-primary, #1d4ed8); background: var(--hsc-primary-soft, #eaf0ff); }
    .chip:focus-visible { outline: 2px solid var(--hsc-primary, #1d4ed8); outline-offset: 2px; }
    .chip-code {
      min-width: 28px; height: 24px; padding: 0 6px; border-radius: 6px;
      display: inline-grid; place-items: center;
      background: var(--hsc-surface-muted, #eef2f7); color: var(--hsc-text-muted, #475569);
      font-size: 0.74rem; font-weight: 700; font-variant-numeric: tabular-nums;
    }
    .chip-papers { font-size: 0.72rem; color: var(--hsc-saffron, #c2410c); font-weight: 600; }
    .chip-icon { font-size: 18px; width: 18px; height: 18px; }

    .chip-selected { border-color: var(--hsc-primary, #1d4ed8); background: var(--hsc-primary-soft, #eaf0ff); color: var(--hsc-primary-hover, #1e40af); font-weight: 600; }
    .chip-selected .chip-code { background: var(--hsc-primary, #1d4ed8); color: #fff; }
    .chip-locked { border-color: #b7e3cf; background: var(--hsc-success-soft, #e8f7f0); color: #065f46; cursor: default; font-weight: 600; }
    .chip-locked .chip-code { background: var(--hsc-success, #047857); color: #fff; }
    .chip-elsewhere { border-style: dashed; border-color: #93b4f5; color: var(--hsc-text-muted, #475569); }
    .chip-elsewhere .chip-code { background: #dbe6ff; color: var(--hsc-primary-hover, #1e40af); }
    .chip-off { border-style: dashed; color: #94a3b8; background: transparent; cursor: not-allowed; }
    .chip-off .chip-code { background: transparent; color: #94a3b8; }
    .chip:disabled:not(.chip-locked):not(.chip-off) { cursor: default; }

    .issues { display: grid; gap: 8px; margin-top: 14px; }
    .issue { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; font-size: 0.88rem; line-height: 1.45; }
    .issue mat-icon { flex: 0 0 20px; font-size: 20px; width: 20px; height: 20px; margin-top: 1px; }
    .issue-error { background: var(--hsc-danger-soft, #fdeeee); color: #7f1d1d; }
    .issue-error mat-icon { color: var(--hsc-danger, #b91c1c); }
    .issue-warn { background: var(--hsc-warning-soft, #fff7e6); color: #78350f; }
    .issue-warn mat-icon { color: var(--hsc-warning, #b45309); }
    .issue-ok { background: var(--hsc-success-soft, #e8f7f0); color: #065f46; }
    .issue-ok mat-icon { color: var(--hsc-success, #047857); }

    .rules { margin-top: 14px; font-size: 0.86rem; color: var(--hsc-text-muted, #475569); }
    .rules summary { cursor: pointer; font-weight: 600; color: var(--hsc-text, #0f172a); }
    .rules .ref { font-weight: 400; color: var(--hsc-text-subtle, #64748b); font-size: 0.78rem; }
    .rules ul { margin: 8px 0 0; padding-left: 20px; display: grid; gap: 4px; }

    @media (max-width: 600px) {
      .guide { padding: 14px; }
      .meter { width: 100%; }
      .group-head { flex-direction: column; align-items: flex-start; gap: 4px; }
      .chip { font-size: 0.82rem; padding-right: 10px; }
    }
  `]
})
export class GrSubjectGuideComponent implements OnChanges, OnDestroy {
  /** Student stream code ('1'..'5') or stream name. */
  @Input() stream: string | null = null;
  /** Comma separated ids of the subjects currently selected in the form. */
  @Input() selectedKey = '';
  /** Subjects offered by the institute; others are shown as unavailable. */
  @Input() offered: Array<{ id: number; code: string }> = [];
  @Input() editable = true;

  @Output() add = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  protected readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);

  readonly scheme = signal<SubjectScheme | null>(null);
  readonly validation = signal<Validation | null>(null);
  readonly loadFailed = signal(false);
  private readonly selectedIds = signal<Set<number>>(new Set());
  private readonly offeredByCode = signal<Map<string, number>>(new Map());

  readonly papers = computed(() => this.validation()?.summary?.papers ?? this.localPapers());
  readonly meterWidth = computed(() => Math.min(100, (this.papers() / 8) * 100));

  private schemeSub?: Subscription;
  private validateSub?: Subscription;
  private validateTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['offered']) {
      this.offeredByCode.set(new Map((this.offered || []).map((s) => [String(s.code).trim(), s.id])));
    }
    if (changes['selectedKey']) {
      const ids = String(this.selectedKey || '').split(',').map(Number).filter((n) => n > 0);
      this.selectedIds.set(new Set(ids));
    }
    if (changes['stream']) {
      this.loadScheme();
    } else if (changes['selectedKey'] || changes['offered']) {
      this.scheduleValidation();
    }
  }

  ngOnDestroy() {
    this.schemeSub?.unsubscribe();
    this.validateSub?.unsubscribe();
    clearTimeout(this.validateTimer);
  }

  /** Subject id to use for a scheme entry — prefer the institute's own subject row. */
  private idFor(s: SchemeSubject): number | null {
    return this.offeredByCode().get(s.code) ?? null;
  }

  isSelected(s: SchemeSubject): boolean {
    const id = this.idFor(s) ?? s.subjectId;
    return id != null && this.selectedIds().has(id);
  }

  groupCount(group: SchemeGroup): number {
    const v = this.validation();
    if (v?.summary) {
      const s = v.summary;
      switch (group.key) {
        case 'A': return s.groupA.length;
        case 'A_CHOICE': return s.aChoice.length;
        case 'B': return s.groupB.length;
        case 'C': return s.groupC.filter((c) => !s.unlisted.includes(c)).length;
        case 'FOUNDATION': return s.foundation?.length ?? 0;
        case 'OPTIONAL': return s.optional?.length ?? 0;
      }
    }
    return group.subjects.filter((s) => this.isSelected(s)).length;
  }

  /** counted: selected and counted in this group · elsewhere: selected but counted in another group */
  chipState(group: SchemeGroup, s: SchemeSubject): 'counted' | 'elsewhere' | 'locked' | 'unavailable' | 'free' {
    if (this.isSelected(s)) {
      if (COMPULSORY_CODES.includes(s.code)) return 'locked';
      const summary = this.validation()?.summary;
      if (!summary) return 'counted';
      const inGroup: Record<string, string[] | undefined> = {
        A: summary.groupA, A_CHOICE: summary.aChoice, B: summary.groupB, C: summary.groupC,
        FOUNDATION: summary.foundation, OPTIONAL: summary.optional
      };
      const assigned = Object.entries(inGroup).filter(([, codes]) => codes?.includes(s.code)).map(([k]) => k);
      return !assigned.length || assigned.includes(group.key) ? 'counted' : 'elsewhere';
    }
    if (this.idFor(s) == null) return 'unavailable';
    return 'free';
  }

  chipTooltip(s: SchemeSubject, state: string): string {
    if (state === 'unavailable') return this.i18n.t('grNotOffered');
    if (state === 'locked') return this.i18n.t('grCompulsory');
    if (s.theory != null && s.internal != null) return `${s.theory} + ${s.internal}`;
    return '';
  }

  pickHint(group: SchemeGroup): string {
    const { min, max } = group.pick;
    if (group.key === 'A') return this.i18n.t('grCompulsory');
    if (min === 0) return this.i18n.t('grUpTo', { max });
    if (min === max) return `${this.i18n.t('grPick')} ${min}`;
    return this.i18n.t('grPickRange', { min, max });
  }

  toggle(s: SchemeSubject) {
    if (!this.editable || COMPULSORY_CODES.includes(s.code)) return;
    const id = this.idFor(s);
    if (id == null) return;
    if (this.selectedIds().has(id)) this.remove.emit(id);
    else this.add.emit(id);
  }

  private localPapers(): number {
    const byId = new Map<number, SchemeSubject>();
    for (const g of this.scheme()?.groups ?? []) for (const s of g.subjects) {
      const id = this.idFor(s);
      if (id != null) byId.set(id, s);
    }
    let total = 0;
    for (const id of this.selectedIds()) total += byId.get(id)?.papers ?? 1;
    return total;
  }

  private loadScheme() {
    this.schemeSub?.unsubscribe();
    this.scheme.set(null);
    this.validation.set(null);
    this.loadFailed.set(false);
    if (!this.stream) return;
    this.schemeSub = this.http
      .get<SubjectScheme>(`${API_BASE_URL}/masters/subject-scheme`, { params: { stream: String(this.stream) } })
      .subscribe({
        next: (scheme) => {
          this.scheme.set(scheme);
          this.scheduleValidation(0);
        },
        error: () => this.loadFailed.set(true)
      });
  }

  private scheduleValidation(delay = 300) {
    clearTimeout(this.validateTimer);
    if (!this.stream || !this.scheme()?.stream) return;
    this.validateTimer = setTimeout(() => this.validateNow(), delay);
  }

  private validateNow() {
    this.validateSub?.unsubscribe();
    this.validateSub = this.http
      .post<Validation>(`${API_BASE_URL}/masters/subject-scheme/validate`, {
        stream: String(this.stream),
        subjectIds: [...this.selectedIds()]
      })
      .subscribe({
        next: (result) => this.validation.set(result),
        error: () => this.validation.set(null)
      });
  }
}
