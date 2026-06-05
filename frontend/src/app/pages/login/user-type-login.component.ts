import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';

@Component({
  selector: 'app-user-type-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="user-type-container">
      <div class="ambient-shape shape-one"></div>
      <div class="ambient-shape shape-two"></div>

      <div class="header">
        <img [src]="branding.getLogoUrl()" alt="HSC Exam Portal Logo" class="header-logo" />
        <span class="eyebrow">HSC / SSC Exam Portal</span>
        <h1>{{ i18n.t('selectUserType') || 'Select Login Type' }}</h1>
        <p class="subtitle">Choose the correct login for your role. आपल्या भूमिकेनुसार योग्य लॉगिन निवडा.</p>
        <div class="login-instructions">
          <div><mat-icon>school</mat-icon><span>Students can fill profiles, apply for active exams, pay fees, and print verified forms. विद्यार्थी प्रोफाइल, अर्ज, पेमेंट आणि प्रिंट प्रक्रिया करू शकतात.</span></div>
          <div><mat-icon>apartment</mat-icon><span>Institutes must complete setup first: details, teachers, subject mapping, and capacity. संस्थांनी प्रथम माहिती, शिक्षक, विषय आणि क्षमता सेट करावी.</span></div>
          <div><mat-icon>admin_panel_settings</mat-icon><span>Board users manage exams, institutes, applications, and reports for their own board only. बोर्ड वापरकर्ते त्यांच्या बोर्डचा डेटा व्यवस्थापित करतात.</span></div>
        </div>
      </div>

      <div class="login-cards">
        <div class="login-card student-card">
          <div class="card-icon">
            <mat-icon class="large-icon">school</mat-icon>
          </div>
          <h2>Student</h2>
          <p class="description">Fill exam form and apply for exams. परीक्षा अर्ज भरा आणि स्थिती तपासा.</p>
          <div class="features">
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Profile and exam form</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Google Sign-In</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Payment and print form</span>
            </div>
          </div>
          <button mat-raised-button color="primary" class="full-width" (click)="navigateTo('/google-login')">
            <mat-icon>login</mat-icon>
            Student Login
          </button>
        </div>

        <div class="login-card institute-card">
          <div class="card-icon">
            <mat-icon class="large-icon">apartment</mat-icon>
          </div>
          <h2>Institute</h2>
          <p class="description">Manage institute setup and student applications. संस्था सेटअप आणि अर्ज पडताळणी करा.</p>
          <div class="features">
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Institute details setup</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Teachers and subjects</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Verify applications</span>
            </div>
          </div>
          <button mat-raised-button color="accent" class="full-width" (click)="navigateTo('/institute-login')">
            <mat-icon>login</mat-icon>
            Institute Login
          </button>
        </div>

        <div class="login-card board-card">
          <div class="card-icon">
            <mat-icon class="large-icon">admin_panel_settings</mat-icon>
          </div>
          <h2>Board</h2>
          <p class="description">Manage board exams, institutes, and reports. बोर्ड परीक्षा, संस्था आणि अहवाल व्यवस्थापित करा.</p>
          <div class="features">
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Create exams</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>View applications</span>
            </div>
            <div class="feature">
              <mat-icon>check_circle</mat-icon>
              <span>Board-wise dashboards</span>
            </div>
          </div>
          <button mat-raised-button color="warn" class="full-width" (click)="navigateTo('/board-login')">
            <mat-icon>login</mat-icon>
            Board Login
          </button>
        </div>
      </div>

      <div class="footer-info">
        <button mat-stroked-button class="letter-btn" (click)="navigateTo('/institute-letter')">
          <mat-icon>description</mat-icon>
          Generate Institute Letter Of Concern
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-type-container {
      position: relative;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      opacity: 0.5;
      background: rgba(255, 255, 255, 0.16);
    }

    .shape-one {
      width: 260px;
      height: 260px;
      right: -90px;
      top: 52px;
    }

    .shape-two {
      width: 190px;
      height: 190px;
      left: -58px;
      bottom: 8%;
    }

    .header {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      margin-bottom: 2rem;
      max-width: 980px;
    }

    .header-logo {
      width: 92px;
      height: 92px;
      margin-bottom: 14px;
      border-radius: 26px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 24px 54px rgba(0, 0, 0, 0.22);
      padding: 8px;
    }

    .eyebrow {
      display: inline-flex;
      margin-bottom: 10px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .header h1 {
      font-size: clamp(2rem, 5vw, 4rem);
      margin: 0 0 0.5rem 0;
      font-weight: 900;
      letter-spacing: -0.06em;
    }

    .header .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
      line-height: 1.55;
    }

    .login-instructions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 20px;
      text-align: left;
    }

    .login-instructions div {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 10px;
      align-items: start;
      padding: 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      line-height: 1.45;
      font-size: 0.88rem;
      font-weight: 650;
    }

    .login-instructions mat-icon {
      color: #fff;
      width: 24px;
      height: 24px;
      font-size: 24px;
    }

    .login-cards {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(3, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1100px;
      width: 100%;
      margin-bottom: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 28px;
      padding: 2rem;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.28);
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

    .board-card::before {
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

    .board-card .large-icon {
      color: #ff9800;
    }

    .login-card h2 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      color: #333;
      font-weight: 600;
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

    .board-card .feature mat-icon {
      color: #ff9800;
    }

    button.full-width {
      width: 100%;
      margin-top: auto;
      padding: 0.8rem;
      font-size: 1rem;
      font-weight: 600;
    }

    button.full-width mat-icon {
      margin-right: 0.5rem;
    }

    .footer-info {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      font-size: 0.95rem;
    }

    .letter-btn {
      margin-top: 0.8rem;
      color: #fff;
      border-color: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 1024px) {
      .login-cards {
        grid-template-columns: repeat(2, minmax(280px, 1fr));
      }

      .login-instructions {
        grid-template-columns: 1fr;
      }
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
  readonly branding = inject(BrandingService);
  private readonly router = inject(Router);

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
