import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-user-type-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="user-type-container">
      <div class="header">
        <h1>{{ i18n.t('selectUserType') }}</h1>
        <p class="subtitle">{{ i18n.t('chooseYourRoleToLogin') }}</p>
      </div>

      <div class="login-cards">
        <!-- Student Login Card ONLY - Reserved for Students -->
        <div class="login-card student-card">
          <div class="card-icon">
            <mat-icon class="large-icon">school</mat-icon>
          </div>
          <h2>{{ i18n.t('student') }}</h2>
          <p class="description">{{ i18n.t('studentLoginDescription') }}</p>
          <div class="features">
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('fillExamForm') }}</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('autoFillProfile') }}</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>{{ i18n.t('googleSignIn') }}</span>
            </div>
          </div>
          <button mat-raised-button color="primary" class="full-width" (click)="navigateTo('/google-login')">
            <mat-icon>login</mat-icon>
            {{ i18n.t('studentLogin') }}
          </button>
        </div>
      </div>

      <div class="footer-info">
        <p>{{ i18n.t('firstTimeUser') }} <a href="/register">{{ i18n.t('signUpHere') }}</a></p>
      </div>
    </div>
  `,
  styles: [`
    .user-type-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 3rem;
    }

    .header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .header .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .login-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      width: 100%;
      margin-bottom: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .login-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .login-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
    }

    .student-card::before {
      background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
    }

    .institute-card::before {
      background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
    }

    .admin-card::before {
      background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
    }

    .card-icon {
      margin-bottom: 1.5rem;
    }

    .large-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: #666;
    }

    .student-card .large-icon {
      color: #4caf50;
    }

    .institute-card .large-icon {
      color: #2196f3;
    }

    .admin-card .large-icon {
      color: #ff9800;
    }

    .login-card h2 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .login-card .description {
      color: #666;
      margin: 0 0 1.5rem 0;
      font-size: 0.95rem;
    }

    .features {
      width: 100%;
      text-align: left;
      margin-bottom: 1.5rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 0.8rem;
      color: #555;
      font-size: 0.9rem;
    }

    .feature mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
    }

    .institute-card .feature mat-icon {
      color: #2196f3;
    }

    .admin-card .feature mat-icon {
      color: #ff9800;
    }

    .full-width {
      width: 100%;
      margin-top: auto;
      padding: 0.8rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .full-width mat-icon {
      margin-right: 0.5rem;
    }

    .footer-info {
      text-align: center;
      color: white;
      font-size: 0.95rem;
    }

    .footer-info a {
      color: #fff;
      text-decoration: underline;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .footer-info a:hover {
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .user-type-container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.8rem;
      }

      .header .subtitle {
        font-size: 1rem;
      }

      .login-cards {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .login-card {
        padding: 1.5rem;
      }

      .large-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    @media (max-width: 480px) {
      .header h1 {
        font-size: 1.5rem;
      }

      .login-card {
        padding: 1rem;
      }

      .card-icon {
        margin-bottom: 1rem;
      }

      .login-card h2 {
        font-size: 1.3rem;
      }

      .feature {
        font-size: 0.85rem;
        margin-bottom: 0.6rem;
      }
    }
  `]
})
export class UserTypeLoginComponent {
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
