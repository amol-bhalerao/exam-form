import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { API_BASE_URL } from '../../../core/api';

type VerificationResponse = {
  valid: boolean;
  verifiedAt: string;
  document?: {
    applicationId: number;
    applicationNo: string;
    status: string;
    candidateType: string;
    submittedAt?: string | null;
    studentName?: string | null;
    exam?: {
      name?: string;
      session?: string;
      academicYear?: string;
    } | null;
    institute?: {
      name?: string;
      code?: string | null;
      collegeNo?: string | null;
      district?: string | null;
    } | null;
    payment?: {
      amountPaise: number;
      amountRupees: number;
      method?: string | null;
      referenceNo?: string | null;
      receivedAt?: string | null;
      paymentCompleted: boolean;
    } | null;
  };
  message?: string;
  error?: string;
};

@Component({
  selector: 'app-document-verification',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="verify-page">
      <mat-card class="verify-card">
        <div class="head">
          <h1>Document Verification</h1>
          <p>Verification service for exam form QR scans</p>
        </div>

        @if (loading()) {
          <div class="state">Verifying document...</div>
        } @else if (error()) {
          <div class="state error">{{ error() }}</div>
        } @else if (data()) {
          <div class="badge-row">
            <span class="badge" [class.valid]="data()!.valid" [class.invalid]="!data()!.valid">
              <mat-icon>{{ data()!.valid ? 'verified' : 'gpp_bad' }}</mat-icon>
              {{ data()!.valid ? 'DOCUMENT VERIFIED' : 'DOCUMENT NOT VALID' }}
            </span>
          </div>

          <table class="verify-table" *ngIf="data()!.document as d">
            <tbody>
              <tr><th>Application No</th><td>{{ d.applicationNo }}</td></tr>
              <tr><th>Status</th><td>{{ d.status }}</td></tr>
              <tr><th>Candidate Type</th><td>{{ d.candidateType }}</td></tr>
              <tr><th>Student Name</th><td>{{ d.studentName || '-' }}</td></tr>
              <tr><th>Exam</th><td>{{ examLabel(d) }}</td></tr>
              <tr><th>Institute</th><td>{{ instituteLabel(d) }}</td></tr>
              <tr><th>Payment Amount</th><td>{{ d.payment ? ('INR ' + (d.payment.amountRupees | number:'1.2-2')) : '-' }}</td></tr>
              <tr><th>Payment Ref</th><td>{{ d.payment?.referenceNo || '-' }}</td></tr>
              <tr><th>Payment Date</th><td>{{ d.payment?.receivedAt ? (d.payment?.receivedAt | date:'dd/MM/yyyy hh:mm a') : '-' }}</td></tr>
              <tr><th>Verified On</th><td>{{ data()!.verifiedAt | date:'dd/MM/yyyy hh:mm a' }}</td></tr>
            </tbody>
          </table>
        }

        <div class="actions">
          <a mat-stroked-button routerLink="/">
            <mat-icon>home</mat-icon>
            Back to Home
          </a>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 16px;
      background: linear-gradient(160deg, #f8fbff 0%, #eff6ff 60%, #eefbf4 100%);
    }

    .verify-card {
      width: min(820px, 100%);
      border-radius: 12px;
      border: 1px solid #dbe3ef;
      padding: 14px;
    }

    .head h1 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
    }

    .head p {
      margin: 4px 0 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .badge-row {
      margin: 14px 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid transparent;
    }

    .badge.valid {
      background: #dcfce7;
      color: #166534;
      border-color: #86efac;
    }

    .badge.invalid {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fca5a5;
    }

    .verify-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
    }

    .verify-table th,
    .verify-table td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      font-size: 0.84rem;
      text-align: left;
      vertical-align: top;
    }

    .verify-table th {
      width: 220px;
      background: #f8fafc;
      color: #1f2937;
      font-weight: 700;
    }

    .state {
      margin: 14px 0;
      padding: 10px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #334155;
    }

    .state.error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .actions {
      margin-top: 14px;
    }
  `]
})
export class DocumentVerificationComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<VerificationResponse | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    const applicationNo = String(this.route.snapshot.paramMap.get('applicationNo') || '').trim();
    if (!applicationNo) {
      this.loading.set(false);
      this.error.set('Invalid verification URL.');
      return;
    }

    this.http.get<VerificationResponse>(`${API_BASE_URL}/public/verify-document/${encodeURIComponent(applicationNo)}`).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to verify this document.');
      }
    });
  }

  examLabel(document: NonNullable<VerificationResponse['document']>): string {
    const exam = document.exam;
    if (!exam) return '-';
    return `${exam.name || '-'} (${exam.session || '-'} ${exam.academicYear || '-'})`;
  }

  instituteLabel(document: NonNullable<VerificationResponse['document']>): string {
    const institute = document.institute;
    if (!institute) return '-';
    const code = institute.code || institute.collegeNo;
    return [institute.name || '-', code ? `Code: ${code}` : null, institute.district || null].filter(Boolean).join(' | ');
  }
}
