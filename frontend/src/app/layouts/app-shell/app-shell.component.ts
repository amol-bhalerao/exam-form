import { Component, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <mat-sidenav-container class="container" autosize>
      <mat-sidenav 
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'" 
        [opened]="opened()" 
        class="sidenav" 
        (closedStart)="opened.set(false)">
        <div class="sidebar-header">
          <div class="logo-container">
            <div class="logo-badge">📚</div>
            <div class="logo-text">
              <div class="logo-main">HSC Forms</div>
              <div class="logo-sub">Management</div>
            </div>
          </div>
        </div>

        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/app/dashboard" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()">
            <mat-icon class="icon">dashboard</mat-icon>
            <span class="label">Dashboard</span>
            <span class="icon-badge">🏠</span>
          </a>

          @if (role() === 'SUPER_ADMIN') {
            <div class="section-header">
              <span>System Management</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/super/institutes" routerLinkActive="active" class="nav-item"><mat-icon class="icon">apartment</mat-icon><span class="label">Institutes</span></a>
            <a mat-list-item routerLink="/app/super/institute-users" routerLinkActive="active" class="nav-item"><mat-icon class="icon">person_add</mat-icon><span class="label">Institute Users</span></a>
            <a mat-list-item routerLink="/app/super/users" routerLinkActive="active" class="nav-item"><mat-icon class="icon">admin_panel_settings</mat-icon><span class="label">Board Users</span></a>
            <a mat-list-item routerLink="/app/super/masters" routerLinkActive="active" class="nav-item"><mat-icon class="icon">tune</mat-icon><span class="label">Master Data</span></a>
          }

          @if (role() === 'BOARD') {
            <div class="section-header">
              <span>Content Management</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/board/exams" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">event</mat-icon><span class="label">Exams</span></a>
            <a mat-list-item routerLink="/app/board/applications" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">description</mat-icon><span class="label">Applications</span></a>
            <a mat-list-item routerLink="/app/board/news" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">feed</mat-icon><span class="label">News</span></a>

            <div class="section-header">
              <span>Academic</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/board/teachers" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">groups</mat-icon><span class="label">Teachers</span></a>
            <a mat-list-item routerLink="/app/board/subjects" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">auto_stories</mat-icon><span class="label">Subjects</span></a>
            <a mat-list-item routerLink="/app/board/streams" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">branch</mat-icon><span class="label">Streams</span></a>
          }

          @if (role() === 'INSTITUTE') {
            <div class="section-header">
              <span>Student Management</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/institute/applications" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">verified_user</mat-icon><span class="label">Applications</span></a>

            <div class="section-header">
              <span>Administration</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/institute/settings" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">domain</mat-icon><span class="label">Institute Details</span></a>
            <a mat-list-item routerLink="/app/institute/teachers" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">people</mat-icon><span class="label">Teachers & Staff</span></a>
            <a mat-list-item routerLink="/app/institute/stream-subjects" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">category</mat-icon><span class="label">Stream Subjects</span></a>
          }

          @if (role() === 'STUDENT') {
            <div class="section-header">
              <span>My Studies</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/student/profile" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">account_box</mat-icon><span class="label">My Profile</span></a>
            <a mat-list-item routerLink="/app/student/applications" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">assignment</mat-icon><span class="label">My Applications</span></a>
            <a mat-list-item routerLink="/app/student/exam-schedule" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">schedule</mat-icon><span class="label">Exam Schedule</span></a>
          }

          <div class="nav-divider"></div>
          <a mat-list-item routerLink="/app/profile" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">settings</mat-icon><span class="label">Account Settings</span></a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          <button mat-icon-button (click)="toggle()" aria-label="Toggle menu" class="menu-toggle"><mat-icon>menu</mat-icon></button>
          <span class="center-title">{{ centerTitle() }}</span>
          <span class="spacer"></span>
          <div class="user-info">
            <div class="user-avatar">{{ username()?.[0]?.toUpperCase() }}</div>
            <div class="user-details">
              <div class="user-name">{{ username() }}</div>
              <div class="user-role">{{ role() }}</div>
            </div>
          </div>
          <button mat-icon-button (click)="logout()" aria-label="Logout" class="logout-btn"><mat-icon>logout</mat-icon></button>
        </mat-toolbar>

        <div class="content"><router-outlet /></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host {
        --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        --secondary-gradient: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        --sidebar-bg: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        --sidebar-hover: rgba(99, 102, 241, 0.15);
        --sidebar-active: rgba(99, 102, 241, 0.25);
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --accent-color: #6366f1;
        --accent-light: #a5b4fc;
        --border-color: rgba(255, 255, 255, 0.08);
        --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        --smooth-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: block;
        width: 100%;
        height: 100%;
      }

      .container {
        height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #0f172a 100%);
        display: flex;
        overflow: hidden;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      /* Ensure sidenav-content takes full available width */
      ::ng-deep mat-sidenav-content {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        margin: 0 !important;
        margin-left: 0 !important;
        padding: 0 !important;
        width: auto !important;
        overflow: hidden !important;
      }

      /* ===== SIDEBAR STYLES ===== */
      .sidenav {
        width: 280px;
        background: var(--sidebar-bg);
        border-right: 1px solid var(--border-color);
        box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.05), var(--card-shadow);
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
      }

      .sidenav::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
      }

      /* Sidebar Header / Logo */
      .sidebar-header {
        padding: 24px 16px;
        border-bottom: 1px solid var(--border-color);
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        position: sticky;
        top: 0;
        z-index: 10;
        animation: slideDown 0.5s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: var(--smooth-transition);
        padding: 8px;
        border-radius: 10px;
      }

      .logo-container:hover {
        background: rgba(99, 102, 241, 0.1);
        transform: translateX(2px);
      }

      .logo-badge {
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: var(--primary-gradient);
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        animation: bounce 0.6s ease;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      .logo-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .logo-main {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.5px;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .logo-sub {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--accent-light);
        opacity: 0.8;
      }

      /* Navigation List */
      .nav-list {
        padding: 12px 0;
        margin: 0;
      }

      /* Section Headers */
      .section-header {
        padding: 16px 16px 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: var(--accent-light);
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        animation: fadeInLeft 0.4s ease;
      }

      @keyframes fadeInLeft {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .section-indicator {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
        border-radius: 2px;
      }

      /* Navigation Items */
      .nav-item {
        border-radius: 12px;
        margin: 4px 8px;
        padding: 12px 16px !important;
        transition: var(--smooth-transition);
        color: var(--text-secondary);
        position: relative;
        overflow: hidden;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        height: 44px;
        cursor: pointer;
        background: transparent;
      }

      /* Background Glow Effect */
      .nav-item::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--sidebar-hover);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1;
        border-radius: 12px;
      }

      .nav-item:hover::before {
        opacity: 1;
      }

      /* Left Accent Bar on Hover */
      .nav-item::after {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0%;
        background: var(--primary-gradient);
        border-radius: 0 4px 4px 0;
        transition: height 0.3s ease, box-shadow 0.3s ease;
        z-index: 2;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0);
      }

      .nav-item:hover::after {
        height: 60%;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
      }

      .nav-item:hover {
        color: var(--text-primary);
        transform: translateX(2px);
      }

      /* Active State */
      .nav-item.active {
        background: var(--sidebar-active);
        color: var(--accent-light);
        font-weight: 600;
        box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.2);
      }

      .nav-item.active::after {
        height: 80%;
        box-shadow: 0 0 16px rgba(99, 102, 241, 0.8);
      }

      .nav-item.active .icon {
        color: #a5b4fc;
        filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
      }

      /* Icon Styling */
      .icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        transition: var(--smooth-transition);
        z-index: 2;
        flex-shrink: 0;
        font-size: 20px !important;
      }

      .nav-item:hover .icon {
        color: var(--accent-light);
        transform: scale(1.15) rotate(5deg);
        filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.4));
      }

      .nav-item.active .icon {
        animation: iconPulse 0.6s ease;
      }

      @keyframes iconPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      /* Label Styling */
      .label {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.2px;
        z-index: 2;
        flex: 1;
        transition: var(--smooth-transition);
      }

      /* Icon Badge Styling */
      .icon-badge {
        opacity: 0;
        transform: scale(0);
        transition: var(--smooth-transition);
        z-index: 2;
        font-size: 16px;
      }

      .nav-item:hover .icon-badge {
        opacity: 1;
        transform: scale(1);
      }

      /* Navigation Divider */
      .nav-divider {
        height: 1px !important;
        background: linear-gradient(90deg, transparent, var(--border-color), transparent);
        margin: 12px 0 !important;
        padding: 0 !important;
        cursor: default !important;
        pointer-events: none;
      }

      /* Scrollbar Styling */
      .sidenav::-webkit-scrollbar {
        width: 8px;
      }

      .sidenav::-webkit-scrollbar-track {
        background: transparent;
      }

      .sidenav::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4));
        border-radius: 4px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      .sidenav::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.6));
        background-clip: padding-box;
      }

      /* ===== TOOLBAR STYLES ===== */
      .toolbar {
        height: 72px;
        padding: 0 28px;
        background: linear-gradient(90deg, #0f172a 0%, #1a1f35 50%, #0f172a 100%);
        border-bottom: 1px solid var(--border-color);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 20px;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .toolbar::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
      }

      .menu-toggle {
        color: var(--accent-light);
        transition: var(--smooth-transition);
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
      }

      .menu-toggle:hover {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-color);
        transform: rotate(90deg);
        box-shadow: inset 0 0 15px rgba(99, 102, 241, 0.2);
      }

      .menu-toggle mat-icon {
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }

      .center-title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: var(--text-primary);
        flex-shrink: 0;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: slideInDown 0.5s ease;
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .spacer {
        flex: 1;
      }

      /* User Info Section */
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 14px;
        background: rgba(99, 102, 241, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(99, 102, 241, 0.2);
        transition: var(--smooth-transition);
        cursor: pointer;
        min-width: 220px;
      }

      .user-info:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        transform: translateY(-2px);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--primary-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        flex-shrink: 0;
        animation: popIn 0.4s ease;
      }

      @keyframes popIn {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      .user-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--accent-light);
        opacity: 0.8;
      }

      .logout-btn {
        color: #ef4444;
        transition: var(--smooth-transition);
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #ff6b6b;
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
      }

      .logout-btn mat-icon {
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }

      /* ===== CONTENT AREA ===== */
      .content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 32px;
        background: linear-gradient(135deg, #0f172a 0%, #1a1f35 100%);
        width: 100%;
      }

      .content::-webkit-scrollbar {
        width: 8px;
      }

      .content::-webkit-scrollbar-track {
        background: transparent;
      }

      .content::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
        border-radius: 4px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      .content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5));
        background-clip: padding-box;
      }

      /* ===== RESPONSIVE DESIGN ===== */
      @media (max-width: 1024px) {
        .sidenav { width: 260px; }
        .center-title { font-size: 16px; }
        .user-details { display: none; }
        .toolbar { padding: 0 20px; }
      }

      @media (max-width: 768px) {
        .sidenav { width: 100%; }
        .center-title { display: none; }
        .user-info { min-width: auto; }
        .content { padding: 20px; }
        .toolbar { height: 64px; padding: 0 16px; }
      }

      @media (max-width: 600px) {
        .logo-main { font-size: 14px; }
        .label { font-size: 12px; }
        .icon-badge { font-size: 14px; }
        .content { padding: 16px; }
      }

      /* ===== MATERIAL DESIGN OVERRIDES ===== */
      /* Override Material's default mat-list-item styling in sidebar */
      ::ng-deep .sidenav .mat-mdc-list-item {
        color: var(--text-secondary) !important;
        background: transparent !important;
      }

      ::ng-deep .sidenav .mat-mdc-list-item .mdc-list-item__content {
        color: inherit !important;
      }

      ::ng-deep .sidenav .mat-mdc-list-item:hover {
        background: var(--sidebar-hover) !important;
        color: var(--text-primary) !important;
      }

      ::ng-deep .sidenav .mat-mdc-list-item.active {
        background: var(--sidebar-active) !important;
        color: var(--accent-light) !important;
      }

      /* Ensure mat-icon in sidebar uses proper colors */
      ::ng-deep .sidenav .mat-icon {
        color: inherit !important;
      }

      /* Override Material's focus/ripple colors */
      ::ng-deep .sidenav .mat-mdc-list-item::before {
        background-color: var(--sidebar-hover) !important;
      }
    `
  ]
})
export class AppShellComponent {
  readonly opened = signal(true);
  readonly isMobile = signal(window.innerWidth <= 960); // Detect mobile on init

  readonly role = computed(() => this.auth.user()?.role ?? null);
  readonly username = computed(() => this.auth.user()?.username ?? '');
  readonly instituteName = signal<string>('');
  readonly centerTitle = computed(() => {
    if (this.role() === 'INSTITUTE') return this.instituteName() || 'Institute Portal';
    if (this.role() === 'BOARD') return 'Board Portal';
    if (this.role() === 'SUPER_ADMIN') return 'Super Admin Portal';
    if (this.role() === 'STUDENT') return 'Student Portal';
    return 'HSC Exam System';
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    this.syncMobile(); // Enable responsive detection
    window.addEventListener('resize', () => this.syncMobile());
    this.loadProfile();
  }

  private syncMobile() {
    const mobile = window.matchMedia('(max-width: 960px)').matches;
    this.isMobile.set(mobile);
    if (!mobile) this.opened.set(true);
  }

  private loadProfile() {
    this.http.get<{ user?: any }>(`${API_BASE_URL}/me`).subscribe({
      next: (res) => {
        if (res.user?.institute?.name) {
          this.instituteName.set(res.user.institute.name);
        }
      },
      error: () => {
        this.instituteName.set('');
      }
    });
  }

  toggle() {
    this.opened.set(!this.opened());
  }

  closeOnMobile() {
    if (this.isMobile()) this.opened.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

