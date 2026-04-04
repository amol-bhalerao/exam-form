import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

type SubjectRow = { id: number; code: string; name: string; category: string };
@Component({
  selector: 'app-board-subjects',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="header-row">
        <div>
          <div class="h">Subject Master</div>
          <div class="p">Board can add/edit/delete subjects with category.</div>
        </div>
      </div>

      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="edit.code" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="edit.name" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select [(ngModel)]="edit.category"><mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option></mat-select></mat-form-field>
      </div>
      <div class="card-actions">
        <button mat-flat-button color="primary" (click)="save()">{{ edit.id ? 'Update Subject' : 'Add Subject' }}</button>
        <button mat-stroked-button color="warn" *ngIf="edit.id" (click)="reset()">Cancel</button>
      </div>
      <div class="msg error" *ngIf="error">{{ error }}</div>
      <div class="msg success" *ngIf="success">{{ success }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="table-header">
        <div class="h" style="margin:0;">Subjects</div>
        <mat-form-field appearance="outline" class="search"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
      </div>
      <div style="height: 360px;" class="ag-theme-alpine">
        <ag-grid-angular
          style="width:100%; height:100%;"
          [rowData]="subjects()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onGridCellClicked($event)"
        ></ag-grid-angular>
      </div>
      <div class="card-actions" style="margin-top: 8px;">
        <button mat-stroked-button color="primary" (click)="editSelected()" [disabled]="!selectedRow">Edit Selected</button>
        <button mat-stroked-button color="warn" (click)="deleteSelected()" [disabled]="!selectedRow">Delete Selected</button>
      </div>
    </mat-card>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .h { font-weight: 900; font-size: 1rem; }
    .p { color: #6b7280; margin-top: 4px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 10px; margin-top: 10px; }
    .card-actions { margin-top: 10px; display: flex; gap: 8px; }
    .msg { margin-top: 10px; font-weight: 700; }
    .error { color: #b91c1c; }
    .success { color: #065f46; }
    .table { width: 100%; margin-top: 10px; }
    .table-header { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
    .search { width: 250px; }
  `]
})
export class BoardSubjectsComponent implements OnInit {
  readonly subjects = signal<SubjectRow[]>([]);
  selectedRow: SubjectRow | null = null;
  edit: Partial<SubjectRow> = { id: 0, code: '', name: '', category: 'language' };
  search = '';
  error = '';
  success = '';
  categories = ['language', 'Compulsory', 'Optional Subjects', 'Bifocal Subjects', 'Vocational Subjects'];
  columnDefs: ColDef[] = [
    { field: 'code', headerName: 'Code', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      headerName: 'Actions', field: 'actions', flex: 1, minWidth: 160,
      cellRenderer: (params: any) => `<div style="display:flex;gap:4px;"><button data-action=view style="border:none;background:#dbeafe;color:#1d4ed8;padding:4px 8px;border-radius:4px;">View</button><button data-action=edit style="border:none;background:#fef9c3;color:#92400e;padding:4px 8px;border-radius:4px;">Edit</button><button data-action=delete style="border:none;background:#fee2e2;color:#b91c1c;padding:4px 8px;border-radius:4px;">Delete</button></div>`
    }
  ];
  defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, floatingFilter: true, minWidth: 120, flex: 1 };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const params = this.search ? `?search=${encodeURIComponent(this.search)}` : '';
    this.http.get<{ subjects: SubjectRow[] }>(`${API_BASE_URL}/masters/subjects${params}`).subscribe((r) => this.subjects.set(r.subjects));
  }

  save() {
    this.error = '';
    this.success = '';
    if (!this.edit.code?.trim() || !this.edit.name?.trim() || !this.edit.category?.trim()) {
      this.error = 'Code, name, and category are required';
      return;
    }

    const payload = {
      code: this.edit.code!.trim(),
      name: this.edit.name!.trim(),
      category: this.edit.category!
    };

    if (this.edit.id) {
      this.http.put(`${API_BASE_URL}/masters/subjects/${this.edit.id}`, payload).subscribe({ next: () => { this.success = 'Updated'; this.reset(); this.load(); }, error: (e) => { this.error = e?.error?.error || 'Update failed'; } });
    } else {
      this.http.post(`${API_BASE_URL}/masters/subjects`, payload).subscribe({ next: () => { this.success = 'Added'; this.reset(); this.load(); }, error: (e) => { this.error = e?.error?.error || 'Add failed'; } });
    }
  }

  onRowClicked(event: any) {
    this.selectedRow = event.data;
  }

  editSelected() {
    if (!this.selectedRow) return;
    this.edit = { ...this.selectedRow };
    this.error = '';
    this.success = '';
  }

  deleteSelected() {
    if (!this.selectedRow) return;
    if (!confirm('Delete selected subject?')) return;
    this.http.delete(`${API_BASE_URL}/masters/subjects/${this.selectedRow.id}`).subscribe({
      next: () => {
        this.selectedRow = null;
        this.load();
      },
      error: (e) => {
        this.error = e?.error?.error || 'Delete failed';
      }
    });
  }

  onGridCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'view') {
      this.edit = { ...row };
      return;
    }
    if (action === 'edit') {
      this.edit = { ...row };
      return;
    }
    if (action === 'delete') {
      if (!confirm('Delete subject?')) return;
      this.http.delete(`${API_BASE_URL}/masters/subjects/${row.id}`).subscribe({ next: () => this.load(), error: () => (this.error = 'Delete failed') });
      return;
    }
  }

  reset() {
    this.edit = { id: 0, code: '', name: '', category: 'language' };
    this.selectedRow = null;
  }
}
