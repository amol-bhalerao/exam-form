import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-refund-policy',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  template: `
    <div class="public-page">
      <mat-card class="public-card">
        <span class="eyebrow">Policy</span>
        <h1>Refund Policy</h1>
        <p class="updated">Last updated: April 2026</p>

        <section>
          <h2>1. Exam Fee Nature</h2>
          <p>Exam application fees are collected for processing and examination administration. Students should carefully verify all details before proceeding to payment.</p>
        </section>

        <section>
          <h2>2. Non-Refundable Cases</h2>
          <p>Fees are generally non-refundable once payment is successfully captured and the application is submitted, except where a refund is explicitly approved by the institute or governing authority.</p>
        </section>

        <section>
          <h2>3. Failed or Duplicate Transactions</h2>
          <p>If a payment fails but the amount is debited, or if duplicate payment is detected, the case will be reviewed and processed according to bank, gateway, and institutional guidelines.</p>
        </section>

        <section>
          <h2>4. Refund Processing Time</h2>
          <p>Approved refunds, when applicable, may take 7 to 10 working days to reflect in the original payment source, depending on the banking channel.</p>
        </section>

        <section>
          <h2>5. Support</h2>
          <p>For refund-related queries, contact <a href="mailto:contact@hscexam.in">contact&#64;hscexam.in</a> with the student details, application ID, and payment reference number.</p>
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
export class RefundPolicyComponent {}
