import { Component, OnInit, computed, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

type ExamCapacityGridRow = {
  examId: number;
  examName: string;
  academicYear: string;
  session: string;
  streamId: number;
  streamName: string;
  applicationOpen?: string | Date | null;
  applicationClose?: string | Date | null;
  totalStudents: number | null;
  applicationsUsed: number;
  remainingApplications: number | null;
  isCapacityReached: boolean;
  isConfigured: boolean;
};

@Component({
  selector: 'app-institute-exam-capacity-grid',
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="header-row">
        <div>
          <div class="h">Exam-wise Student Capacity by Stream</div>
          <div class="p">Edit the total capacity for each exam and stream, then click save for that row. Remaining applications update automatically.</div>
        </div>
        <button mat-stroked-button color="primary" type="button" (click)="load()">Refresh</button>
      </div>

      <div *ngIf="loading()" class="p">Loading exam capacities…</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>
      <div *ngIf="success()" class="success">{{ success() }}</div>
      <div *ngIf="savingKey()" class="p">Saving updated stream capacity…</div>
      <div *ngIf="!loading() && rows().length === 0" class="p">No exams found yet for capacity setup.</div>

      <div class="tables-stack" *ngIf="rows().length > 0">
        <div class="table-section">
          <div class="section-title">Active / Running Exams</div>
          <div class="p">These exams are currently open for applications.</div>
          <div class="ag-theme-alpine table-box" *ngIf="activeRows().length > 0">
            <ag-grid-angular
              style="width: 100%; height: 100%;"
              class="ag-theme-alpine"
              [rowData]="activeRows()"
              [columnDefs]="columnDefs"
              [defaultColDef]="defaultColDef"
              [pagination]="true"
              [paginationPageSize]="20"
              [paginationPageSizeSelector]="[10, 20, 50, 100]"
              (cellClicked)="onGridAction($event)"
            ></ag-grid-angular>
          </div>
          <div *ngIf="activeRows().length === 0" class="p">No active exams are running right now.</div>
        </div>

        <div class="table-section">
          <div class="section-title">Non-Active / Closed Exams</div>
          <div class="p">These exams are upcoming, closed, or outside the application window.</div>
          <div class="ag-theme-alpine table-box" *ngIf="inactiveRows().length > 0">
            <ag-grid-angular
              style="width: 100%; height: 100%;"
              class="ag-theme-alpine"
              [rowData]="inactiveRows()"
              [columnDefs]="columnDefs"
              [defaultColDef]="defaultColDef"
              [pagination]="true"
              [paginationPageSize]="20"
              [paginationPageSizeSelector]="[10, 20, 50, 100]"
              (cellClicked)="onGridAction($event)"
            ></ag-grid-angular>
          </div>
          <div *ngIf="inactiveRows().length === 0" class="p">No inactive exams found.</div>
        </div>
      </div>
    </mat-card>
  `,
  styles: [
    `.card { margin-bottom: 14px; padding: 18px; }`,
    `.header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }`,
    `.h { font-weight: 800; margin-bottom: 4px; }`,
    `.p { color: #6b7280; margin-bottom: 8px; line-height: 1.45; }`,
    `.tables-stack { display: grid; gap: 18px; }`,
    `.table-section { display: grid; gap: 8px; }`,
    `.section-title { font-weight: 700; color: #111827; }`,
    `.table-box { width: 100%; height: 430px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }`,
    `.success { color: #065f46; font-size: 13px; margin-bottom: 8px; }`,
    `.error { color: #b91c1c; font-size: 13px; margin-bottom: 8px; }`
  ]
})
export class InstituteExamCapacityGridComponent implements OnInit {
  readonly rows = signal<ExamCapacityGridRow[]>([]);
  readonly activeRows = computed(() => this.rows().filter((row) => this.isExamRunning(row)));
  readonly inactiveRows = computed(() => this.rows().filter((row) => !this.isExamRunning(row)));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly savingKey = signal<string | null>(null);

  readonly defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 110
  };

  readonly columnDefs: ColDef[] = [
    { field: 'examName', headerName: 'Exam', pinned: 'left', minWidth: 180 },
    {
      headerName: 'Session / Academic Year',
      minWidth: 190,
      valueGetter: (params: any) => [params.data?.session, params.data?.academicYear].filter(Boolean).join(' • ') || '-'
    },
    {
      headerName: 'Status',
      minWidth: 140,
      valueGetter: (params: any) => this.getExamStatus(params.data),
      cellStyle: (params: any) => ({
        color: params.value === 'Running' ? '#166534' : '#92400e',
        fontWeight: '700'
      })
    },
    {
      headerName: 'Application Window',
      minWidth: 210,
      valueGetter: (params: any) => this.getApplicationWindow(params.data)
    },
    { field: 'streamName', headerName: 'Stream', minWidth: 140 },
    {
      field: 'totalStudents',
      headerName: 'Total Capacity',
      editable: true,
      minWidth: 140,
      valueFormatter: (params: any) => params.value ?? '',
      valueParser: (params: any) => {
        const rawValue = `${params.newValue ?? ''}`.trim();
        if (!rawValue) return 0;
        const parsed = Number(rawValue);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : (params.oldValue ?? 0);
      },
      cellStyle: { background: '#f8fafc', fontWeight: '600' }
    },
    { field: 'applicationsUsed', headerName: 'Used', minWidth: 90, maxWidth: 110 },
    {
      field: 'remainingApplications',
      headerName: 'Remaining',
      minWidth: 120,
      valueFormatter: (params: any) => params.value ?? 'Not set'
    },
    {
      field: 'saveAction',
      headerName: 'Action',
      sortable: false,
      filter: false,
      minWidth: 110,
      maxWidth: 120,
      cellRenderer: () => '<button type="button" class="ag-action-btn">Save</button>'
    }
  ];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.get<{ exams: ExamCapacityGridRow[] }>(`${API_BASE_URL}/institutes/me/exam-capacities`).subscribe({
      next: (response) => {
        this.rows.set(response.exams || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to load exam capacities');
        this.loading.set(false);
      }
    });
  }

  onGridAction(event: any): void {
    if (event?.colDef?.field !== 'saveAction' || !event?.data) return;
    this.saveRow(event.data as ExamCapacityGridRow);
  }

  private isExamRunning(row: ExamCapacityGridRow): boolean {
    const now = new Date();
    const open = row.applicationOpen ? new Date(row.applicationOpen) : null;
    const close = row.applicationClose ? new Date(row.applicationClose) : null;
    return !!open && !!close && open <= now && now <= close;
  }

  private getExamStatus(row: ExamCapacityGridRow): string {
    if (!row) return 'Unknown';
    if (this.isExamRunning(row)) return 'Running';

    const now = new Date();
    const open = row.applicationOpen ? new Date(row.applicationOpen) : null;
    if (open && open > now) return 'Upcoming';
    return 'Closed';
  }

  private getApplicationWindow(row: ExamCapacityGridRow): string {
    const open = row.applicationOpen ? new Date(row.applicationOpen) : null;
    const close = row.applicationClose ? new Date(row.applicationClose) : null;
    if (!open || !close || Number.isNaN(open.getTime()) || Number.isNaN(close.getTime())) {
      return '-';
    }
    return `${open.toLocaleDateString('en-IN')} → ${close.toLocaleDateString('en-IN')}`;
  }

  private saveRow(row: ExamCapacityGridRow): void {
    const totalStudents = Number(row.totalStudents ?? 0);
    if (!Number.isFinite(totalStudents) || totalStudents < 0) {
      this.error.set('Total capacity must be 0 or more.');
      return;
    }

    const key = `${row.examId}-${row.streamId}`;
    this.savingKey.set(key);
    this.error.set(null);
    this.success.set(null);

    this.http.put<any>(`${API_BASE_URL}/institutes/me/exam-capacities/${row.examId}`, {
      streamId: row.streamId,
      totalStudents
    }).subscribe({
      next: (response) => {
        const remaining = response?.exam?.remainingApplications;
        this.success.set(`Saved ${row.examName} • ${row.streamName}. Remaining applications: ${remaining ?? 'Not set'}.`);
        this.savingKey.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message || err?.error?.error || 'Failed to save exam capacity');
        this.savingKey.set(null);
      }
    });
  }
}
