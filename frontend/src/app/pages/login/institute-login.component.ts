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
      <div class="left-section">
        <div class="branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="logo" />
          <h1>{{ branding.getBoardName('en') }}</h1>
          <p class="tagline">{{ i18n.t('institutePortal') }}</p>
        </div>

    
         <div class="concern-letter-section">
          <div class="concern-letter-card">
            <div class="letter-header">
              <mat-icon>description</mat-icon>
              <h3>आपले इन्स्टिट्यूट लॉगीन मिळविण्यासाठी सूचना</h3>
            </div>
            <div class="letter-content bg-white p-4 rounded shadow">
              <p><strong>नवीन इन्स्टिट्यूट नोंदणी साठी सूचना:</strong></p>
              <ol>
                <li>"Generate Letter Of Concern" या बटन वरती क्लिक करा</li>
                <li>आपल्या इन्स्टिट्यूटचे डीटेल्स भरा व लेटर डाउनलोड करा</li>
                <li>लेटर डाउनलोड केल्यानंतर तो आपल्या संस्थेच्या लेटर हेड वरती प्रिंट करा</li>
                <li>लेटरवर सही व शिक्का मारून त्याची फोटो काढून खालील मेल वरती पाठवा</li>
                <li class="bg-white">Send the signed letter to: contact&#64;hscexam.in</li>
              </ol>
              <p><strong>For any queries, contact us on WhatsApp:</strong></p>
              <!-- <a href="https://wa.me/919922774144" target="_blank" class="whatsapp-link">
                <mat-icon>whatsapp</mat-icon>
                +91 99227 74144
              </a> -->
              <a mat-raised-button
              matButton="elevated"
                color="success"
                type="submit"
                class="full-width"
   [href]="'https://wa.me/919922774144?text=Hello%20HSC%20Exam%20Support%2C%20I%20have%20a%20query%20regarding%20the%20institute%20login.'" 
   target="_blank">
   <mat-icon>chat</mat-icon>
   Send WhatsApp Message
</a>
            </div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.t('instituteLogin') }}</mat-card-title>
            <mat-card-subtitle>{{ i18n.t('enterYourCredentials') }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <mat-form-field class="full-width">
                <mat-label>Username</mat-label>
                <mat-icon matPrefix>person</mat-icon>
                <input matInput formControlName="username" required />
              </mat-form-field>

              <mat-form-field class="full-width">
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

            <button mat-stroked-button class="full-width" type="button" (click)="goToLetterGenerator()">
              <mat-icon>description</mat-icon>
              Generate Letter Of Concern
            </button>

            <button mat-stroked-button class="full-width" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              {{ i18n.t('backToUserSelection') }}
            </button>
          </mat-card-content>
        </mat-card>

        <div class="footer-links">
          <a href="#help">{{ i18n.t('needHelp') }}</a>
          <span>•</span>
          <a href="#support">{{ i18n.t('contactSupport') }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .institute-login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .left-section {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
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

    .benefits {
      text-align: left;
      width: 100%;
    }

    .benefits h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .benefits ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .benefits li {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .benefits mat-icon {
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
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    mat-card-title {
      font-size: 1.5rem;
      color: #333;
    }

    mat-card-subtitle {
      color: #666;
      font-size: 0.95rem;
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

    .footer-links {
      text-align: center;
      margin-top: 2rem;
      color: #666;
      font-size: 0.9rem;
    }

    .footer-links a {
      color: #2196f3;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .footer-links a:hover {
      opacity: 0.7;
    }

    .footer-links span {
      margin: 0 0.5rem;
    }

    @media (max-width: 968px) {
      .institute-login-container {
        grid-template-columns: 1fr;
      }

      .left-section {
        min-height: auto;
        padding: 2rem;
      }

      .benefits h2 {
        font-size: 1.3rem;
      }

      .benefits li {
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
