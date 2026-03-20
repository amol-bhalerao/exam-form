import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';
import { FormsModule } from '@angular/forms';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-institute-stream-subjects',
  standalone: true,
  imports: [MatCardModule,AgGridAngular, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, AgGridModule, FormsModule, NgIf, NgFor, CommonModule],
  template: `
    <mat-card class="card">
      <div class="h">Stream Subject Mapping</div>
      <p class="p">Select stream and link available subjects by name.</p>
      <div class="row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Stream search</mat-label>
          <input matInput [(ngModel)]="streamSearch" placeholder="Search stream" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="field">
          <mat-label>Subject search</mat-label>
          <input matInput [(ngModel)]="subjectSearch" placeholder="Search subjects" />
        </mat-form-field>
      </div>
      <div class="row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Stream</mat-label>
          <mat-select [(ngModel)]="streamId" (selectionChange)="selectedSubjectIds=[]">
            <mat-option *ngFor="let s of filteredStreams" [value]="s.id">{{ s.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="field">
          <mat-label>Subjects</mat-label>
          <mat-select multiple [(ngModel)]="selectedSubjectIds">
            <mat-option *ngFor="let s of filteredSubjects" [value]="s.id">{{ s.name }} ({{ s.code }}) - {{ s.category || 'General' }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="row" *ngIf="selectedSubjectIds.length > 0" style="gap:6px;flex-wrap:wrap;">Selected subjects:
        <span *ngFor="let sid of selectedSubjectIds" class="chip">{{ getSubjectName(sid) }}</span>
      </div>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!streamId || selectedSubjectIds.length===0">Save Mapping</button>
      <div class="error" *ngIf="error()">{{ error() }}</div>
      <div class="success" *ngIf="success()">{{ success() }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="h">Current Mappings</div>
      <div class="summary" style="margin-top: 8px; font-size: 0.95rem; color: #374151;">
        {{ mappings().length }} mappings loaded
      </div>
      <div class="ag-theme-alpine" style="width:100%; height:280px; margin-top:10px;">
        <ag-grid-angular
  [rowData]="mappings()"
  [columnDefs]="columnDefs"
  [defaultColDef]="defaultColDef"
  class="ag-theme-alpine"
  style="width:100%; height:280px;"
  (cellClicked)="onGridCellClick($event)"
></ag-grid-angular>
      </div>
      <div *ngIf="mappings().length === 0" style="margin-top: 8px; color: #b91c1c; font-weight: 600;">No stream-subject mappings found yet.</div>
    </mat-card>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .h { font-weight: 800; }
    .p { color: #6b7280; margin-bottom: 8px; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
    .field { min-width: 220px; width: 280px; }
    .chip { background: #e2e8f0; color: #1f2937; padding: 4px 10px; border-radius: 999px; font-size: .85rem; }
    .table { width: 100%; margin-top: 10px; }
    .error { color: #b91c1c; margin-top: 8px; }
    .success { color: #065f46; margin-top: 8px; }
  `]
})
export class InstituteStreamSubjectsComponent implements OnInit {
  streams = signal<any[]>([]);
  subjects = signal<any[]>([]);
  mappings = signal<any[]>([]);
  streamId = 0;
  selectedSubjectIds: number[] = [];
  streamSearch = signal('');
  subjectSearch = signal('');
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  get filteredStreams() {
    const q = this.streamSearch().trim().toLowerCase();
    if (!q) return this.streams();
    return this.streams().filter((s) => s.name.toLowerCase().includes(q));
  }
  get filteredSubjects() {
    const q = this.subjectSearch().trim().toLowerCase();
    if (!q) return this.subjects();
    return this.subjects().filter((s) => `${s.name} ${s.code} ${s.category}`.toLowerCase().includes(q));
  }

  columnDefs: ColDef[] = [
  { headerName: 'Stream', field: 'stream.name', valueGetter: (params: any) => params.data?.stream?.name || '' },
  { headerName: 'Subject', field: 'subject.name', valueGetter: (params: any) => params.data?.subject?.name || '' },
  { headerName: 'Category', field: 'subject.category', valueGetter: (params: any) => params.data?.subject?.category || 'General' },
  {
    headerName: 'Actions', field: 'actions', minWidth: 120, flex: 1,
    cellRenderer: () => `<button data-action=view style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 6px;border-radius:4px;">View</button>`
  }
];

  readonly defaultColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ streams: any[] }>(`${API_BASE_URL}/masters/streams`).subscribe((r) => this.streams.set(r.streams));
    this.http.get<{ subjects: any[] }>(`${API_BASE_URL}/masters/subjects`).subscribe((r) => this.subjects.set(r.subjects));
    this.load();
  }

  load() {
    this.http
      .get<{ settings: any[] }>(`${API_BASE_URL}/institutes/me/stream-subjects`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        params: { t: Date.now().toString() }
      })
      .subscribe({
        next: (r) => {
          console.log('stream subject settings', r);
          const settings = Array.isArray(r?.settings) ? r.settings : this.mappings();
          this.mappings.set(settings);
        },
        error: (e) => {
          console.error('Failed to load stream-subject settings', e);
          this.mappings.set(this.mappings());
        }
      });
  }

  save() {
    if (!this.streamId || this.selectedSubjectIds.length === 0) return;
    this.error.set(null);
    this.success.set(null);
    this.http.post<{ settings: any[] }>(`${API_BASE_URL}/institutes/me/stream-subjects`, { streamId: this.streamId, subjectIds: this.selectedSubjectIds }).subscribe({
      next: (r) => {
        this.success.set('Saved successfully');
        this.mappings.set(r.settings);

      },
      error: (e) => {
        this.error.set(e?.error?.error ? JSON.stringify(e.error) : 'Save failed');
      }
    });
  }

  getSubjectName(sid: number) {
    return this.subjects().find((s) => s.id === sid)?.name || sid;
  }

  onMappingRowClick(row: any) {
    console.log('Mapping selected', row);
  }

  onGridCellClick(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    if (!action || !event.data) return;
    if (action === 'view') {
      alert(`Stream: ${event.data.stream?.name}\nSubject: ${event.data.subject?.name}`);
    }
  }
}
