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
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';
import { rateLimiter } from '../../core/rate-limiter';

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
          <p class="board-subtitle">Student Login | विद्यार्थी लॉगिन</p>
        </div>

        <!-- Login Card -->
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.t('studentLogin') }}</mat-card-title>
            <mat-card-subtitle>{{ i18n.t('pleaseLogin') }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Google Sign-In Button -->
            <div class="student-instructions">
              <div>
                <mat-icon>account_circle</mat-icon>
                <span>Login with your own Google account. आपल्या स्वतःच्या Google खात्याने लॉगिन करा.</span>
              </div>
              <div>
                <mat-icon>edit_document</mat-icon>
                <span>Complete profile first, then select HSC/SSC exam and institute. आधी प्रोफाइल पूर्ण करा, नंतर परीक्षा व संस्था निवडा.</span>
              </div>
              <div>
                <mat-icon>print</mat-icon>
                <span>Print form after payment/submission and institute verification. पेमेंट/सबमिशन व संस्था पडताळणीनंतर प्रिंट घ्या.</span>
              </div>
            </div>

            <div class="google-signin-container">
              <div id="google-signin-button" class="google-button-wrapper"></div>
              <button mat-stroked-button type="button" class="google-redirect-btn" (click)="continueWithGoogleRedirect()">
                <mat-icon>open_in_new</mat-icon>
                Google login in same tab
              </button>
              <p class="popup-help">
                If the popup does not open, use the same-tab login above. पॉपअप न उघडल्यास वरील same-tab login वापरा.
              </p>
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
                <p class="english-info">Help: mail.hscinfo&#64;gmail.com</p>
              </div>
            </div>
          </mat-card-content>

          <mat-card-footer class="login-footer">
            <p class="security-note">
              <mat-icon>lock</mat-icon>
              आपला डेटा सुरक्षित आहे. We use your account only for secure student login.
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
              <p>मराठी आणि इंग्रजी समर्थित</p>
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
      background:
        radial-gradient(circle at 12% 14%, rgba(255, 255, 255, 0.18), transparent 28%),
        radial-gradient(circle at 88% 16%, rgba(255, 255, 255, 0.14), transparent 30%),
        linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      max-width: 680px;
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
      margin-bottom: 24px;
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
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 24px 54px rgba(0, 0, 0, 0.22);
      padding: 8px;
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
      border-radius: 28px;
      box-shadow: 0 34px 90px rgba(0, 0, 0, 0.24);
      margin-bottom: 30px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      animation: slideIn 0.7s ease-out 0.2s both;
      overflow: hidden;
    }

    .login-card::before {
      content: '';
      display: block;
      height: 4px;
      background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
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
      color: #102033;
      font-weight: 900;
      letter-spacing: -0.035em;
    }

    mat-card-subtitle {
      color: #58677a;
      font-size: 0.9rem;
    }

    mat-card-content {
      padding: 24px;
    }

    .student-instructions {
      display: grid;
      gap: 10px;
      margin: 0 0 18px;
    }

    .student-instructions div {
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 10px;
      align-items: start;
      padding: 12px;
      border-radius: 14px;
      background: #f5f7ff;
      color: #4b5563;
      font-size: 0.86rem;
      line-height: 1.45;
      font-weight: 650;
    }

    .student-instructions mat-icon {
      width: 21px;
      height: 21px;
      font-size: 21px;
      color: #667eea;
    }

    .google-signin-container {
      text-align: center;
      margin: 20px 0;
      min-height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .google-button-wrapper {
      display: inline-block;
    }

    .google-redirect-btn {
      border-color: #d7e1ea;
      color: #143047;
      font-weight: 800;
      border-radius: 999px;
      padding: 0 18px;
      min-height: 42px;
      background: #fff;
    }

    .google-redirect-btn mat-icon {
      margin-right: 6px;
      color: #0f5f6f;
    }

    .popup-help {
      margin: 0;
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.35;
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
      background: #eef7f5;
      border-left: 4px solid #f2a93b;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      display: flex;
      gap: 12px;
    }

    .info-icon {
      color: #0f5f6f;
      flex-shrink: 0;
    }

    .info-content h3 {
      margin: 0 0 8px;
      color: #102033;
      font-size: 1rem;
    }

    .info-content p {
      margin: 4px 0;
      color: #58677a;
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
      color: #58677a;
      font-size: 0.85rem;
    }

    .security-note mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      line-height: 18px;
      color: #1b7f5a;
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
      background: rgba(255, 250, 241, 0.14);
      backdrop-filter: blur(10px);
      padding: 16px;
      border-radius: 18px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.24);
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
  private authService = inject(AuthService);
  private router = inject(Router);
  protected i18n = inject(I18nService);
  protected branding = inject(BrandingService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  selectedLanguage = this.i18n.getLanguage();
  private returnUrl = '';

  ngOnInit() {
    if (this.handleGoogleRedirectResponse()) {
      return;
    }

    // Check if already logged in
    if (this.googleAuth.isLoggedIn()) {
      // Clear rate limiter when already logged in
      rateLimiter.clearAll();
      this.navigateToAppropriateLocation();
      return;
    }

    // Check if user is rate limited
    if (rateLimiter.isBlocked('login')) {
      this.errorMessage.set(rateLimiter.getThrottleMessage('login'));
      return;
    }

    // Get return URL from route parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

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
        // Record successful login attempt
        rateLimiter.recordSuccess('login');
        this.loading.set(false);
        this.errorMessage.set(null);
        this.navigateToAppropriateLocation();
      },
      () => {
        // Record failed login attempt
        rateLimiter.recordFailure('login');
        
        // Check if now blocked due to too many attempts
        if (rateLimiter.isBlocked('login')) {
          this.errorMessage.set(rateLimiter.getThrottleMessage('login'));
        } else {
          this.errorMessage.set('Failed to authenticate. Please try again.');
        }
        this.loading.set(false);
      }
    );
  }

  continueWithGoogleRedirect() {
    if (rateLimiter.isBlocked('login')) {
      this.errorMessage.set(rateLimiter.getThrottleMessage('login'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    window.location.href = this.googleAuth.getGoogleRedirectUrl(this.returnUrl);
  }

  private handleGoogleRedirectResponse() {
    if (!window.location.hash.includes('id_token=')) return false;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const credential = params.get('id_token');
    this.returnUrl = params.get('state') || this.route.snapshot.queryParams['returnUrl'] || '';

    if (!credential) {
      this.errorMessage.set('Google did not return a valid login token. Please try again.');
      return true;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    this.googleAuth.handleGoogleSignIn(credential).subscribe({
      next: () => {
        rateLimiter.recordSuccess('login');
        this.loading.set(false);
        this.navigateToAppropriateLocation();
      },
      error: (err) => {
        rateLimiter.recordFailure('login');
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.error?.error ?? 'Google sign-in failed. Please try again.');
      }
    });

    return true;
  }

  /**
   * Navigate to the appropriate location based on user role and explicit return URL
   * - If returnUrl in query params, use that
   * - For STUDENT users, go to /app/student/profile for onboarding/profile completion
   * - For other roles, navigate to /app/dashboard
   */
  private navigateToAppropriateLocation() {
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Get current user
    const user = this.authService.user();
    
    // STUDENT users land on profile onboarding first
    if (user?.role === 'STUDENT') {
      this.router.navigate(['/app/student/profile']);
      return;
    }

    // Other roles (BOARD, INSTITUTE, SUPER_ADMIN) go to dashboard
    this.router.navigate(['/app/dashboard']);
  }

  changeLanguage() {
    const lang = this.selectedLanguage as 'en' | 'mr';
    this.i18n.setLanguage(lang);
    this.selectedLanguage = lang;
  }
}
