import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';

@Component({
  selector: 'app-institute-login',
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
    <div class="institute-login-container">
      <div class="ambient-shape shape-one"></div>
      <div class="ambient-shape shape-two"></div>

      <div class="left-section">
        <div class="branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="logo" />
          <span>Institute Portal</span>
          <h1>Manage HSC exam applications with confidence</h1>
          <p class="tagline">Verify student forms, manage institute records, and keep the exam process moving from one secure workspace.</p>
        </div>

        <div class="portal-stats">
          <div>
            <strong>01</strong>
            <span>Generate letter</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Send signed copy</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Login after approval</span>
          </div>
        </div>

        <div class="concern-letter-section">
          <div class="concern-letter-card">
            <div class="letter-header">
              <div class="letter-icon"><mat-icon>verified_user</mat-icon></div>
              <div>
                <h3>नवीन इन्स्टिट्यूट लॉगिन कसे मिळेल?</h3>
                <p>Follow these steps to request institute access.</p>
              </div>
            </div>
            <div class="letter-content">
              <ol>
                <li>Click <strong>Generate Letter Of Concern</strong>.</li>
                <li>Fill institute details and print the letter on official letterhead.</li>
                <li>Sign and stamp the letter from the principal/authorized person.</li>
                <li>Send the scanned copy to <a href="mailto:mail.hscinfo@gmail.com">mail.hscinfo&#64;gmail.com</a>.</li>
              </ol>
              <div class="support-actions">
                <a mat-raised-button
                  type="button"
                  class="whatsapp-btn"
                  [href]="'https://wa.me/919922774144?text=Hello%20HSC%20Exam%20Support%2C%20I%20have%20a%20query%20regarding%20the%20institute%20login.'"
                  target="_blank">
                  <mat-icon>chat</mat-icon>
                  WhatsApp Support
                </a>
                <a mat-stroked-button class="mail-btn" href="mailto:mail.hscinfo@gmail.com">
                  <mat-icon>mail</mat-icon>
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <mat-card class="login-card">
          <mat-card-header>
            <img [src]="branding.getLogoUrl()" alt="HSC Exam Portal Logo" class="login-logo" />
            <mat-card-title>{{ i18n.t('instituteLogin') }}</mat-card-title>
            <mat-card-subtitle>Use the credentials issued after institute verification.</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="login-help">
              <mat-icon>info</mat-icon>
              <span>Institute users can verify applications, manage subject mapping, exam capacity, and teacher records after login.</span>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Username</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput formControlName="username" required />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ i18n.t('password') }}</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput formControlName="password" [type]="showPassword ? 'text' : 'password'" required />
                <button mat-icon-button matSuffix (click)="togglePasswordVisibility()" type="button">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width"
                [disabled]="loginForm.invalid || isLoading"
              >
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">{{ i18n.t('login') }}</span>
              </button>
            </form>

            <div class="divider">{{ i18n.t('or') }}</div>

            <button mat-raised-button class="full-width secondary-action" type="button" (click)="goToLetterGenerator()">
              <mat-icon>description</mat-icon>
              Generate Letter Of Concern
            </button>

            <button mat-stroked-button class="full-width back-action" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              {{ i18n.t('backToUserSelection') }}
            </button>

            <div class="mini-contact">
              <div><mat-icon>mail</mat-icon><a href="mailto:mail.hscinfo@gmail.com">mail.hscinfo&#64;gmail.com</a></div>
              <div><mat-icon>phone</mat-icon><a href="https://wa.me/919922774144" target="_blank">+91 99227 74144</a></div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .institute-login-container {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background:
        radial-gradient(circle at 80% 12%, rgba(242, 169, 59, 0.18), transparent 28%),
        linear-gradient(135deg, #f8f1e4 0%, #eef7f5 100%);
      overflow: hidden;
      color: #102033;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      filter: blur(1px);
      opacity: 0.58;
    }

    .shape-one {
      width: 220px;
      height: 220px;
      right: -70px;
      top: 60px;
      background: rgba(242, 169, 59, 0.36);
    }

    .shape-two {
      width: 170px;
      height: 170px;
      left: 45%;
      bottom: -60px;
      background: rgba(93, 183, 159, 0.3);
    }

    .left-section {
      position: relative;
      z-index: 1;
      background:
        radial-gradient(circle at 20% 18%, rgba(242, 169, 59, 0.28), transparent 28%),
        linear-gradient(145deg, #102a43 0%, #0f5f6f 100%);
      color: white;
      padding: clamp(28px, 5vw, 64px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
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
      background: rgba(255, 255, 255, 0.14);
      color: #ffe6b0;
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
    }

    .tagline {
      max-width: 620px;
      font-size: clamp(1rem, 1.8vw, 1.18rem);
      line-height: 1.65;
      opacity: 0.86;
      margin: 0;
    }

    .portal-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      max-width: 680px;
    }

    .portal-stats div {
      padding: 16px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(10px);
    }

    .portal-stats strong {
      display: block;
      color: #ffe6b0;
      font-size: 1.4rem;
      line-height: 1;
      margin-bottom: 8px;
    }

    .portal-stats span {
      color: rgba(255, 255, 255, 0.82);
      font-size: 0.86rem;
      line-height: 1.35;
      font-weight: 700;
    }

    .concern-letter-section,
    .concern-letter-card {
      max-width: 680px;
    }

    .concern-letter-card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(14px);
    }

    .letter-header {
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }

    .letter-icon {
      width: 56px;
      height: 56px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: #f2a93b;
      color: #102033;
    }

    .letter-icon mat-icon {
      width: 32px;
      height: 32px;
      font-size: 32px;
    }

    .letter-header h3 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 900;
      color: #fff;
    }

    .letter-header p {
      margin: 4px 0 0;
      color: rgba(255, 255, 255, 0.72);
    }

    .letter-content ol {
      margin: 0;
      padding-left: 22px;
      color: rgba(255, 255, 255, 0.86);
      line-height: 1.75;
    }

    .letter-content a {
      color: #ffe6b0;
      font-weight: 900;
      text-decoration: none;
    }

    .support-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 18px;
    }

    .support-actions a {
      min-height: 44px;
      border-radius: 14px;
    }

    .whatsapp-btn {
      background: #1b7f5a !important;
      color: #fff !important;
    }

    .mail-btn {
      color: #fff !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
    }

    .right-section {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: clamp(22px, 5vw, 56px);
    }

    .login-card {
      width: min(100%, 470px);
      max-width: 470px;
      border-radius: 32px;
      border: 1px solid rgba(16, 42, 67, 0.08);
      box-shadow: 0 32px 84px rgba(16, 42, 67, 0.18);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      overflow: hidden;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 1rem;
      padding: 28px 28px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .login-logo {
      width: 86px;
      height: 86px;
      margin-bottom: 14px;
      border-radius: 24px;
      box-shadow: 0 18px 40px rgba(16, 42, 67, 0.16);
    }

    mat-card-title {
      font-size: 1.75rem;
      color: #102033;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    mat-card-subtitle {
      color: #58677a;
      font-size: 0.95rem;
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
      border-radius: 18px;
      background: #eef7f5;
      color: #405267;
      font-size: 0.9rem;
      line-height: 1.45;
      margin-bottom: 18px;
    }

    .login-help mat-icon {
      color: #0f5f6f;
      width: 22px;
      height: 22px;
      font-size: 22px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
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

    button.full-width {
      min-height: 46px;
      border-radius: 14px;
      font-weight: 800;
    }

    .secondary-action {
      background: #f2a93b !important;
      color: #102033 !important;
      margin-bottom: 10px;
    }

    .back-action {
      margin-bottom: 14px;
    }

    .divider {
      text-align: center;
      color: #7a8798;
      margin: 1.4rem 0;
      position: relative;
      font-weight: 800;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .divider::before,
    .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 38%;
      height: 1px;
      background-color: #d9e2e8;
    }

    .divider::before {
      left: 0;
    }

    .divider::after {
      right: 0;
    }

    .mini-contact {
      display: grid;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .mini-contact div {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #58677a;
      font-size: 0.88rem;
    }

    .mini-contact mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: #0f5f6f;
    }

    .mini-contact a {
      color: #0f5f6f;
      text-decoration: none;
      font-weight: 800;
    }

    @media (max-width: 968px) {
      .institute-login-container {
        grid-template-columns: 1fr;
      }

      .left-section {
        min-height: auto;
      }

      .portal-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .left-section {
        padding: 24px 16px;
      }

      .branding h1 {
        font-size: 2.15rem;
      }

      .support-actions {
        grid-template-columns: 1fr;
      }

      .right-section {
        padding: 16px;
      }

      mat-card-header {
        padding: 22px 18px 0;
      }

      mat-card-content {
        padding: 12px 18px 22px;
      }
    }

  `]
})
export class InstituteLoginComponent {
  readonly i18n = inject(I18nService);
  readonly branding = inject(BrandingService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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

  goToLetterGenerator() {
    this.router.navigate(['/institute-letter']);
  }
}
