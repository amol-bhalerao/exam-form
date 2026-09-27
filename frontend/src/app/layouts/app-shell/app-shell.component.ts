import { Component, computed, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api';
import { I18nService } from '../../core/i18n.service';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';

type NavItem = { link: string; icon: string; key: string };
type NavSection = { titleKey?: string; items: NavItem[] };

const NAV: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    {
      titleKey: 'navSystemManagement',
      items: [
        { link: '/app/super/health', icon: 'health_and_safety', key: 'navHealth' },
        { link: '/app/super/payments', icon: 'payments', key: 'navPayments' },
        { link: '/app/super/institutes', icon: 'apartment', key: 'navInstitutes' },
        { link: '/app/super/institute-dashboard', icon: 'analytics', key: 'navInstituteDashboard' },
        { link: '/app/super/institute-users', icon: 'person_add', key: 'navInstituteUsers' },
        { link: '/app/super/users', icon: 'admin_panel_settings', key: 'navAdminUsers' },
        { link: '/app/super/masters', icon: 'tune', key: 'navMasterData' }
      ]
    }
  ],
  BOARD: [
    {
      titleKey: 'navContent',
      items: [
        { link: '/app/board/exams', icon: 'event', key: 'navExams' },
        { link: '/app/board/applications', icon: 'description', key: 'navApplications' },
        { link: '/app/board/students', icon: 'school', key: 'navStudentMaster' },
        { link: '/app/board/news', icon: 'feed', key: 'navNews' }
      ]
    },
    { titleKey: 'navInstitutes', items: [{ link: '/app/board/institutes', icon: 'apartment', key: 'navInstituteDashboard' }] },
    {
      titleKey: 'navAcademic',
      items: [
        { link: '/app/board/teachers', icon: 'groups', key: 'navTeachers' },
        { link: '/app/board/subjects', icon: 'auto_stories', key: 'navSubjects' },
        { link: '/app/board/streams', icon: 'account_tree', key: 'navStreams' }
      ]
    }
  ],
  INSTITUTE: [
    { titleKey: 'navStudentManagement', items: [{ link: '/app/institute/applications', icon: 'verified_user', key: 'navApplications' }] },
    {
      titleKey: 'navAdministration',
      items: [
        { link: '/app/institute/settings', icon: 'domain', key: 'navInstituteDetails' },
        { link: '/app/institute/teachers', icon: 'people', key: 'navTeachersStaff' },
        { link: '/app/institute/stream-subjects', icon: 'category', key: 'navStreamSubjects' },
        { link: '/app/institute/exam-capacity', icon: 'grid_view', key: 'navExamCapacity' }
      ]
    }
  ],
  STUDENT: [
    {
      titleKey: 'navMyStudies',
      items: [
        { link: '/app/student/profile', icon: 'account_box', key: 'navRegistration' },
        { link: '/app/student/applications', icon: 'assignment', key: 'navExamForms' },
        { link: '/app/student/payments', icon: 'payments', key: 'navMyPayments' }
      ]
    }
  ]
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatIconModule, MatButtonModule, MatTooltipModule, LanguageSwitcherComponent],
  template: `
    <mat-sidenav-container
      class="shell"
      [class.is-compact]="isCompact()"
      [class.is-hidden]="desktopSidebarHidden() && !isMobile()"
      autosize>
      <mat-sidenav
        class="sidenav"
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="isMobile() ? opened() : !desktopSidebarHidden()"
        (closedStart)="opened.set(false)">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">HSC</div>
          <div class="brand-text">
            <div class="brand-title">{{ i18n.t('appTitle') }}</div>
            <div class="brand-sub">{{ i18n.t('appSubtitle') }}</div>
          </div>
          @if (isMobile()) {
            <button mat-icon-button type="button" class="brand-btn" (click)="closeOnMobile()" [attr.aria-label]="i18n.t('close')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <nav class="nav" [attr.aria-label]="centerTitle()">
          <a class="nav-item" routerLink="/app/dashboard" routerLinkActive="active" (click)="closeOnMobile()"
             [matTooltip]="isCompact() ? i18n.t('navDashboard') : ''" matTooltipPosition="right">
            <mat-icon>space_dashboard</mat-icon><span class="label">{{ i18n.t('navDashboard') }}</span>
          </a>

          @for (section of sections(); track $index) {
            @if (section.titleKey) {
              <div class="nav-section">{{ i18n.t(section.titleKey) }}</div>
            }
            @for (item of section.items; track item.link) {
              <a class="nav-item" [routerLink]="item.link" routerLinkActive="active" (click)="closeOnMobile()"
                 [matTooltip]="isCompact() ? i18n.t(item.key) : ''" matTooltipPosition="right">
                <mat-icon>{{ item.icon }}</mat-icon><span class="label">{{ i18n.t(item.key) }}</span>
              </a>
            }
          }
        </nav>

        <div class="nav-footer">
          <a class="nav-item" routerLink="/app/profile" routerLinkActive="active" (click)="closeOnMobile()"
             [matTooltip]="isCompact() ? i18n.t('navAccountSettings') : ''" matTooltipPosition="right">
            <mat-icon>settings</mat-icon><span class="label">{{ i18n.t('navAccountSettings') }}</span>
          </a>
          @if (!isMobile()) {
            <button type="button" class="nav-item collapse-btn" (click)="toggleCompactSidebar()"
                    [attr.aria-label]="sidebarCompact() ? i18n.t('expandSidebar') : i18n.t('collapseSidebar')"
                    [matTooltip]="isCompact() ? i18n.t('expandSidebar') : ''" matTooltipPosition="right">
              <mat-icon>{{ sidebarCompact() ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left' }}</mat-icon>
              <span class="label">{{ i18n.t('collapseSidebar') }}</span>
            </button>
          }
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main">
        <header class="topbar">
          @if (isMobile()) {
            <button mat-icon-button type="button" class="icon-btn" (click)="toggle()" [attr.aria-label]="i18n.t('openMenu')">
              <mat-icon>menu</mat-icon>
            </button>
          } @else {
            <button mat-icon-button type="button" class="icon-btn" (click)="toggleDesktopSidebar()"
                    [attr.aria-label]="desktopSidebarHidden() ? i18n.t('expandSidebar') : i18n.t('collapseSidebar')">
              <mat-icon>{{ desktopSidebarHidden() ? 'menu' : 'menu_open' }}</mat-icon>
            </button>
          }

          <div class="page-context">
            <div class="context-title">{{ centerTitle() }}</div>
            @if (!isMobile() && role() === 'INSTITUTE' && instituteName()) {
              <div class="context-sub">{{ i18n.t('portalInstitute') }}</div>
            }
          </div>

          <div class="topbar-actions">
            <app-language-switcher [compact]="isMobile()" />
            <div class="user-chip" [attr.title]="username()">
              <div class="avatar" aria-hidden="true">{{ initials() }}</div>
              @if (!isMobile()) {
                <div class="user-meta">
                  <div class="user-name">{{ username() }}</div>
                  <div class="user-role">{{ roleLabel() }}</div>
                </div>
              }
            </div>
            <button mat-icon-button type="button" class="icon-btn" (click)="logout()" [attr.aria-label]="i18n.t('logout')" [matTooltip]="i18n.t('logout')">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </header>

        <main class="content" [class.student-content]="role() === 'STUDENT'"><router-outlet /></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .shell { height: 100vh; background: var(--hsc-bg); }

    /* ── Sidebar ─────────────────────────────── */
    .sidenav {
      width: 264px;
      border-right: 1px solid var(--hsc-border) !important;
      background: var(--hsc-surface);
      transition: width 0.2s ease;
    }
    .sidenav ::ng-deep .mat-drawer-inner-container { display: flex; flex-direction: column; overflow-x: hidden; }
    .shell.is-compact .sidenav { width: 76px; }
    .shell.is-hidden .sidenav { width: 0; border-right: 0 !important; }

    ::ng-deep .shell .mat-drawer.mat-drawer-side { z-index: 1; }
    ::ng-deep .shell .mat-drawer.mat-drawer-over { z-index: 5 !important; }
    ::ng-deep .shell .mat-drawer-backdrop { z-index: 4 !important; }

    .brand {
      display: flex; align-items: center; gap: 12px;
      height: 64px; padding: 0 16px;
      border-bottom: 1px solid var(--hsc-border);
      position: relative; flex: 0 0 auto;
    }
    .brand::after {
      /* thin saffron rule, a nod to the state board identity */
      content: ''; position: absolute; left: 16px; width: 56px; bottom: -1px; height: 2px;
      background: var(--hsc-saffron); border-radius: 2px;
    }
    .brand-mark {
      flex: 0 0 38px; height: 38px; border-radius: 10px;
      background: var(--hsc-navy); color: #fff;
      display: grid; place-items: center;
      font-weight: 800; font-size: 0.74rem; letter-spacing: 0.04em;
    }
    .brand-text { min-width: 0; flex: 1; }
    .brand-title { font-weight: 700; font-size: 0.96rem; color: var(--hsc-text); line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-sub { font-size: 0.74rem; color: var(--hsc-text-subtle); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-btn { color: var(--hsc-text-muted); }
    .shell.is-compact .brand { justify-content: center; padding-inline: 8px; }
    .shell.is-compact .brand-text, .shell.is-compact .brand::after { display: none; }

    .nav { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav > *, .nav-footer > * { flex-shrink: 0; }
    .nav-section {
      margin: 14px 10px 6px;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--hsc-text-subtle);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    :host-context(html[lang='mr']) .nav-section, :host-context(html[lang='hi']) .nav-section { letter-spacing: 0; font-size: 0.76rem; }
    .shell.is-compact .nav-section { height: 1px; margin: 10px 8px; background: var(--hsc-border); font-size: 0; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      min-height: 40px; padding: 8px 12px; border-radius: 8px;
      color: var(--hsc-text-muted); text-decoration: none;
      font-size: 0.92rem; font-weight: 500;
      position: relative; white-space: nowrap;
      border: 0; background: transparent; width: 100%; text-align: left; font-family: inherit; cursor: pointer;
    }
    .nav-item mat-icon { flex: 0 0 22px; width: 22px; height: 22px; font-size: 22px; color: #7c8aa0; }
    .nav-item .label { overflow: hidden; text-overflow: ellipsis; }
    .nav-item:hover { background: var(--hsc-surface-muted); color: var(--hsc-text); }
    .nav-item:focus-visible { outline: 2px solid var(--hsc-primary); outline-offset: -2px; }
    .nav-item.active { background: var(--hsc-primary-soft); color: var(--hsc-primary); font-weight: 600; }
    .nav-item.active mat-icon { color: var(--hsc-primary); }
    .nav-item.active::before {
      content: ''; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px;
      border-radius: 0 3px 3px 0; background: var(--hsc-primary);
    }
    .shell.is-compact .nav-item { justify-content: center; padding: 8px; }
    .shell.is-compact .nav-item .label { display: none; }

    .nav-footer { border-top: 1px solid var(--hsc-border); padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 2px; }
    .collapse-btn { color: var(--hsc-text-subtle); }

    /* ── Top bar ─────────────────────────────── */
    .main { display: flex; flex-direction: column; background: var(--hsc-bg); }
    .topbar {
      position: sticky; top: 0; z-index: 40;
      height: 64px; flex: 0 0 64px;
      display: flex; align-items: center; gap: 12px;
      padding: 0 20px 0 12px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: saturate(1.4) blur(8px);
      border-bottom: 1px solid var(--hsc-border);
    }
    .icon-btn { color: var(--hsc-text-muted); }
    .page-context { flex: 1; min-width: 0; line-height: 1.25; }
    .context-title { font-size: 1.02rem; font-weight: 700; color: var(--hsc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .context-sub { font-size: 0.75rem; color: var(--hsc-text-subtle); }
    .topbar-actions { display: flex; align-items: center; gap: 12px; }

    .user-chip { display: flex; align-items: center; gap: 10px; padding: 4px 12px 4px 4px; border-radius: 999px; border: 1px solid var(--hsc-border); background: var(--hsc-surface); max-width: 240px; }
    .avatar { flex: 0 0 32px; width: 32px; height: 32px; border-radius: 50%; background: var(--hsc-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 0.78rem; }
    .user-meta { min-width: 0; line-height: 1.2; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: var(--hsc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.72rem; color: var(--hsc-text-subtle); white-space: nowrap; }

    .content { flex: 1; padding: 20px 24px 32px; width: 100%; box-sizing: border-box; }
    ::ng-deep .content > * { display: block; width: 100%; max-width: 100%; }

    /* Keep page-level modal overlays above the shell */
    .shell ::ng-deep .app-modal-backdrop,
    .shell ::ng-deep .modal-backdrop,
    .shell ::ng-deep .picker-overlay,
    .shell ::ng-deep .instructions-popup-backdrop { z-index: 1300 !important; }

    @media (max-width: 960px) {
      .sidenav { width: min(85vw, 300px); }
      .topbar { height: 56px; flex-basis: 56px; padding: 0 8px 0 4px; gap: 6px; }
      .topbar-actions { gap: 4px; }
      .user-chip { padding: 2px; border: 0; background: transparent; }
      .context-title { font-size: 0.95rem; }
      .content { padding: 8px 0 16px; }
      .student-content { padding-top: 0; }
      .student-content { padding-bottom: 82px; }
    }
    @media (max-width: 420px) {
      .user-chip { display: none; }
    }
  `]
})
export class AppShellComponent {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 960 : false);
  readonly opened = signal(typeof window !== 'undefined' ? window.innerWidth > 960 : true);
  readonly sidebarCompact = signal(false);
  readonly desktopSidebarHidden = signal(false);
  readonly isCompact = computed(() => this.sidebarCompact() && !this.isMobile());

  readonly role = computed(() => this.auth.user()?.role ?? null);
  readonly username = computed(() => this.auth.user()?.username ?? '');
  readonly sections = computed<NavSection[]>(() => NAV[this.role() ?? ''] ?? []);
  readonly instituteName = signal<string>('');
  readonly initials = computed(() => {
    const parts = this.username().replace(/[._@-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  });
  readonly roleLabel = computed(() => {
    this.i18n.language();
    return this.role() ? this.i18n.t('role' + this.role()) : '';
  });
  readonly centerTitle = computed(() => {
    this.i18n.language(); // re-evaluate when the language changes
    switch (this.role()) {
      case 'INSTITUTE': return this.instituteName() || this.i18n.t('portalInstitute');
      case 'BOARD': return this.i18n.t('portalBoard');
      case 'SUPER_ADMIN': return this.i18n.t('portalSystem');
      case 'STUDENT': return this.i18n.t('portalStudent');
      default: return this.i18n.t('portalDefault');
    }
  });

  constructor() {
    this.syncMobile(true);
    window.addEventListener('resize', () => this.syncMobile(false));
    this.loadProfile();
  }

  /** Reset drawer state only when crossing the mobile breakpoint. */
  private syncMobile(initial: boolean) {
    const mobile = window.matchMedia('(max-width: 960px)').matches;
    if (!initial && mobile === this.isMobile()) return;
    this.isMobile.set(mobile);
    this.opened.set(!mobile);
    if (mobile) {
      this.sidebarCompact.set(false);
      this.desktopSidebarHidden.set(false);
    }
  }

  private loadProfile() {
    this.http.get<{ user?: any }>(`${API_BASE_URL}/me`).subscribe({
      next: (res) => {
        if (res.user?.institute?.name) this.instituteName.set(res.user.institute.name);
        this.i18n.applyUserPreference(res.user);
      },
      error: () => this.instituteName.set('')
    });
  }

  toggle() {
    this.opened.set(!this.opened());
  }

  toggleCompactSidebar() {
    if (this.isMobile()) return;
    this.sidebarCompact.set(!this.sidebarCompact());
  }

  toggleDesktopSidebar() {
    if (this.isMobile()) return;
    const hidden = !this.desktopSidebarHidden();
    this.desktopSidebarHidden.set(hidden);
    if (hidden) this.sidebarCompact.set(false);
  }

  closeOnMobile() {
    if (this.isMobile()) this.opened.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
