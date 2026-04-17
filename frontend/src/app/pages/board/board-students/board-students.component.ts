import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

type ExamOption = {
  id: number;
  name: string;
  session: string;
  academicYear: string;
};

type SubjectOption = {
  id: number;
  code: string;
  name: string;
};

type StudentMasterRow = {
  applicationId: number;
  applicationNo: string;
  status: string;
  candidateType: string;
  examId: number | null;
  examName: string;
  examSession: string;
  examAcademicYear: string;
  instituteId: number | null;
  instituteCode: string;
  instituteName: string;
  instituteDistrict: string;
  studentId: number | null;
  studentName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  motherName: string;
  dob: string | null;
  gender: string;
  aadhaar: string;
  apaarId: string;
  studentSaralId: string;
  mobile: string;
  streamCode: string;
  categoryCode: string;
  minorityReligionCode: string;
  mediumCode: string;
  divyangCode: string;
  address: string;
  district: string;
  taluka: string;
  village: string;
  pinCode: string;
  subjectCodes: string;
  subjectNames: string;
  subjectCategories: string;
  subjectCount: number;
  submittedAt: string | null;
  updatedAt: string | null;
};

type GroupSummary = {
  name: string;
  count: number;
};

type StudentMasterResponse = {
  rows: StudentMasterRow[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    availableCastes: string[];
    summaries?: {
      byCaste: GroupSummary[];
      byGender: GroupSummary[];
      byDistrict: GroupSummary[];
      bySubject: GroupSummary[];
    };
  };
};

type ExportColumn = {
  key: keyof StudentMasterRow;
  label: string;
  toText?: (row: StudentMasterRow) => string;
};

@Component({
  selector: 'app-board-students',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, AgGridModule, BoardExamSelectorComponent],
  template: `
    <mat-card class="card">
      <div class="title-row">
        <div class="title-copy">
          <div class="h">Board Student Master</div>
          <div class="sub">Unified student records with clean filters, summaries, and exports.</div>
        </div>
        <div class="stats-chip">
          <span class="stats-label">Total Records</span>
          <strong class="stats-value">{{ total() }}</strong>
        </div>
      </div>

      <div class="filters">
        <app-board-exam-selector
          [exams]="exams()"
          [selectedExamId]="examId"
          [compact]="true"
          (selectedExamIdChange)="onExamSelectionChanged($event)">
        </app-board-exam-selector>

        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="onFilterChanged()" />
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="loadRowsForSelectedExam()"><mat-icon>search</mat-icon>Load Students</button>
        <button mat-stroked-button color="primary" (click)="resetFilters()"><mat-icon>restart_alt</mat-icon>Reset</button>
      </div>

      <div class="actions">
        <button mat-flat-button color="primary" (click)="exportCsv()"><mat-icon>download</mat-icon>CSV</button>
        <button mat-flat-button color="primary" (click)="exportXlsx()"><mat-icon>grid_on</mat-icon>XLSX</button>
        <button mat-stroked-button color="primary" (click)="printReport()"><mat-icon>print</mat-icon>Print</button>
        <button mat-stroked-button color="primary" (click)="printAllExamForms()"><mat-icon>print</mat-icon>Print All Exam Forms</button>
      </div>

      <div class="summary-grid app-summary-grid">
        <div class="summary-card app-summary-card">
          <div class="summary-title app-summary-title">Gender-wise</div>
          <div class="app-summary-scroll">
            <div class="summary-item app-summary-item" *ngFor="let item of summaries().byGender">
              <span>{{ item.name }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>

        <div class="summary-card app-summary-card">
          <div class="summary-title app-summary-title">Caste-wise</div>
          <div class="app-summary-scroll">
            <div class="summary-item app-summary-item" *ngFor="let item of summaries().byCaste">
              <span>{{ item.name }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>

        <div class="summary-card app-summary-card">
          <div class="summary-title app-summary-title">District-wise</div>
          <div class="app-summary-scroll">
            <div class="summary-item app-summary-item" *ngFor="let item of summaries().byDistrict">
              <span>{{ item.name }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>

        <div class="summary-card app-summary-card">
          <div class="summary-title app-summary-title">Subject-wise</div>
          <div class="app-summary-scroll">
            <div class="summary-item app-summary-item" *ngFor="let item of summaries().bySubject">
              <span>{{ item.name }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="error()" class="error-box">{{ error() }}</div>
      <div *ngIf="loading()" class="p">Loading student records…</div>
      <div *ngIf="!loading() && rows().length === 0" class="p">No students found for the selected filters. Please select an exam and click Load Students.</div>

      <div class="ag-theme-alpine table-wrap">
        <ag-grid-angular
          style="width:100%; height:100%;"
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="limit"
          [paginationPageSizeSelector]="[25, 50, 100, 250]"
        ></ag-grid-angular>
      </div>

      <div class="pager">
        <span>Page {{ page }} / {{ totalPages() }} ({{ total() }} records)</span>
        <button mat-stroked-button (click)="prevPage()" [disabled]="page <= 1">Prev</button>
        <button mat-stroked-button (click)="nextPage()" [disabled]="page >= totalPages()">Next</button>
      </div>
    </mat-card>
  `,
  styles: [
    `.card { margin-bottom: 14px; padding: 14px 16px 16px; overflow: visible; border: 1px solid #dbe3f0; border-radius: 14px; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 28%); }`,
    `.title-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding-bottom: 8px; border-bottom: 1px solid #e5edf7; }`,
    `.title-copy { min-width: 260px; }`,
    `.h { font-weight: 900; font-size: 1.02rem; line-height: 1.2; color: #0f172a; margin: 0; }`,
    `.sub { color: #5f6f86; font-size: 0.83rem; margin-top: 2px; line-height: 1.3; }`,
    `.stats-chip { display: flex; align-items: baseline; gap: 8px; padding: 6px 10px; border-radius: 999px; border: 1px solid #cde2da; background: #ecfdf5; }`,
    `.stats-label { color: #115e59; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }`,
    `.stats-value { color: #065f46; font-size: 1rem; line-height: 1; }`,
    `.filters { margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; position: relative; z-index: 8; }`,
    `.actions { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; position: relative; z-index: 8; }`,
    `.summary-grid { margin-top: 10px; position: relative; z-index: 8; }`,
    `.table-wrap { margin-top: 10px; width: 100%; height: 470px; border: 1px solid #dbe7f6; border-radius: 10px; overflow: hidden; position: relative; z-index: 2; background: #fff; }`,
    `::ng-deep .cdk-overlay-container { z-index: 1300 !important; }`,
    `::ng-deep .cdk-overlay-pane { z-index: 1301 !important; }`,
    `::ng-deep .board-students-select-panel { max-height: 320px !important; }`,
    `.pager { margin-top: 10px; display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }`,
    `.error-box { margin-top: 10px; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; padding: 8px 10px; border-radius: 6px; }`,
    `.w160 { width: 160px; max-width: 100%; }`,
    `.w180 { width: 180px; max-width: 100%; }`,
    `.w220 { width: 220px; max-width: 100%; }`,
    `.w260 { width: 260px; max-width: 100%; }`,
    `@media (max-width: 1280px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`,
    `@media (max-width: 1080px) { .summary-grid { grid-template-columns: 1fr; } .title-row { align-items: flex-start; } .stats-chip { margin-top: 2px; } }`
  ]
})
export class BoardStudentsComponent implements OnInit {
  readonly rows = signal<StudentMasterRow[]>([]);
  readonly exams = signal<ExamOption[]>([]);
  readonly subjects = signal<SubjectOption[]>([]);
  readonly casteOptions = signal<string[]>([]);
  readonly summaries = signal<{ byCaste: GroupSummary[]; byGender: GroupSummary[]; byDistrict: GroupSummary[]; bySubject: GroupSummary[] }>({
    byCaste: [],
    byGender: [],
    byDistrict: [],
    bySubject: []
  });
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  examId = '';
  status = '';
  caste = '';
  subjectId = '';
  search = '';
  sortBy: 'updatedAt' | 'exam' | 'caste' | 'subject' | 'studentName' = 'updatedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  page = 1;
  limit = 100;

  readonly exportColumns: ExportColumn[] = [
    { key: 'applicationNo', label: 'Application No' },
    { key: 'status', label: 'Status' },
    { key: 'candidateType', label: 'Candidate Type' },
    { key: 'examName', label: 'Exam Name' },
    { key: 'examSession', label: 'Exam Session' },
    { key: 'examAcademicYear', label: 'Exam Academic Year' },
    { key: 'instituteCode', label: 'Institute Code' },
    { key: 'instituteName', label: 'Institute Name' },
    { key: 'instituteDistrict', label: 'Institute District' },
    { key: 'studentName', label: 'Student Full Name' },
    { key: 'firstName', label: 'First Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'motherName', label: 'Mother Name' },
    { key: 'dob', label: 'DOB', toText: (row) => this.formatDate(row.dob) },
    { key: 'gender', label: 'Gender' },
    { key: 'aadhaar', label: 'Aadhaar' },
    { key: 'apaarId', label: 'APAAR ID' },
    { key: 'studentSaralId', label: 'Student Saral ID' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'streamCode', label: 'Stream Code' },
    { key: 'categoryCode', label: 'Caste Category' },
    { key: 'minorityReligionCode', label: 'Minority Religion Code' },
    { key: 'mediumCode', label: 'Medium Code' },
    { key: 'divyangCode', label: 'Divyang Code' },
    { key: 'address', label: 'Address' },
    { key: 'district', label: 'District' },
    { key: 'taluka', label: 'Taluka' },
    { key: 'village', label: 'Village' },
    { key: 'pinCode', label: 'Pin Code' },
    { key: 'subjectCodes', label: 'Subject Codes' },
    { key: 'subjectNames', label: 'Subject Names' },
    { key: 'subjectCategories', label: 'Subject Categories' },
    { key: 'subjectCount', label: 'Subject Count' },
    { key: 'submittedAt', label: 'Submitted At', toText: (row) => this.formatDateTime(row.submittedAt) },
    { key: 'updatedAt', label: 'Updated At', toText: (row) => this.formatDateTime(row.updatedAt) }
  ];

  readonly columnDefs: ColDef[] = this.exportColumns.map((column) => ({
    field: column.key,
    headerName: column.label,
    minWidth: 160,
    valueGetter: (params: any) => {
      const row = params.data as StudentMasterRow;
      if (!row) return '';
      return column.toText ? column.toText(row) : this.toText(row[column.key]);
    }
  }));

  readonly defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadFilters();
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  onFilterChanged() {
    this.page = 1;
    this.loadRows();
  }

  onExamSelectionChanged(value: string) {
    this.examId = value;
    this.onFilterChanged();
  }

  loadRowsForSelectedExam() {
    this.page = 1;
    if (!this.examId) {
      this.error.set('Please select an exam to view student records exam-wise.');
      this.rows.set([]);
      this.total.set(0);
      return;
    }
    this.loadRows();
  }

  resetFilters() {
    this.examId = '';
    this.search = '';
    this.page = 1;
    this.loadRows();
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page -= 1;
    this.loadRows();
  }

  nextPage() {
    if (this.page >= this.totalPages()) return;
    this.page += 1;
    this.loadRows();
  }

  exportCsv() {
    this.fetchAllRowsForExport((rows) => {
      if (!rows.length) return;
      const headers = this.exportColumns.map((column) => column.label);
      const lines = rows.map((row) => this.exportColumns.map((column) => this.escapeCsv(column.toText ? column.toText(row) : this.toText(row[column.key]))).join(','));
      const content = `${headers.join(',')}\n${lines.join('\n')}`;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `board-student-master-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  exportXlsx() {
    this.fetchAllRowsForExport((rows) => {
      if (!rows.length) return;
      const data = rows.map((row) => {
        const record: Record<string, string> = {};
        this.exportColumns.forEach((column) => {
          record[column.label] = column.toText ? column.toText(row) : this.toText(row[column.key]);
        });
        return record;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Master');
      XLSX.writeFile(workbook, `board-student-master-${Date.now()}.xlsx`);
    });
  }

  printReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const head = this.exportColumns.map((column) => `<th>${column.label}</th>`).join('');
    const body = rows
      .map((row) => {
        const cells = this.exportColumns
          .map((column) => `<td>${this.htmlEscape(column.toText ? column.toText(row) : this.toText(row[column.key]))}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const title = `Board Student Master Report - Current Grid Page`;
    const subtitle = `Generated: ${new Date().toLocaleString()} | Records: ${rows.length}`;
    const html = `<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:16px;color:#111;} h2{margin:0 0 4px;} .sub{color:#555;margin-bottom:10px;} table{width:100%;border-collapse:collapse;font-size:11px;} th,td{border:1px solid #777;padding:4px 6px;text-align:left;vertical-align:top;} th{background:#f1f5f9;} @media print{@page{size:A4 landscape; margin:10mm;}}</style></head><body><h2>${title}</h2><div class="sub">${subtitle}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }

  printAllExamForms() {
    this.fetchAllRowsForExport((rows) => {
      if (!rows.length) return;
      const head = this.exportColumns.map((column) => `<th>${column.label}</th>`).join('');
      const body = rows
        .map((row) => {
          const cells = this.exportColumns
            .map((column) => `<td>${this.htmlEscape(column.toText ? column.toText(row) : this.toText(row[column.key]))}</td>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      const title = `Board Student Master Report - All Exams`;
      const subtitle = `Generated: ${new Date().toLocaleString()} | Records: ${rows.length}`;
      const html = `<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:16px;color:#111;} h2{margin:0 0 4px;} .sub{color:#555;margin-bottom:10px;} table{width:100%;border-collapse:collapse;font-size:11px;} th,td{border:1px solid #777;padding:4px 6px;text-align:left;vertical-align:top;} th{background:#f1f5f9;} @media print{@page{size:A4 landscape; margin:10mm;}}</style></head><body><h2>${title}</h2><div class="sub">${subtitle}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.print();
    });
  }

  private loadFilters() {
    this.http.get<{ exams: ExamOption[] }>(`${API_BASE_URL}/applications/board/exams?includeSubmitted=true`).subscribe({
      next: (response) => {
        const exams = response.exams || [];
        this.exams.set(exams);
        if (!this.examId && exams.length > 0) {
          this.examId = String(exams[0].id);
        }
        this.loadRows();
      },
      error: (err: any) => {
        const message = err?.error?.error || err?.error?.message || 'Unable to load exams';
        this.error.set(message);
      }
    });

    this.http.get<{ subjects: SubjectOption[] }>(`${API_BASE_URL}/masters/subjects`).subscribe({
      next: (response) => this.subjects.set(response.subjects || []),
      error: (err: any) => {
        const message = err?.error?.error || err?.error?.message || 'Unable to load subjects';
        this.error.set(message);
      }
    });
  }

  private loadRows() {
    this.loading.set(true);
    this.error.set(null);

    const params = this.buildParams(this.page, this.limit);
    this.http.get<StudentMasterResponse>(`${API_BASE_URL}/applications/board/student-master?${params.toString()}`).subscribe({
      next: (response) => {
        this.rows.set(response.rows || []);
        this.total.set(response.metadata?.total ?? 0);
        this.casteOptions.set(response.metadata?.availableCastes || []);
        this.summaries.set({
          byCaste: response.metadata?.summaries?.byCaste || [],
          byGender: response.metadata?.summaries?.byGender || [],
          byDistrict: response.metadata?.summaries?.byDistrict || [],
          bySubject: response.metadata?.summaries?.bySubject || []
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        const message = err?.error?.error || err?.error?.message || 'Unable to load student master records';
        this.error.set(message);
        this.loading.set(false);
      }
    });
  }

  private fetchAllRowsForExport(onDone: (rows: StudentMasterRow[]) => void, ignoreExam = false) {
    this.loading.set(true);
    this.error.set(null);

    const pageSize = 1000;
    this.fetchExportPage(1, pageSize, ignoreExam, [], onDone);
  }

  private fetchExportPage(
    page: number,
    limit: number,
    ignoreExam: boolean,
    accumulated: StudentMasterRow[],
    onDone: (rows: StudentMasterRow[]) => void
  ) {
    const params = this.buildParams(page, limit, ignoreExam);
    this.http.get<StudentMasterResponse>(`${API_BASE_URL}/applications/board/student-master?${params.toString()}`).subscribe({
      next: (response) => {
        const pageRows = response.rows || [];
        const combined = accumulated.concat(pageRows);
        const total = response.metadata?.total ?? combined.length;

        if (combined.length < total && pageRows.length > 0) {
          this.fetchExportPage(page + 1, limit, ignoreExam, combined, onDone);
          return;
        }

        this.loading.set(false);
        onDone(combined);
      },
      error: (err: any) => {
        const message = err?.error?.error || err?.error?.message || 'Unable to export student master records';
        this.error.set(message);
        this.loading.set(false);
      }
    });
  }

  private buildParams(page: number, limit: number, ignoreExam = false) {
    const p = new URLSearchParams();
    if (!ignoreExam && this.examId) p.set('examId', this.examId);
    if (this.search.trim()) p.set('search', this.search.trim());
    p.set('sortBy', 'updatedAt');
    p.set('sortOrder', 'desc');
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p;
  }

  private formatDate(value: string | null) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-GB');
  }

  private formatDateTime(value: string | null) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-GB');
  }

  private toText(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private escapeCsv(value: string) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  private htmlEscape(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
