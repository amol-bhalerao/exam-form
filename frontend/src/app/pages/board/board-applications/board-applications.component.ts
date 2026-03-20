import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

ModuleRegistry.registerModules([AllCommunityModule]);

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
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">Verified Applications</div>
          <div class="p">Only institute-verified forms are visible here.</div>
        </div>
      </div>
      <div class="row">
        <mat-form-field appearance="outline" class="w260"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
        <mat-form-field appearance="outline" class="w160"><mat-label>Status</mat-label><mat-select [(ngModel)]="status" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="INSTITUTE_VERIFIED">Institute Verified</mat-option><mat-option value="BOARD_APPROVED">Board Approved</mat-option><mat-option value="REJECTED_BY_BOARD">Rejected</mat-option></mat-select></mat-form-field>
        <div class="grow"></div>
        <button mat-flat-button color="primary" (click)="exportCsv()">Export CSV</button>
        <button mat-stroked-button color="primary" (click)="printList()">Print</button>
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
        <span style="margin-left:auto;">Page {{ page }} <button mat-stroked-button (click)="prevPage()" [disabled]="page <= 1">Prev</button><button mat-stroked-button (click)="nextPage()">Next</button></span>
      </div>
    </mat-card>
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
    `
  ]
})
export class BoardApplicationsComponent implements OnInit {
  readonly rows = signal<Row[]>([]);
  selectedRow: Row | null = null;
  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'App No', flex: 1 },
    { field: 'student.lastName', headerName: 'Student', flex: 1, valueGetter: (p) => `${p.data.student.lastName || ''}, ${p.data.student.firstName || ''}` },
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
    this.load();
  }

  load() {
    const p = new URLSearchParams();
    if (this.search) p.set('search', this.search);
    if (this.status) p.set('status', this.status);
    p.set('page', `${this.page}`);
    p.set('limit', '15');
    this.http.get<{ applications: Row[] }>(`${API_BASE_URL}/applications/board/list?${p.toString()}`).subscribe((r) => this.rows.set(r.applications));
  }

  selectRow(event: any) {
    this.selectedRow = event.data;
  }

  decide(id: number | undefined, action: 'APPROVE' | 'REJECT') {
    if (!id) return;
    this.http.post(`${API_BASE_URL}/applications/${id}/board/decision`, { action }).subscribe(() => this.load());
  }

  exportCsv() {
    const rows = this.rows().map((r) => ({
      ApplicationNo: r.applicationNo,
      Student: `${r.student.lastName || ''}, ${r.student.firstName || ''}`,
      Institute: r.institute.name,
      Exam: `${r.exam.name} ${r.exam.session} ${r.exam.academicYear}`,
      Status: r.status,
      UpdatedAt: new Date(r.updatedAt).toLocaleString()
    }));
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `applications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  printList() {
    const header = `<h2>Applications</h2><p>Search:${this.search || 'All'} Status:${this.status || 'All'}</p>`;
    const rowsHtml = this.rows().map((r) => `<tr><td>${r.applicationNo}</td><td>${r.student.lastName || ''}, ${r.student.firstName || ''}</td><td>${r.institute.name}</td><td>${r.exam.name} ${r.exam.session} ${r.exam.academicYear}</td><td>${r.status}</td></tr>`).join('');
    const content = `<html><head><title>Applications</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #666;padding:5px;text-align:left;}</style></head><body>${header}<table><thead><tr><th>App No</th><th>Student</th><th>Institute</th><th>Exam</th><th>Status</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(content);
    w.document.close();
    w.print();
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

