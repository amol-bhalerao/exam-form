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
          <span>संस्था पोर्टल</span>
          <h1>संस्था सेटअप पूर्ण करून परीक्षा अर्ज व्यवस्थापन सुरू करा</h1>
          <p class="tagline">विद्यार्थ्यांचे अर्ज पडताळण्यासाठी आधी संस्थेची मूलभूत माहिती, शिक्षक माहिती, विषय मॅपिंग आणि परीक्षा क्षमता योग्यरीत्या सेट करा.</p>
        </div>

        <div class="portal-stats">
          <div>
            <strong>01</strong>
            <span>संस्था माहिती</span>
          </div>
          <div>
            <strong>02</strong>
            <span>शिक्षक माहिती</span>
          </div>
          <div>
            <strong>03</strong>
            <span>विषय व क्षमता</span>
          </div>
        </div>

        <div class="concern-letter-section">
          <div class="concern-letter-card">
            <div class="letter-header">
              <div class="letter-icon"><mat-icon>verified_user</mat-icon></div>
              <div>
                <h3>प्रथम लॉगिन केल्यानंतर सेटअप कसा करावा?</h3>
                <p>खालील क्रमाने माहिती भरल्यास अर्ज पडताळणी आणि प्रिंट प्रक्रिया व्यवस्थित चालते.</p>
              </div>
            </div>
            <div class="letter-content">
              <ol>
                <li><strong>Institute Details</strong> मध्ये संस्थेचे नाव, पत्ता, संपर्क क्रमांक आणि आवश्यक मूलभूत माहिती पूर्ण भरा.</li>
                <li><strong>Teachers and Staff</strong> मध्ये शिक्षक व कर्मचारी यांची माहिती, विषय आणि संपर्क तपशील जोडा.</li>
                <li><strong>Stream Subjects</strong> मध्ये आपल्या संस्थेसाठी लागू असलेले स्ट्रीम आणि विषय मॅपिंग योग्यरीत्या सेट करा.</li>
                <li><strong>Exam Capacity</strong> मध्ये प्रत्येक परीक्षेसाठी उपलब्ध आसन क्षमता शेवटी सेट करा.</li>
              </ol>
              <p class="setup-note">वरील सेटअप पूर्ण झाल्यानंतरच विद्यार्थ्यांचे सबमिट केलेले अर्ज तपासणे, पडताळणे आणि प्रिंट करणे सोपे होईल.</p>
              <div class="support-actions">
                <a mat-raised-button
                  type="button"
                  class="whatsapp-btn"
                  [href]="'https://wa.me/919922774144?text=Hello%20HSC%20Exam%20Support%2C%20I%20have%20a%20query%20regarding%20the%20institute%20login.'"
                  target="_blank">
                  <mat-icon>chat</mat-icon>
                  WhatsApp मदत
                </a>
                <a mat-stroked-button class="mail-btn" href="mailto:mail.hscinfo@gmail.com">
                  <mat-icon>mail</mat-icon>
                  ई-मेल मदत
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
            <mat-card-subtitle>संस्था पडताळणीनंतर मिळालेल्या युजरनेम आणि पासवर्डने लॉगिन करा.</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="login-help">
              <mat-icon>info</mat-icon>
              <span>लॉगिन केल्यानंतर प्रथम संस्था माहिती, नंतर शिक्षक माहिती, विषय मॅपिंग आणि शेवटी परीक्षा क्षमता पूर्ण करा.</span>
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
              संस्था संमतीपत्र तयार करा
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      color: #25233a;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
      background: rgba(255, 255, 255, 0.18);
    }

    .shape-two {
      width: 170px;
      height: 170px;
      left: 45%;
      bottom: -60px;
      background: rgba(255, 255, 255, 0.14);
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
      color: #fff;
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
      background: #fff;
      color: #667eea;
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
      color: #fff;
      font-weight: 900;
      text-decoration: none;
    }

    .setup-note {
      margin: 14px 0 0;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.55;
      font-weight: 700;
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
      background: #4caf50 !important;
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
      border-radius: 12px;
      border: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
      background: #fff;
      backdrop-filter: blur(16px);
      overflow: hidden;
    }

    .login-card::before {
      content: '';
      display: block;
      height: 4px;
      background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
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
      color: #333;
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
      background: #2196f3 !important;
      color: #fff !important;
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
      color: #667eea;
    }

    .mini-contact a {
      color: #667eea;
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
