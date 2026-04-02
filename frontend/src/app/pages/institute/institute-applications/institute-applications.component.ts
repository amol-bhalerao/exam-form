import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type Row = {
  id: number;
  applicationNo: string;
  status: string;
  student: { firstName?: string; lastName?: string };
  exam: { name: string; session: string; academicYear: string };
  updatedAt: string;
};

@Component({
  selector: 'app-institute-applications',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, AgGridModule, NgIf],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">Institute Applications</div>
          <div class="p">Verify submitted forms. Verified forms move to Board dashboard.</div>
        </div>
        <div class="grow"></div>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="load()" />
        </mat-form-field>
      </div>
    </mat-card>

    <mat-card class="card">
      <div *ngIf="loading()" style="margin-bottom:8px;color:#2563eb">Loading applications…</div>
      <div *ngIf="errorMessage()" style="margin-bottom:8px;color:#b91c1c">{{ errorMessage() }}</div>
      <div *ngIf="!loading() && rows().length === 0" style="margin-bottom:8px;color:#374151">No applications found.</div>
      <div class="ag-theme-alpine" style="width:100%; height:360px; margin-top:10px;">
        <ag-grid-angular
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          (rowClicked)="onRowClicked($event.data)"
        ></ag-grid-angular>
      </div>
      <div *ngIf="selectedRow" class="selected-row">
        <span><strong>Selected:</strong> {{ selectedRow.applicationNo }} ({{ selectedRow.status }})</span>
        <button mat-flat-button color="primary" (click)="decide(selectedRow.id, 'VERIFY')" [disabled]="selectedRow.status !== 'SUBMITTED'">Verify</button>
        <button mat-stroked-button (click)="decide(selectedRow.id, 'REJECT')" [disabled]="selectedRow.status !== 'SUBMITTED'">Reject</button>
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
      td button {
        margin-right: 8px;
      }
    `
  ]
})
export class InstituteApplicationsComponent implements OnInit {
  readonly rows = signal<Row[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  selectedRow: Row | null = null;
  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'App No', flex: 1, sortable: true, filter: true },
    { field: 'student', headerName: 'Student', valueGetter: (params: any) => `${params.data.student?.lastName || ''}, ${params.data.student?.firstName || ''}`, flex: 1 },
    { field: 'exam', headerName: 'Exam', valueGetter: (params: any) => `${params.data.exam?.session || ''} ${params.data.exam?.academicYear || ''}`, flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 }
  ];
  readonly defaultColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };
  search = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params = this.search ? `?search=${encodeURIComponent(this.search)}` : '';
    this.http
      .get<{ applications: Row[] }>(`${API_BASE_URL}/applications/institute/list${params}`)
      .subscribe({
        next: (r) => {
          this.rows.set(r.applications || []);
          this.loading.set(false);
        },
        error: (e) => {
          this.errorMessage.set(e?.error?.error || 'Unable to load applications');
          this.loading.set(false);
        }
      });
  }

  onRowClicked(row: Row | undefined) {
    this.selectedRow = row ?? null;
  }

  decide(id: number, action: 'VERIFY' | 'REJECT') {
    this.http.post(`${API_BASE_URL}/applications/${id}/institute/decision`, { action }).subscribe(() => {
      this.selectedRow = null;
      this.load();
    });
  }
}

