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
  `
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

