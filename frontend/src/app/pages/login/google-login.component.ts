import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { GoogleAuthService } from '../../core/google-auth.service';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <!-- Animated Background -->
      <div class="background-animation">
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
      </div>

      <!-- Content -->
      <div class="login-content">
        <!-- Board Branding -->
        <div class="board-branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="board-logo-large" />
          <h1 class="board-title">{{ i18n.t('boardName') }}</h1>
          <p class="board-subtitle">{{ branding.getBoardNameShort() }}</p>
        </div>

        <!-- Login Card -->
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.t('studentLogin') }}</mat-card-title>
            <mat-card-subtitle>{{ i18n.t('pleaseLogin') }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Google Sign-In Button -->
            <div class="google-signin-container">
              <div id="google-signin-button" class="google-button-wrapper"></div>
              @if (loading()) {
                <div class="loading-spinner">
                  <mat-spinner diameter="40"></mat-spinner>
                  <p>{{ i18n.t('loading') }}</p>
                </div>
              }
              @if (errorMessage()) {
                <div class="error-message">
                  <mat-icon class="error-icon">error</mat-icon>
                  <p>{{ errorMessage() }}</p>
                </div>
              }
            </div>

            <!-- Divider -->
            <div class="divider">
              <span>या विकल्पासह लॉगिन करा</span>
            </div>

            <!-- Language Selector -->
            <div class="language-selector-login">
              <label>{{ i18n.t('language') }}:</label>
              <select [(ngModel)]="selectedLanguage" (change)="changeLanguage()" class="language-select">
                <option value="mr">{{ i18n.t('marathi') }}</option>
                <option value="en">{{ i18n.t('english') }}</option>
              </select>
            </div>

            <!-- Info Box -->
            <div class="info-box">
              <mat-icon class="info-icon">info</mat-icon>
              <div class="info-content">
                <h3>{{ i18n.t('loginRequired') }}</h3>
                <p>आपण परीक्षा फॉर्म भरण्याआधी आपल्या Google खात्याद्वारे लॉगिन करणे आवश्यक आहे.</p>
                <p class="english-info">You must login with your Google account before filling the exam form.</p>
              </div>
            </div>
          </mat-card-content>

          <mat-card-footer class="login-footer">
            <p class="security-note">
              <mat-icon>lock</mat-icon>
              आपले डेटा सुरक्षित आहे। आम्ही केवळ आपल्या ई-मेल आणि नाव वापरतो।
            </p>
          </mat-card-footer>
        </mat-card>

        <!-- Features Info -->
        <div class="features-section">
          <h2>सुविधाएं | Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <mat-icon class="feature-icon">security</mat-icon>
              <h3>सुरक्षित लॉगिन</h3>
              <p>Google OAuth सह सुरक्षित</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">language</mat-icon>
              <h3>बहुभाषिक</h3>
              <p>मराठी आणि अंग्रेजी समर्थित</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">print</mat-icon>
              <h3>प्रिंट करा</h3>
              <p>फॉर्म प्रिंट करा आणि जमा करा</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">assessment</mat-icon>
              <h3>परीक्षा नोंदणी</h3>
              <p>ऑनलाइन परीक्षा नोंदणी</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Moving Wave Background Animation */
    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      overflow: hidden;
    }

    .wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 200%;
      height: 100%;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"/></svg>') repeat-x;
      background-size: 600px 120px;
      animation: wave 15s linear infinite;
    }

    .wave1 {
      bottom: 20px;
      opacity: 0.8;
      animation-delay: 0s;
    }

    .wave2 {
      bottom: 40px;
      opacity: 0.5;
      animation-delay: -5s;
    }

    .wave3 {
      bottom: 60px;
      opacity: 0.3;
      animation-delay: -10s;
    }

    @keyframes wave {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(600px);
      }
    }

    .login-content {
      position: relative;
      z-index: 10;
      max-width: 600px;
      width: 100%;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .board-branding {
      text-align: center;
      color: white;
      margin-bottom: 30px;
      animation: zoomIn 0.8s ease-out;
    }

    @keyframes zoomIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .board-logo-large {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
    }

    .board-title {
      font-size: 1.8rem;
      margin: 0 0 8px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .board-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.9;
    }

    .login-card {
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      margin-bottom: 30px;
      animation: slideIn 0.7s ease-out 0.2s both;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 24px;
    }

    mat-card-title {
      font-size: 1.5rem;
      color: #333;
    }

    mat-card-subtitle {
      color: #999;
      font-size: 0.9rem;
    }

    mat-card-content {
      padding: 24px;
    }

    .google-signin-container {
      text-align: center;
      margin: 20px 0;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .google-button-wrapper {
      display: inline-block;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .error-message {
      color: #d32f2f;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #ffebee;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .error-icon {
      color: #d32f2f;
    }

    .divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #ddd;
      z-index: 0;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 12px;
      color: #999;
      font-size: 0.85rem;
      z-index: 1;
    }

    .language-selector-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 20px 0;
    }

    .language-selector-login label {
      font-weight: 600;
      color: #666;
    }

    .language-select {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #ddd;
      background: white;
      color: #333;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .language-select:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    .info-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      display: flex;
      gap: 12px;
    }

    .info-icon {
      color: #667eea;
      flex-shrink: 0;
    }

    .info-content h3 {
      margin: 0 0 8px;
      color: #333;
      font-size: 1rem;
    }

    .info-content p {
      margin: 4px 0;
      color: #666;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .english-info {
      margin-top: 8px;
      font-family: Arial, sans-serif;
    }

    .login-footer {
      text-align: center;
      padding: 16px 0 0;
      border-top: 1px solid #eee;
    }

    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 0;
      color: #666;
      font-size: 0.85rem;
    }

    .security-note mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      line-height: 18px;
      color: #4caf50;
    }

    /* Features Section */
    .features-section {
      color: white;
      margin-top: 40px;
      animation: slideIn 0.7s ease-out 0.4s both;
    }

    .features-section h2 {
      text-align: center;
      margin: 0 0 20px;
      font-size: 1.3rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-4px);
    }

    .feature-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin: 0 auto 8px;
      color: #fff;
    }

    .feature-card h3 {
      margin: 8px 0 4px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .feature-card p {
      margin: 0;
      font-size: 0.75rem;
      opacity: 0.9;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .board-title {
        font-size: 1.4rem;
      }

      .board-logo-large {
        width: 64px;
        height: 64px;
      }

      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .features-section h2 {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 10px;
      }

      .board-title {
        font-size: 1.2rem;
      }

      mat-card-title {
        font-size: 1.2rem;
      }

      .board-logo-large {
        width: 56px;
        height: 56px;
      }

      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .feature-card {
        padding: 12px;
      }
    }
  `]
})
export class GoogleLoginComponent implements OnInit {
  private googleAuth = inject(GoogleAuthService);
  private router = inject(Router);
  protected i18n = inject(I18nService);
  protected branding = inject(BrandingService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  selectedLanguage = this.i18n.getLanguage();
  private returnUrl = '/app/dashboard';

  ngOnInit() {
    // Check if already logged in
    if (this.googleAuth.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';

    // Initialize Google Sign-In button - ensure it's only done once
    setTimeout(() => {
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement && !buttonElement.hasChildNodes()) {  // Only if button is empty
        this.initializeGoogleSignIn();
      }
    }, 100);  // Reduced from 500ms for faster initialization
  }

  private initializeGoogleSignIn() {
    this.googleAuth.initializeGoogleSignIn(
      'google-signin-button',
      (token: string) => {
        this.loading.set(false);
        this.router.navigate([this.returnUrl]);
      },
      () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to authenticate. Please try again.');
      }
    );
  }

  changeLanguage() {
    const lang = this.selectedLanguage as 'en' | 'mr';
    this.i18n.setLanguage(lang);
    this.selectedLanguage = lang;
  }
}
