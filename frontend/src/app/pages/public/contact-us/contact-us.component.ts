import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="public-page">
      <mat-card class="public-card">
        <span class="eyebrow">Support</span>
        <h1>Contact Us</h1>
        <p class="intro">For HSC exam form assistance, payment help, correction requests, or technical support, please contact the support team below.</p>

        <div class="grid">
          <div class="info-box">
            <mat-icon>mail</mat-icon>
            <div>
              <h3>Email</h3>
              <p><a href="mailto:contact@hscexam.in">contact&#64;hscexam.in</a></p>
            </div>
          </div>

          <div class="info-box">
            <mat-icon>language</mat-icon>
            <div>
              <h3>Website</h3>
              <p><a href="https://hisofttechnology.com/" target="_blank" rel="noopener">https://hisofttechnology.com/</a></p>
            </div>
          </div>

          <div class="info-box full-width">
            <mat-icon>schedule</mat-icon>
            <div>
              <h3>Support Hours</h3>
              <p>Monday to Saturday, 10:00 AM to 6:00 PM IST. Queries received outside business hours are handled on the next working day.</p>
            </div>
          </div>
        </div>

        <div class="actions">
          <a mat-raised-button color="primary" routerLink="/">Back to Home</a>
          <a mat-stroked-button routerLink="/refund-policy">Refund Policy</a>
        </div>
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
      margin: 0 0 8px;
      color: #0f172a;
    }

    .intro {
      margin: 0 0 18px;
      color: #475569;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .info-box.full-width {
      grid-column: 1 / -1;
    }

    .info-box mat-icon {
      color: #2563eb;
    }

    .info-box h3 {
      margin: 0 0 4px;
      font-size: 1rem;
      color: #0f172a;
    }

    .info-box p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }

    .info-box a {
      color: #1d4ed8;
      text-decoration: none;
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
  `]
})
export class ContactUsComponent {}
