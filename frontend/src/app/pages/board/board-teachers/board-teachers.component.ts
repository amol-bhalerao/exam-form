import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { API_BASE_URL } from '../../../core/api';

type TeacherRow = {
  id: number;
  fullName: string;
  designation?: string;
  subjectSpecialization?: string;
  institute?: { name?: string };
  active: boolean;
  createdAt: string;
  email?: string;
  mobile?: string;
};

@Component({
  selector: 'app-board-teachers',
  standalone: true,
  imports: [FormsModule, AgGridAngular, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <mat-card class="card">
      <div class="dashboard-grid">
        <div class="stat">Total: {{ metadata().total }}</div>
        <div class="stat">Active: {{ metadata().activeCount }}</div>
        <div class="stat">Inactive: {{ metadata().inactiveCount }}</div>
      </div>
      <div class="controls">
        <mat-form-field appearance="outline" class="w240"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
        <mat-form-field appearance="outline" class="w180"><mat-label>Status</mat-label><mat-select [(ngModel)]="statusFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="true">Active</mat-option><mat-option value="false">Inactive</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="w220"><mat-label>Institute</mat-label><input matInput [(ngModel)]="instituteFilter" (input)="load()" /></mat-form-field>
        <button mat-flat-button color="primary" (click)="exportCsv()">Export CSV</button>
        <button mat-stroked-button color="primary" (click)="printGrid()">Print</button>
      </div>
      <div class="ag-theme-alpine table-box" style="height: 420px; width: 100%;">
        <ag-grid-angular
          style="width: 100%; height: 100%;"
          class="ag-theme-alpine"
          [rowData]="teachers()"
          [columnDefs]="columnDefs"
          [pagination]="true"
          [paginationPageSize]="metadata().limit"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onGridAction($event)"
        ></ag-grid-angular>
      </div>
    </mat-card>
  `,
  styles: [
    `.card { margin-bottom: 14px; padding: 16px; }`,
    `.dashboard-grid { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }`,
    `.stat { background: #eef2ff; padding: 10px; border-radius: 8px; font-weight: 700; }`,
    `.controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }`,
    `.w240 { width: 240px; }`,
    `.w180 { width: 180px; }`,
    `.w220 { width: 220px; }`,
    `.table-box { border: 1px solid #e2e8f0; border-radius: 6px; }`
  ]
})
export class BoardTeachersComponent implements OnInit {
  readonly teachers = signal<TeacherRow[]>([]);
  readonly metadata = signal({ page: 1, limit: 20, total: 0, activeCount: 0, inactiveCount: 0 });
  search = '';
  statusFilter = '';
  instituteFilter = '';

  readonly columnDefs: ColDef[] = [
    { field: 'fullName', headerName: 'Name', sortable: true, filter: true, resizable: true },
    { field: 'designation', headerName: 'Designation', sortable: true, filter: true, resizable: true },
    { field: 'subjectSpecialization', headerName: 'Subject', sortable: true, filter: true, resizable: true },
    { headerName: 'Institute', valueGetter: (params: any) => params.data?.institute?.name ?? '-', sortable: true, filter: true, resizable: true },
    { field: 'email', headerName: 'Email', sortable: true, filter: true, resizable: true },
    { field: 'mobile', headerName: 'Mobile', sortable: true, filter: true, resizable: true },
    { headerName: 'Status', valueGetter: (params: any) => (params.data.active ? 'Active' : 'Inactive'), sortable: true, filter: true, resizable: true },
    { headerName: 'Created', valueGetter: (params: any) => new Date(params.data.createdAt).toLocaleDateString(), sortable: true, filter: true, resizable: true },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 170, cellRenderer: (params: any) => `<div style="display:flex;gap:4px;"><button data-action=view style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 6px;border-radius:4px;">View</button><button data-action=toggle style="border:none;background:#fef3c7;color:#92400e;padding:3px 6px;border-radius:4px;">Toggle</button></div>` }
  ];

  defaultColDef = { flex: 1, minWidth: 120, filter: true, sortable: true };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    const q = new URLSearchParams();
    if (this.search) q.set('search', this.search);
    if (this.statusFilter) q.set('active', this.statusFilter);
    if (this.instituteFilter) q.set('institute', this.instituteFilter);
    q.set('page', `${this.metadata().page}`);
    q.set('limit', `${this.metadata().limit}`);
    this.http.get<{ teachers: TeacherRow[]; metadata: any }>(`${API_BASE_URL}/institutes/board/teachers?${q.toString()}`).subscribe((r) => {
      this.teachers.set(r.teachers);
      this.metadata.set({ ...this.metadata(), ...r.metadata });
    });
  }

  exportCsv() {
    const rows = this.teachers().map((t) => ({
      Name: t.fullName,
      Designation: t.designation ?? '',
      Subject: t.subjectSpecialization ?? '',
      Institute: t.institute?.name ?? '',
      Email: t.email ?? '',
      Mobile: t.mobile ?? '',
      Status: t.active ? 'Active' : 'Inactive',
      CreatedAt: new Date(t.createdAt).toLocaleDateString()
    }));
    if (!rows.length) return;
    const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  printGrid() {
    const rows = this.teachers().map((t) => `<tr><td>${t.fullName}</td><td>${t.designation ?? ''}</td><td>${t.subjectSpecialization ?? ''}</td><td>${t.institute?.name ?? ''}</td><td>${t.email ?? ''}</td><td>${t.mobile ?? ''}</td><td>${t.active ? 'Active' : 'Inactive'}</td><td>${new Date(t.createdAt).toLocaleDateString()}</td></tr>`).join('');
    const html = `<html><head><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #666;padding:4px;text-align:left;}</style></head><body><h2>Teachers</h2><table><thead><tr><th>Name</th><th>Designation</th><th>Subject</th><th>Institute</th><th>Email</th><th>Mobile</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  onGridAction(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'view') {
      alert(`Teacher: ${row.fullName}\nInstitute: ${row.institute?.name ?? 'N/A'}\nSubject: ${row.subjectSpecialization ?? ''}`);
      return;
    }
    if (action === 'toggle') {
      const newStatus = !row.active;
      this.http.patch(`${API_BASE_URL}/institutes/board/teachers/${row.id}`, { active: newStatus }).subscribe({ next: () => this.load(), error: () => alert('Status update failed') });
      return;
    }
  }
}
