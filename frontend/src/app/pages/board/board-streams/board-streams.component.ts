import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

type StreamRow = { id: number; name: string; createdAt: string };

@Component({
  selector: 'app-board-streams',
  standalone: true,
  imports: [NgIf, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="header">
        <div class="header-copy">
          <div class="h">Board Streams</div>
          <div class="p">Add, update and delete board streams. Cannot delete stream with bound subjects.</div>
        </div>
        <button class="header-cta" mat-flat-button color="primary" (click)="openForm()">Add Stream</button>
      </div>
      <div class="msg error" *ngIf="error">{{ error }}</div>
      <div class="msg success" *ngIf="success">{{ success }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="table-header">
        <div class="h">Streams</div>
        <mat-form-field appearance="outline" class="search"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
      </div>
      <div class="ag-theme-alpine" style="height: 350px; width: 100%; margin-top: 8px;">
        <ag-grid-angular
          style="width:100%; height:100%;"
          [rowData]="streams()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        ></ag-grid-angular>
      </div>
    </mat-card>

    <div class="app-modal-backdrop" *ngIf="showForm()">
      <div class="app-modal-panel app-modal-panel--sm">
        <div class="app-modal-header">
          <div class="h">{{ edit.id ? 'Update Stream' : 'Add Stream' }}</div>
          <button mat-icon-button type="button" (click)="closeForm()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Stream name</mat-label><input matInput [(ngModel)]="edit.name" /></mat-form-field>
        </div>
        <div class="card-actions">
          <button mat-stroked-button (click)="closeForm()">Cancel</button>
          <button mat-flat-button color="primary" (click)="save()">{{ edit.id ? 'Update Stream' : 'Add Stream' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .header { display: grid; gap: 12px; }
    .header-copy { max-width: 840px; }
    .header-cta { justify-self: start; }
    .h { font-weight: 900; font-size: 1rem; }
    .p { color: #6b7280; margin-top: 4px; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 10px; }
    .form-grid mat-form-field { width: 100%; margin: 0; }
    .card-actions { margin-top: 10px; display: flex; gap: 8px; }
    .msg { margin-top: 8px; font-weight: 700; }
    .error { color: #b91c1c; }
    .success { color: #065f46; }
    .table-header { display: grid; gap: 10px; }
    .search { width: min(320px, 100%); margin: 0; }
    @media (max-width: 860px) {
      .header-cta { width: 100%; }
      .search { width: 100%; }
    }
  `]
})
export class BoardStreamsComponent implements OnInit {
  readonly streams = signal<StreamRow[]>([]);
  readonly showForm = signal(false);
  edit: Partial<StreamRow> = { id: 0, name: '' };
  search = '';
  error = '';
  success = '';

  readonly columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
    { field: 'createdAt', headerName: 'Created', valueGetter: (params: any) => new Date(params.data.createdAt).toLocaleDateString(), flex: 1, sortable: true, filter: true },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 180, cellRenderer: (params: any) => `<div style="display:flex;gap:4px;"><button data-action=edit style="border:none;background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;">Edit</button><button data-action=delete style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;">Delete</button></div>` }
  ];

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() { this.load(); }

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
    this.http.get<{ streams: StreamRow[] }>(`${API_BASE_URL}/masters/streams${params}`).subscribe({
      next: (r) => { this.streams.set(r.streams); },
      error: () => { this.error = 'Unable to load streams'; }
    });
  }

  save() {
    this.error = '';
    this.success = '';
    if (!this.edit.name?.trim()) {
      this.error = 'Stream name is required';
      return;
    }

    const payload = { name: this.edit.name.trim() };
    if (this.edit.id) {
      this.http.put(`${API_BASE_URL}/masters/streams/${this.edit.id}`, payload).subscribe({
        next: () => { this.success = 'Updated stream'; this.closeForm(); this.load(); },
        error: (e) => { this.error = e?.error?.error || 'Update failed'; }
      });
    } else {
      this.http.post(`${API_BASE_URL}/masters/streams`, payload).subscribe({
        next: () => { this.success = 'Added stream'; this.closeForm(); this.load(); },
        error: (e) => { this.error = e?.error?.error || 'Create failed'; }
      });
    }
  }

  onCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'edit') {
      this.edit = { ...row };
      this.showForm.set(true);
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete stream?')) return;
      this.http.delete(`${API_BASE_URL}/masters/streams/${row.id}`).subscribe({
        next: () => { this.success = 'Deleted stream'; this.load(); },
        error: (e) => { this.error = e?.error?.error || 'Delete failed'; }
      });
    }
  }

  reset() {
    this.edit = { id: 0, name: '' };
  }
}
