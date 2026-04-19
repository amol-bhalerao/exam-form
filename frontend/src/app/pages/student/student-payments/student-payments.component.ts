import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { API_BASE_URL } from '../../../core/api';

type PaymentRow = {
  id: number;
  amountPaise: number;
  method: string;
  referenceNo: string | null;
  receivedAt: string | null;
  createdAt: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_INITIATED';
  isPaid: boolean;
  printable: boolean;
  canRetry: boolean;
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
    };
  };
};

@Component({
  selector: 'app-student-payments',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <mat-card class="card top-card">
      <div class="head-row">
        <div>
          <div class="title">My Payments</div>
          <div class="subtitle">Track successful, pending, and failed fee payments for every application.</div>
        </div>
        <mat-form-field appearance="outline" class="status-filter">
          <mat-label>Payment Status</mat-label>
          <mat-select [value]="selectedStatus()" (selectionChange)="onStatusFilterChange($event.value)">
            <mat-option value="ALL">All</mat-option>
            <mat-option value="SUCCESS">Success</mat-option>
            <mat-option value="PENDING">Pending</mat-option>
            <mat-option value="FAILED">Failed</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="kpi-row">
        <div class="kpi kpi-success"><span>Success</span><strong>{{ successCount() }}</strong></div>
        <div class="kpi kpi-pending"><span>Pending</span><strong>{{ pendingCount() }}</strong></div>
        <div class="kpi kpi-failed"><span>Failed</span><strong>{{ failedCount() }}</strong></div>
        <div class="kpi kpi-total"><span>Total Paid</span><strong>INR {{ totalPaidRupees() }}</strong></div>
      </div>
    </mat-card>

    <mat-card class="card table-card">
      @if (loading()) {
        <div class="loading">Loading payments...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (!filteredPayments().length) {
        <div class="empty">No payment records found for the selected filter.</div>
      } @else {
        <div class="table-wrap">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Application</th>
                <th>Exam</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of filteredPayments(); track payment.id) {
                <tr>
                  <td>{{ payment.createdAt | date:'dd/MM/yyyy hh:mm a' }}</td>
                  <td>{{ payment.application.applicationNo }}</td>
                  <td>{{ examLabel(payment) }}</td>
                  <td>INR {{ (payment.amountPaise || 0) / 100 | number:'1.2-2' }}</td>
                  <td>
                    <span class="status-pill" [class.ok]="payment.status === 'SUCCESS'" [class.pending]="payment.status === 'PENDING'" [class.fail]="payment.status === 'FAILED'">
                      {{ payment.status }}
                    </span>
                  </td>
                  <td>{{ payment.referenceNo || '-' }}</td>
                  <td class="actions-cell">
                    @if (payment.status === 'SUCCESS') {
                      <button mat-stroked-button class="mini-btn" (click)="openReceipt(payment)">Print Receipt</button>
                      @if (payment.printable) {
                        <button mat-stroked-button class="mini-btn" (click)="openFormPrint(payment)">Print Form</button>
                      }
                    } @else {
                      <button mat-stroked-button class="mini-btn" color="primary" (click)="retryPayment(payment)">Retry</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .card { margin: 0 0 14px 0; padding: 14px; border-radius: 12px; }
    .top-card { border: 1px solid #dbe7f2; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%); }
    .head-row { display: flex; gap: 10px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    .title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .subtitle { margin-top: 2px; color: #64748b; font-size: 0.86rem; }
    .status-filter { min-width: 180px; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 2px; background: #fff; }
    .kpi span { font-size: 0.72rem; color: #64748b; }
    .kpi strong { font-size: 0.95rem; color: #0f172a; }
    .kpi-success { border-color: #86efac; }
    .kpi-pending { border-color: #fde68a; }
    .kpi-failed { border-color: #fca5a5; }
    .kpi-total { border-color: #bfdbfe; }

    .table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    .payments-table { width: 100%; min-width: 980px; border-collapse: collapse; }
    .payments-table th, .payments-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      font-size: 0.8rem;
      vertical-align: middle;
    }
    .payments-table thead th { font-size: 0.74rem; color: #334155; background: #f8fafc; font-weight: 700; }
    .status-pill { padding: 4px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; }
    .status-pill.ok { background: #dcfce7; color: #166534; }
    .status-pill.pending { background: #fef3c7; color: #92400e; }
    .status-pill.fail { background: #fee2e2; color: #991b1b; }

    .actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
    .mini-btn { min-width: 80px; height: 26px; line-height: 24px; padding: 0 8px; font-size: 0.7rem; }

    .loading, .empty, .error { padding: 18px; text-align: center; color: #64748b; }
    .error { color: #b91c1c; }

    @media (max-width: 800px) {
      .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class StudentPaymentsComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly payments = signal<PaymentRow[]>([]);
  readonly selectedStatus = signal<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  readonly filteredPayments = computed(() => {
    const status = this.selectedStatus();
    const rows = this.payments();
    if (status === 'ALL') return rows;
    return rows.filter((payment) => payment.status === status);
  });

  readonly successCount = computed(() => this.payments().filter((payment) => payment.status === 'SUCCESS').length);
  readonly pendingCount = computed(() => this.payments().filter((payment) => payment.status === 'PENDING').length);
  readonly failedCount = computed(() => this.payments().filter((payment) => payment.status === 'FAILED').length);
  readonly totalPaidRupees = computed(() => {
    const totalPaise = this.payments()
      .filter((payment) => payment.status === 'SUCCESS')
      .reduce((sum, payment) => sum + Number(payment.amountPaise || 0), 0);
    return (totalPaise / 100).toFixed(2);
  });

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.fetchPayments();
  }

  onStatusFilterChange(value: 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'): void {
    this.selectedStatus.set(value || 'ALL');
  }

  fetchPayments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ payments: PaymentRow[] }>(`${API_BASE_URL}/payments/my`).subscribe({
      next: (response) => {
        this.payments.set(response?.payments || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to fetch payment history.');
        this.loading.set(false);
      }
    });
  }

  examLabel(payment: PaymentRow): string {
    const exam = payment?.application?.exam;
    if (!exam) return '-';
    return `${exam.name} (${exam.session} ${exam.academicYear})`;
  }

  openReceipt(payment: PaymentRow): void {
    const appId = payment?.application?.id;
    if (!appId) return;
    this.router.navigate(['/app/student/applications', appId, 'receipt']);
  }

  openFormPrint(payment: PaymentRow): void {
    const appId = payment?.application?.id;
    if (!appId || !payment.printable) return;
    this.router.navigate(['/app/student/forms', appId, 'print']);
  }

  retryPayment(payment: PaymentRow): void {
    const appId = payment?.application?.id;
    if (!appId) return;
    this.router.navigate(['/app/student/applications', appId, 'payment']);
  }
}
