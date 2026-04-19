import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  template: `
    <div class="public-page">
      <mat-card class="public-card">
        <span class="eyebrow">Policy</span>
        <h1>Terms and Conditions</h1>
        <p class="updated">Last updated: April 2026</p>

        <section>
          <h2>1. Acceptance</h2>
          <p>By using the HSC Exam Management System, you agree to submit true and complete information and to follow the instructions issued by the institute and examination authority.</p>
        </section>

        <section>
          <h2>2. Student Responsibility</h2>
          <p>Students are responsible for verifying profile data, selected stream, subjects, uploaded information, and exam details before making payment and final submission.</p>
        </section>

        <section>
          <h2>3. Payment and Submission</h2>
          <p>Application fee payment is processed through Cashfree. An application is treated as finally submitted only after successful payment confirmation and system acknowledgement.</p>
        </section>

        <section>
          <h2>4. Correction Requests</h2>
          <p>Any correction after payment or submission is subject to institute rules, exam deadlines, and approval by the authorized administration.</p>
        </section>

        <section>
          <h2>5. Service Availability</h2>
          <p>Reasonable efforts are made to keep the portal available and secure. Scheduled maintenance, network issues, or force majeure events may cause temporary interruptions.</p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p>For technical support or policy questions, please visit the <a routerLink="/contact-us">Contact Us</a> page.</p>
        </section>
      </mat-card>
    </div>
  `,
  styles: [`
    .public-page {
      padding: 24px 12px 40px;
      display: grid;
      place-items: start center;
    }

    .public-card {
      width: min(900px, 100%);
      padding: 24px;
      border-radius: 16px;
    }

    .eyebrow {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 10px;
    }

    h1 {
      margin: 0 0 6px;
      color: #0f172a;
    }

    .updated {
      margin: 0 0 18px;
      color: #64748b;
    }

    section + section {
      margin-top: 16px;
    }

    h2 {
      margin: 0 0 6px;
      font-size: 1.05rem;
      color: #0f172a;
    }

    p {
      margin: 0;
      color: #475569;
      line-height: 1.65;
    }

    a {
      color: #1d4ed8;
      text-decoration: none;
    }
  `]
})
export class TermsAndConditionsComponent {}
