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
        <div class="logo">HSC Exam Forms</div>

        <mat-nav-list>
          <a mat-list-item routerLink="/app/dashboard" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>dashboard</mat-icon><span>Dashboard</span></a>

          @if (role() === 'SUPER_ADMIN') {
            <!-- Core Management -->
            <mat-list-item class="menu-label">System Management</mat-list-item>
            <a mat-list-item routerLink="/app/super/institutes" routerLinkActive="mat-list-item-active"><mat-icon>school</mat-icon><span>Institutes</span></a>
            <a mat-list-item routerLink="/app/super/institute-users" routerLinkActive="mat-list-item-active"><mat-icon>person</mat-icon><span>Institute Users</span></a>
            <a mat-list-item routerLink="/app/super/users" routerLinkActive="mat-list-item-active"><mat-icon>admin_panel_settings</mat-icon><span>Board Users</span></a>
            <a mat-list-item routerLink="/app/super/masters" routerLinkActive="mat-list-item-active"><mat-icon>settings</mat-icon><span>Master Data</span></a>

            <!-- Analytics -->
            <mat-list-item class="menu-label">Advanced</mat-list-item>
            <a mat-list-item routerLink="/app/super/reports" routerLinkActive="mat-list-item-active"><mat-icon>bar_chart</mat-icon><span>System Reports</span></a>
            <a mat-list-item routerLink="/app/super/audit-logs" routerLinkActive="mat-list-item-active"><mat-icon>history</mat-icon><span>Audit Logs</span></a>
            <a mat-list-item routerLink="/app/super/health" routerLinkActive="mat-list-item-active"><mat-icon>health_and_safety</mat-icon><span>System Health</span></a>
          }

          @if (role() === 'BOARD') {
            <!-- Core Board Functions -->
            <mat-list-item class="menu-label">Content Management</mat-list-item>
            <a mat-list-item routerLink="/app/board/exams" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>calendar_month</mat-icon><span>Exams</span></a>
            <a mat-list-item routerLink="/app/board/applications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>assignment</mat-icon><span>Applications</span></a>
            <a mat-list-item routerLink="/app/board/news" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>newspaper</mat-icon><span>News</span></a>

            <!-- Academic -->
            <mat-list-item class="menu-label">Academic</mat-list-item>
            <a mat-list-item routerLink="/app/board/teachers" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>people</mat-icon><span>Teachers</span></a>
            <a mat-list-item routerLink="/app/board/subjects" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>subject</mat-icon><span>Subjects</span></a>
            <a mat-list-item routerLink="/app/board/streams" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>account_tree</mat-icon><span>Streams</span></a>

            <!-- Analytics -->
            <mat-list-item class="menu-label">Analytics</mat-list-item>
            <a mat-list-item routerLink="/app/board/reports" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>analytics</mat-icon><span>Reports</span></a>
            <a mat-list-item routerLink="/app/board/statistics" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>assessment</mat-icon><span>Statistics</span></a>
          }

          @if (role() === 'INSTITUTE') {
            <!-- Student Management -->
            <mat-list-item class="menu-label">Student Management</mat-list-item>
            <a mat-list-item routerLink="/app/institute/applications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>fact_check</mat-icon><span>Student Applications</span></a>
            <a mat-list-item routerLink="/app/institute/students" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>group</mat-icon><span>All Students</span></a>

            <!-- Institute Management -->
            <mat-list-item class="menu-label">Administration</mat-list-item>
            <a mat-list-item routerLink="/app/institute/settings" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>corporate_fare</mat-icon><span>Institute Details</span></a>
            <a mat-list-item routerLink="/app/institute/teachers" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>people</mat-icon><span>Teachers & Staff</span></a>
            <a mat-list-item routerLink="/app/institute/stream-subjects" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>view_list</mat-icon><span>Stream Subjects</span></a>

            <!-- Reports -->
            <mat-list-item class="menu-label">Insights</mat-list-item>
            <a mat-list-item routerLink="/app/institute/reports" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>bar_chart</mat-icon><span>Institute Reports</span></a>
          }

          @if (role() === 'STUDENT') {
            <!-- Academics -->
            <mat-list-item class="menu-label">My Studies</mat-list-item>
            <a mat-list-item routerLink="/app/student/profile" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>person</mat-icon><span>My Profile</span></a>
            <a mat-list-item routerLink="/app/student/applications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>assignment_ind</mat-icon><span>My Applications</span></a>
            <a mat-list-item routerLink="/app/student/exam-schedule" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>calendar_today</mat-icon><span>Exam Schedule</span></a>

            <!-- Payment & Fees -->
            <mat-list-item class="menu-label">Payment</mat-list-item>
            <a mat-list-item routerLink="/app/student/fees" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>credit_card</mat-icon><span>Fees & Payments</span></a>
            <a mat-list-item routerLink="/app/student/payment-history" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>history</mat-icon><span>Payment History</span></a>

            <!-- Help Resources -->
            <mat-list-item class="menu-label">Resources</mat-list-item>
            <a mat-list-item routerLink="/app/student/notifications" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>notifications</mat-icon><span>Notifications</span></a>
            <a mat-list-item routerLink="/app/student/help" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>help</mat-icon><span>Help & Support</span></a>
          }

          <!-- Common items for all roles -->
          <mat-list-item class="menu-divider"></mat-list-item>
          <a mat-list-item routerLink="/app/profile" routerLinkActive="mat-list-item-active" (click)="closeOnMobile()"><mat-icon>account_circle</mat-icon><span>Account Settings</span></a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="toggle()" aria-label="Toggle menu"><mat-icon>menu</mat-icon></button>
          <span class="center-title">{{ centerTitle() }}</span>
          <span class="spacer"></span>
          <div class="who">
            <div class="u">{{ username() }}</div>
            <!-- <div class="r">{{ role() }}</div> -->
          </div>
          <button mat-icon-button (click)="logout()" aria-label="Logout"><mat-icon>logout</mat-icon></button>
        </mat-toolbar>

        <div class="content"><router-outlet /></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host {
        --sidebar-bg: #334264;
        --sidebar-hover: #1e293b;
        --sidebar-active: #2563eb;
        --sidebar-text: #f1f5f9;
        --sidebar-accent: #60a5fa;
        --card-radius: 12px;
        --card-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        --transition: all 0.2s ease;
      }

      .container {
        height: 100vh;
        background: linear-gradient(135deg, #f0f4f8 0%, #f8fafc 100%);
        display: flex;
      }

      mat-sidenav-container {
        height: 100%;
      }

      mat-sidenav-content {
        display: flex;
        flex-direction: column;
        width: 100% !important;
        height: 100% !important;
      }

      .sidenav {
        width: 260px;
        background: var(--sidebar-bg);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
      }

      .logo {
        padding: 20px 16px;
        font-weight: 800;
        letter-spacing: 0.5px;
        font-size: 1.1rem;
        color: #60a5fa;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideInLeft 0.4s ease;
      }

      .mat-nav-list {
        padding-top: 12px;
        padding-bottom: 20px;
      }

      .mat-list-item {
        border-radius: 10px;
        margin: 6px 10px;
        padding: 10px 12px !important;
        transition: var(--transition);
        color: #e2e8f0;
        position: relative;
        overflow: hidden;
      }

      .mat-list-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background: var(--sidebar-active);
        transform: scaleY(0);
        transform-origin: top;
        transition: transform 0.3s ease;
      }

      .mat-list-item:hover {
        background: var(--sidebar-hover);
        color: #ffffff;
        transform: translateX(2px);
      }

      .mat-list-item.mat-list-item-active {
        background: rgba(37, 99, 235, 0.15);
        color: #60a5fa;
        font-weight: 600;
      }

      .mat-list-item.mat-list-item-active::before {
        transform: scaleY(1);
      }

      .mat-list-item mat-icon {
        margin-right: 12px;
        width: 20px;
        height: 20px;
        color: inherit;
        transition: var(--transition);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .mat-list-item:hover mat-icon {
        color: var(--sidebar-accent);
        transform: scale(1.1);
      }

      .mat-list-item span {
        font-size: 0.9rem;
        font-weight: 500;
        letter-spacing: 0.2px;
      }

      /* Menu section labels */
      .menu-label {
        padding: 12px 16px 6px 16px !important;
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        color: #93c5fd !important;
        opacity: 0.7;
        cursor: default !important;
        margin: 12px 0 6px 0 !important;
        pointer-events: none;
      }

      /* Menu divider -->
      .menu-divider {
        height: 1px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        margin: 12px 10px !important;
        padding: 0 !important;
        cursor: default !important;
        pointer-events: none;
      }

      .toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        color: #fff;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 24px;
        height: 64px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        flex-shrink: 0;
      }

      .toolbar button {
        color: #60a5fa;
        transition: var(--transition);
        padding: 8px;
        margin: 0 4px;
      }

      .toolbar button:hover {
        color: #93c5fd;
        background: rgba(96, 165, 250, 0.1);
        border-radius: 6px;
      }

      .center-title {
        margin-left: 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
        font-size: 0.95rem;
        color: #e2e8f0;
        flex-shrink: 0;
      }

      .content {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        background: linear-gradient(180deg, #f8fafc 0%, #eef2f5 100%);
        width: 100%;
        max-width: 100%;
      }

      .spacer {
        flex: 1;
      }

      .who {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        padding: 8px 12px;
        background: rgba(96, 165, 250, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(96, 165, 250, 0.2);
        min-width: 250px;
      }

      .u {
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
      }

      .r {
        font-size: 11px;
        opacity: 0.75;
        color: #93c5fd;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Animations */
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Scrollbar */
      .sidenav::-webkit-scrollbar {
        width: 6px;
      }
      .sidenav::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }
      .sidenav::-webkit-scrollbar-thumb {
        background: rgba(96, 165, 250, 0.4);
        border-radius: 3px;
      }
      .sidenav::-webkit-scrollbar-thumb:hover {
        background: rgba(96, 165, 250, 0.6);
      }

      /* Mobile */
      @media (max-width: 960px) {
        .sidenav { width: 280px; }
        .content { padding: 16px; }
      }

      @media (max-width: 600px) {
        .sidenav { width: 100%; }
        .center-title { display: none; }
        .who { font-size: 12px; }
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

