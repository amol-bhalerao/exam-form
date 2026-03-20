import { Component, OnInit, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

ModuleRegistry.registerModules([AllCommunityModule]);

type Exam = { id: number; name: string; academicYear: string; session: string; applicationOpen: string; applicationClose: string; stream: { name: string } };

@Component({
  selector: 'app-board-exams',
  standalone: true,
  imports: [FormsModule, NgFor, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="row"><div><div class="h">Exams</div><div class="p">Board can create exam windows, filter, and view latest records first.</div></div></div>
      <div class="badges" style="display:flex; gap:8px; margin-bottom: 10px; align-items:center; flex-wrap:wrap;">
        <span style="background:#e0f2fe; color:#0369a1; border-radius:999px; padding:4px 10px; font-size:0.8rem; font-weight:600;">Active exams only</span>
        <span style="background:#f3f4f6; color:#334155; border-radius:999px; padding:4px 10px; font-size:0.8rem;">{{ activeCount() }} active · {{ dateRange() }}</span>
      </div>
      <div class="grid">
        <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="form.name" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Academic year</mat-label><input matInput [(ngModel)]="form.academicYear" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Session</mat-label><input matInput [(ngModel)]="form.session" placeholder="e.g. FEB-MAR 2026" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Stream</mat-label><mat-select [(ngModel)]="form.streamId"><mat-option *ngFor="let s of streams()" [value]="s.id">{{ s.name }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Open date</mat-label><input matInput [matDatepicker]="openPicker" [(ngModel)]="form.applicationOpen" /><mat-datepicker-toggle matSuffix [for]="openPicker"></mat-datepicker-toggle><mat-datepicker #openPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Close date</mat-label><input matInput [matDatepicker]="closePicker" [(ngModel)]="form.applicationClose" /><mat-datepicker-toggle matSuffix [for]="closePicker"></mat-datepicker-toggle><mat-datepicker #closePicker></mat-datepicker></mat-form-field>
      </div>
      <div class="actions"><button mat-flat-button color="primary" (click)="create()">Create Exam</button><span class="status">{{ status }}</span></div>
      <div class="stream-row" style="margin-top: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <mat-form-field appearance="outline" style="width: 280px;"><mat-label>New stream name</mat-label><input matInput [(ngModel)]="newStreamName" placeholder="E.g. Science" /></mat-form-field>
        <button mat-stroked-button color="primary" (click)="createStream()" [disabled]="!newStreamName">Add Stream</button>
      </div>
    </mat-card>

    <mat-card class="card">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="w260"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
        <mat-form-field appearance="outline" class="w180"><mat-label>Stream</mat-label><mat-select [(ngModel)]="filterStream" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option *ngFor="let s of streams()" [value]="s.id">{{ s.name }}</mat-option></mat-select></mat-form-field>
        <div class="grow"></div>
      </div>
      <div class="ag-theme-alpine" style="height: 360px; width: 100%; margin-top: 6px;">
        <ag-grid-angular
          style="width:100%; height:100%;"
          [rowData]="exams()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="10"
        ></ag-grid-angular>
      </div>
      <div class="pager"><button mat-stroked-button (click)="prevPage()" [disabled]="page<=1">Prev</button><span>Page {{ page }}</span><button mat-stroked-button (click)="nextPage()">Next</button></div>
    </mat-card>
  `,
  styles: [
    `
      .card { margin-bottom: 14px; padding: 16px; }
      .row { display: flex; gap: 12px; align-items: center; }
      .h { font-weight: 900; }
      .p { color: #6b7280; margin-top: 4px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: center; }
      .actions { margin-top: 10px; display: flex; align-items: center; gap: 12px; }
      .status { color: #166534; }
      .filter-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }
      .w260 { width: 260px; }
      .w180 { width: 180px; }
      .table { width: 100%; }
      .grow { flex: 1; }
      .pager { margin-top: 10px; display: flex; align-items: center; gap: 10px; }
      @media (max-width: 980px) {
        .grid { grid-template-columns: 1fr; }
        .w260, .w180 { width: 100%; }
      }
    `
  ]
})
export class BoardExamsComponent implements OnInit {
  readonly exams = signal<Exam[]>([]);
  readonly streams = signal<{ id: number; name: string }[]>([]);
  readonly columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'session', headerName: 'Session', flex: 1 },
    { field: 'academicYear', headerName: 'Academic Year', flex: 1 },
    { field: 'stream.name', headerName: 'Stream', flex: 1 },
    { field: 'applicationOpen', headerName: 'Open Date', flex: 1, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'applicationClose', headerName: 'Close Date', flex: 1, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
    { headerName: 'Status', flex: 1, valueGetter: (p) => this.isExamOpen(p.data) ? 'Open' : 'Closed' }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, floatingFilter: true };
  readonly activeCount = signal(0);
  readonly dateRange = signal('');
  page = 1;
  limit = 10;
  search = '';
  filterStream = '';
  status = '';
  newStreamName = '';
  form = {
    name: '',
    academicYear: '',
    session: '',
    streamId: 0,
    applicationOpen: '',
    applicationClose: ''
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadStreams();
    this.load();
  }

  private isExamOpen(exam: any): boolean {
    const now = new Date();
    return new Date(exam.applicationOpen) <= now && now <= new Date(exam.applicationClose);
  }

  private updateMetrics(exams: Exam[]) {
    const now = new Date();
    const active = exams.filter((e) => new Date(e.applicationOpen) <= now && now <= new Date(e.applicationClose));
    this.activeCount.set(active.length);
    if (active.length > 0) {
      const minOpen = new Date(Math.min(...active.map((e) => new Date(e.applicationOpen).getTime())));
      const maxClose = new Date(Math.max(...active.map((e) => new Date(e.applicationClose).getTime())));
      this.dateRange.set(`${minOpen.toLocaleDateString()} - ${maxClose.toLocaleDateString()}`);
    } else {
      this.dateRange.set('No active windows');
    }
  }

  loadStreams() {
    this.http.get<{ streams: any[] }>(`${API_BASE_URL}/masters/streams`).subscribe((r) => this.streams.set(r.streams));
  }

  load() {
    const params = new URLSearchParams();
    if (this.search) params.set('search', this.search);
    if (this.filterStream) params.set('streamId', this.filterStream.toString());
    params.set('page', this.page.toString());
    params.set('limit', this.limit.toString());
    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/exams?${params.toString()}`).subscribe((r) => {
      this.exams.set(r.exams);
      this.updateMetrics(r.exams);
    });
  }

  create() {
    if (!this.form.name || !this.form.academicYear || !this.form.session || !this.form.streamId || !this.form.applicationOpen || !this.form.applicationClose) {
      this.status = 'Fill all fields';
      return;
    }
    const openDate = new Date(this.form.applicationOpen);
    const closeDate = new Date(this.form.applicationClose);
    if (Number.isNaN(openDate.getTime()) || Number.isNaN(closeDate.getTime()) || closeDate <= openDate) {
      this.status = 'Invalid exam dates';
      return;
    }
    this.status = 'Creating...';
    this.http.post(`${API_BASE_URL}/exams`, {
      name: this.form.name,
      academicYear: this.form.academicYear,
      session: this.form.session,
      streamId: Number(this.form.streamId),
      applicationOpen: openDate.toISOString(),
      applicationClose: closeDate.toISOString(),
      instructions: ''
    }).subscribe({
      next: () => {
        this.status = 'Exam created';
        this.load();
      },
      error: () => {
        this.status = 'Create failed';
      }
    });
  }

  createStream() {
    if (!this.newStreamName.trim()) return;
    this.http.post(`${API_BASE_URL}/masters/streams`, { name: this.newStreamName }).subscribe({
      next: () => {
        this.newStreamName = '';
        this.loadStreams();
        this.status = 'Stream added';
      },
      error: () => {
        this.status = 'Stream create failed';
      }
    });
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

