import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { BrandingService } from '../../core/branding.service';
import { I18nService } from '../../core/i18n.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { GoogleAuthService } from '../../core/google-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, LanguageSwitcherComponent],
  template: `
    <header class="board-header">
      <div class="header-content">
        <div class="logo-section">
          <img [src]="branding.getLogoUrl()" alt="Logo" class="board-logo" />
          <div class="board-info">
            <h1 class="board-name">{{ i18n.t('boardName') }}</h1>
            <p class="board-name-short">{{ branding.getBoardNameShort() }}</p>
          </div>
        </div>
        <div class="header-actions">
          <app-language-switcher />
          @if (!isLoggedIn()) {
            <button mat-raised-button color="accent" class="login-btn" (click)="goToLogin()">
              <mat-icon>login</mat-icon> {{ i18n.t('login') }}
            </button>
          }
          @if (isLoggedIn()) {
            <div class="auth-actions">
              <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
                <mat-icon>account_circle</mat-icon>
              </button>
              <mat-menu #userMenu>
                <button mat-menu-item routerLink="/app/profile">
                  <mat-icon>person</mat-icon><span>{{ i18n.t('profile') }}</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="logout()">
                  <mat-icon>logout</mat-icon><span>{{ i18n.t('logout') }}</span>
                </button>
              </mat-menu>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class BoardHeaderComponent {
  protected branding = inject(BrandingService);
  protected i18n = inject(I18nService);
  protected googleAuth = inject(GoogleAuthService);
  protected router = inject(Router);

  // Expose isLoggedIn as a signal
  isLoggedIn = this.googleAuth.isLoggedIn;
  selectedLanguage = this.i18n.getLanguageSignal();

  goToLogin() {
    // Redirect to unified auth page which shows login options
    this.router.navigate(['/login']);
  }

  logout() {
    this.googleAuth.logout();
    this.router.navigate(['/']);
  }
}
