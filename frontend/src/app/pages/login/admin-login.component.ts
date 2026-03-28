import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-login-container">
      <div class="left-section">
        <div class="branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="logo" />
          <h1>{{ branding.getBoardName('en') }}</h1>
          <p class="tagline">{{ i18n.t('adminPortal') }}</p>
        </div>

        <div class="capabilities">
          <h2>{{ i18n.t('adminCapabilities') }}</h2>
          <ul>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('systemConfiguration') }}</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('userAndRoleManagement') }}</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('auditLogs') }}</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('applicationAnalytics') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="right-section">
        <mat-card class="login-card">
          <mat-card-header>
            <div class="admin-badge">
              <mat-icon>admin_panel_settings</mat-icon>
            </div>
            <mat-card-title>{{ i18n.t('admin') }}</mat-card-title>
            <mat-card-subtitle>{{ i18n.t('restrictedAccess') }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <mat-form-field class="full-width">
                <mat-label>{{ i18n.t('adminUsername') }}</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput formControlName="username" required />
              </mat-form-field>

              <mat-form-field class="full-width">
                <mat-label>{{ i18n.t('securePassword') }}</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput formControlName="password" [type]="showPassword ? 'text' : 'password'" required />
                <button mat-icon-button matSuffix (click)="togglePasswordVisibility()" type="button">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button
                mat-raised-button
                color="accent"
                type="submit"
                class="full-width"
                [disabled]="loginForm.invalid || isLoading"
              >
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ i18n.t('secureLogin') }}</span>
              </button>
            </form>

            <div class="divider">{{ i18n.t('or') }}</div>

            <button mat-stroked-button class="full-width" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              {{ i18n.t('backToUserSelection') }}
            </button>
          </mat-card-content>
        </mat-card>

        <div class="security-notice">
          <mat-icon class="warning-icon">security</mat-icon>
          <p>{{ i18n.t('securityNotice') }}</p>
        </div>

        <div class="footer-links">
          <a href="#help">{{ i18n.t('adminHelp') }}</a>
          <span>•</span>
          <a href="#support">{{ i18n.t('emergencySupport') }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .left-section {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .branding {
      margin-bottom: 3rem;
    }

    .logo {
      max-width: 100px;
      margin-bottom: 1rem;
      filter: brightness(0) invert(1);
    }

    .branding h1 {
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .tagline {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
    }

    .capabilities {
      text-align: left;
      width: 100%;
    }

    .capabilities h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .capabilities ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .capabilities li {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .capabilities mat-icon {
      color: #4caf50;
      flex-shrink: 0;
    }

    .right-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border-top: 4px solid #ff9800;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .admin-badge {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .admin-badge mat-icon {
      color: white;
      font-size: 30px;
      width: 30px;
      height: 30px;
    }

    mat-card-title {
      font-size: 1.5rem;
      color: #333;
    }

    mat-card-subtitle {
      color: #ff6f00;
      font-weight: 600;
      font-size: 0.9rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      display: block;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }

    .divider {
      text-align: center;
      color: #999;
      margin: 1.5rem 0;
      position: relative;
    }

    .divider::before,
    .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background-color: #e0e0e0;
    }

    .divider::before {
      left: 0;
    }

    .divider::after {
      right: 0;
    }

    .security-notice {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      color: #e65100;
      font-size: 0.9rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .warning-icon {
      flex-shrink: 0;
      color: #ff9800;
    }

    .footer-links {
      text-align: center;
      margin-top: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .footer-links a {
      color: #ff9800;
      text-decoration: none;
      transition: opacity 0.2s;
      font-weight: 600;
    }

    .footer-links a:hover {
      opacity: 0.7;
    }

    .footer-links span {
      margin: 0 0.5rem;
    }

    @media (max-width: 968px) {
      .admin-login-container {
        grid-template-columns: 1fr;
      }

      .left-section {
        min-height: auto;
        padding: 2rem;
      }

      .capabilities h2 {
        font-size: 1.3rem;
      }

      .capabilities li {
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .left-section {
        padding: 1.5rem;
      }

      .branding h1 {
        font-size: 1.5rem;
      }

      .right-section {
        padding: 1rem;
      }

      .login-card {
        max-width: 100%;
      }
    }
  `]
})
export class AdminLoginComponent {
  readonly i18n: I18nService = inject(I18nService);
  readonly branding: BrandingService  = inject(BrandingService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly http: HttpClient = inject(HttpClient);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;

    this.http
      .post<any>(`${API_BASE_URL}/auth/login`, {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      })
      .subscribe({
        next: (response) => {
          // Allow BOARD and SUPER_ADMIN roles - not just ADMIN
          const allowedRoles = ['BOARD', 'SUPER_ADMIN'];
          if (!allowedRoles.includes(response.user?.role)) {
            this.isLoading = false;
            this.snackBar.open(this.i18n.t('notAuthorized'), '', { duration: 3000 });
            return;
          }

          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.snackBar.open(this.i18n.t('loginSuccess'), '', { duration: 3000 });
          this.router.navigate(['/app/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(this.i18n.t('loginFailed'), '', { duration: 3000 });
        }
      });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
