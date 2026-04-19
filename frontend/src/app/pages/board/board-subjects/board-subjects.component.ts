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
        <div class="header-copy">
          <div class="h">Subject Master</div>
          <div class="p">Board can add/edit/delete subjects with category.</div>
        </div>
        <button class="header-cta" mat-flat-button color="primary" (click)="openForm()">Add Subject</button>
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

    <div class="app-modal-backdrop" *ngIf="showForm()">
      <div class="app-modal-panel app-modal-panel--md">
        <div class="app-modal-header">
          <div class="h">{{ edit.id ? 'Update Subject' : 'Add Subject' }}</div>
          <button mat-icon-button type="button" (click)="closeForm()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="edit.code" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="edit.name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select [(ngModel)]="edit.category"><mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option></mat-select></mat-form-field>
        </div>
        <div class="card-actions">
          <button mat-stroked-button (click)="closeForm()">Cancel</button>
          <button mat-flat-button color="primary" (click)="save()">{{ edit.id ? 'Update Subject' : 'Add Subject' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .header-row { display: grid; gap: 12px; }
    .header-copy { max-width: 840px; }
    .header-cta { justify-self: start; }
    .h { font-weight: 900; font-size: 1rem; }
    .p { color: #6b7280; margin-top: 4px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 12px; margin-top: 10px; }
    .form-grid mat-form-field { width: 100%; margin: 0; }
    .card-actions { margin-top: 10px; display: flex; gap: 8px; }
    .msg { margin-top: 10px; font-weight: 700; }
    .error { color: #b91c1c; }
    .success { color: #065f46; }
    .table { width: 100%; margin-top: 10px; }
    .table-header { display: grid; gap: 10px; }
    .search { width: min(320px, 100%); margin: 0; }
    @media (max-width: 860px) {
      .header-cta { width: 100%; }
      .search { width: 100%; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BoardSubjectsComponent implements OnInit {
  readonly subjects = signal<SubjectRow[]>([]);
  readonly showForm = signal(false);
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

  openForm() {
    this.reset();
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.reset();
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
      this.http.put(`${API_BASE_URL}/masters/subjects/${this.edit.id}`, payload).subscribe({ next: () => { this.success = 'Updated'; this.closeForm(); this.load(); }, error: (e) => { this.error = e?.error?.error || 'Update failed'; } });
    } else {
      this.http.post(`${API_BASE_URL}/masters/subjects`, payload).subscribe({ next: () => { this.success = 'Added'; this.closeForm(); this.load(); }, error: (e) => { this.error = e?.error?.error || 'Add failed'; } });
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
    this.showForm.set(true);
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
      this.showForm.set(true);
      return;
    }
    if (action === 'edit') {
      this.edit = { ...row };
      this.showForm.set(true);
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
