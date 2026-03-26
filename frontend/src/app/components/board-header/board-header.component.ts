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
import { GoogleAuthService } from '../../core/google-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
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
          <div class="language-selector">
            <select [(ngModel)]="selectedLanguage" (change)="changeLanguage()" class="language-select">
              <option value="mr">मराठी</option>
              <option value="en">English</option>
            </select>
          </div>
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
  `,
  styles: [`
    .board-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 1000; }
    .header-content { display: flex; justify-content: space-between; align-items: center; gap: 16px; max-width: 1400px; margin: 0 auto; }
    .logo-section { display: flex; align-items: center; gap: 10px; flex-shrink: 0; cursor: pointer; min-width: 150px; }
    .board-logo { width: 44px; height: 44px; border-radius: 4px; background: white; padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); object-fit: contain; flex-shrink: 0; }
    .board-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .board-name { margin: 0; font-size: 1rem; font-weight: 700; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .board-name-short { margin: 0; font-size: 0.75rem; opacity: 0.85; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header-actions { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: flex-end; }
    .language-selector { display: flex; align-items: center; }
    .language-select { padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.15); color: white; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; font-weight: 500; min-width: 100px; }
    .language-select:hover { background: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.5); }
    .language-select:focus { outline: 0; background: rgba(255,255,255,0.35); border-color: white; }
    .language-select option { background: #333; color: white; }
    .login-btn { white-space: nowrap; padding: 6px 14px !important; font-size: 0.9rem !important; height: auto !important; display: flex; align-items: center; gap: 6px; }
    .login-btn mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    .auth-actions { display: flex; align-items: center; }
    .user-menu-btn { color: white; padding: 4px !important; font-size: 1.2rem; }
    @media (max-width: 1023px) { .board-logo { width: 40px; height: 40px; } .board-name { font-size: 0.95rem; } .board-name-short { font-size: 0.65rem; } .language-select { font-size: 0.8rem; padding: 5px 8px; min-width: 85px; } .login-btn { padding: 6px 12px !important; font-size: 0.85rem !important; } }
    @media (max-width: 767px) { .board-header { padding: 8px 10px; } .logo-section { gap: 6px; min-width: 80px; } .board-logo { width: 36px; height: 36px; } .board-name { font-size: 0.85rem; } .board-name-short { display: none; } .header-actions { gap: 6px; } .language-selector { display: none; } .login-btn { padding: 5px 10px !important; font-size: 0.8rem !important; } .user-menu-btn { font-size: 1rem; padding: 2px !important; } }
    @media (max-width: 479px) { .board-header { padding: 6px 8px; } .logo-section { gap: 4px; min-width: 60px; } .board-logo { width: 32px; height: 32px; } .board-name { font-size: 0.8rem; } .login-btn { padding: 4px 8px !important; font-size: 0.75rem !important; } .user-menu-btn { font-size: 0.9rem; padding: 0 !important; } }
  `]
})
export class BoardHeaderComponent {
  protected branding = inject(BrandingService);
  protected i18n = inject(I18nService);
  protected googleAuth = inject(GoogleAuthService);
  protected router = inject(Router);

  // Expose isLoggedIn as a signal
  isLoggedIn = this.googleAuth.isLoggedIn;
  selectedLanguage = this.i18n.getLanguageSignal();

  changeLanguage() {
    const lang = this.selectedLanguage() as 'en' | 'mr';
    this.i18n.setLanguage(lang);
  }

  goToLogin() {
    // Redirect to unified auth page which shows login options
    this.router.navigate(['/auth']);
  }

  logout() {
    this.googleAuth.logout();
    this.router.navigate(['/']);
  }
}
