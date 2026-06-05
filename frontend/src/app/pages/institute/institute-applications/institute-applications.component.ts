import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

type Row = {
  id: number;
  applicationNo: string;
  status: string;
  paymentCompleted?: boolean;
  verification?: {
    hasStudentCoreDetails?: boolean;
    hasSubjects?: boolean;
    subjectCount?: number;
    instituteName?: string;
    instituteCode?: string;
    examName?: string;
    examSession?: string;
    examAcademicYear?: string;
    streamName?: string;
    isReadyForVerification?: boolean;
  };
  institute?: { name?: string; code?: string; collegeNo?: string };
  subjects?: Array<{ subject?: { name?: string; code?: string } }>;
  student: { firstName?: string; lastName?: string };
  exam: { name: string; session: string; academicYear: string };
  updatedAt: string;
  candidateType?: string;
};

type GroupSummary = { name: string; count: number };
type DashboardSummary = {
  totalCapacity: number | null;
  totalReceived: number;
  byStatus: GroupSummary[];
  bySubject: GroupSummary[];
  byCaste: GroupSummary[];
  byGender: GroupSummary[];
  byDistrict: GroupSummary[];
  byExamType: GroupSummary[];
};

type ExamOption = { id: number; name: string; session: string; academicYear: string };

function formatSubjectsCell(subjects: Row['subjects']): string {
  return (subjects || [])
    .map((entry) => {
      const code = entry.subject?.code || '';
      const name = entry.subject?.name || '';
      return code && name ? `${code}-${name}` : code || name;
    })
    .filter(Boolean)
    .join(', ');
}

@Component({
  selector: 'app-institute-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, AgGridModule],
  template: `
    <mat-card class="card hero-card">
      <div class="row hero-row">
        <div>
          <div class="eyebrow">Institute review desk</div>
          <div class="h">Student Applications</div>
          <div class="p">All exam applications for your institute. Submitted forms stay pending until the institute verifies them.</div>
        </div>
        <div class="grow"></div>
        <button mat-stroked-button type="button" (click)="printAllExamForms()" [disabled]="loading() || rows().length === 0">
          <mat-icon>print</mat-icon>
          Print All Exam Forms
        </button>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Exam</mat-label>
          <mat-select [(ngModel)]="selectedExamId" (selectionChange)="load()">
            <mat-option value="">All exams</mat-option>
            <mat-option *ngFor="let exam of availableExams()" [value]="exam.id">{{ exam.name }} - {{ exam.session }} {{ exam.academicYear }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search by application no. or student</mat-label>
          <input matInput [(ngModel)]="search" (input)="load()" placeholder="e.g. APP-2026-000123" />
        </mat-form-field>
      </div>

      <div class="analytics-grid app-summary-grid" *ngIf="dashboard() as s">
        <div class="analytics-card hero app-summary-card app-summary-card--hero">
          <div class="analytics-title app-summary-title">Capacity vs Received</div>
          <div class="analytics-big">{{ s.totalCapacity ?? 'N/A' }} / {{ s.totalReceived }}</div>
        </div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">Exam Type-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.byExamType"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">Subject-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.bySubject"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">Caste-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.byCaste"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">Gender-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.byGender"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">District-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.byDistrict"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
        <div class="analytics-card app-summary-card"><div class="analytics-title app-summary-title">Status-wise</div><div class="app-summary-scroll"><div class="analytics-item app-summary-item" *ngFor="let item of s.byStatus"><span>{{ item.name }}</span><strong>{{ item.count }}</strong></div></div></div>
      </div>

      <div class="summary-row" *ngIf="rows().length > 0">
        <div class="summary-chip total-chip">
          <strong>{{ rows().length }}</strong>
          <span>Total Applications</span>
        </div>
        <div class="summary-chip verified-chip">
          <strong>{{ readyToVerifyCount() }}</strong>
          <span>Ready to Verify</span>
        </div>
        <div class="summary-chip submitted-chip">
          <strong>{{ needsChecklistCount() }}</strong>
          <span>Needs Detail Check</span>
        </div>
        <div class="summary-chip rejected-chip">
          <strong>{{ rows().length - readyToVerifyCount() }}</strong>
          <span>Not Verifiable Yet</span>
        </div>
      </div>
    </mat-card>

    <mat-card class="card list-card">
      <div *ngIf="loading()" class="state-message loading">
        <mat-icon>sync</mat-icon>
        <span>Loading applications…</span>
      </div>

      <div *ngIf="errorMessage()" class="state-message error">
        <mat-icon>error_outline</mat-icon>
        <span>{{ errorMessage() }}</span>
      </div>

      <div *ngIf="!loading() && !errorMessage() && rows().length === 0" class="state-message empty">
        <mat-icon>inbox</mat-icon>
        <span>No applications found.</span>
      </div>

      <div class="ag-theme-alpine grid-table" *ngIf="!loading() && rows().length > 0">
        <ag-grid-angular
          style="width:100%; height:480px;"
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (rowClicked)="onRowSelected($event)"
          (cellClicked)="onGridCellClicked($event)"
          [pagination]="true"
          [paginationPageSize]="15"
        ></ag-grid-angular>
        <div class="grid-actions" *ngIf="selectedRow as row">
          <button mat-stroked-button [routerLink]="['/app/institute/applications', row.id]">
            <mat-icon>edit</mat-icon> Edit Form
          </button>
          <button mat-stroked-button (click)="openPrint(row)">
            <mat-icon>print</mat-icon> Print
          </button>
          <button mat-flat-button color="primary" (click)="decide(row.id, 'VERIFY')" [disabled]="!canVerify(row) || decidingId() === row.id">
            <mat-icon>verified</mat-icon> Verify
          </button>
          <button mat-stroked-button color="warn" (click)="decide(row.id, 'REJECT')" [disabled]="!canReject(row) || decidingId() === row.id">
            <mat-icon>close</mat-icon> Reject
          </button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
        border-radius: 18px;
      }

      .hero-card {
        background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);
        border: 1px solid #dbeafe;
      }

      .list-card {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      }

      .row {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .hero-row {
        align-items: flex-start;
      }

      .grow {
        flex: 1;
      }

      .eyebrow {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #4f46e5;
        margin-bottom: 4px;
      }

      .h {
        font-size: 1.35rem;
        font-weight: 900;
        color: #111827;
      }

      .p {
        color: #6b7280;
        margin-top: 6px;
        max-width: 720px;
      }

      .w260 {
        width: 320px;
        max-width: 100%;
      }

      .summary-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      .analytics-big { font-size: 1.12rem; font-weight: 800; color: #0f172a; }

      .summary-chip {
        border-radius: 14px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        border: 1px solid #e5e7eb;
        background: #fff;
      }

      .summary-chip strong {
        font-size: 1.1rem;
        color: #111827;
      }

      .summary-chip span {
        font-size: 0.8rem;
        color: #6b7280;
      }

      .total-chip { border-color: #cbd5e1; }
      .submitted-chip { border-color: #bfdbfe; background: #eff6ff; }
      .verified-chip { border-color: #bbf7d0; background: #f0fdf4; }
      .rejected-chip { border-color: #fecaca; background: #fef2f2; }

      .state-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 10px;
        font-weight: 500;
      }

      .state-message.loading {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .state-message.error {
        background: #fef2f2;
        color: #b91c1c;
      }

      .state-message.empty {
        background: #f8fafc;
        color: #475569;
      }

      .application-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 14px;
      }

      .application-item {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 15px;
        background: #fff;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .item-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
      }

      .app-no {
        font-size: 1rem;
        font-weight: 800;
        color: #111827;
      }

      .student-name {
        margin-top: 4px;
        color: #4b5563;
        font-size: 0.92rem;
      }

      .status-pill {
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        background: #f3f4f6;
        color: #374151;
      }

      .status-submitted {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-verified {
        background: #dcfce7;
        color: #166534;
      }

      .status-rejected {
        background: #fee2e2;
        color: #b91c1c;
      }

      .status-draft {
        background: #fef3c7;
        color: #92400e;
      }

      .item-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .item-grid div {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .item-grid label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #6b7280;
      }

      .item-grid span {
        font-size: 0.92rem;
        color: #111827;
        word-break: break-word;
      }

      .item-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: auto;
      }

      .verify-checklist {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px;
        background: #f8fafc;
      }

      .check-title {
        font-size: 0.78rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .check-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .check-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid #fecaca;
        color: #991b1b;
        background: #fef2f2;
        font-size: 0.74rem;
        font-weight: 700;
        padding: 5px 8px;
        text-align: center;
      }

      .check-pill.ok {
        border-color: #bbf7d0;
        color: #166534;
        background: #ecfdf5;
      }

      .grid-table { margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .grid-actions { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
      ::ng-deep .institute-row-actions { display: flex; gap: 6px; align-items: center; height: 100%; }
      ::ng-deep .row-action { border: 0; border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 800; cursor: pointer; }
      ::ng-deep .row-action:disabled { opacity: 0.45; cursor: not-allowed; }
      ::ng-deep .row-action--edit { background: #dbeafe; color: #1d4ed8; }
      ::ng-deep .row-action--print { background: #f1f5f9; color: #334155; }
      ::ng-deep .row-action--verify { background: #dcfce7; color: #166534; }
      ::ng-deep .row-action--reject { background: #fee2e2; color: #b91c1c; }

      @media (max-width: 768px) {
        .card {
          padding: 14px;
        }

        .row {
          align-items: stretch;
        }

        .w260 {
          width: 100%;
        }

        .row > button {
          width: 100%;
        }

        .item-grid {
          grid-template-columns: 1fr;
        }

        .check-grid {
          grid-template-columns: 1fr;
        }

        .item-actions button {
          flex: 1 1 100%;
        }
      }

      .grid-table {
        margin-top: 8px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }

      .grid-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }
    `
  ]
})
export class InstituteApplicationsComponent implements OnInit {
  readonly rows = signal<Row[]>([]);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly availableExams = signal<ExamOption[]>([]);
  readonly loading = signal(false);
  readonly decidingId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly readyToVerifyCount = computed(() => this.rows().filter((row) => !!row.verification?.isReadyForVerification).length);
  readonly needsChecklistCount = computed(() => this.rows().filter((row) => !row.verification?.isReadyForVerification).length);
  search = '';
  selectedExamId = '';
  selectedRow: Row | null = null;

  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'App No', flex: 1 },
    {
      headerName: 'Student',
      flex: 1.2,
      valueGetter: (p) => {
        const st = p.data?.student || {};
        return `${st.lastName || ''} ${st.firstName || ''}`.trim();
      }
    },
    { field: 'exam.name', headerName: 'Exam', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    {
      headerName: 'Subjects',
      flex: 1.5,
      valueGetter: (p) => formatSubjectsCell(p.data?.subjects)
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      flex: 1,
      valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : '')
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1.4,
      minWidth: 300,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const row = params.data as Row;
        if (!row?.id) return '';
        const verifyTitle = this.canVerify(row) ? 'Verify submitted form' : this.getVerifyBlockedTitle(row);
        return `
          <div class="institute-row-actions">
            <button data-action="edit" class="row-action row-action--edit">Edit</button>
            <button data-action="print" class="row-action row-action--print">Print</button>
            <button data-action="verify" class="row-action row-action--verify" title="${verifyTitle}" ${this.canVerify(row) ? '' : 'disabled'}>Verify</button>
            <button data-action="reject" class="row-action row-action--reject" ${this.canReject(row) ? '' : 'disabled'}>Reject</button>
          </div>
        `;
      }
    }
  ];

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true };

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    this.load();
  }

  trackById = (_index: number, row: Row) => row.id;

  formatStudentName(row: Row): string {
    const firstName = row.student?.firstName || '';
    const lastName = row.student?.lastName || '';
    return `${lastName} ${firstName}`.trim() || 'Student name unavailable';
  }

  formatStatus(status: string): string {
    return String(status || '').replace(/_/g, ' ');
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const q = new URLSearchParams();
    if (this.search) q.set('search', this.search);
    if (this.selectedExamId) q.set('examId', this.selectedExamId);
    const params = q.toString() ? `?${q.toString()}` : '';

    this.http.get<{ applications: Row[]; metadata?: { availableExams?: ExamOption[]; dashboard?: DashboardSummary } }>(`${API_BASE_URL}/applications/institute/list${params}`).subscribe({
      next: (response) => {
        this.rows.set(response.applications || []);
        this.availableExams.set(response.metadata?.availableExams || []);
        this.dashboard.set(response.metadata?.dashboard || null);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error || 'Unable to load applications');
        this.loading.set(false);
      }
    });
  }

  onRowSelected(event: { data?: Row }) {
    this.selectedRow = event?.data ?? null;
  }

  onGridCellClicked(event: any) {
    const action = event?.event?.target?.getAttribute?.('data-action');
    const row = event?.data as Row | undefined;
    if (!action || !row?.id) return;

    event.event.preventDefault?.();
    event.event.stopPropagation?.();
    this.selectedRow = row;

    if (action === 'edit') {
      this.router.navigate(['/app/institute/applications', row.id]);
      return;
    }
    if (action === 'print') {
      this.openPrint(row);
      return;
    }
    if (action === 'verify' && this.canVerify(row)) {
      this.decide(row.id, 'VERIFY');
      return;
    }
    if (action === 'reject' && this.canReject(row)) {
      this.decide(row.id, 'REJECT');
    }
  }

  canReject(row: Row): boolean {
    return ['SUBMITTED', 'INSTITUTE_VERIFIED'].includes(row.status);
  }

  canVerify(row: Row): boolean {
    return row.status === 'SUBMITTED' && !!row.verification?.isReadyForVerification;
  }

  getVerifyBlockedTitle(row: Row): string {
    if (row.status !== 'SUBMITTED') return 'Only submitted applications can be verified';
    if (!row.verification?.hasStudentCoreDetails) return 'Student core details are incomplete';
    if (!row.verification?.hasSubjects) return 'Subjects are not selected';
    return 'Application is not ready for verification';
  }

  decide(id: number, action: 'VERIFY' | 'REJECT') {
    this.decidingId.set(id);
    this.http.post(`${API_BASE_URL}/applications/${id}/institute/decision`, { action }).subscribe({
      next: () => {
        this.decidingId.set(null);
        this.selectedRow = null;
        this.load();
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error || `Unable to ${action.toLowerCase()} application`);
        this.decidingId.set(null);
      }
    });
  }

  openPrint(row: Row) {
    if (!row?.id) return;
    window.open(`/app/student/forms/${row.id}/print`, '_blank');
  }

  printAllExamForms() {
    const ids = this.rows().map((row) => row.id).filter((id) => Number.isInteger(id) && id > 0);
    if (!ids.length) {
      this.errorMessage.set('No applications available to print.');
      return;
    }

    const popup = window.open(`/print/institute/forms?ids=${encodeURIComponent(ids.join(','))}`, '_blank');
    if (!popup) {
      this.errorMessage.set('Print window was blocked by browser popup settings. Please allow popups and try again.');
    }
  }
}

