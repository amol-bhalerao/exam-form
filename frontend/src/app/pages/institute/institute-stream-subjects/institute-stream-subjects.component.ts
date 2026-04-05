import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';
import { FormsModule } from '@angular/forms';

const LANGUAGE_OPTIONS = [
  { code: 'MAR', label: 'Marathi' },
  { code: 'ENG', label: 'English' },
  { code: 'HIN', label: 'Hindi' },
  { code: 'URD', label: 'Urdu' }
];

type MappingRow = {
  id: number;
  streamId: number;
  streamName: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  category?: string;
  answerLanguageCode?: string;
};

@Component({
  selector: 'app-institute-stream-subjects',
  standalone: true,
  imports: [MatCardModule, AgGridAngular, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule, FormsModule, NgIf, NgFor],
  template: `
    <mat-card class="card">
      <div class="h">Stream Subject Mapping</div>
      <p class="p">Map subjects to a stream and set the answer language for each subject at institute level.</p>

      <div class="row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Stream search</mat-label>
          <input matInput [ngModel]="streamSearch()" (ngModelChange)="streamSearch.set($event)" placeholder="Search stream" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="field field-wide">
          <mat-label>Search in subject list</mat-label>
          <input matInput [ngModel]="subjectSearch()" (ngModelChange)="subjectSearch.set($event)" placeholder="Type subject name, code, or category" />
        </mat-form-field>
      </div>

      <div class="row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Stream</mat-label>
          <mat-select [(ngModel)]="streamId" (selectionChange)="onStreamChanged()">
            <mat-option *ngFor="let s of filteredStreams" [value]="s.id">{{ s.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field field-wide">
          <mat-label>Subjects</mat-label>
          <mat-select [multiple]="!editingMappingId()" [(ngModel)]="selectedSubjectIds">
            <mat-option *ngIf="filteredSubjects.length === 0" disabled>No subjects match the current search.</mat-option>
            <mat-option *ngFor="let s of filteredSubjects" [value]="s.id">
              {{ s.name }} ({{ s.code }}) - {{ s.category || 'General' }}
            </mat-option>
          </mat-select>
          <mat-hint>{{ filteredSubjects.length }} of {{ subjects().length }} subjects shown</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Language of Answer</mat-label>
          <mat-select [(ngModel)]="answerLanguageCode">
            <mat-option value="">Not set</mat-option>
            <mat-option *ngFor="let lang of languageOptions" [value]="lang.code">{{ lang.label }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="row chips-row" *ngIf="selectedSubjectIds.length > 0">
        <span class="chip" *ngFor="let sid of selectedSubjectIds">{{ getSubjectName(sid) }}</span>
      </div>

      <div class="actions">
        <button mat-flat-button color="primary" (click)="save()" [disabled]="!streamId || selectedSubjectIds.length === 0">
          {{ editingMappingId() ? 'Update Mapping' : 'Save Mapping' }}
        </button>
        <button mat-stroked-button type="button" *ngIf="editingMappingId()" (click)="resetForm()">Cancel Edit</button>
      </div>

      <div class="error" *ngIf="error()">{{ error() }}</div>
      <div class="success" *ngIf="success()">{{ success() }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="h">Current Mappings</div>
      <div class="summary">{{ mappings().length }} mapping(s) loaded</div>

      <div class="ag-theme-alpine table-box">
        <ag-grid-angular
          [rowData]="mappings()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          class="ag-theme-alpine"
          style="width:100%; height:100%;"
          (cellClicked)="onGridCellClick($event)"
        ></ag-grid-angular>
      </div>

      <div *ngIf="mappings().length === 0" class="empty">No stream-subject mappings found yet.</div>
    </mat-card>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .h { font-weight: 800; }
    .p { color: #6b7280; margin: 6px 0 12px; line-height: 1.45; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
    .field { min-width: 220px; width: 280px; }
    .field-wide { width: min(480px, 100%); }
    .chips-row { gap: 6px; }
    .chip { background: #e2e8f0; color: #1f2937; padding: 4px 10px; border-radius: 999px; font-size: .85rem; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .table-box { width: 100%; height: 340px; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .summary { margin-top: 8px; font-size: 0.95rem; color: #374151; }
    .empty { margin-top: 8px; color: #b91c1c; font-weight: 600; }
    .error { color: #b91c1c; margin-top: 8px; }
    .success { color: #065f46; margin-top: 8px; }
  `]
})
export class InstituteStreamSubjectsComponent implements OnInit {
  readonly streams = signal<any[]>([]);
  readonly subjects = signal<any[]>([]);
  readonly mappings = signal<MappingRow[]>([]);
  readonly streamSearch = signal('');
  readonly subjectSearch = signal('');
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly editingMappingId = signal<number | null>(null);

  streamId = 0;
  selectedSubjectIds: number[] = [];
  answerLanguageCode = '';
  readonly languageOptions = LANGUAGE_OPTIONS;

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };
  readonly columnDefs: ColDef[] = [
    { field: 'streamName', headerName: 'Stream' },
    { field: 'subjectName', headerName: 'Subject' },
    { field: 'subjectCode', headerName: 'Code', maxWidth: 120 },
    { field: 'category', headerName: 'Category' },
    {
      field: 'answerLanguageCode',
      headerName: 'Answer Language',
      valueGetter: (params: any) => this.getLanguageLabel(params.data?.answerLanguageCode)
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 170,
      cellRenderer: () => `
        <div style="display:flex;gap:6px;align-items:center;">
          <button data-action="edit" style="border:none;background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:4px;">Edit</button>
          <button data-action="delete" style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;">Delete</button>
        </div>`
    }
  ];

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    this.http.get<{ streams: any[] }>(`${API_BASE_URL}/masters/streams`).subscribe((r) => this.streams.set(r.streams || []));
    this.http.get<{ subjects: any[] }>(`${API_BASE_URL}/masters/subjects`).subscribe((r) => this.subjects.set(r.subjects || []));
    this.load();
  }

  get filteredStreams() {
    const q = this.streamSearch().trim().toLowerCase();
    return q ? this.streams().filter((s) => s.name.toLowerCase().includes(q)) : this.streams();
  }

  get filteredSubjects() {
    const q = this.subjectSearch().trim().toLowerCase();
    return q
      ? this.subjects().filter((s) => `${s.name} ${s.code} ${s.category || ''}`.toLowerCase().includes(q))
      : this.subjects();
  }

  onStreamChanged() {
    if (!this.editingMappingId()) {
      this.selectedSubjectIds = [];
      this.answerLanguageCode = '';
    }
  }

  load() {
    this.http
      .get<any>(`${API_BASE_URL}/institutes/me/stream-subjects`, { params: { t: Date.now().toString() } })
      .subscribe({
        next: (r) => {
          if (Array.isArray(r?.mappings)) {
            this.mappings.set(r.mappings);
            return;
          }

          const flattened: MappingRow[] = [];
          for (const stream of r?.streams || []) {
            for (const subject of stream.subjects || []) {
              flattened.push({
                id: subject.mappingId,
                streamId: stream.id,
                streamName: stream.name,
                subjectId: subject.id,
                subjectName: subject.name,
                subjectCode: subject.code,
                category: subject.category,
                answerLanguageCode: subject.answerLanguageCode || ''
              });
            }
          }
          this.mappings.set(flattened);
        },
        error: (e) => {
          console.error('Failed to load stream-subject settings', e);
          const message = e?.error?.message || e?.error?.error || 'Unable to load existing mappings.';
          this.error.set(message);
          this.mappings.set([]);
        }
      });
  }

  save() {
    if (!this.streamId || this.selectedSubjectIds.length === 0) return;
    this.error.set(null);
    this.success.set(null);

    if (this.editingMappingId()) {
      const payload = {
        streamId: this.streamId,
        subjectId: this.selectedSubjectIds[0],
        answerLanguageCode: this.answerLanguageCode || undefined
      };

      this.http.put<{ ok: boolean }>(`${API_BASE_URL}/institutes/me/stream-subjects/${this.editingMappingId()}`, payload).subscribe({
        next: () => {
          this.success.set('Mapping updated successfully.');
          this.snackBar.open('Mapping updated', 'Close', { duration: 2000 });
          this.resetForm();
          this.load();
        },
        error: (e) => this.setRequestError(e, 'Update failed')
      });
      return;
    }

    const payload = {
      streamSubjects: [
        {
          streamId: this.streamId,
          subjects: this.selectedSubjectIds.map((subjectId) => ({
            subjectId,
            answerLanguageCode: this.answerLanguageCode || undefined
          }))
        }
      ]
    };

    this.http.post<{ ok: boolean; message?: string }>(`${API_BASE_URL}/institutes/me/stream-subjects`, payload).subscribe({
      next: (r) => {
        this.success.set(r.message || 'Saved successfully');
        this.snackBar.open('Stream subjects saved', 'Close', { duration: 2000 });
        this.resetForm();
        this.load();
      },
      error: (e) => this.setRequestError(e, 'Save failed')
    });
  }

  resetForm() {
    this.editingMappingId.set(null);
    this.streamId = 0;
    this.selectedSubjectIds = [];
    this.answerLanguageCode = '';
  }

  getSubjectName(subjectId: number) {
    return this.subjects().find((s) => s.id === subjectId)?.name || `${subjectId}`;
  }

  getLanguageLabel(code?: string) {
    if (!code) return 'Not set';
    return this.languageOptions.find((lang) => lang.code === code)?.label || code;
  }

  onGridCellClick(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data as MappingRow | undefined;
    if (!action || !row) return;

    if (action === 'edit') {
      this.editingMappingId.set(row.id);
      this.streamId = row.streamId;
      this.selectedSubjectIds = [row.subjectId];
      this.answerLanguageCode = row.answerLanguageCode || '';
      this.success.set(null);
      this.error.set(null);
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Remove ${row.subjectName} from ${row.streamName}?`)) return;
      this.http.delete(`${API_BASE_URL}/institutes/me/stream-subjects/${row.id}`).subscribe({
        next: () => {
          this.snackBar.open('Mapping removed', 'Close', { duration: 2000 });
          this.load();
        },
        error: (e) => this.setRequestError(e, 'Delete failed')
      });
    }
  }

  private setRequestError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.error || fallback;
    this.error.set(message);
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}

