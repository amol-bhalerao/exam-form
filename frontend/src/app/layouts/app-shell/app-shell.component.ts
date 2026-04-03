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
            <a mat-list-item routerLink="/app/super/health" routerLinkActive="active" class="nav-item"><mat-icon class="icon">health_and_safety</mat-icon><span class="label">Health Monitor</span></a>
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
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .container {
      height: 100vh;
      display: flex;
    }

    .sidenav {
      width: 280px;
      background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
      border-right: 1px solid #e0e0e0;
    }

    @media (max-width: 960px) {
      .sidenav {
        width: 85vw !important;
        max-width: 320px;
      }
    }

    @media (max-width: 480px) {
      .sidenav {
        width: 100vw !important;
        max-width: none;
      }
    }

    .sidebar-header {
      padding: 1.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 480px) {
      .sidebar-header {
        padding: 1rem;
      }
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      font-size: 28px;
      flex-shrink: 0;
    }

    .logo-text {
      flex: 1;
    }

    .logo-main {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .logo-sub {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .nav-list {
      padding: 0.5rem 0;
      flex: 1;
    }

    .section-header {
      padding: 1rem 1.5rem 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 0.5rem;
    }

    .section-indicator {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, #667eea, transparent);
    }

    .nav-item {
      margin: 0.25rem 0.5rem;
      border-radius: 8px;
      position: relative;
      transition: all 0.2s ease;
      color: #333;
      font-size: 0.95rem;
      height: auto;
      min-height: 44px;
      padding: 0 1rem !important;
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: visible;
    }

    .nav-item:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%);
      color: #667eea;
      font-weight: 600;
      border-right: 3px solid #667eea;
    }

    .nav-item .icon {
      flex-shrink: 0;
      font-size: 24px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item .label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .icon-badge {
      display: none;
      font-size: 1rem;
    }

    @media (max-width: 960px) {
      .nav-item {
        font-size: 0.9rem;
        padding: 0 0.75rem !important;
      }

      .nav-item .label {
        display: inline;
      }
    }

    .nav-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 0.5rem 1rem;
    }

    .toolbar {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0 1rem;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 480px) {
      .toolbar {
        padding: 0 0.5rem;
        height: 56px;
      }
    }

    .menu-toggle {
      display: none;
      color: white;
    }

    @media (max-width: 960px) {
      .menu-toggle {
        display: block;
      }
    }

    .center-title {
      font-size: 1.1rem;
      font-weight: 600;
      flex: 1;
      text-align: center;
    }

    @media (max-width: 600px) {
      .center-title {
        font-size: 0.95rem;
      }
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 600px) {
      .user-info {
        gap: 8px;
        padding: 0.5rem 0.75rem;
      }
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    @media (max-width: 600px) {
      .user-details {
        display: none;
      }
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.75rem;
      opacity: 0.8;
      white-space: nowrap;
    }

    .logout-btn {
      color: white;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
    }

    /* Ensure mat-list items are properly styled */
    ::ng-deep .mat-mdc-list-item {
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-list-item-title {
      overflow: visible !important;
    }
  `]
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

