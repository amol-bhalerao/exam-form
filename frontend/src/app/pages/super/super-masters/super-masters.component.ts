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
    <mat-card class="card grid-panel">
      <div class="grid-panel__header">
        <div class="header-copy">
          <div class="grid-panel__title">
            <mat-icon>dataset</mat-icon>
            Master Data Management
          </div>
          <div class="grid-panel__subtitle">Manage streams and subjects used across the examination system.</div>
        </div>
        <div class="grid-panel__actions">
          <span class="grid-pill">{{ streams().length }} streams</span>
          <span class="grid-pill">{{ subjects().length }} subjects</span>
        </div>
      </div>
    </mat-card>

    <mat-tab-group>
      <mat-tab label="Streams">
        <mat-card class="card grid-panel">
          <div class="grid-panel__header">
            <div class="header-copy">
              <div class="grid-panel__title">Streams</div>
              <div class="grid-panel__subtitle">Search, edit, and maintain available academic streams.</div>
            </div>
            <div class="grid-panel__actions">
              <span class="grid-pill">{{ streams().length }} records</span>
              <button mat-flat-button color="primary" (click)="openStreamForm()">Add Stream</button>
              <mat-form-field appearance="outline" class="search">
                <mat-label>Search streams</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput [(ngModel)]="streamSearch" (input)="loadStreams()" />
              </mat-form-field>
            </div>
          </div>
          <div class="grid-panel__table">
            <ag-grid-angular
              [rowData]="streams()"
              [columnDefs]="streamColumnDefs"
              [defaultColDef]="defaultColDef"
              [rowSelection]="{ mode: 'singleRow' }"
              class="ag-theme-alpine"
              style="width:100%; height:100%;"
              (cellClicked)="onStreamCellClicked($event)"
            ></ag-grid-angular>
          </div>
        </mat-card>

        <div class="app-modal-backdrop" *ngIf="showStreamForm()">
          <div class="app-modal-panel app-modal-panel--md">
            <div class="app-modal-header">
              <div class="grid-panel__title">{{ streamEdit.id ? 'Update Stream' : 'Add Stream' }}</div>
              <button mat-icon-button type="button" (click)="closeStreamForm()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Stream name</mat-label><input matInput [(ngModel)]="streamEdit.name" /></mat-form-field>
            </div>
            <div class="card-actions">
              <button mat-stroked-button (click)="closeStreamForm()">Cancel</button>
              <button mat-flat-button color="primary" (click)="saveStream()">{{ streamEdit.id ? 'Update Stream' : 'Add Stream' }}</button>
            </div>
            <div class="msg error" *ngIf="streamError">{{ streamError }}</div>
            <div class="msg success" *ngIf="streamSuccess">{{ streamSuccess }}</div>
          </div>
        </div>
      </mat-tab>

      <mat-tab label="Subjects">
        <mat-card class="card grid-panel">
          <div class="grid-panel__header">
            <div class="header-copy">
              <div class="grid-panel__title">Subjects</div>
              <div class="grid-panel__subtitle">Quickly search, edit, and organize subject master records.</div>
            </div>
            <div class="grid-panel__actions">
              <span class="grid-pill">{{ subjects().length }} records</span>
              <button mat-flat-button color="primary" (click)="openSubjectForm()">Add Subject</button>
              <mat-form-field appearance="outline" class="search">
                <mat-label>Search subjects</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput [(ngModel)]="subjectSearch" (input)="loadSubjects()" />
              </mat-form-field>
            </div>
          </div>
          <div class="grid-panel__table grid-panel__table--lg">
            <ag-grid-angular
              [rowData]="subjects()"
              [columnDefs]="subjectColumnDefs"
              [defaultColDef]="defaultColDef"
              [rowSelection]="{ mode: 'singleRow' }"
              class="ag-theme-alpine"
              style="width:100%; height:100%;"
              (cellClicked)="onSubjectCellClicked($event)"
            ></ag-grid-angular>
          </div>
        </mat-card>

        <div class="app-modal-backdrop" *ngIf="showSubjectForm()">
          <div class="app-modal-panel app-modal-panel--md">
            <div class="app-modal-header">
              <div class="grid-panel__title">{{ subjectEdit.id ? 'Update Subject' : 'Add Subject' }}</div>
              <button mat-icon-button type="button" (click)="closeSubjectForm()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="subjectEdit.code" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="subjectEdit.name" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Category</mat-label><mat-select [(ngModel)]="subjectEdit.category"><mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option></mat-select></mat-form-field>
            </div>
            <div class="card-actions">
              <button mat-stroked-button (click)="closeSubjectForm()">Cancel</button>
              <button mat-flat-button color="primary" (click)="saveSubject()">{{ subjectEdit.id ? 'Update Subject' : 'Add Subject' }}</button>
            </div>
            <div class="msg error" *ngIf="subjectError">{{ subjectError }}</div>
            <div class="msg success" *ngIf="subjectSuccess">{{ subjectSuccess }}</div>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .grid-panel__header { display: grid; gap: 12px; }
    .header-copy { max-width: 900px; }
    .grid-panel__actions { display: flex; align-items: center; justify-content: flex-start; gap: 10px; flex-wrap: wrap; }
    .grid-panel__title { display: flex; align-items: center; gap: 6px; font-weight: 800; }
    .grid-panel__subtitle { color: #64748b; margin-top: 4px; font-size: 13px; }
    .grid-pill { border: 1px solid #dbeafe; background: #f8fbff; color: #1e3a8a; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .grid-panel__table { margin-top: 10px; width: 100%; min-height: 400px; height: 400px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .grid-panel__table--lg { min-height: 460px; height: 460px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
    .form-grid mat-form-field { width: 100%; margin: 0; }
    .card-actions { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
    .msg { margin-top: 8px; font-weight: 700; }
    .error { color: #b91c1c; }
    .success { color: #065f46; }
    .search { width: min(280px, 100%); }
    @media (max-width: 900px) {
      .form-grid { grid-template-columns: 1fr; }
      .search { width: 100%; }
      .grid-panel__actions { align-items: stretch; }
      .grid-panel__actions > button { width: 100%; }
      .grid-panel__table,
      .grid-panel__table--lg { min-height: 360px; height: 360px; }
    }
  `]
})
export class SuperMastersComponent implements OnInit {
  readonly streams = signal<StreamRow[]>([]);
  readonly subjects = signal<SubjectRow[]>([]);
  readonly showStreamForm = signal(false);
  readonly showSubjectForm = signal(false);
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
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 190, cellRenderer: () => `<div style="display:flex;gap:6px;flex-wrap:wrap;"><button data-action="edit" class="grid-action-btn grid-action-btn--edit">Edit</button><button data-action="delete" class="grid-action-btn grid-action-btn--delete">Delete</button></div>` }
  ];

  readonly subjectColumnDefs: ColDef[] = [
    { field: 'code', headerName: 'Code', sortable: true, filter: true, flex: 1 },
    { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
    { field: 'category', headerName: 'Category', sortable: true, filter: true, flex: 1 },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 190, cellRenderer: () => `<div style="display:flex;gap:6px;flex-wrap:wrap;"><button data-action="edit" class="grid-action-btn grid-action-btn--edit">Edit</button><button data-action="delete" class="grid-action-btn grid-action-btn--delete">Delete</button></div>` }
  ];

  readonly defaultColDef: ColDef = { sortable: true, filter: true, floatingFilter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor() {}

  ngOnInit() {
    this.loadStreams();
    this.loadSubjects();
  }

  openStreamForm() {
    this.resetStream();
    this.showStreamForm.set(true);
  }

  closeStreamForm() {
    this.showStreamForm.set(false);
    this.resetStream();
  }

  openSubjectForm() {
    this.resetSubject();
    this.showSubjectForm.set(true);
  }

  closeSubjectForm() {
    this.showSubjectForm.set(false);
    this.resetSubject();
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
        next: () => { this.streamSuccess = 'Updated stream'; this.showStreamForm.set(false); this.resetStream(); this.loadStreams(); },
        error: (e: { error: { error: string; }; }) => { this.streamError = e?.error?.error || 'Update failed'; }
      });
    } else {
      this.http.post(`${API_BASE_URL}/masters/streams`, payload).subscribe({
        next: () => { this.streamSuccess = 'Added stream'; this.showStreamForm.set(false); this.resetStream(); this.loadStreams(); },
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
        next: () => { this.subjectSuccess = 'Updated subject'; this.showSubjectForm.set(false); this.resetSubject(); this.loadSubjects(); },
        error: (e: { error: { error: string; }; }) => { this.subjectError = e?.error?.error || 'Update failed'; }
      });
    } else {
      this.http.post(`${API_BASE_URL}/masters/subjects`, payload).subscribe({
        next: () => { this.subjectSuccess = 'Added subject'; this.showSubjectForm.set(false); this.resetSubject(); this.loadSubjects(); },
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
      this.showStreamForm.set(true);
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
      this.showSubjectForm.set(true);
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
