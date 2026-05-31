import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

type LoginCard = {
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
  route: string;
  action: string;
  tone: 'student' | 'institute' | 'board';
  points: string[];
  meta: string;
};

@Component({
  selector: 'app-user-type-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <main class="login-page">
      <section class="hero-panel">
        <div class="hero-copy">
          <span class="kicker">Maharashtra HSC Exam Services</span>
          <h1>Choose your secure portal</h1>
          <p>
            Students, institutes, and board officers can access the exam workflow from one
            trusted login page. Select the card that matches your role to continue.
          </p>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="document document-main">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="document document-side">
            <mat-icon>verified</mat-icon>
          </div>
          <div class="orb orb-one"></div>
          <div class="orb orb-two"></div>
        </div>
      </section>

      <section class="login-cards" aria-label="Login options">
        @for (card of cards; track card.title) {
          <article class="login-card" [class]="card.tone">
            <div class="card-visual">
              <div class="icon-badge">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <span>{{ card.eyebrow }}</span>
            </div>

            <div class="card-body">
              <h2>{{ card.title }}</h2>
              <p class="description">{{ card.description }}</p>

              <div class="feature-list">
                @for (point of card.points; track point) {
                  <div class="feature">
                    <mat-icon>task_alt</mat-icon>
                    <span>{{ point }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="card-footer">
              <p>{{ card.meta }}</p>
              <button mat-raised-button type="button" class="login-button" (click)="navigateTo(card.route)">
                <mat-icon>login</mat-icon>
                {{ card.action }}
              </button>
            </div>
          </article>
        }
      </section>

      <section class="support-strip">
        <div>
          <strong>New institute request?</strong>
          <span>Generate the institute letter of concern before portal onboarding.</span>
        </div>
        <button mat-stroked-button type="button" (click)="navigateTo('/institute-letter')">
          <mat-icon>description</mat-icon>
          Institute Letter
        </button>
      </section>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      padding: clamp(20px, 4vw, 48px);
      background:
        radial-gradient(circle at 12% 10%, rgba(246, 183, 62, 0.26), transparent 28%),
        radial-gradient(circle at 88% 14%, rgba(38, 116, 170, 0.22), transparent 30%),
        linear-gradient(135deg, #f8f3e7 0%, #edf5f7 48%, #f7efe1 100%);
      color: #172033;
      font-family: "Aptos", "Segoe UI", sans-serif;
    }

    .hero-panel {
      width: min(1180px, 100%);
      margin: 0 auto 24px;
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
      gap: 28px;
      align-items: stretch;
      padding: clamp(24px, 4vw, 44px);
      border: 1px solid rgba(23, 32, 51, 0.08);
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.74);
      box-shadow: 0 28px 80px rgba(33, 53, 85, 0.13);
      backdrop-filter: blur(16px);
      overflow: hidden;
    }

    .kicker {
      display: inline-flex;
      margin-bottom: 14px;
      padding: 7px 12px;
      border-radius: 999px;
      background: #102a43;
      color: #fff7e6;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero-copy h1 {
      max-width: 720px;
      margin: 0;
      font-size: clamp(2.15rem, 5vw, 4.85rem);
      line-height: 0.94;
      letter-spacing: -0.07em;
      color: #0f2236;
    }

    .hero-copy p {
      max-width: 720px;
      margin: 18px 0 0;
      color: #42526a;
      font-size: clamp(1rem, 1.7vw, 1.2rem);
      line-height: 1.65;
    }

    .hero-art {
      position: relative;
      min-height: 260px;
      border-radius: 24px;
      background:
        linear-gradient(145deg, rgba(13, 60, 97, 0.94), rgba(36, 92, 107, 0.9)),
        repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 10px);
      overflow: hidden;
    }

    .document {
      position: absolute;
      background: #fffaf1;
      border-radius: 18px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    }

    .document-main {
      left: 40px;
      top: 48px;
      width: 170px;
      height: 210px;
      padding: 28px 22px;
      transform: rotate(-7deg);
    }

    .document-main span {
      display: block;
      height: 12px;
      margin-bottom: 18px;
      border-radius: 999px;
      background: #d6e2e8;
    }

    .document-main span:nth-child(1) {
      width: 72%;
      background: #f0a83a;
    }

    .document-main span:nth-child(2) {
      width: 100%;
    }

    .document-main span:nth-child(3) {
      width: 82%;
    }

    .document-side {
      right: 34px;
      bottom: 38px;
      width: 118px;
      height: 144px;
      display: grid;
      place-items: center;
      transform: rotate(9deg);
    }

    .document-side mat-icon {
      width: 56px;
      height: 56px;
      font-size: 56px;
      color: #1b7f5a;
    }

    .orb {
      position: absolute;
      border-radius: 999px;
      filter: blur(1px);
    }

    .orb-one {
      width: 120px;
      height: 120px;
      right: -34px;
      top: -28px;
      background: rgba(240, 168, 58, 0.72);
    }

    .orb-two {
      width: 76px;
      height: 76px;
      left: 24px;
      bottom: 24px;
      background: rgba(88, 178, 155, 0.74);
    }

    .login-cards {
      width: min(1180px, 100%);
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .login-card {
      min-height: 430px;
      display: flex;
      flex-direction: column;
      border-radius: 26px;
      overflow: hidden;
      border: 1px solid rgba(23, 32, 51, 0.08);
      background: #fff;
      box-shadow: 0 22px 54px rgba(33, 53, 85, 0.12);
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .login-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 28px 68px rgba(33, 53, 85, 0.18);
    }

    .card-visual {
      min-height: 126px;
      padding: 22px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      color: #fff;
    }

    .student .card-visual {
      background: linear-gradient(135deg, #1b7f5a, #54b385);
    }

    .institute .card-visual {
      background: linear-gradient(135deg, #0f5f8c, #47a3c4);
    }

    .board .card-visual {
      background: linear-gradient(135deg, #8a4f12, #e09832);
    }

    .icon-badge {
      width: 72px;
      height: 72px;
      display: grid;
      place-items: center;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.28);
    }

    .icon-badge mat-icon {
      width: 42px;
      height: 42px;
      font-size: 42px;
    }

    .card-visual > span {
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .card-body {
      padding: 24px 24px 8px;
      flex: 1;
    }

    .card-body h2 {
      margin: 0;
      color: #111827;
      font-size: 1.55rem;
      letter-spacing: -0.03em;
    }

    .description {
      min-height: 56px;
      margin: 10px 0 18px;
      color: #566174;
      line-height: 1.55;
    }

    .feature-list {
      display: grid;
      gap: 11px;
    }

    .feature {
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 10px;
      align-items: start;
      color: #273449;
      font-size: 0.94rem;
      line-height: 1.4;
    }

    .feature mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: #1b7f5a;
    }

    .card-footer {
      padding: 18px 24px 24px;
      border-top: 1px solid #edf0f4;
    }

    .card-footer p {
      min-height: 40px;
      margin: 0 0 14px;
      color: #657287;
      font-size: 0.88rem;
      line-height: 1.45;
    }

    .login-button {
      width: 100%;
      min-height: 48px;
      border-radius: 14px;
      font-weight: 800;
    }

    .login-button mat-icon {
      margin-right: 8px;
    }

    .support-strip {
      width: min(1180px, 100%);
      margin: 20px auto 0;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border-radius: 20px;
      background: rgba(16, 42, 67, 0.92);
      color: #fff;
      box-shadow: 0 16px 42px rgba(33, 53, 85, 0.18);
    }

    .support-strip strong,
    .support-strip span {
      display: block;
    }

    .support-strip span {
      margin-top: 3px;
      color: rgba(255, 255, 255, 0.78);
    }

    .support-strip button {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.55);
      flex: 0 0 auto;
    }

    @media (max-width: 980px) {
      .hero-panel {
        grid-template-columns: 1fr;
      }

      .hero-art {
        min-height: 220px;
      }

      .login-cards {
        grid-template-columns: 1fr;
      }

      .login-card {
        min-height: auto;
      }

      .description,
      .card-footer p {
        min-height: auto;
      }
    }

    @media (max-width: 640px) {
      .login-page {
        padding: 14px;
      }

      .hero-panel {
        border-radius: 22px;
      }

      .hero-art {
        display: none;
      }

      .support-strip {
        align-items: stretch;
        flex-direction: column;
      }

      .support-strip button {
        width: 100%;
      }
    }
  `]
})
export class UserTypeLoginComponent {
  private readonly router = inject(Router);

  readonly cards: LoginCard[] = [
    {
      title: 'Student Login',
      eyebrow: 'Exam Form',
      description: 'Apply for HSC examination, complete profile details, pay exam fees, and print receipts or submitted forms.',
      icon: 'school',
      route: '/google-login',
      action: 'Continue as Student',
      tone: 'student',
      meta: 'Use Google Sign-In linked with your student profile.',
      points: [
        'Fill and submit exam forms online',
        'Pay securely through Cashfree live gateway',
        'Download payment receipt and printable form'
      ]
    },
    {
      title: 'Institute Login',
      eyebrow: 'College Portal',
      description: 'Review student applications, verify submitted forms, manage subjects, streams, and institute records.',
      icon: 'apartment',
      route: '/institute-login',
      action: 'Continue as Institute',
      tone: 'institute',
      meta: 'For approved institute users with issued credentials.',
      points: [
        'Verify submitted student exam forms',
        'Manage institute stream and subject setup',
        'Maintain teacher and application records'
      ]
    },
    {
      title: 'Board Login',
      eyebrow: 'Board Office',
      description: 'Monitor exams, applications, payments, teacher records, reports, and board-level verification workflows.',
      icon: 'admin_panel_settings',
      route: '/board-login',
      action: 'Continue as Board',
      tone: 'board',
      meta: 'For authorized board officers and administrators.',
      points: [
        'Create and manage exam sessions',
        'Track applications, payments, and reports',
        'Approve forms and print official records'
      ]
    }
  ];

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
