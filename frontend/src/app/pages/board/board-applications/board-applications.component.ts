import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import { BoardExamSelectorComponent } from '../../../components/board-exam-selector/board-exam-selector.component';

import { API_BASE_URL } from '../../../core/api';

type Exam = {
  id: number;
  name: string;
  session: string;
  academicYear: string;
  _count?: { applications: number };
};

type Row = {
  id: number;
  applicationNo: string;
  status: string;
  institute: { name: string };
  student: { firstName?: string; lastName?: string };
  exam: { name: string; session: string; academicYear: string };
  updatedAt: string;
};

@Component({
  selector: 'app-board-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, AgGridModule, BoardExamSelectorComponent],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">Verified Applications</div>
          <div class="p">Only institute-verified forms are visible here.</div>
        </div>
        <div class="grow"></div>
        <app-board-exam-selector
          [exams]="exams()"
          [selectedExamId]="selectedExam?.id || ''"
          label="Exam"
          allLabel="Select exam"
          [compact]="true"
          (selectedExamIdChange)="onExamChange($event)">
        </app-board-exam-selector>
      </div>
    </mat-card>

    @if (error()) {
      <mat-card class="card error-card">
        <div class="error-message">
          <mat-icon>error_outline</mat-icon>
          <div>
            <strong>Error:</strong> {{ error() }}
          </div>
        </div>
      </mat-card>
    }

    @if (loading()) {
      <mat-card class="card">
        <div class="loading-text">Loading...</div>
      </mat-card>
    }

    <!-- Applications List -->
    <ng-container *ngIf="selectedExam">
      <mat-card class="card">
        <div class="row">
          <div>
            <div class="h">Applications for {{ selectedExam.name || 'Unknown Exam' }} {{ selectedExam.session || 'Unknown Session' }} {{ selectedExam.academicYear || 'Unknown Academic Year' }}</div>
            <div class="p">Showing {{ totalApplications }} applications</div>
          </div>
          <div class="grow"></div>
          <button mat-stroked-button (click)="clearExamSelection()">Change Exam</button>
        </div>
        <div class="row">
          <mat-form-field appearance="outline" class="w260"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
          <mat-form-field appearance="outline" class="w160"><mat-label>Status</mat-label><mat-select [(ngModel)]="status" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="INSTITUTE_VERIFIED">Institute Verified</mat-option><mat-option value="BOARD_APPROVED">Board Approved</mat-option><mat-option value="REJECTED_BY_BOARD">Rejected</mat-option></mat-select></mat-form-field>
          <div class="grow"></div>
          <button mat-flat-button color="primary" (click)="exportExcel()">Export Excel</button>
          <button mat-stroked-button color="primary" (click)="printList()">Print List</button>
          <button mat-stroked-button color="primary" (click)="printAllExamForms()">Print All Exam Forms</button>
        </div>
      </mat-card>

      <mat-card class="card">
        <div class="ag-theme-alpine" style="height: 360px; width: 100%; margin-top: 6px;">
          <ag-grid-angular
            style="width:100%; height:100%;"
            [rowData]="rows()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            (rowClicked)="selectRow($event)"
          ></ag-grid-angular>
        </div>
        <div style="margin-top: 10px; display:flex; gap: 8px; align-items:center;">
          <button mat-flat-button color="primary" (click)="decide(selectedRow?.id, 'APPROVE')" [disabled]="!selectedRow || selectedRow.status !== 'INSTITUTE_VERIFIED'">Approve Selected</button>
          <button mat-stroked-button color="warn" (click)="decide(selectedRow?.id, 'REJECT')" [disabled]="!selectedRow || selectedRow.status !== 'INSTITUTE_VERIFIED'">Reject Selected</button>
          <span style="margin-left:auto;">Page {{ page }} of {{ totalPages }} ({{ totalApplications }} total) 
            <button mat-stroked-button (click)="prevPage()" [disabled]="page <= 1">Prev</button>
            <button mat-stroked-button (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
          </span>
        </div>
      </mat-card>
    </ng-container>
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
      }
      .row {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .grow {
        flex: 1;
      }
      .h {
        font-weight: 900;
      }
      .p {
        color: #6b7280;
        margin-top: 4px;
      }
      .exam-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .exam-card {
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 16px;
      }
      .exam-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateY(-2px);
      }
      .exam-name {
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 4px;
      }
      .exam-details {
        color: #6b7280;
        font-size: 0.9rem;
        margin-bottom: 8px;
      }
      .exam-count {
        color: #059669;
        font-weight: 500;
        font-size: 0.9rem;
      }
      .table {
        width: 100%;
      }
      .w260 {
        width: 280px;
        max-width: 100%;
      }
      .w160 {
        width: 180px;
        max-width: 100%;
      }
      td button {
        margin-right: 8px;
      }
      .pager {
        margin-top: 10px;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .error-card {
        background-color: #fee;
        border: 1px solid #fcc;
      }
      .error-message {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        color: #c33;
      }
      .error-message mat-icon {
        color: #c33;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .loading-text {
        text-align: center;
        padding: 20px;
        color: #666;
      }
    `
  ]
})
export class BoardApplicationsComponent implements OnInit {
  readonly rows = signal<Row[]>([]);
  readonly exams = signal<Exam[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedRow: Row | null = null;
  selectedExam: Exam | null = null;
  totalApplications = 0;
  totalPages = 1;
  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'App No', flex: 1 },
    {
      field: 'student.lastName',
      headerName: 'Student',
      flex: 1,
      valueGetter: (p) => {
        const student = p?.data?.student || {};
        return `${student.lastName || ''}, ${student.firstName || ''}`.replace(/^,\s*/, '').trim();
      }
    },
    { field: 'institute.name', headerName: 'Institute', flex: 1 },
    { field: 'exam.name', headerName: 'Exam', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'updatedAt', headerName: 'Updated', flex: 1, valueFormatter: (p) => new Date(p.value).toLocaleString() }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, floatingFilter: true };
  search = '';
  status = '';
  page = 1;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/applications/board/exams`).subscribe({
      next: (r) => {
        const examList = r.exams || [];
        this.exams.set(examList);
        if (!this.selectedExam && examList.length > 0) {
          this.selectExam(examList[0]);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load exams';
        console.error('Failed to load exams:', errorMsg);
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  selectExam(exam: Exam) {
    this.selectedExam = exam;
    this.page = 1;
    this.search = '';
    this.status = '';
    this.load();
  }

  onExamChange(examId: string | number) {
    if (!examId) {
      this.clearExamSelection();
      return;
    }
    const selected = this.exams().find((exam) => exam.id === Number(examId));
    if (selected) {
      this.selectExam(selected);
    }
  }

  clearExamSelection() {
    this.selectedExam = null;
    this.rows.set([]);
    this.selectedRow = null;
    this.totalApplications = 0;
    this.totalPages = 1;
    this.page = 1;
  }

  load() {
    if (!this.selectedExam) return;

    this.loading.set(true);
    this.error.set(null);
    const p = new URLSearchParams();
    p.set('examId', `${this.selectedExam.id}`);
    if (this.search) p.set('search', this.search);
    if (this.status) p.set('status', this.status);
    p.set('page', `${this.page}`);
    p.set('limit', '25');

    this.http.get<{ applications: Row[]; metadata: { total: number; page: number; limit: number } }>(`${API_BASE_URL}/applications/board/list?${p.toString()}`).subscribe({
      next: (r) => {
        this.rows.set(r.applications || []);
        this.totalApplications = r.metadata.total;
        this.totalPages = Math.ceil(r.metadata.total / r.metadata.limit);
        this.loading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load applications';
        console.error('Failed to load applications:', errorMsg);
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  selectRow(event: any) {
    this.selectedRow = event.data;
  }

  decide(id: number | undefined, action: 'APPROVE' | 'REJECT') {
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.post(`${API_BASE_URL}/applications/${id}/board/decision`, { action }).subscribe({
      next: () => {
        this.loading.set(false);
        this.error.set(null);
        this.load();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to process decision';
        console.error('Failed to process decision:', errorMsg);
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  exportExcel() {
    if (!this.selectedExam) return;
    
    this.loading.set(true);
    this.error.set(null);
    
    this.fetchAllApplicationsForSelectedExam((applications) => {
      if (!applications.length) {
        this.loading.set(false);
        return;
      }
        const data = applications.map((r) => ({
          'Application No': r.applicationNo,
          'Student Name': `${r.student.lastName || ''}, ${r.student.firstName || ''}`.trim(),
          'Institute': r.institute.name,
          'Exam': `${r.exam.name} ${r.exam.session} ${r.exam.academicYear}`,
          'Status': r.status,
          'Updated At': new Date(r.updatedAt).toLocaleString()
        }));

        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
        XLSX.writeFile(workbook, `applications-${this.selectedExam!.name}-${Date.now()}.xlsx`);
        this.loading.set(false);
    });
  }

  printList() {
    if (!this.selectedExam) return;

    this.loading.set(true);
    this.error.set(null);

    this.fetchAllApplicationsForSelectedExam((printableRows) => {
        if (!printableRows.length) {
          this.loading.set(false);
          return;
        }
        const header = `<h2>Applications for ${this.selectedExam!.name} ${this.selectedExam!.session} ${this.selectedExam!.academicYear}</h2><p>Status: ${this.status || 'All'} | Search: ${this.search || 'All'} | Total: ${printableRows.length}</p>`;
        const rowsHtml = printableRows
          .map((r) => `<tr><td>${this.htmlEscape(r.applicationNo)}</td><td>${this.htmlEscape(`${r.student.lastName || ''}, ${r.student.firstName || ''}`)}</td><td>${this.htmlEscape(r.institute.name)}</td><td>${this.htmlEscape(`${r.exam.name} ${r.exam.session} ${r.exam.academicYear}`)}</td><td>${this.htmlEscape(r.status)}</td><td>${this.htmlEscape(new Date(r.updatedAt).toLocaleString())}</td></tr>`)
          .join('');
        const content = `<html><head><title>Applications - ${this.selectedExam!.name}</title><style>table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border:1px solid #666;padding:4px;text-align:left;}th{background:#f5f5f5;font-weight:bold;}</style></head><body>${header}<table><thead><tr><th>App No</th><th>Student</th><th>Institute</th><th>Exam</th><th>Status</th><th>Updated</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
        const w = window.open('', '_blank');
        if (!w) {
          this.loading.set(false);
          return;
        }
        w.document.write(content);
        w.document.close();
        w.print();
        this.loading.set(false);
    });
  }

  printAllExamForms() {
    if (!this.selectedExam) return;

    this.loading.set(true);
    this.error.set(null);

    this.fetchAllApplicationsForSelectedExam((applications) => {
      if (!applications.length) {
        this.loading.set(false);
        return;
      }

      const urls = applications.map((row) =>
        `/app/student/forms/${row.id}/print?autoprint=1&hideActions=1&closeAfterPrint=1`
      );

      let blocked = 0;
      urls.forEach((url, index) => {
        setTimeout(() => {
          const popup = window.open(url, '_blank');
          if (!popup) blocked += 1;

          if (index === urls.length - 1 && blocked > 0) {
            this.error.set('Some print windows were blocked by browser popup settings. Please allow popups and try again.');
          }
        }, index * 150);
      });

      this.loading.set(false);
    });
  }

  private fetchAllApplicationsForSelectedExam(onDone: (applications: Row[]) => void) {
    if (!this.selectedExam) return;

    const pageSize = 500;
    const allRows: Row[] = [];

    const fetchPage = (page: number) => {
      const params = new URLSearchParams();
      params.set('examId', `${this.selectedExam!.id}`);
      if (this.status) params.set('status', this.status);
      if (this.search) params.set('search', this.search);
      params.set('page', `${page}`);
      params.set('limit', `${pageSize}`);

      this.http
        .get<{ applications: Row[]; metadata: { total: number; page: number; limit: number } }>(`${API_BASE_URL}/applications/board/list?${params.toString()}`)
        .subscribe({
          next: (response) => {
            const rows = response.applications || [];
            allRows.push(...rows);

            const total = response.metadata?.total ?? allRows.length;
            if (allRows.length < total && rows.length > 0) {
              fetchPage(page + 1);
              return;
            }

            onDone(allRows);
          },
          error: (err: any) => {
            const errorMsg = err?.error?.error || err?.error?.message || 'Failed to fetch applications';
            console.error('Failed to fetch applications:', errorMsg);
            this.error.set(errorMsg);
            this.loading.set(false);
          }
        });
    };

    fetchPage(1);
  }

  private htmlEscape(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  nextPage() {
    this.page += 1;
    this.load();
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }
}

