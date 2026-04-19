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
    <mat-sidenav-container
      class="container"
      [class.sidebar-compact]="sidebarCompact() && !isMobile()"
      [class.sidebar-hidden]="desktopSidebarHidden() && !isMobile()"
      autosize>
      <mat-sidenav 
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'" 
        [opened]="isMobile() ? opened() : !desktopSidebarHidden()" 
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
          @if (isMobile()) {
            <button mat-icon-button type="button" class="sidebar-close-btn" (click)="closeOnMobile()" aria-label="Close sidebar">
              <mat-icon>close</mat-icon>
            </button>
          } @else {
            <button mat-icon-button type="button" class="sidebar-control-btn" (click)="toggleCompactSidebar()" [attr.aria-label]="sidebarCompact() ? 'Expand sidebar' : 'Compact sidebar'">
              <mat-icon>{{ sidebarCompact() ? 'last_page' : 'first_page' }}</mat-icon>
            </button>
          }
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
            <a mat-list-item routerLink="/app/super/health" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">health_and_safety</mat-icon><span class="label">Health Monitor</span></a>
            <a mat-list-item routerLink="/app/super/payments" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">payments</mat-icon><span class="label">Payments Dashboard</span></a>
            <a mat-list-item routerLink="/app/super/institutes" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">apartment</mat-icon><span class="label">Institutes</span></a>
            <a mat-list-item routerLink="/app/super/institute-users" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">person_add</mat-icon><span class="label">Institute Users</span></a>
            <a mat-list-item routerLink="/app/super/users" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">admin_panel_settings</mat-icon><span class="label">Admin Users</span></a>
            <a mat-list-item routerLink="/app/super/masters" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">tune</mat-icon><span class="label">Master Data</span></a>
          }

          @if (role() === 'BOARD') {
            <div class="section-header">
              <span>Content Management</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/board/exams" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">event</mat-icon><span class="label">Exams</span></a>
            <a mat-list-item routerLink="/app/board/applications" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">description</mat-icon><span class="label">Applications</span></a>
            <a mat-list-item routerLink="/app/board/students" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">school</mat-icon><span class="label">Student Master</span></a>
            <a mat-list-item routerLink="/app/board/news" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">feed</mat-icon><span class="label">News</span></a>

            <div class="section-header">
              <span>Academic</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/board/teachers" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">groups</mat-icon><span class="label">Teachers</span></a>
            <a mat-list-item routerLink="/app/board/subjects" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">auto_stories</mat-icon><span class="label">Subjects</span></a>
            <a mat-list-item routerLink="/app/board/streams" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">branch</mat-icon><span class="label">Streams</span></a>
            <a mat-list-item routerLink="/app/board/payments" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">payments</mat-icon><span class="label">Payments</span></a>
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
            <a mat-list-item routerLink="/app/institute/exam-capacity" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">grid_view</mat-icon><span class="label">Exam Capacity</span></a>
            <a mat-list-item routerLink="/app/institute/teachers" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">people</mat-icon><span class="label">Teachers & Staff</span></a>
            <a mat-list-item routerLink="/app/institute/stream-subjects" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">category</mat-icon><span class="label">Stream Subjects</span></a>
          }

          @if (role() === 'STUDENT') {
            <div class="section-header">
              <span>My Studies</span>
              <div class="section-indicator"></div>
            </div>
            <a mat-list-item routerLink="/app/student/profile" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">account_box</mat-icon><span class="label">Student Registration</span></a>
            <a mat-list-item routerLink="/app/student/applications" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">assignment</mat-icon><span class="label">Exam Forms</span></a>
            <a mat-list-item routerLink="/app/student/payments" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">payments</mat-icon><span class="label">My Payments</span></a>
          }

          <div class="nav-divider"></div>
          <a mat-list-item routerLink="/app/profile" routerLinkActive="active" class="nav-item" (click)="closeOnMobile()"><mat-icon class="icon">settings</mat-icon><span class="label">Account Settings</span></a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content [class.student-mobile-shell]="role() === 'STUDENT' && isMobile()">
        <mat-toolbar class="toolbar" [class.mobile-toolbar]="isMobile()" [class.student-toolbar]="role() === 'STUDENT'">
          <button mat-icon-button (click)="toggle()" aria-label="Toggle menu" class="menu-toggle">
            <mat-icon>menu</mat-icon>
          </button>

          @if (!isMobile()) {
            <button mat-icon-button type="button" class="desktop-sidebar-toggle" (click)="toggleDesktopSidebar()" [attr.aria-label]="desktopSidebarHidden() ? 'Show sidebar' : 'Hide sidebar for full page'">
              <mat-icon>{{ desktopSidebarHidden() ? 'dock_to_left' : 'fullscreen' }}</mat-icon>
            </button>
          }

          @if (isMobile()) {
            <div class="mobile-brand">
              <div class="brand-title">HSC Exam</div>
              <div class="brand-subtitle">{{ centerTitle() }}</div>
            </div>
          } @else {
            <span class="center-title">{{ centerTitle() }}</span>
            <span class="spacer"></span>
          }

          <div class="user-info" [class.mobile-user-info]="isMobile()">
            <div class="user-avatar">{{ username()?.[0]?.toUpperCase() }}</div>
            <div class="user-details">
              <div class="user-name">{{ username() }}</div>
              <div class="user-role">{{ role() }}</div>
            </div>
          </div>
          <button mat-icon-button (click)="logout()" aria-label="Logout" class="logout-btn"><mat-icon>logout</mat-icon></button>
        </mat-toolbar>

        <div class="content" [class.student-content]="role() === 'STUDENT'"><router-outlet /></div>
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
      min-width: 280px;
      max-width: 280px;
      background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
      border-right: 1px solid #e0e0e0;
      transition: width 0.22s ease, transform 0.22s ease;
      z-index: 1;
    }

    ::ng-deep .mat-drawer.mat-drawer-side {
      z-index: 1;
    }

    .container.sidebar-compact .sidenav {
      width: 88px !important;
      min-width: 88px !important;
      max-width: 88px !important;
    }

    .container.sidebar-compact ::ng-deep .mat-drawer.sidenav,
    .container.sidebar-compact ::ng-deep .mat-drawer.mat-sidenav {
      width: 88px !important;
      min-width: 88px !important;
      max-width: 88px !important;
    }

    .container.sidebar-compact ::ng-deep .mat-drawer-inner-container {
      overflow-x: hidden !important;
    }

    .container.sidebar-hidden .sidenav {
      width: 0 !important;
      min-width: 0 !important;
      border-right: 0 !important;
      overflow: hidden;
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
      padding: 0.9rem 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
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
      font-size: 24px;
      flex-shrink: 0;
    }

    .logo-text {
      flex: 1;
    }

    .logo-main {
      font-size: 0.98rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .logo-sub {
      font-size: 0.7rem;
      opacity: 0.8;
    }

    .sidebar-control-btn {
      color: #fff;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.24);
      width: 34px;
      height: 34px;
      min-width: 34px;
      min-height: 34px;
    }

    .sidebar-close-btn {
      color: #fff;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
    }

    .nav-list {
      padding: 0.35rem 0 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
    }

    .section-header {
      padding: 0.62rem 0.8rem 0.2rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 0.2rem;
    }

    .section-indicator {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, #667eea, transparent);
    }

    .nav-item {
      margin: 0.12rem 0.4rem !important;
      border-radius: 10px !important;
      position: relative !important;
      transition: all 0.2s ease !important;
      color: #333 !important;
      font-size: 0.95rem !important;
      height: auto !important;
      min-height: 40px !important;
      padding: 0.45rem 0.7rem !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 9px !important;
      overflow: visible !important;
      flex-wrap: nowrap !important;
      width: calc(100% - 1rem) !important;
      white-space: nowrap !important;
    }

    .container.sidebar-compact .logo-text,
    .container.sidebar-compact .section-header,
    .container.sidebar-compact .nav-item .label,
    .container.sidebar-compact .nav-item .icon-badge,
    .container.sidebar-compact .section-indicator {
      display: none !important;
    }

    .container.sidebar-compact .sidebar-header {
      justify-content: center;
      padding: 0.75rem 0.45rem;
    }

    .container.sidebar-compact .logo-container {
      justify-content: center;
    }

    .container.sidebar-compact .sidebar-control-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
    }

    .container.sidebar-compact .nav-item {
      justify-content: center !important;
      width: calc(100% - 0.6rem) !important;
      margin: 0.1rem 0.3rem !important;
      padding: 0.5rem !important;
      min-height: 38px !important;
      gap: 0 !important;
    }

    /* Force Angular Material list item content into a single row */
    ::ng-deep .nav-item,
    ::ng-deep .nav-item .mat-mdc-list-item-unscoped-content,
    ::ng-deep .nav-item .mdc-list-item__content,
    ::ng-deep .nav-item .mdc-list-item__primary-text,
    ::ng-deep .nav-item .mat-list-item-content {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 12px !important;
      width: 100% !important;
      flex-wrap: nowrap !important;
      white-space: nowrap !important;
    }

    ::ng-deep .nav-item .mdc-list-item__content,
    ::ng-deep .nav-item .mdc-list-item__primary-text,
    ::ng-deep .nav-item .mat-mdc-list-item-unscoped-content {
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }

    .nav-item:hover {
      background: rgba(102, 126, 234, 0.1) !important;
      color: #667eea !important;
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%) !important;
      color: #667eea !important;
      font-weight: 600 !important;
      border-right: 3px solid #667eea !important;
    }

    .nav-item .icon {
      flex-shrink: 0 !important;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .nav-item .label {
      display: inline-flex !important;
      align-items: center !important;
      flex: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      min-width: 0 !important;
    }

    .icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    @media (max-width: 960px) {
      .nav-list {
        padding: 0.4rem 0 0.9rem;
      }

      .section-header {
        padding: 0.8rem 1rem 0.35rem;
        font-size: 0.72rem;
      }

      .nav-item {
        font-size: 0.9rem;
        margin: 0.18rem 0.45rem !important;
        min-height: 48px !important;
        padding: 0.7rem 0.85rem !important;
        gap: 10px !important;
      }

      .nav-item .icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
      }

      .nav-item .label {
        display: inline-flex !important;
        align-items: center !important;
        font-size: 0.92rem;
      }

      .icon-badge {
        display: none !important;
      }
    }

    @media (max-width: 480px) {
      .nav-item {
        margin: 0.15rem 0.35rem !important;
        padding: 0.72rem 0.8rem !important;
        border-radius: 9px !important;
      }

      .section-header {
        padding-inline: 0.85rem;
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
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .student-toolbar {
      background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
    }

    .mobile-toolbar {
      gap: 0.55rem;
      background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
      color: #0f172a;
      border-bottom: 1px solid #dbeafe;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    }

    .mobile-brand {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-title {
      font-size: 0.96rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      white-space: nowrap;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: #475569;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 480px) {
      .toolbar {
        padding: 0 0.5rem;
        height: 56px;
      }

      .brand-title {
        font-size: 0.9rem;
      }

      .brand-subtitle {
        font-size: 0.68rem;
      }
    }

    .menu-toggle {
      display: none;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }

    .desktop-sidebar-toggle {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.2);
      width: 38px;
      height: 38px;
      min-width: 38px;
      min-height: 38px;
    }

    .menu-toggle mat-icon {
      color: inherit !important;
    }

    .mobile-toolbar .menu-toggle,
    .mobile-toolbar .logout-btn {
      color: #000000;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
    }

    .mobile-toolbar .center-title {
      color: #0f172a;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .mobile-user-info {
      display: none;
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
      background: linear-gradient(180deg, #f4f7fb 0%, #eef4ff 100%);
      padding: 12px 0;
      width: 100%;
    }

    /* Keep page-level modal overlays inside the main content area, not under the sidenav */
    .container ::ng-deep .app-modal-backdrop,
    .container ::ng-deep .modal-backdrop,
    .container ::ng-deep .picker-overlay,
    .container ::ng-deep .instructions-popup-backdrop {
      z-index: 1300 !important;
    }

    

    .container.sidebar-compact:not(.sidebar-hidden) ::ng-deep .app-modal-backdrop,
    .container.sidebar-compact:not(.sidebar-hidden) ::ng-deep .modal-backdrop,
    .container.sidebar-compact:not(.sidebar-hidden) ::ng-deep .picker-overlay {
      left: 88px !important;
      width: calc(100vw - 88px) !important;
    }

    .container.sidebar-hidden ::ng-deep .app-modal-backdrop,
    .container.sidebar-hidden ::ng-deep .modal-backdrop,
    .container.sidebar-hidden ::ng-deep .picker-overlay {
      left: 0 !important;
      width: 100vw !important;
    }

    @media (max-width: 960px) {
      .container ::ng-deep .app-modal-backdrop,
      .container ::ng-deep .modal-backdrop,
      .container ::ng-deep .picker-overlay {
        left: 0 !important;
        width: 100vw !important;
      }
    }

    ::ng-deep .content > * {
      display: block;
      width: 100%;
      max-width: 100%;
    }

    .student-content {
      padding: 0 0 78px;
    }

    .student-mobile-shell {
      background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    }

    @media (min-width: 961px) {
      .student-content {
        padding: 0;
      }
    }

    @media (max-width: 768px) {
      .content {
        padding: 8px 0;
      }

      .student-content {
        padding: 0 0 82px;
      }
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
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 960 : false);
  readonly opened = signal(typeof window !== 'undefined' ? window.innerWidth > 960 : true);
  readonly sidebarCompact = signal(false);
  readonly desktopSidebarHidden = signal(false);

  readonly role = computed(() => this.auth.user()?.role ?? null);
  readonly username = computed(() => this.auth.user()?.username ?? '');
  readonly instituteName = signal<string>('');
  readonly centerTitle = computed(() => {
    if (this.role() === 'INSTITUTE') return this.instituteName() || 'Institute Portal';
    if (this.role() === 'BOARD') return 'Admin Portal';
    if (this.role() === 'SUPER_ADMIN') return 'System Admin Portal';
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
    this.opened.set(!mobile);
    if (mobile) {
      this.sidebarCompact.set(false);
      this.desktopSidebarHidden.set(false);
    }
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

  toggleCompactSidebar() {
    if (this.isMobile()) return;
    this.sidebarCompact.set(!this.sidebarCompact());
  }

  toggleDesktopSidebar() {
    if (this.isMobile()) return;
    const nextState = !this.desktopSidebarHidden();
    this.desktopSidebarHidden.set(nextState);
    if (nextState) {
      this.sidebarCompact.set(false);
    }
  }

  closeOnMobile() {
    if (this.isMobile()) this.opened.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

