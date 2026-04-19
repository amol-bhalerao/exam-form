import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { API_BASE_URL } from '../../../core/api';

type PaymentReceipt = {
  issuerName: string;
  issuerAddress: string;
  receiptNo: string;
  generatedAt: string;
  amountPaise: number;
  amountRupees: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference: string | null;
  orderId: string | null;
  application: {
    id: number;
    applicationNo: string;
    status: string;
    candidateType: string;
    exam?: {
      id: number;
      name: string;
      session: string;
      academicYear: string;
    } | null;
    institute?: {
      id: number;
      name: string;
      code?: string | null;
      collegeNo?: string | null;
      district?: string | null;
    } | null;
  };
  student: {
    id: number;
    name: string;
    mobile: string | null;
    email: string | null;
  };
};

@Component({
  selector: 'app-student-payment-receipt',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="receipt-page">
      @if (loading()) {
        <mat-card class="state-card no-print">
          <div class="state-row">
            <mat-spinner diameter="42"></mat-spinner>
            <div>
              <strong>Loading payment receipt...</strong>
              <p>Please wait while we prepare your printable copy.</p>
            </div>
          </div>
        </mat-card>
      }

      @if (!loading() && error()) {
        <mat-card class="state-card no-print error">
          <div class="state-row">
            <mat-icon>error_outline</mat-icon>
            <div>
              <strong>Receipt not available</strong>
              <p>{{ error() }}</p>
            </div>
          </div>
          <div class="action-row">
            <button mat-stroked-button type="button" [routerLink]="['/app/student/applications']">
              <mat-icon>arrow_back</mat-icon>
              Back to Applications
            </button>
          </div>
        </mat-card>
      }

      @if (!loading() && !error() && receipt()) {
        <div class="action-row no-print">
          <button mat-stroked-button type="button" [routerLink]="['/app/student/applications', receipt()!.application.id]">
            <mat-icon>arrow_back</mat-icon>
            Back to Application
          </button>
          <button mat-raised-button color="primary" type="button" (click)="printReceipt()">
            <mat-icon>print</mat-icon>
            Print Receipt (A5)
          </button>
          <button mat-stroked-button type="button" [routerLink]="['/app/student/forms', receipt()!.application.id, 'print']">
            <mat-icon>description</mat-icon>
            Open Exam Form
          </button>
        </div>

        <section class="receipt-sheet" id="payment-receipt-a5">
          <header class="sheet-header">
            <div class="company">{{ receipt()!.issuerName }}</div>
            <div class="address">{{ receipt()!.issuerAddress }}</div>
            <h1>OFFICIAL PAYMENT RECEIPT</h1>
          </header>

          <table class="meta-table">
            <tr>
              <th>Receipt No</th>
              <td>{{ receipt()!.receiptNo }}</td>
              <th>Receipt Date</th>
              <td>{{ receipt()!.generatedAt | date:'dd/MM/yyyy hh:mm a' }}</td>
            </tr>
            <tr>
              <th>Payment Date</th>
              <td>{{ receipt()!.paymentDate | date:'dd/MM/yyyy hh:mm a' }}</td>
              <th>Payment Method</th>
              <td>{{ cleanMethod(receipt()!.paymentMethod) }}</td>
            </tr>
            <tr>
              <th>Transaction Ref.</th>
              <td colspan="3">{{ receipt()!.transactionReference || receipt()!.orderId || '-' }}</td>
            </tr>
          </table>

          <table class="meta-table">
            <tr>
              <th>Received From</th>
              <td>{{ receipt()!.student.name }}</td>
              <th>Application No</th>
              <td>{{ receipt()!.application.applicationNo }}</td>
            </tr>
            <tr>
              <th>Mobile</th>
              <td>{{ receipt()!.student.mobile || '-' }}</td>
              <th>Candidate Type</th>
              <td>{{ receipt()!.application.candidateType }}</td>
            </tr>
            <tr>
              <th>Exam</th>
              <td colspan="3">{{ examLabel() }}</td>
            </tr>
            <tr>
              <th>Institute</th>
              <td colspan="3">{{ instituteLabel() }}</td>
            </tr>
          </table>

          <table class="particulars-table">
            <thead>
              <tr>
                <th class="col-sr">Sr.</th>
                <th>Payment Particulars</th>
                <th class="col-amt">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Examination Fee for {{ examLabel() }} (Application: {{ receipt()!.application.applicationNo }})</td>
                <td class="right">{{ receipt()!.amountRupees | number:'1.2-2' }}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" class="right"><strong>Total Amount Received</strong></td>
                <td class="right"><strong>{{ receipt()!.amountRupees | number:'1.2-2' }}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="amount-words">Amount in words: {{ amountInWords(receipt()!.amountRupees) }}</div>

          <footer class="sheet-footer">
            <p>This is a computer-generated receipt and does not require physical signature.</p>
            <p>Payee: {{ receipt()!.issuerName }}</p>
          </footer>
        </section>
      }
    </div>
  `,
  styles: [`
    .receipt-page {
      padding: 16px;
      display: grid;
      gap: 14px;
      justify-items: center;
      background: radial-gradient(circle at top right, #f5fbff 0%, #fefefe 55%, #f6fbf6 100%);
    }

    .state-card {
      width: min(820px, 100%);
      border-radius: 14px;
      border: 1px solid #dbe7f5;
      padding: 14px;
    }

    .state-card.error {
      border-color: #fecaca;
      background: #fef2f2;
    }

    .state-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .state-row strong {
      display: block;
      margin-bottom: 4px;
    }

    .state-row p {
      margin: 0;
      color: #475569;
    }

    .action-row {
      width: min(820px, 100%);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .receipt-sheet {
      width: 148mm;
      min-height: 210mm;
      background: #ffffff;
      color: #111827;
      border: 1px solid #9ca3af;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      padding: 10mm;
      font-family: 'Times New Roman', Times, serif;
      display: grid;
      grid-template-rows: auto auto auto 1fr auto;
      gap: 9px;
    }

    .sheet-header {
      text-align: center;
      border-bottom: 1px solid #111827;
      padding-bottom: 8px;
    }

    .sheet-header .company {
      font-size: 17px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .sheet-header .address {
      font-size: 12px;
      margin-top: 2px;
    }

    .sheet-header h1 {
      margin: 6px 0 0;
      font-size: 15px;
      letter-spacing: 0.7px;
    }

    .meta-table,
    .particulars-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #374151;
      font-size: 12px;
      page-break-inside: avoid;
    }

    .meta-table th,
    .meta-table td,
    .particulars-table th,
    .particulars-table td {
      border: 1px solid #4b5563;
      padding: 6px 7px;
      vertical-align: top;
    }

    .meta-table th {
      width: 22%;
      background: #f3f4f6;
      text-align: left;
      font-weight: 700;
    }

    .particulars-table thead th {
      background: #f3f4f6;
      text-align: left;
      font-weight: 700;
    }

    .col-sr {
      width: 8%;
      text-align: center;
    }

    .col-amt {
      width: 22%;
      text-align: right;
    }

    .right {
      text-align: right;
    }

    .total-row td {
      background: #f9fafb;
      font-size: 12.5px;
    }

    .amount-words {
      border: 1px solid #4b5563;
      padding: 7px;
      font-size: 12px;
    }

    .sheet-footer {
      border-top: 1px dashed #6b7280;
      margin-top: 4px;
      padding-top: 7px;
      font-size: 10px;
      color: #374151;
      text-align: center;
    }

    .sheet-footer p {
      margin: 1px 0;
    }

    @media (max-width: 768px) {
      .receipt-page {
        padding: 10px;
      }

      .receipt-sheet {
        width: 100%;
        min-height: auto;
        padding: 14px;
      }

      .meta-table,
      .particulars-table {
        font-size: 11px;
      }
    }

    @media print {
      @page {
        size: A5 portrait;
        margin: 7mm;
      }

      .no-print {
        display: none !important;
      }

      .receipt-page {
        padding: 0;
        background: #fff !important;
      }

      .receipt-sheet {
        width: auto;
        min-height: auto;
        border: none;
        box-shadow: none;
        margin: 0;
        padding: 0;
      }
    }
  `]
})
export class StudentPaymentReceiptComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly receipt = signal<PaymentReceipt | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    const applicationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      this.loading.set(false);
      this.error.set('Invalid application selected for receipt.');
      return;
    }

    this.http.get(`${API_BASE_URL}/payments/receipt/${applicationId}`, { responseType: 'text' }).subscribe({
      next: (raw: string) => {
        try {
          const parsed = JSON.parse(raw || '{}') as { receipt?: PaymentReceipt };
          if (!parsed?.receipt) {
            this.error.set('Receipt data is unavailable right now. Please try again in a moment.');
            this.loading.set(false);
            return;
          }

          this.receipt.set(parsed.receipt);
          this.loading.set(false);

          const autoprint = this.route.snapshot.queryParamMap.get('autoprint') === '1';
          if (autoprint) {
            setTimeout(() => this.printReceipt(), 300);
          }
        } catch {
          this.loading.set(false);
          this.error.set('Receipt service is temporarily unavailable. Please retry after backend deployment/restart.');
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to fetch payment receipt.');
      }
    });
  }

  cleanMethod(value: string): string {
    return String(value || 'ONLINE').replace(/_/g, ' ');
  }

  examLabel(): string {
    const receipt = this.receipt();
    if (!receipt?.application?.exam) return '-';
    const exam = receipt.application.exam;
    return `${exam.name} (${exam.session} ${exam.academicYear})`;
  }

  instituteLabel(): string {
    const institute = this.receipt()?.application?.institute;
    if (!institute) return '-';
    const code = institute.code || institute.collegeNo;
    const parts = [institute.name, code ? `Code: ${code}` : null, institute.district || null].filter(Boolean);
    return parts.join(' | ');
  }

  amountInWords(amount: number | null | undefined): string {
    const normalized = Math.max(0, Math.round(Number(amount || 0)));
    const paise = Math.round((Number(amount || 0) - normalized) * 100);
    const words = this.numberToWords(normalized);
    if (paise > 0) {
      return `${words} Rupees and ${this.numberToWords(paise)} Paise Only`;
    }
    return `${words} Rupees Only`;
  }

  private numberToWords(n: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (n === 0) return 'Zero';

    const twoDigit = (x: number): string => {
      if (x < 10) return ones[x];
      if (x < 20) return teens[x - 10];
      const t = Math.floor(x / 10);
      const o = x % 10;
      return `${tens[t]}${o ? ` ${ones[o]}` : ''}`;
    };

    const threeDigit = (x: number): string => {
      const h = Math.floor(x / 100);
      const r = x % 100;
      const hPart = h ? `${ones[h]} Hundred` : '';
      const rPart = r ? twoDigit(r) : '';
      return `${hPart}${hPart && rPart ? ' ' : ''}${rPart}`.trim();
    };

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    const parts: string[] = [];
    if (crore) parts.push(`${twoDigit(crore)} Crore`);
    if (lakh) parts.push(`${twoDigit(lakh)} Lakh`);
    if (thousand) parts.push(`${twoDigit(thousand)} Thousand`);
    if (remainder) parts.push(threeDigit(remainder));
    return parts.join(' ').trim();
  }

  printReceipt(): void {
    if (!this.receipt()) return;
    window.print();
  }

  openApplication(): void {
    const appId = this.receipt()?.application?.id;
    if (!appId) return;
    this.router.navigate(['/app/student/applications', appId]);
  }
}
