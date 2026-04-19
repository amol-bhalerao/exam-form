import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { API_BASE_URL } from '../../../core/api';

type GroupRow = { label: string; count: number; amountPaise: number };

type DashboardData = {
  summary: {
    totalTransactions: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    totalCollectedPaise: number;
    totalCollectedRupees: number;
  };
  grouped: {
    byDistrict: GroupRow[];
    byInstitute: GroupRow[];
    byExam: GroupRow[];
  };
  failedPayments: any[];
  latestTransactions: any[];
};

type ExamOption = { id: number; name: string; session: string; academicYear: string };

@Component({
  selector: 'app-super-payments-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatInputModule],
  template: `
    <mat-card class="card">
      <div class="head-row">
        <div>
          <div class="title">Payments Dashboard</div>
          <div class="sub">Collection, failures, and payment trends by district, institute, and exam.</div>
        </div>
        <div class="filter-row">
          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Status</mat-label>
            <mat-select [value]="statusFilter()" (selectionChange)="changeStatus($event.value)">
              <mat-option value="ALL">All</mat-option>
              <mat-option value="SUCCESS">Success</mat-option>
              <mat-option value="PENDING">Pending</mat-option>
              <mat-option value="FAILED">Failed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>District</mat-label>
            <mat-select [value]="districtFilter()" (selectionChange)="changeDistrict($event.value)">
              <mat-option value="ALL">All</mat-option>
              <mat-option *ngFor="let district of districtOptions()" [value]="district">{{ district }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Exam</mat-label>
            <mat-select [value]="examFilter()" (selectionChange)="changeExam($event.value)">
              <mat-option value="ALL">All</mat-option>
              <mat-option *ngFor="let exam of exams()" [value]="exam.id">
                {{ exam.name }} ({{ exam.session }} {{ exam.academicYear }})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-filter">
            <mat-label>From</mat-label>
            <input matInput type="date" [value]="fromDate()" (input)="changeFromDate($any($event.target).value)" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-filter">
            <mat-label>To</mat-label>
            <input matInput type="date" [value]="toDate()" (input)="changeToDate($any($event.target).value)" />
          </mat-form-field>

          <button mat-stroked-button (click)="loadData()"><mat-icon>refresh</mat-icon>Refresh</button>
          <button mat-flat-button color="primary" (click)="exportCsv()"><mat-icon>download</mat-icon>Export CSV</button>
        </div>
      </div>

      <div class="kpi-grid" *ngIf="data() as d">
        <div class="kpi"><span>Total Txn</span><strong>{{ d.summary.totalTransactions }}</strong></div>
        <div class="kpi success"><span>Success</span><strong>{{ d.summary.successCount }}</strong></div>
        <div class="kpi fail"><span>Failed</span><strong>{{ d.summary.failedCount }}</strong></div>
        <div class="kpi pending"><span>Pending</span><strong>{{ d.summary.pendingCount }}</strong></div>
        <div class="kpi collect"><span>Total Collected</span><strong>INR {{ d.summary.totalCollectedRupees | number:'1.2-2' }}</strong></div>
      </div>
    </mat-card>

    <div class="grid-two">
      <mat-card class="card">
        <div class="section-title">By District</div>
        <div class="mini-table-wrap" *ngIf="(data()?.grouped?.byDistrict || []).length; else noDistrict">
          <table class="mini-table">
            <thead><tr><th>District</th><th>Count</th><th>Amount</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of topDistricts()">
                <td>{{ row.label }}</td>
                <td>{{ row.count }}</td>
                <td>INR {{ row.amountPaise / 100 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noDistrict><div class="empty">No district data</div></ng-template>
      </mat-card>

      <mat-card class="card">
        <div class="section-title">By Exam</div>
        <div class="mini-table-wrap" *ngIf="(data()?.grouped?.byExam || []).length; else noExam">
          <table class="mini-table">
            <thead><tr><th>Exam</th><th>Count</th><th>Amount</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of topExams()">
                <td>{{ row.label }}</td>
                <td>{{ row.count }}</td>
                <td>INR {{ row.amountPaise / 100 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noExam><div class="empty">No exam data</div></ng-template>
      </mat-card>
    </div>

    <mat-card class="card">
      <div class="section-title">Failed Payments (Recent)</div>
      <div class="mini-table-wrap" *ngIf="failedRows().length; else noFailed">
        <table class="mini-table">
          <thead><tr><th>Date</th><th>Application</th><th>Method</th><th>Amount</th><th>Reference</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of failedRows()">
              <td>{{ row.createdAt | date:'dd/MM/yyyy hh:mm a' }}</td>
              <td>{{ row.application?.applicationNo || '-' }}</td>
              <td>{{ row.method || '-' }}</td>
              <td>INR {{ (row.amountPaise || 0) / 100 | number:'1.2-2' }}</td>
              <td>{{ row.referenceNo || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noFailed><div class="empty">No failed payments found.</div></ng-template>
    </mat-card>
  `,
  styles: [`
    .card { margin: 0 0 14px 0; padding: 14px; border-radius: 12px; }
    .head-row { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: center; }
    .title { font-size: 1.12rem; font-weight: 800; }
    .sub { font-size: 0.84rem; color: #64748b; margin-top: 2px; }
    .filter-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .status-filter { min-width: 170px; }
    .date-filter { min-width: 150px; }

    .kpi-grid { margin-top: 10px; display: grid; gap: 8px; grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; background: #fff; }
    .kpi span { font-size: 0.72rem; color: #64748b; display: block; }
    .kpi strong { font-size: 0.95rem; }
    .kpi.success { border-color: #86efac; }
    .kpi.fail { border-color: #fca5a5; }
    .kpi.pending { border-color: #fde68a; }
    .kpi.collect { border-color: #93c5fd; }

    .grid-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .section-title { font-size: 0.94rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
    .mini-table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    .mini-table { width: 100%; min-width: 440px; border-collapse: collapse; }
    .mini-table th, .mini-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 0.78rem; text-align: left; }
    .mini-table th { background: #f8fafc; font-size: 0.72rem; color: #334155; }
    .empty { padding: 14px; color: #64748b; text-align: center; }

    @media (max-width: 980px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-two { grid-template-columns: 1fr; }
      .filter-row { align-items: stretch; }
      .status-filter, .date-filter { width: 100%; min-width: 0; }
    }

    @media (max-width: 520px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SuperPaymentsDashboardComponent implements OnInit {
  readonly data = signal<DashboardData | null>(null);
  readonly statusFilter = signal<'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING'>('ALL');
  readonly districtFilter = signal<string>('ALL');
  readonly examFilter = signal<number | 'ALL'>('ALL');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');
  readonly exams = signal<ExamOption[]>([]);

  readonly districtOptions = computed(() => (this.data()?.grouped?.byDistrict || []).map((x) => x.label).filter(Boolean));
  readonly topDistricts = computed(() => (this.data()?.grouped?.byDistrict || []).slice(0, 10));
  readonly topExams = computed(() => (this.data()?.grouped?.byExam || []).slice(0, 10));
  readonly failedRows = computed(() => (this.data()?.failedPayments || []).slice(0, 100));

  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    this.loadExams();
    this.loadData();
  }

  changeStatus(value: 'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING'): void {
    this.statusFilter.set(value || 'ALL');
    this.loadData();
  }

  changeDistrict(value: string): void {
    this.districtFilter.set(value || 'ALL');
    this.loadData();
  }

  changeExam(value: number | 'ALL'): void {
    this.examFilter.set(value ?? 'ALL');
    this.loadData();
  }

  changeFromDate(value: string): void {
    this.fromDate.set(value || '');
  }

  changeToDate(value: string): void {
    this.toDate.set(value || '');
  }

  exportCsv(): void {
    const url = `${API_BASE_URL}/payments/dashboard/export${this.buildQueryString()}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `payments-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(downloadUrl);
      }
    });
  }

  loadData(): void {
    const url = `${API_BASE_URL}/payments/dashboard${this.buildQueryString()}`;
    this.http.get<DashboardData>(url).subscribe({
      next: (response) => this.data.set(response),
      error: () => this.data.set(null)
    });
  }

  private loadExams(): void {
    this.http.get<{ exams?: any[] } | any[]>(`${API_BASE_URL}/exams`).subscribe({
      next: (response) => {
        const rows = Array.isArray(response) ? response : (response?.exams || []);
        this.exams.set(rows.map((row) => ({
          id: Number(row.id),
          name: String(row.name || ''),
          session: String(row.session || ''),
          academicYear: String(row.academicYear || '')
        })));
      },
      error: () => this.exams.set([])
    });
  }

  private buildQueryString(): string {
    const query = new URLSearchParams();
    if (this.statusFilter() !== 'ALL') {
      query.set('status', this.statusFilter());
    }
    if (this.districtFilter() !== 'ALL') {
      query.set('district', this.districtFilter());
    }
    if (this.examFilter() !== 'ALL') {
      query.set('examId', String(this.examFilter()));
    }
    if (this.fromDate()) {
      query.set('from', this.fromDate());
    }
    if (this.toDate()) {
      query.set('to', this.toDate());
    }

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

}
