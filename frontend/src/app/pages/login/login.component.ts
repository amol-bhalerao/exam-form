import { Component, signal, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth.service';

// Declare global google object injected by GSI script
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <!-- Left branding panel -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <mat-icon class="logo-icon">school</mat-icon>
          </div>
          <h1 class="brand-title">Maharashtra HSC</h1>
          <p class="brand-subtitle">State Board Exam Portal</p>
          <p class="brand-desc">
            Secure, seamless examination form submission for students, institutes, and board officials.
          </p>
          <div class="brand-features">
            <div class="feature-item">
              <mat-icon>verified_user</mat-icon>
              <span>Secure & Encrypted</span>
            </div>
            <div class="feature-item">
              <mat-icon>speed</mat-icon>
              <span>Fast Processing</span>
            </div>
            <div class="feature-item">
              <mat-icon>devices</mat-icon>
              <span>Works on All Devices</span>
            </div>
          </div>
        </div>
        <div class="brand-decoration">
          <div class="deco-circle c1"></div>
          <div class="deco-circle c2"></div>
          <div class="deco-circle c3"></div>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="form-panel">
        <div class="form-container fade-in-up">
          <div class="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          <!-- Google Sign-In -->
          <div class="google-section">
            <p class="google-label">
              <mat-icon class="g-icon">person</mat-icon>
              Students — sign in with Google
            </p>
            <div id="google-signin-btn"></div>
            @if (googleLoading()) {
              <div class="google-loading">
                <mat-spinner diameter="24"></mat-spinner>
                <span>Signing in with Google…</span>
              </div>
            }
            @if (googleError()) {
              <div class="error-msg">{{ googleError() }}</div>
            }
          </div>

          <mat-divider></mat-divider>
          <div class="or-divider">
            <span>or sign in with credentials</span>
          </div>

          <!-- Credential login (BOARD / INSTITUTE / SUPER_ADMIN) -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <mat-icon matPrefix class="field-icon">person_outline</mat-icon>
              <input matInput formControlName="username" autocomplete="username" placeholder="Enter your username" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix class="field-icon">lock_outline</mat-icon>
              <input matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password" />
              <button mat-icon-button matSuffix type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (error()) {
              <div class="error-msg" role="alert">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-flat-button color="primary" class="submit-btn" type="submit"
              [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              } @else {
                <mat-icon>login</mat-icon>
              }
              {{ loading() ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <div class="form-footer">
            <p>
              Institute self-registration:
              <a routerLink="/institute/register" class="link">Register your institute</a>
            </p>
            <p class="muted">
              For credential accounts: BOARD, INSTITUTE, SUPER_ADMIN users only.
              Students must use Google Sign-In above.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    /* ── Brand Panel ─────────────────────── */
    .brand-panel {
      background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #7c3aed 100%);
      color: #fff;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      max-width: 360px;
    }

    .brand-logo {
      width: 72px;
      height: 72px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: grid;
      place-items: center;
      margin-bottom: 24px;
      backdrop-filter: blur(8px);
    }

    .logo-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #fff;
    }

    .brand-title {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 8px;
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      font-size: 1rem;
      opacity: 0.8;
      margin: 0 0 16px;
      font-weight: 500;
    }

    .brand-desc {
      font-size: 0.9rem;
      opacity: 0.7;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      opacity: 0.85;
    }

    .feature-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      padding: 4px;
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      font-size: 14px;
    }

    /* Decorative circles */
    .brand-decoration { position: absolute; inset: 0; }
    .deco-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .c1 { width: 400px; height: 400px; top: -100px; right: -150px; }
    .c2 { width: 250px; height: 250px; bottom: -80px; left: -80px; }
    .c3 { width: 160px; height: 160px; top: 40%; right: 20px; background: rgba(255,255,255,0.06); }

    /* ── Form Panel ──────────────────────── */
    .form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      background: #f8faff;
    }

    .form-container {
      width: min(440px, 100%);
    }

    .form-header {
      margin-bottom: 32px;
    }

    .form-header h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .form-header p {
      color: #64748b;
      margin: 0;
      font-size: 0.95rem;
    }

    /* Google section */
    .google-section {
      margin-bottom: 20px;
    }

    .google-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #475569;
      font-weight: 600;
      margin: 0 0 10px;
    }

    .g-icon { font-size: 16px; width: 16px; height: 16px; color: #4285F4; }

    .google-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      color: #64748b;
      padding: 8px 0;
    }

    /* Divider */
    .or-divider {
      text-align: center;
      position: relative;
      margin: 16px 0;
    }
    .or-divider span {
      background: #f8faff;
      padding: 0 12px;
      font-size: 0.8rem;
      color: #94a3b8;
      position: relative;
      z-index: 1;
    }
    .or-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }

    /* Form fields */
    .login-form {
      display: grid;
      gap: 12px;
      margin-top: 8px;
    }

    .full-width { width: 100%; }

    .field-icon {
      color: #94a3b8;
      margin-right: 8px;
    }

    /* Error */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #dc2626;
      font-size: 0.875rem;
      background: #fee2e2;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #fecaca;
    }
    .error-msg mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Submit button */
    .submit-btn {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }

    /* Footer */
    .form-footer {
      margin-top: 20px;
      font-size: 0.8rem;
    }
    .form-footer p { margin: 6px 0; color: #64748b; }
    .link { color: #2563eb; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .muted { color: #94a3b8; font-size: 0.75rem; line-height: 1.5; }

    /* Mobile */
    @media (max-width: 768px) {
      .page { grid-template-columns: 1fr; }
      .brand-panel { display: none; }
      .form-panel { padding: 32px 16px; }
    }
  `]
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);
  readonly googleLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly googleError = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initGoogleSignIn();
  }

  ngOnDestroy() {
    // Clean up GSI if needed
    if (isPlatformBrowser(this.platformId) && typeof google !== 'undefined') {
      try { google.accounts?.id?.cancel(); } catch {}
    }
  }

  private initGoogleSignIn() {
    // Retry until google script loads (it's async)
    const tryInit = (attempts = 0): void => {
      if (typeof google === 'undefined') {
        if (attempts > 15) return; // give up after 3s
        setTimeout(() => tryInit(attempts + 1), 200);
        return;
      }

      const btn = document.getElementById('google-signin-btn');
      if (!btn) return;

      // Read client ID from meta or environment
      const clientId = (window as any).__GOOGLE_CLIENT_ID__ || '';

      if (!clientId) {
        // Show a disabled placeholder if not configured
        btn.innerHTML = `<div style="padding:10px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e2e8f0;border-radius:8px;">Google Sign-In not configured (add GOOGLE_CLIENT_ID)</div>`;
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => this.handleGoogleCredential(response.credential)
      });

      google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        width: btn.offsetWidth || 380,
        logo_alignment: 'left',
        text: 'signin_with',
        shape: 'rectangular'
      });
    };

    tryInit();
  }

  private handleGoogleCredential(credential: string) {
    this.googleLoading.set(true);
    this.googleError.set(null);
    this.auth.googleLogin(credential).subscribe({
      next: (resp) => {
        this.googleLoading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err) => {
        this.googleLoading.set(false);
        const msg = err?.error?.message ?? err?.error?.error ?? 'Google sign-in failed. Please try again.';
        this.googleError.set(msg);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        const code = err?.error?.error ?? '';
        if (code === 'USE_GOOGLE_LOGIN') {
          this.error.set('This account uses Google Sign-In. Please use the "Continue with Google" button.');
        } else {
          this.error.set('Invalid credentials or account not approved yet.');
        }
      }
    });
  }
}

