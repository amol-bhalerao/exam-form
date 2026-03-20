import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';

ModuleRegistry.registerModules([AllCommunityModule]);

type Exam = { id: number; name: string; academicYear: string; session: string; applicationOpen: string; applicationClose: string };
type Application = { id: number; applicationNo: string; status: string; candidateType: string; exam: Exam; updatedAt: string };

@Component({
  selector: 'app-student-applications',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AgGridModule
  ],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">My Applications</div>
          <div class="p">Create, fill, submit and print.</div>
        </div>
        <div class="grow"></div>
        <mat-form-field appearance="outline" class="w240">
          <mat-label>Exam</mat-label>
          <mat-select [(value)]="selectedExamId">
            @for (e of exams(); track e.id) {
              <mat-option [value]="e.id" [disabled]="!isExamOpen(e)">
                {{ e.name }} ({{ e.session }} {{ e.academicYear }})
                <span style="color: #9ca3af; font-size: 0.8rem; margin-left: 6px;">{{ isExamOpen(e) ? 'Apply now' : 'Closed' }}</span>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="create()" [disabled]="!selectedExamId() || creating()">
          {{ creating() ? 'Creating…' : 'New application' }}
        </button>
      </div>
    </mat-card>

    <mat-card class="card">
      <div class="ag-theme-alpine" style="width:100%; height:340px; margin-top: 10px;">
        <ag-grid-angular
          [rowData]="applications()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          (rowClicked)="onRowClicked($event.data)"
        ></ag-grid-angular>
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
        font-weight: 800;
      }
      .p {
        color: #6b7280;
        margin-top: 4px;
      }
      .w240 {
        width: 280px;
        max-width: 100%;
      }
      .table {
        width: 100%;
      }
      a {
        color: #2563eb;
        text-decoration: none;
      }
    `
  ]
})
export class StudentApplicationsComponent implements OnInit {
  readonly applications = signal<Application[]>([]);
  readonly exams = signal<Exam[]>([]);
  readonly creating = signal(false);
  readonly selectedExamId = signal<number | null>(null);
  selectedApplication: Application | null = null;

  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'Application No', flex: 1, sortable: true, filter: true },
    { field: 'exam', headerName: 'Exam', valueGetter: (params: any) => `${params.data.exam?.name || ''} (${params.data.exam?.session || ''} ${params.data.exam?.academicYear || ''})`, flex: 2 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'updatedAt', headerName: 'Updated', valueGetter: (params: any) => params.data.updatedAt ? new Date(params.data.updatedAt).toLocaleString() : '', flex: 1 }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120 };

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    this.reload();
    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/exams`).subscribe((r) => {
      this.exams.set(r.exams || []);
      const active = r.exams.filter((e) => this.isExamOpen(e));
      if (!active.length) this.selectedExamId.set(null);
    });
  }

  isExamOpen(exam: Exam): boolean {
    const now = new Date();
    return new Date(exam.applicationOpen) <= now && now <= new Date(exam.applicationClose);
  }

  reload() {
    this.http.get<{ applications: Application[] }>(`${API_BASE_URL}/applications/my`).subscribe((r) => this.applications.set(r.applications));
  }

  onRowClicked(row: Application | undefined) {
    this.selectedApplication = row ?? null;
  }

  create() {
    const examId = this.selectedExamId();
    if (!examId) return;
    const exam = this.exams().find((e) => e.id === examId);
    if (!exam || !this.isExamOpen(exam)) {
      window.alert('Cannot apply: selected exam is closed or invalid.');
      return;
    }
    this.creating.set(true);
    this.http
      .post<{ application: Application }>(`${API_BASE_URL}/applications`, { examId, candidateType: 'REGULAR' })
      .subscribe({
        next: (r) => {
          this.creating.set(false);
          this.router.navigate(['/student/applications', r.application.id]);
        },
        error: () => this.creating.set(false)
      });
  }
}

