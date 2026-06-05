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
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';

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
      <div class="ambient-shape shape-one"></div>
      <div class="ambient-shape shape-two"></div>

      <div class="left-section">
        <div class="branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="logo" />
          <span>Board Portal</span>
          <h1>Secure board control for HSC and SSC examinations</h1>
          <p class="tagline">Create exams, monitor institutes, review applications, and keep HSC/SSC data separated by authority.</p>
          <p class="tagline marathi">परीक्षा तयार करणे, संस्था पाहणे, अर्जांचे निरीक्षण करणे आणि HSC/SSC डेटा स्वतंत्र ठेवणे.</p>
        </div>

        <div class="capabilities">
          <h2>Board Login Instructions | बोर्ड लॉगिन सूचना</h2>
          <ul>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>Use only authority-provided credentials. फक्त अधिकृत युजरनेम आणि पासवर्ड वापरा.</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>HSC board users see HSC data, SSC board users see SSC data. HSC/SSC डेटा स्वतंत्र दिसतो.</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>Manage exams, institute dashboard, reports, and application status. परीक्षा, संस्था व अहवाल व्यवस्थापित करा.</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>Do not share login details with anyone. लॉगिन माहिती कोणाशीही शेअर करू नका.</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="right-section">
        <mat-card class="login-card">
          <mat-card-header>
            <img [src]="branding.getLogoUrl()" alt="HSC Exam Portal Logo" class="login-logo" />
            <div class="admin-badge">
              <mat-icon>admin_panel_settings</mat-icon>
            </div>
            <mat-card-title>Board / Admin Login</mat-card-title>
            <mat-card-subtitle>Restricted access for board and higher authority users only.</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="login-help">
              <mat-icon>info</mat-icon>
              <span>लॉगिन केल्यानंतर आपल्या भूमिकेनुसारच संस्था, परीक्षा, अर्ज आणि अहवाल दिसतील.</span>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ i18n.t('adminUsername') }}</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput formControlName="username" required />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
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
          <a href="mailto:mail.hscinfo@gmail.com">mail.hscinfo&#64;gmail.com</a>
          <span>•</span>
          <a href="https://wa.me/919922774144" target="_blank">+91 99227 74144</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-container {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      color: #25233a;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      opacity: 0.55;
      background: rgba(255, 255, 255, 0.16);
    }

    .shape-one {
      width: 230px;
      height: 230px;
      right: -70px;
      top: 60px;
    }

    .shape-two {
      width: 170px;
      height: 170px;
      left: 45%;
      bottom: -60px;
    }

    .left-section {
      position: relative;
      z-index: 1;
      background:
        radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.18), transparent 30%),
        rgba(255, 255, 255, 0.08);
      color: white;
      padding: clamp(28px, 5vw, 64px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
      text-align: left;
      gap: 24px;
    }

    .branding {
      max-width: 680px;
    }

    .logo {
      width: 96px;
      height: 96px;
      margin-bottom: 1.2rem;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 24px 54px rgba(0, 0, 0, 0.22);
      padding: 8px;
    }

    .branding span {
      display: inline-flex;
      margin-bottom: 10px;
      padding: 7px 11px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .branding h1 {
      font-size: clamp(2.3rem, 5vw, 4.5rem);
      line-height: 0.95;
      letter-spacing: -0.075em;
      margin: 0 0 1rem 0;
      font-weight: 900;
      text-shadow: 0 18px 38px rgba(0, 0, 0, 0.18);
    }

    .tagline {
      max-width: 620px;
      font-size: clamp(1rem, 1.8vw, 1.18rem);
      line-height: 1.65;
      opacity: 0.86;
      margin: 0;
    }

    .tagline.marathi {
      margin-top: 8px;
      font-weight: 700;
    }

    .capabilities {
      text-align: left;
      width: 100%;
      max-width: 680px;
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(14px);
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
      line-height: 1.55;
    }

    .capabilities mat-icon {
      color: #fff;
      flex-shrink: 0;
    }

    .right-section {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
      overflow: hidden;
    }

    .login-card::before {
      content: '';
      display: block;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .login-logo {
      width: 78px;
      height: 78px;
      margin-bottom: 1rem;
      border-radius: 22px;
      box-shadow: 0 18px 40px rgba(16, 42, 67, 0.16);
    }

    .admin-badge mat-icon {
      color: white;
      font-size: 30px;
      width: 30px;
      height: 30px;
    }

    mat-card-title {
      font-size: 1.5rem;
      color: #102033;
      font-weight: 900;
    }

    mat-card-subtitle {
      color: #58677a;
      font-weight: 600;
      font-size: 0.9rem;
      line-height: 1.45;
    }

    mat-card-content {
      padding: 12px 28px 28px;
    }

    .login-help {
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 10px;
      padding: 14px;
      border-radius: 12px;
      background: #f5f7ff;
      color: #555;
      font-size: 0.9rem;
      line-height: 1.45;
      margin-bottom: 18px;
    }

    .login-help mat-icon {
      color: #667eea;
      width: 22px;
      height: 22px;
      font-size: 22px;
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
      background-color: rgba(255, 255, 255, 0.88);
      border-left: 4px solid #667eea;
      border-radius: 14px;
      color: #34314f;
      font-size: 0.9rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .warning-icon {
      flex-shrink: 0;
      color: #667eea;
    }

    .footer-links {
      text-align: center;
      margin-top: 1rem;
      color: rgba(255, 255, 255, 0.86);
      font-size: 0.9rem;
    }

    .footer-links a {
      color: #fff;
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
  readonly branding: BrandingService = inject(BrandingService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly authService: AuthService = inject(AuthService);
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

    this.authService
      .login(this.loginForm.value.username, this.loginForm.value.password)
      .subscribe({
        next: (response) => {
          // Allow BOARD and SUPER_ADMIN roles - not just ADMIN
          const allowedRoles = ['BOARD', 'SUPER_ADMIN'];
          if (!allowedRoles.includes(response.user?.role)) {
            this.isLoading = false;
            this.snackBar.open(this.i18n.t('notAuthorized'), '', { duration: 3000 });
            return;
          }

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
