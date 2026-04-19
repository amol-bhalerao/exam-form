import { Component, OnInit, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
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
  imports: [NgIf, NgFor, MatCardModule, MatButtonModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="header-row">
        <div class="header-copy">
          <div class="h">Exam-wise Student Capacity by Stream</div>
          <div class="p">Use Set Exam Limit for a guided update, or edit directly in the table and click Save in that row.</div>
        </div>
        <div class="header-actions">
          <button mat-flat-button color="primary" type="button" (click)="toggleQuickSet()">Set Exam Limit</button>
          <button mat-stroked-button color="primary" type="button" (click)="load()">Refresh</button>
        </div>
      </div>

      <div *ngIf="showQuickSet()" class="quick-set-panel">
        <div class="quick-set-title">Quick Set Exam Capacity</div>
        <div class="quick-set-help">Select exam + stream, enter limit, and save.</div>

        <div class="quick-set-grid">
          <div class="quick-field">
            <label>Exam and Stream</label>
            <select class="quick-input" [value]="quickSetKey() ?? ''" (change)="onQuickSetSelection($any($event.target).value)">
              <option value="">Select exam and stream</option>
              <option *ngFor="let row of rows()" [value]="keyFor(row)">
                {{ row.examName }} ({{ row.session }} {{ row.academicYear }}) • {{ row.streamName }}
              </option>
            </select>
          </div>

          <div class="quick-field">
            <label>Total Capacity</label>
            <input
              class="quick-input"
              type="number"
              min="0"
              [value]="quickSetCapacity() ?? ''"
              (input)="onQuickSetCapacityInput($any($event.target).value)"
              placeholder="Enter total students"
            />
          </div>
        </div>

        <div class="quick-set-actions">
          <button mat-flat-button color="primary" type="button" [disabled]="!canSaveQuickSet()" (click)="saveQuickSet()">Save Limit</button>
          <button mat-stroked-button type="button" (click)="showQuickSet.set(false)">Close</button>
        </div>
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
    `.card { margin-bottom: 14px; padding: 18px; border: 1px solid #e5e7eb; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }`,
    `.header-row { display: grid; gap: 12px; margin-bottom: 12px; }`,
    `.header-copy { max-width: 900px; }`,
    `.header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-start; }`,
    `.h { font-weight: 800; margin-bottom: 4px; }`,
    `.p { color: #6b7280; margin-bottom: 8px; line-height: 1.45; }`,
    `.quick-set-panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 12px; background: #f9fafb; }`,
    `.quick-set-title { font-weight: 700; color: #111827; margin-bottom: 4px; }`,
    `.quick-set-help { font-size: 13px; color: #4b5563; margin-bottom: 10px; }`,
    `.quick-set-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }`,
    `.quick-field { display: grid; gap: 6px; align-content: start; }`,
    `.quick-field label { font-size: 12px; font-weight: 600; color: #374151; margin-top: 2px; }`,
    `.quick-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 10px; font: inherit; line-height: 1.4; background: #fff; }`,
    `.quick-set-actions { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }`,
    `.tables-stack { display: grid; gap: 18px; }`,
    `.table-section { display: grid; gap: 8px; }`,
    `.section-title { font-weight: 700; color: #111827; }`,
    `.table-box { width: 100%; height: 430px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }`,
    `.success { color: #065f46; font-size: 13px; margin-bottom: 8px; }`,
    `.error { color: #b91c1c; font-size: 13px; margin-bottom: 8px; }`,
    `@media (max-width: 860px) {
      .quick-set-grid { grid-template-columns: 1fr; }
      .header-actions { flex-direction: column; align-items: stretch; }
      .header-actions button, .quick-set-actions button { width: 100%; }
      .quick-set-actions { flex-direction: column; align-items: stretch; }
    }`
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
  readonly showQuickSet = signal(false);
  readonly quickSetKey = signal<string | null>(null);
  readonly quickSetCapacity = signal<number | null>(null);

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
        this.syncQuickSetWithRows();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || err?.error?.error || 'Unable to load exam capacities');
        this.loading.set(false);
      }
    });
  }

  toggleQuickSet(): void {
    this.showQuickSet.update((state) => !state);
    if (this.showQuickSet()) {
      this.syncQuickSetWithRows();
    }
  }

  keyFor(row: ExamCapacityGridRow): string {
    return `${row.examId}-${row.streamId}`;
  }

  onQuickSetSelection(key: string): void {
    this.quickSetKey.set(key || null);
    const row = this.findRowByKey(key);
    this.quickSetCapacity.set(row ? Number(row.totalStudents ?? 0) : null);
  }

  onQuickSetCapacityInput(value: string): void {
    const parsed = Number(value);
    this.quickSetCapacity.set(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
  }

  canSaveQuickSet(): boolean {
    const key = this.quickSetKey();
    const capacity = this.quickSetCapacity();
    return !!key && Number.isFinite(capacity) && (capacity ?? -1) >= 0;
  }

  saveQuickSet(): void {
    if (!this.canSaveQuickSet()) {
      this.error.set('Select an exam-stream and enter a valid total capacity.');
      return;
    }

    const row = this.findRowByKey(this.quickSetKey());
    if (!row) {
      this.error.set('Selected exam-stream row was not found. Please refresh and try again.');
      return;
    }

    row.totalStudents = this.quickSetCapacity();
    this.saveRow(row);
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

  private findRowByKey(key: string | null): ExamCapacityGridRow | undefined {
    if (!key) return undefined;
    return this.rows().find((row) => this.keyFor(row) === key);
  }

  private syncQuickSetWithRows(): void {
    const rows = this.rows();
    if (rows.length === 0) {
      this.quickSetKey.set(null);
      this.quickSetCapacity.set(null);
      return;
    }

    const currentKey = this.quickSetKey();
    const selectedRow = this.findRowByKey(currentKey);
    if (selectedRow) {
      this.quickSetCapacity.set(Number(selectedRow.totalStudents ?? 0));
      return;
    }

    const defaultRow = rows[0];
    this.quickSetKey.set(this.keyFor(defaultRow));
    this.quickSetCapacity.set(Number(defaultRow.totalStudents ?? 0));
  }
}
