import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrandingService } from '../core/branding.service';

@Component({
  selector: 'app-board-presentation-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <main class="presentation-page">
      <section class="hero">
        <div class="hero-copy">
          <div class="brand-row">
            <img [src]="branding.getLogoUrl()" alt="HSC Exam Portal Logo" />
            <span>Board Customer Presentation</span>
          </div>
          <h1>Secure HSC / SSC Exam Portal for Board-led operations</h1>
          <p class="lead-en">A bilingual digital workflow for exam creation, institute setup, student applications, verification, payment tracking and printable exam forms.</p>
          <p class="lead-mr">परीक्षा निर्मिती, संस्था सेटअप, विद्यार्थी अर्ज, पडताळणी, पेमेंट ट्रॅकिंग आणि प्रिंट फॉर्मसाठी सुरक्षित डिजिटल प्रणाली.</p>
          <div class="hero-actions">
            <button mat-raised-button type="button" (click)="scrollTo('security')">
              <mat-icon>shield</mat-icon>
              Data Safety
            </button>
            <button mat-stroked-button type="button" (click)="scrollTo('workflow')">
              <mat-icon>timeline</mat-icon>
              View Workflow
            </button>
          </div>
        </div>

        <div class="hero-panel">
          <div class="metric-card primary">
            <strong>Role based</strong>
            <span>भूमिकेनुसार प्रवेश</span>
          </div>
          <div class="metric-card no-public">
            <strong>No public data</strong>
            <span>सार्वजनिक डेटा प्रवेश नाही</span>
          </div>
          <div class="metric-card authority">
            <strong>Authority managed</strong>
            <span>उच्च अधिकाऱ्यांचे नियंत्रण</span>
          </div>
        </div>
      </section>

      <section class="section" id="workflow">
        <div class="section-heading">
          <span class="eyebrow">Portal Story</span>
          <h2>One system coordinates Board, Institute and Student users.</h2>
          <p>एकाच पोर्टलमधून बोर्ड, संस्था आणि विद्यार्थी यांची परीक्षा प्रक्रिया स्पष्ट आणि नियंत्रित पद्धतीने चालते.</p>
        </div>

        <div class="workflow-grid">
          <article *ngFor="let item of workflow; let i = index" class="workflow-card">
            <div class="step">{{ i + 1 | number:'2.0' }}</div>
            <mat-icon>{{ item.icon }}</mat-icon>
            <h3>{{ item.en }}</h3>
            <p>{{ item.mr }}</p>
          </article>
        </div>
      </section>

      <section class="section board-strip">
        <div>
          <span class="eyebrow light">Board Value</span>
          <h2>Board users get operational control, not only reports.</h2>
          <p>बोर्ड वापरकर्त्यांना परीक्षा सत्र, अर्ज स्थिती, संस्था आणि पडताळणी यावर नियंत्रण मिळते.</p>
        </div>
        <div class="value-list">
          <div *ngFor="let item of boardValue">
            <mat-icon>check_circle</mat-icon>
            <span>{{ item }}</span>
          </div>
        </div>
      </section>

      <section class="section feature-update">
        <div class="section-heading compact">
          <span class="eyebrow">New Board Dashboard</span>
          <h2>Institute monitoring is now available inside Board Login.</h2>
          <p>बोर्ड लॉगिनमध्ये संस्था यादी, जिल्हानिहाय विभागणी, HSC/SSC प्रकार आणि सद्यस्थिती पाहता येते.</p>
        </div>

        <div class="feature-grid">
          <article *ngFor="let item of instituteDashboard" class="feature-card">
            <mat-icon>{{ item.icon }}</mat-icon>
            <strong>{{ item.en }}</strong>
            <span>{{ item.mr }}</span>
          </article>
        </div>
      </section>

      <section class="section" id="security">
        <div class="section-heading compact">
          <span class="eyebrow">Data Safety</span>
          <h2>Data is visible only to the relevant and permitted user.</h2>
          <p>डेटा फक्त संबंधित आणि परवानगी असलेल्या वापरकर्त्यासच दिसतो. परवानगीशिवाय कोणालाही डेटा प्रवेश नाही.</p>
        </div>

        <div class="security-grid">
          <article *ngFor="let item of security" class="security-card">
            <div class="security-icon"><mat-icon>{{ item.icon }}</mat-icon></div>
            <h3>{{ item.en }}</h3>
            <p>{{ item.mr }}</p>
          </article>
        </div>
      </section>

      <section class="section technical-security">
        <div class="section-heading compact">
          <span class="eyebrow">Technical Protection</span>
          <h2>Security controls protect the portal from common web risks.</h2>
          <p>SSL, सुरक्षित क्लाउड होस्टिंग, Google login, server-side validation आणि database protection यामुळे पोर्टल अधिक सुरक्षित राहते.</p>
        </div>

        <div class="technical-grid">
          <article *ngFor="let item of technicalSecurity" class="technical-card">
            <mat-icon>{{ item.icon }}</mat-icon>
            <div>
              <h3>{{ item.en }}</h3>
              <p>{{ item.mr }}</p>
            </div>
          </article>
        </div>

        <div class="security-note">
          <mat-icon>verified_user</mat-icon>
          <div>
            <strong>No system should be described as impossible to hack; this portal reduces risk through layered controls.</strong>
            <span>कोणतीही प्रणाली 100% hack-proof म्हणता येत नाही; परंतु हे पोर्टल अनेक सुरक्षा स्तरांमुळे धोका कमी करते.</span>
          </div>
        </div>
      </section>

      <section class="section access-section">
        <div class="section-heading compact">
          <span class="eyebrow">Access Model</span>
          <h2>Every role has a controlled data boundary.</h2>
          <p>प्रत्येक भूमिकेसाठी डेटा पाहण्याची सीमा स्पष्टपणे नियंत्रित आहे.</p>
        </div>

        <div class="access-table">
          <div class="access-row header">
            <span>User</span>
            <span>Accessible data</span>
            <span>मराठी माहिती</span>
          </div>
          <div class="access-row" *ngFor="let row of accessRows">
            <strong>{{ row.role }}</strong>
            <span>{{ row.en }}</span>
            <span>{{ row.mr }}</span>
          </div>
        </div>
      </section>

      <section class="section governance-section">
        <div class="governance-copy">
          <span class="eyebrow">Governance</span>
          <h2>Users are managed by higher authority.</h2>
          <p>वापरकर्ते उच्च अधिकाऱ्यांच्या नियंत्रणाखाली तयार, मंजूर आणि व्यवस्थापित केले जातात.</p>
          <p class="note">No ordinary user can download all data. Reports and prints are available only as per role and workflow need.</p>
          <p class="note-mr">कोणत्याही सामान्य वापरकर्त्यास संपूर्ण डेटा डाउनलोड करता येत नाही. रिपोर्ट आणि प्रिंट फक्त भूमिका व प्रक्रियेच्या गरजेनुसार उपलब्ध असतात.</p>
        </div>
        <div class="governance-flow">
          <div>Higher Authority<br /><span>उच्च अधिकारी</span></div>
          <mat-icon>arrow_forward</mat-icon>
          <div>Board / Institute Users<br /><span>बोर्ड / संस्था वापरकर्ते</span></div>
          <mat-icon>arrow_forward</mat-icon>
          <div>Permitted Workflows<br /><span>परवानगी असलेली प्रक्रिया</span></div>
        </div>
      </section>

      <section class="section demo-section">
        <div>
          <span class="eyebrow light">Demo Ready</span>
          <h2>Recommended customer demo path</h2>
          <p>बोर्ड ग्राहकांसाठी सुचवलेला डेमो क्रम</p>
        </div>
        <div class="demo-steps">
          <div *ngFor="let item of demoSteps">{{ item }}</div>
        </div>
        <div class="demo-actions">
          <button mat-raised-button type="button" (click)="go('/board-login')">
            <mat-icon>admin_panel_settings</mat-icon>
            Board Login
          </button>
          <button mat-stroked-button type="button" (click)="go('/login')">
            <mat-icon>login</mat-icon>
            All Login Options
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }

    .presentation-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #1f2937;
      font-family: 'Segoe UI', 'Nirmala UI', sans-serif;
      overflow-x: hidden;
    }

    .hero {
      min-height: 92vh;
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
      gap: clamp(24px, 5vw, 72px);
      align-items: center;
      padding: clamp(28px, 6vw, 76px);
      color: white;
      position: relative;
    }

    .hero::before,
    .hero::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.13);
      pointer-events: none;
    }

    .hero::before {
      width: 340px;
      height: 340px;
      right: -120px;
      top: 42px;
    }

    .hero::after {
      width: 220px;
      height: 220px;
      left: -70px;
      bottom: 20px;
    }

    .hero-copy,
    .hero-panel {
      position: relative;
      z-index: 1;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 26px;
    }

    .brand-row img {
      width: 72px;
      height: 72px;
      border-radius: 22px;
      background: white;
      box-shadow: 0 18px 42px rgba(0,0,0,0.16);
    }

    .brand-row span,
    .eyebrow {
      display: inline-flex;
      width: fit-content;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      color: white;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .eyebrow {
      background: #eef2ff;
      color: #667eea;
      margin-bottom: 14px;
    }

    .eyebrow.light {
      background: rgba(255,255,255,0.18);
      color: #fff;
    }

    h1,
    h2,
    h3,
    p {
      margin-top: 0;
    }

    h1 {
      max-width: 900px;
      font-size: clamp(2.6rem, 6vw, 5.9rem);
      line-height: 0.9;
      letter-spacing: -0.08em;
      margin-bottom: 24px;
      text-shadow: 0 22px 52px rgba(0,0,0,0.16);
    }

    .lead-en,
    .lead-mr {
      max-width: 760px;
      font-size: clamp(1.05rem, 1.8vw, 1.26rem);
      line-height: 1.65;
      color: rgba(255,255,255,0.88);
      margin-bottom: 10px;
    }

    .lead-mr {
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 700;
    }

    .hero-actions,
    .demo-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
    }

    .hero-actions button,
    .demo-actions button {
      min-height: 48px;
      border-radius: 999px;
      font-weight: 900;
    }

    .hero-actions button:first-child,
    .demo-actions button:first-child {
      background: #fff;
      color: #667eea;
    }

    .hero-actions button:last-child,
    .demo-actions button:last-child {
      color: #fff;
      border-color: rgba(255,255,255,0.72);
    }

    .hero-panel {
      display: grid;
      gap: 18px;
    }

    .metric-card {
      padding: 28px;
      border-radius: 26px;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 22px 58px rgba(0,0,0,0.12);
      backdrop-filter: blur(12px);
    }

    .metric-card.primary {
      background: #fff;
      color: #667eea;
    }

    .metric-card.no-public {
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      border-color: rgba(255,255,255,0.28);
      color: #fff;
    }

    .metric-card.authority {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      border-color: rgba(255,255,255,0.28);
      color: #fff;
    }

    .metric-card strong {
      display: block;
      font-size: clamp(1.45rem, 3vw, 2.35rem);
      line-height: 1;
      margin-bottom: 8px;
      letter-spacing: -0.04em;
    }

    .metric-card span {
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 800;
      opacity: 0.86;
    }

    .section {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto 28px;
      padding: clamp(24px, 4vw, 44px);
      border-radius: 32px;
      background: #fff;
      box-shadow: 0 22px 64px rgba(23, 32, 69, 0.18);
    }

    .section-heading {
      max-width: 820px;
      margin-bottom: 26px;
    }

    .section-heading.compact {
      max-width: 960px;
    }

    .section-heading h2,
    .board-strip h2,
    .governance-copy h2,
    .demo-section h2 {
      color: #1f2343;
      font-size: clamp(1.9rem, 4vw, 3.2rem);
      line-height: 1;
      letter-spacing: -0.06em;
      margin-bottom: 14px;
    }

    .section-heading p,
    .board-strip p,
    .governance-copy p,
    .demo-section p {
      color: #64748b;
      font-size: 1.05rem;
      line-height: 1.65;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 700;
    }

    .workflow-grid,
    .security-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    .workflow-card,
    .security-card {
      position: relative;
      padding: 22px;
      min-height: 235px;
      border-radius: 22px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .workflow-card .step {
      color: #c7d2fe;
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.06em;
    }

    .workflow-card mat-icon,
    .security-icon mat-icon {
      color: #667eea;
      width: 34px;
      height: 34px;
      font-size: 34px;
      margin: 12px 0;
    }

    .workflow-card h3,
    .security-card h3 {
      color: #1f2343;
      font-size: 1.08rem;
      margin-bottom: 8px;
    }

    .workflow-card p,
    .security-card p {
      color: #64748b;
      line-height: 1.55;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 650;
    }

    .board-strip,
    .demo-section {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
      gap: 34px;
      align-items: center;
      background: #1f2343;
      color: white;
    }

    .board-strip h2,
    .demo-section h2 {
      color: white;
    }

    .board-strip p,
    .demo-section p {
      color: rgba(255,255,255,0.78);
    }

    .value-list {
      display: grid;
      gap: 12px;
    }

    .value-list div {
      display: grid;
      grid-template-columns: 26px 1fr;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.92);
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 800;
    }

    .value-list mat-icon {
      color: #4caf50;
    }

    .security-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .security-card {
      background: #f6f7ff;
      min-height: 218px;
    }

    .feature-update {
      background:
        radial-gradient(circle at 92% 18%, rgba(102,126,234,0.14), transparent 28%),
        #ffffff;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .feature-card {
      display: grid;
      gap: 8px;
      padding: 18px;
      border: 1px solid #e0e7ff;
      border-radius: 20px;
      background: linear-gradient(180deg, #ffffff, #f8fafc);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
    }

    .feature-card mat-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      background: #eef2ff;
      color: #4f46e5;
    }

    .feature-card strong {
      color: #0f172a;
      font-size: 1rem;
    }

    .feature-card span {
      color: #64748b;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 700;
      line-height: 1.45;
    }

    .technical-security {
      background: #10172a;
      color: white;
    }

    .technical-security .eyebrow {
      background: rgba(255,255,255,0.14);
      color: #fff;
    }

    .technical-security h2 {
      color: white;
    }

    .technical-security .section-heading p {
      color: rgba(255,255,255,0.78);
    }

    .technical-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .technical-card {
      display: grid;
      grid-template-columns: 46px 1fr;
      gap: 14px;
      min-height: 148px;
      padding: 18px;
      border-radius: 20px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
    }

    .technical-card mat-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      color: #fff;
      font-size: 34px;
    }

    .technical-card h3 {
      color: #fff;
      margin-bottom: 7px;
      font-size: 1.02rem;
    }

    .technical-card p {
      margin: 0;
      color: rgba(255,255,255,0.74);
      line-height: 1.5;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 650;
    }

    .security-note {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 14px;
      align-items: start;
      margin-top: 20px;
      padding: 16px 18px;
      border-radius: 18px;
      background: rgba(255,152,0,0.14);
      border: 1px solid rgba(255,152,0,0.28);
    }

    .security-note mat-icon {
      color: #ffb74d;
    }

    .security-note strong,
    .security-note span {
      display: block;
    }

    .security-note strong {
      color: #fff;
      margin-bottom: 5px;
    }

    .security-note span {
      color: rgba(255,255,255,0.75);
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 700;
    }

    .security-icon {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 12px 28px rgba(102,126,234,0.14);
      margin-bottom: 12px;
    }

    .access-section {
      background: #f8fafc;
    }

    .access-table {
      overflow: hidden;
      border-radius: 22px;
      border: 1px solid #dbe3f2;
      background: white;
    }

    .access-row {
      display: grid;
      grid-template-columns: 1.1fr 1.45fr 1.65fr;
      gap: 16px;
      padding: 17px 20px;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
      color: #475569;
    }

    .access-row:last-child {
      border-bottom: 0;
    }

    .access-row.header {
      background: #1f2343;
      color: white;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.78rem;
    }

    .access-row strong {
      color: #667eea;
      font-size: 1.04rem;
    }

    .access-row span:last-child {
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 650;
    }

    .governance-section {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1.1fr);
      gap: 34px;
      align-items: center;
    }

    .note {
      color: #1f2343 !important;
      font-family: 'Segoe UI', sans-serif !important;
      font-weight: 900 !important;
    }

    .note-mr {
      color: #667eea !important;
    }

    .governance-flow {
      display: grid;
      grid-template-columns: 1fr 42px 1fr 42px 1fr;
      gap: 10px;
      align-items: center;
    }

    .governance-flow div {
      min-height: 132px;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 18px;
      border-radius: 22px;
      background: #eef2ff;
      color: #1f2343;
      font-weight: 900;
    }

    .governance-flow span {
      color: #667eea;
      font-family: 'Nirmala UI', sans-serif;
      font-size: 0.88rem;
    }

    .governance-flow mat-icon {
      color: #667eea;
    }

    .demo-section {
      margin-bottom: 56px;
    }

    .demo-steps {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .demo-steps div {
      padding: 15px 16px;
      border-radius: 16px;
      background: rgba(255,255,255,0.1);
      color: white;
      font-family: 'Nirmala UI', sans-serif;
      font-weight: 800;
    }

    .demo-actions {
      grid-column: 1 / -1;
      margin-top: 6px;
    }

    @media (max-width: 980px) {
      .hero,
      .board-strip,
      .governance-section,
      .demo-section {
        grid-template-columns: 1fr;
      }

      .workflow-grid,
      .security-grid,
      .feature-grid,
      .technical-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .governance-flow {
        grid-template-columns: 1fr;
      }

      .governance-flow mat-icon {
        transform: rotate(90deg);
        margin: 0 auto;
      }
    }

    @media (max-width: 640px) {
      .hero {
        padding: 24px 16px 34px;
        min-height: auto;
      }

      .workflow-grid,
      .security-grid,
      .feature-grid,
      .technical-grid,
      .demo-steps {
        grid-template-columns: 1fr;
      }

      .access-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .section {
        width: calc(100% - 20px);
        padding: 22px;
        border-radius: 24px;
      }
    }
  `]
})
export class BoardPresentationLandingComponent {
  readonly branding = inject(BrandingService);
  private readonly router = inject(Router);

  readonly workflow = [
    { icon: 'admin_panel_settings', en: 'Board creates and controls exams', mr: 'बोर्ड परीक्षा सत्र, विषय आणि अंतिम पडताळणी नियंत्रित करतो.' },
    { icon: 'apartment', en: 'Institute completes setup', mr: 'संस्था माहिती, शिक्षक, विषय मॅपिंग आणि क्षमता सेट करते.' },
    { icon: 'school', en: 'Student submits form', mr: 'विद्यार्थी प्रोफाइल, अर्ज, पेमेंट आणि प्रिंट प्रक्रिया पूर्ण करतो.' },
    { icon: 'verified_user', en: 'Verification becomes trackable', mr: 'अर्ज स्थिती, पडताळणी आणि प्रिंट नियंत्रण ट्रॅक करता येते.' }
  ];

  readonly boardValue = [
    'Create and manage HSC / SSC exam sessions | HSC / SSC परीक्षा सत्र व्यवस्थापन',
    'Monitor submitted applications and verification status | अर्ज व पडताळणी स्थिती निरीक्षण',
    'Review institute dashboard and district-wise status | संस्था डॅशबोर्ड आणि जिल्हानिहाय स्थिती पाहणे',
    'Publish news, notices and exam updates | सूचना, बातम्या आणि अपडेट्स प्रसिद्ध करणे'
  ];

  readonly instituteDashboard = [
    { icon: 'apartment', en: 'All institute list', mr: 'सर्व संस्था एकाच यादीत पाहता येतात.' },
    { icon: 'map', en: 'District-wise view', mr: 'जिल्ह्यानुसार संस्था संख्या आणि फिल्टर उपलब्ध.' },
    { icon: 'verified', en: 'Current status', mr: 'APPROVED, PENDING, DISABLED स्थिती स्पष्ट दिसते.' },
    { icon: 'manage_accounts', en: 'Institute user registration', mr: 'नोंदणीकृत आणि नोंदणी बाकी संस्था जिल्ह्यानुसार ट्रॅक करता येतात.' },
    { icon: 'admin_panel_settings', en: 'Super Admin combined view', mr: 'Super Admin ला HSC आणि SSC दोन्ही संस्थांचा एकत्रित dashboard दिसतो.' },
    { icon: 'school', en: 'HSC / SSC visibility', mr: 'संस्था HSC किंवा SSC प्रकारानुसार ओळखता येते.' }
  ];

  readonly security = [
    { icon: 'lock', en: 'Login required', mr: 'लॉगिनशिवाय संवेदनशील डेटा पाहता येत नाही.' },
    { icon: 'badge', en: 'Role based access', mr: 'वापरकर्त्याच्या भूमिकेनुसारच माहिती दिसते.' },
    { icon: 'domain_verification', en: 'Institute boundary', mr: 'संस्थेला फक्त स्वतःच्या संस्थेची माहिती दिसते.' },
    { icon: 'manage_accounts', en: 'Authority managed users', mr: 'वापरकर्ते उच्च अधिकाऱ्यांच्या नियंत्रणाखाली व्यवस्थापित होतात.' },
    { icon: 'download_done', en: 'Restricted exports', mr: 'संपूर्ण डेटा अनधिकृतपणे डाउनलोड करता येत नाही.' },
    { icon: 'fact_check', en: 'Workflow controlled print', mr: 'प्रिंट आणि रिपोर्ट स्थिती व परवानगीनुसार उपलब्ध असतात.' }
  ];

  readonly technicalSecurity = [
    {
      icon: 'https',
      en: 'SSL / HTTPS encrypted connection',
      mr: 'वेबसाइट HTTPS/SSL वर चालते, त्यामुळे browser आणि server मधील माहिती encrypted राहते.'
    },
    {
      icon: 'cloud_done',
      en: 'Cloud data-center hosting',
      mr: 'डेटा cloud data center मध्ये host होतो, जिथे server access आणि infrastructure नियंत्रणाखाली असते.'
    },
    {
      icon: 'login',
      en: 'Google login for students',
      mr: 'विद्यार्थ्यांसाठी Google login वापरल्याने password handling कमी होते आणि trusted authentication मिळते.'
    },
    {
      icon: 'data_object',
      en: 'SQL injection protection',
      mr: 'Backend मध्ये ORM/parameterized database access वापरल्याने raw SQL injection चा धोका कमी होतो.'
    },
    {
      icon: 'rule',
      en: 'Server-side validation',
      mr: 'महत्त्वाची validation server-side होते, त्यामुळे चुकीचा किंवा manipulated data थेट स्वीकारला जात नाही.'
    },
    {
      icon: 'shield',
      en: 'Layered protection from hackers',
      mr: 'Authentication, role permission, input checks आणि controlled APIs यांचे अनेक सुरक्षा स्तर hacker risk कमी करतात.'
    }
  ];

  readonly accessRows = [
    { role: 'Student', en: 'Own profile, own applications, own payments', mr: 'विद्यार्थ्यास स्वतःचा प्रोफाइल, अर्ज आणि पेमेंट दिसते.' },
    { role: 'Institute', en: 'Applications and setup for that institute only', mr: 'संस्थेला फक्त स्वतःच्या संस्थेचे अर्ज आणि सेटअप दिसतो.' },
    { role: 'Board', en: 'Board exam operations, verification and monitoring', mr: 'बोर्डला परीक्षा ऑपरेशन, पडताळणी आणि निरीक्षण दिसते.' },
    { role: 'Higher Authority', en: 'User approval and controlled administration', mr: 'उच्च अधिकाऱ्यांना वापरकर्ता मंजुरी आणि नियंत्रित प्रशासन करता येते.' }
  ];

  readonly demoSteps = [
    '1. Board Login | बोर्ड लॉगिन',
    '2. Create Exam | परीक्षा तयार करणे',
    '3. Institute Setup | संस्था सेटअप',
    '4. Student Application | विद्यार्थी अर्ज',
    '5. Verification + Print | पडताळणी + प्रिंट',
    '6. Reports + Safety Controls | रिपोर्ट + सुरक्षा नियंत्रण'
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  go(path: string): void {
    this.router.navigate([path]);
  }
}
