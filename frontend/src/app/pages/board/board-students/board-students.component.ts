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
      byExam: GroupSummary[];
      byCaste: GroupSummary[];
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
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="title-row">
        <div>
          <div class="h">Board Student Master</div>
          <div class="p">Unified student records across exam forms with exam-wise, caste-wise, and subject-wise filters.</div>
        </div>
        <div class="stats">Total: {{ total() }}</div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Exam</mat-label>
          <mat-select [(ngModel)]="examId" (selectionChange)="onFilterChanged()">
            <mat-option [value]="''">All exams</mat-option>
            <mat-option *ngFor="let exam of exams()" [value]="String(exam.id)">{{ exam.name }} - {{ exam.session }} {{ exam.academicYear }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w180">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="status" (selectionChange)="onFilterChanged()">
            <mat-option [value]="''">All visible</mat-option>
            <mat-option value="INSTITUTE_VERIFIED">Institute Verified</mat-option>
            <mat-option value="BOARD_APPROVED">Board Approved</mat-option>
            <mat-option value="REJECTED_BY_BOARD">Rejected By Board</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w180">
          <mat-label>Caste</mat-label>
          <mat-select [(ngModel)]="caste" (selectionChange)="onFilterChanged()">
            <mat-option [value]="''">All caste groups</mat-option>
            <mat-option *ngFor="let item of casteOptions()" [value]="item">{{ item }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w260">
          <mat-label>Subject</mat-label>
          <mat-select [(ngModel)]="subjectId" (selectionChange)="onFilterChanged()">
            <mat-option [value]="''">All subjects</mat-option>
            <mat-option *ngFor="let subject of subjects()" [value]="String(subject.id)">{{ subject.code }} - {{ subject.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w220">
          <mat-label>Sort By</mat-label>
          <mat-select [(ngModel)]="sortBy" (selectionChange)="onFilterChanged()">
            <mat-option value="updatedAt">Updated Date</mat-option>
            <mat-option value="exam">Exam</mat-option>
            <mat-option value="caste">Caste</mat-option>
            <mat-option value="subject">Subject</mat-option>
            <mat-option value="studentName">Student Name</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w160">
          <mat-label>Order</mat-label>
          <mat-select [(ngModel)]="sortOrder" (selectionChange)="onFilterChanged()">
            <mat-option value="asc">Ascending</mat-option>
            <mat-option value="desc">Descending</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="onFilterChanged()" placeholder="App no, student name, SARAL ID, Aadhaar" />
        </mat-form-field>

        <button mat-stroked-button color="primary" (click)="resetFilters()"><mat-icon>restart_alt</mat-icon>Reset</button>
      </div>

      <div class="actions">
        <button mat-flat-button color="primary" (click)="exportCsv()"><mat-icon>download</mat-icon>CSV</button>
        <button mat-flat-button color="primary" (click)="exportXlsx()"><mat-icon>grid_on</mat-icon>XLSX</button>
        <button mat-stroked-button color="primary" (click)="printReport()"><mat-icon>print</mat-icon>Print</button>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Exam-wise</div>
          <div class="summary-item" *ngFor="let item of summaries().byExam">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-title">Caste-wise</div>
          <div class="summary-item" *ngFor="let item of summaries().byCaste">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-title">Subject-wise</div>
          <div class="summary-item" *ngFor="let item of summaries().bySubject">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </div>

      <div *ngIf="error()" class="error-box">{{ error() }}</div>

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
    `.card { margin-bottom: 14px; padding: 16px; }`,
    `.title-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }`,
    `.h { font-weight: 900; font-size: 1.05rem; }`,
    `.p { color: #64748b; margin-top: 4px; }`,
    `.stats { font-weight: 700; color: #0f766e; }`,
    `.filters { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }`,
    `.actions { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }`,
    `.summary-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }`,
    `.summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }`,
    `.summary-title { font-weight: 700; color: #1d4ed8; margin-bottom: 6px; }`,
    `.summary-item { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; padding: 2px 0; }`,
    `.table-wrap { margin-top: 10px; width: 100%; height: 470px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }`,
    `.pager { margin-top: 10px; display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }`,
    `.error-box { margin-top: 10px; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; padding: 8px 10px; border-radius: 6px; }`,
    `.w160 { width: 160px; max-width: 100%; }`,
    `.w180 { width: 180px; max-width: 100%; }`,
    `.w220 { width: 220px; max-width: 100%; }`,
    `.w260 { width: 260px; max-width: 100%; }`,
    `@media (max-width: 1080px) { .summary-grid { grid-template-columns: 1fr; } }`
  ]
})
export class BoardStudentsComponent implements OnInit {
  readonly rows = signal<StudentMasterRow[]>([]);
  readonly exams = signal<ExamOption[]>([]);
  readonly subjects = signal<SubjectOption[]>([]);
  readonly casteOptions = signal<string[]>([]);
  readonly summaries = signal<{ byExam: GroupSummary[]; byCaste: GroupSummary[]; bySubject: GroupSummary[] }>({
    byExam: [],
    byCaste: [],
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
    this.loadRows();
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  onFilterChanged() {
    this.page = 1;
    this.loadRows();
  }

  resetFilters() {
    this.examId = '';
    this.status = '';
    this.caste = '';
    this.subjectId = '';
    this.search = '';
    this.sortBy = 'updatedAt';
    this.sortOrder = 'desc';
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

      const title = `Board Student Master Report`;
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
    this.http.get<{ exams: ExamOption[] }>(`${API_BASE_URL}/applications/board/exams`).subscribe({
      next: (response) => this.exams.set(response.exams || []),
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
          byExam: response.metadata?.summaries?.byExam || [],
          byCaste: response.metadata?.summaries?.byCaste || [],
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

  private fetchAllRowsForExport(onDone: (rows: StudentMasterRow[]) => void) {
    this.loading.set(true);
    this.error.set(null);

    const params = this.buildParams(1, 10000);
    this.http.get<StudentMasterResponse>(`${API_BASE_URL}/applications/board/student-master?${params.toString()}`).subscribe({
      next: (response) => {
        this.loading.set(false);
        onDone(response.rows || []);
      },
      error: (err: any) => {
        const message = err?.error?.error || err?.error?.message || 'Unable to export student master records';
        this.error.set(message);
        this.loading.set(false);
      }
    });
  }

  private buildParams(page: number, limit: number) {
    const p = new URLSearchParams();
    if (this.examId) p.set('examId', this.examId);
    if (this.status) p.set('status', this.status);
    if (this.caste) p.set('caste', this.caste);
    if (this.subjectId) p.set('subjectId', this.subjectId);
    if (this.search.trim()) p.set('search', this.search.trim());
    p.set('sortBy', this.sortBy);
    p.set('sortOrder', this.sortOrder);
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
