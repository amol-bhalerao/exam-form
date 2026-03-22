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
    <mat-sidenav-container class="container">
      <mat-sidenav [mode]="isMobile() ? 'over' : 'side'" [opened]="isMobile() ? opened() : true" class="sidenav" (closedStart)="opened.set(false)">
        <div class="logo">HSC Exam Forms</div>

        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>dashboard</mat-icon><span>Dashboard</span></a>

          @if (role() === 'SUPER_ADMIN') {
            <a mat-list-item routerLink="/super/institutes" routerLinkActive="mat-list-item-active"><mat-icon>school</mat-icon><span>Institutes</span></a>
            <a mat-list-item routerLink="/super/institute-users" routerLinkActive="mat-list-item-active"><mat-icon>person</mat-icon><span>Institute Users</span></a>
            <a mat-list-item routerLink="/super/users" routerLinkActive="mat-list-item-active"><mat-icon>admin_panel_settings</mat-icon><span>Board Users</span></a>
            <a mat-list-item routerLink="/super/masters" routerLinkActive="mat-list-item-active"><mat-icon>settings</mat-icon><span>Master Data</span></a>
          }

          @if (role() === 'BOARD') {
            <a mat-list-item routerLink="/board/exams" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>calendar_month</mat-icon><span>Exams</span></a>
            <a mat-list-item routerLink="/board/applications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>assignment</mat-icon><span>Applications</span></a>
            <a mat-list-item routerLink="/board/teachers" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>people</mat-icon><span>Teachers</span></a>
            <a mat-list-item routerLink="/board/subjects" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>subject</mat-icon><span>Subjects</span></a>
            <a mat-list-item routerLink="/board/streams" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>account_tree</mat-icon><span>Streams</span></a>
          }

          @if (role() === 'INSTITUTE') {
            <a mat-list-item routerLink="/institute/applications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>fact_check</mat-icon><span>Student Applications</span></a>
            <a mat-list-item routerLink="/institute/settings" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>corporate_fare</mat-icon><span>Institute Details</span></a>
            <a mat-list-item routerLink="/institute/teachers" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>people</mat-icon><span>Teachers</span></a>
            <a mat-list-item routerLink="/institute/stream-subjects" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>view_list</mat-icon><span>Stream Subjects</span></a>
          }

          @if (role() === 'STUDENT') {
            <a mat-list-item routerLink="/student/applications" routerLinkActive="mat-list-item-active"><mat-icon>assignment_ind</mat-icon><span>My Applications</span></a>
          }
<a mat-list-item routerLink="/profile" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>person</mat-icon><span>My Profile</span></a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="toggle()" aria-label="Toggle menu"><mat-icon>menu</mat-icon></button>
          <span class="center-title">{{ centerTitle() }}</span>
          <span class="spacer"></span>
          <div class="who">
            <div class="u">{{ username() }}</div>
            <div class="r">{{ role() }}</div>
          </div>
          <button mat-icon-button (click)="logout()" aria-label="Logout"><mat-icon>logout</mat-icon></button>
        </mat-toolbar>

        <div class="content"><router-outlet /></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .container {
        height: 100vh;
        background: #f3f4ff;
      }
      .sidenav {
        width: 260px;
        border-right: 0;
        // background: linear-gradient(180deg, #111827 0%, #1f2937 100%);
        // color: #e2e8f0;
      }
      .logo {
        padding: 18px 16px;
        font-weight: 800;
        letter-spacing: 0.2px;
        font-size: 1.05rem;
        // color: #f3f4ff;
      }
      .mat-nav-list {
        padding-top: 0;
      }
      .mat-list-item {
        border-radius: 8px;
        margin: 4px 8px;
        color: #e2e8f0;
        padding: 8px 10px;
      }
      .mat-list-item .mat-list-item-content {
        color: #e2e8f0;
      }
      .mat-list-item:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
      .mat-list-item.mat-list-item-active {
        background: #2563eb;
        color: #fff;
      }
      .mat-list-item.mat-list-item-active mat-icon {
        color: #fff;
      }
      .mat-list-item mat-icon {
        margin-right: 10px;
        width: 24px;
        text-align: center;
        color: #dbeafe;
      }
      .mat-list-item span {
        line-height: 1.2;
        color: #f8fafc;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: linear-gradient(90deg, #1f2937 0%, #111827 70%, #0f172a 100%);
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .center-title {
        margin-left: 12px;
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 0.95rem;
      }
      .toolbar button {
        color: #fff;
      }
      .content {
        padding: 20px;
        min-height: calc(100vh - 64px);
        background: #f3f4ff;
      }
      .spacer { flex: 1; }
      .who {
        text-align: right;
        margin-right: 8px;
        line-height: 1.1;
        color: #f3f4ff;
      }
      .u { font-size: 13px; font-weight: 600; }
      .r { font-size: 11px; opacity: 0.9; color: #dbeafe; }
      @media (max-width: 960px) {
        .sidenav { width: 280px; }
      }
    `
  ]
})
export class AppShellComponent {
  readonly opened = signal(true);
  readonly isMobile = signal(false); // Temporarily disable mobile detection

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
    // this.syncMobile(); // Temporarily disabled
    // window.addEventListener('resize', () => this.syncMobile());
    this.loadProfile();
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

  // private syncMobile() {
  //   const mobile = window.matchMedia('(max-width: 960px)').matches;
  //   this.isMobile.set(mobile);
  //   if (!mobile) this.opened.set(true);
  // }

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

