import { Component, OnInit, signal, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

type StreamRow = { id: number; name: string; createdAt: string };
type SubjectRow = { id: number; code: string; name: string; category: string };

@Component({
  selector: 'app-super-masters',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatTabsModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="header">
        <div>
          <div class="h">Master Data Management</div>
          <div class="p">Manage streams and subjects for the examination system.</div>
        </div>
      </div>
    </mat-card>

    <mat-tab-group>
      <mat-tab label="Streams">
        <mat-card class="card">
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Stream name</mat-label><input matInput [(ngModel)]="streamEdit.name" /></mat-form-field>
          </div>
          <div class="card-actions">
            <button mat-flat-button color="primary" (click)="saveStream()">{{ streamEdit.id ? 'Update Stream' : 'Add Stream' }}</button>
            <button mat-stroked-button (click)="resetStream()" *ngIf="streamEdit.id">Cancel</button>
          </div>
          <div class="msg error" *ngIf="streamError">{{ streamError }}</div>
          <div class="msg success" *ngIf="streamSuccess">{{ streamSuccess }}</div>
        </mat-card>

        <mat-card class="card">
          <div class="table-header">
            <div class="h">Streams</div>
            <mat-form-field appearance="outline" class="search"><mat-label>Search</mat-label><input matInput [(ngModel)]="streamSearch" (input)="loadStreams()" /></mat-form-field>
          </div>
          <div class="ag-theme-alpine" style="height: 350px; width: 100%; margin-top: 8px;">
           
            <ag-grid-angular
          [rowData]="streams()"
          [columnDefs]="streamColumnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          class="ag-theme-alpine"
          style="width:100%; height:280px;"
          (cellClicked)="onStreamCellClicked($event)"
        ></ag-grid-angular>
          </div>
        </mat-card>
      </mat-tab>

      <mat-tab label="Subjects">
        <mat-card class="card">
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="subjectEdit.code" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="subjectEdit.name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select [(ngModel)]="subjectEdit.category"><mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option></mat-select></mat-form-field>
          </div>
          <div class="card-actions">
            <button mat-flat-button color="primary" (click)="saveSubject()">{{ subjectEdit.id ? 'Update Subject' : 'Add Subject' }}</button>
            <button mat-stroked-button color="warn" *ngIf="subjectEdit.id" (click)="resetSubject()">Cancel</button>
          </div>
          <div class="msg error" *ngIf="subjectError">{{ subjectError }}</div>
          <div class="msg success" *ngIf="subjectSuccess">{{ subjectSuccess }}</div>
        </mat-card>

        <mat-card class="card">
          <div class="table-header">
            <div class="h">Subjects</div>
            <mat-form-field appearance="outline" class="search"><mat-label>Search</mat-label><input matInput [(ngModel)]="subjectSearch" (input)="loadSubjects()" /></mat-form-field>
          </div>
          <div class="ag-theme-alpine" style="height: 360px; width: 100%; margin-top: 8px;">
           

            <ag-grid-angular
          [rowData]="subjects()"
          [columnDefs]="subjectColumnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          class="ag-theme-alpine"
          style="width:100%; height:280px;"
          (cellClicked)="onSubjectCellClicked($event)"
        ></ag-grid-angular>

          </div>
        </mat-card>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .h { font-weight: 900; font-size: 1rem; }
    .p { color: #6b7280; margin-top: 4px; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 10px; }
    .card-actions { margin-top: 10px; display: flex; gap: 8px; }
    .msg { margin-top: 8px; font-weight: 700; }
    .error { color: #b91c1c; }
    .success { color: #065f46; }
    .table-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .search { width: 240px; }
  `]
})
export class SuperMastersComponent implements OnInit {
  readonly streams = signal<StreamRow[]>([]);
  readonly subjects = signal<SubjectRow[]>([]);
  private readonly http = inject(HttpClient);

  streamEdit: Partial<StreamRow> = { id: 0, name: '' };
  streamSearch = '';
  streamError = '';
  streamSuccess = '';

  subjectEdit: Partial<SubjectRow> = { id: 0, code: '', name: '', category: '' };
  subjectSearch = '';
  subjectError = '';
  subjectSuccess = '';

  readonly categories = ['language', 'Compulsory', 'Optional Subjects', 'Bifocal Subjects', 'Vocational Subjects'];

  readonly streamColumnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
    { field: 'createdAt', headerName: 'Created', valueGetter: (params: any) => new Date(params.data.createdAt).toLocaleDateString(), flex: 1, sortable: true, filter: true },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 180, cellRenderer: (params: any) => `<div style="display:flex;gap:4px;"><button data-action=edit style="border:none;background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;">Edit</button><button data-action=delete style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;">Delete</button></div>` }
  ];

  readonly subjectColumnDefs: ColDef[] = [
    { field: 'code', headerName: 'Code', sortable: true, filter: true, flex: 1 },
    { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
    { field: 'category', headerName: 'Category', sortable: true, filter: true, flex: 1 },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 180, cellRenderer: (params: any) => `<div style="display:flex;gap:4px;"><button data-action=edit style="border:none;background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;">Edit</button><button data-action=delete style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;">Delete</button></div>` }
  ];

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor() {}

  ngOnInit() {
    this.loadStreams();
    this.loadSubjects();
  }

  loadStreams() {
    const params = this.streamSearch ? `?search=${encodeURIComponent(this.streamSearch)}` : '';
    this.http.get<{ streams: StreamRow[] }>(`${API_BASE_URL}/masters/streams${params}`).subscribe({
      next: (r: { streams: StreamRow[]; }) => { this.streams.set(r.streams); },
      error: () => { this.streamError = 'Unable to load streams'; }
    });
  }

  loadSubjects() {
    this.http.get<{ subjects: SubjectRow[] }>(`${API_BASE_URL}/masters/subjects`).subscribe({
      next: (r: { subjects: SubjectRow[]; }) => { this.subjects.set(r.subjects); },
      error: () => { this.subjectError = 'Unable to load subjects'; }
    });
  }

  saveStream() {
    this.streamError = '';
    this.streamSuccess = '';
    if (!this.streamEdit.name?.trim()) {
      this.streamError = 'Stream name is required';
      return;
    }

    const payload = { name: this.streamEdit.name.trim() };
    if (this.streamEdit.id) {
      this.http.put(`${API_BASE_URL}/masters/streams/${this.streamEdit.id}`, payload).subscribe({
        next: () => { this.streamSuccess = 'Updated stream'; this.resetStream(); this.loadStreams(); },
        error: (e: { error: { error: string; }; }) => { this.streamError = e?.error?.error || 'Update failed'; }
      });
    } else {
      this.http.post(`${API_BASE_URL}/masters/streams`, payload).subscribe({
        next: () => { this.streamSuccess = 'Added stream'; this.resetStream(); this.loadStreams(); },
        error: (e: { error: { error: string; }; }) => { this.streamError = e?.error?.error || 'Create failed'; }
      });
    }
  }

  saveSubject() {
    this.subjectError = '';
    this.subjectSuccess = '';
    if (!this.subjectEdit.code?.trim() || !this.subjectEdit.name?.trim() || !this.subjectEdit.category) {
      this.subjectError = 'Code, name and category are required';
      return;
    }

    const payload = { code: this.subjectEdit.code.trim(), name: this.subjectEdit.name.trim(), category: this.subjectEdit.category };
    if (this.subjectEdit.id) {
      this.http.put(`${API_BASE_URL}/masters/subjects/${this.subjectEdit.id}`, payload).subscribe({
        next: () => { this.subjectSuccess = 'Updated subject'; this.resetSubject(); this.loadSubjects(); },
        error: (e: { error: { error: string; }; }) => { this.subjectError = e?.error?.error || 'Update failed'; }
      });
    } else {
      this.http.post(`${API_BASE_URL}/masters/subjects`, payload).subscribe({
        next: () => { this.subjectSuccess = 'Added subject'; this.resetSubject(); this.loadSubjects(); },
        error: (e: { error: { error: string; }; }) => { this.subjectError = e?.error?.error || 'Create failed'; }
      });
    }
  }

  onStreamCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'edit') {
      this.streamEdit = { ...row };
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete stream?')) return;
      this.http.delete(`${API_BASE_URL}/masters/streams/${row.id}`).subscribe({
        next: () => { this.streamSuccess = 'Deleted stream'; this.loadStreams(); },
        error: (e: { error: { error: string; }; }) => { this.streamError = e?.error?.error || 'Delete failed'; }
      });
    }
  }

  onSubjectCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'edit') {
      this.subjectEdit = { ...row };
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete subject?')) return;
      this.http.delete(`${API_BASE_URL}/masters/subjects/${row.id}`).subscribe({
        next: () => { this.subjectSuccess = 'Deleted subject'; this.loadSubjects(); },
        error: (e: { error: { error: string; }; }) => { this.subjectError = e?.error?.error || 'Delete failed'; }
      });
    }
  }

  resetStream() {
    this.streamEdit = { id: 0, name: '' };
  }

  resetSubject() {
    this.subjectEdit = { id: 0, code: '', name: '', category: '' };
  }
}
