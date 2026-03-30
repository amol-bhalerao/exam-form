import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

import { API_BASE_URL } from '../../../core/api';
import { StudentProfileService } from '../../../core/student-profile.service';

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
    MatSnackBarModule,
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
          <mat-select [value]="selectedExamId()" (selectionChange)="selectedExamId.set($event.value)">
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

    @if (error()) {
      <mat-card class="card error-card">
        <div class="error-message">
          <strong>Error:</strong> {{ error() }}
        </div>
      </mat-card>
    }

    <mat-card class="card">
      @if (loading()) {
        <div class="loading">Loading applications...</div>
      } @else if (applications().length === 0) {
        <div class="empty-state">
          <p>No applications yet. Create a new one to get started!</p>
        </div>
      } @else {
        <div class="ag-theme-alpine" style="width:100%; height:340px; margin-top: 10px;">
          <ag-grid-angular
            [rowData]="applications()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [rowSelection]="{ mode: 'singleRow' }"
            (rowClicked)="onRowClicked($event.data)"
          ></ag-grid-angular>
        </div>
      }
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
      }
      .error-card {
        background-color: #fee;
        border: 1px solid #fcc;
      }
      .error-message {
        color: #c33;
      }
      .loading {
        padding: 20px;
        text-align: center;
        color: #666;
      }
      .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #999;
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
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedApplication: Application | null = null;

  readonly columnDefs: ColDef[] = [
    { field: 'applicationNo', headerName: 'Application No', flex: 1, sortable: true, filter: true },
    { field: 'exam', headerName: 'Exam', valueGetter: (params: any) => `${params.data.exam?.name || ''} (${params.data.exam?.session || ''} ${params.data.exam?.academicYear || ''})`, flex: 2 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'updatedAt', headerName: 'Updated', valueGetter: (params: any) => params.data.updatedAt ? new Date(params.data.updatedAt).toLocaleString() : '', flex: 1 }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120 };

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly profileService = inject(StudentProfileService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit() {
    this.reload();
    this.loadExams();
  }

  private loadExams() {
    // FIX: Added error handling, type safety and deduplication
    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/exams`).subscribe({
      next: (r: any) => {
        // Deduplicate exams by ID to prevent duplicates in dropdown
        const examsArray = (r.exams || []) as Exam[];
        const examsMap = new Map<number, Exam>();
        examsArray.forEach((exam: Exam) => {
          examsMap.set(exam.id, exam);
        });
        const uniqueExams: Exam[] = Array.from(examsMap.values());
        this.exams.set(uniqueExams);
        const active = uniqueExams.filter((e: Exam) => this.isExamOpen(e)) || [];
        if (!active.length) this.selectedExamId.set(null);
      },
      error: (err: any) => {
        console.error('Failed to load exams:', err?.error?.message || err?.message);
        this.error.set('Failed to load exams. Please try again.');
      }
    });
  }

  isExamOpen(exam: Exam): boolean {
    const now = new Date();
    return new Date(exam.applicationOpen) <= now && now <= new Date(exam.applicationClose);
  }

  reload() {
    // FIX: Added loading state, error handling, and proper type casting
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ applications: Application[] }>(`${API_BASE_URL}/applications/my`).subscribe({
      next: (r: any) => {
        this.applications.set(r.applications || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load applications';
        console.error('Failed to load applications:', errorMsg);
        this.error.set(errorMsg);
        this.loading.set(false);
        // Show empty state on error instead of breaking
        this.applications.set([]);
      }
    });
  }

  onRowClicked(row: Application | undefined) {
    this.selectedApplication = row ?? null;
  }

  create() {
    const examId = this.selectedExamId();
    if (!examId) return;
    
    const exam = this.exams().find((e) => e.id === examId);
    if (!exam || !this.isExamOpen(exam)) {
      this.error.set('Cannot apply: selected exam is closed or invalid.');
      return;
    }

    // Check if student profile is complete before allowing application creation
    const profileCompletion = this.getProfileCompletion();
    if (profileCompletion < 100) {
      this.snackBar.open(
        `⚠️ Please complete your profile (${profileCompletion}% done) before creating an exam application`,
        'Go to Profile',
        { duration: 5000 }
      ).onAction().subscribe(() => {
        this.router.navigate(['/app/student/profile']);
      });
      this.error.set('Please complete your student profile before creating an exam application.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    // FIX: Added error handling and proper response typing
    this.http
      .post<{ application: Application }>(`${API_BASE_URL}/applications`, { examId, candidateType: 'REGULAR' })
      .subscribe({
        next: (r: any) => {
          this.creating.set(false);
          this.router.navigate(['/app/student/applications', r.application.id]);
        },
        error: (err: any) => {
          const errorMsg = err?.error?.error || err?.error?.message || 'Failed to create application';
          console.error('Failed to create application:', errorMsg);
          this.error.set(errorMsg);
          this.creating.set(false);
        }
      });
  }

  /**
   * Calculate profile completion percentage
   */
  private getProfileCompletion(): number {
    const profile = this.profileService.profile$();
    if (!profile) return 0;

    const requiredFields = [
      'firstName',
      'lastName',
      'dob',
      'gender',
      'aadhaar',
      'address',
      'pinCode',
      'mobile'
    ];

    let completedCount = 0;
    requiredFields.forEach(field => {
      const value = (profile as any)[field];
      if (value && value !== null && value !== '') {
        completedCount++;
      }
    });

    // Check if at least one previous exam is added
    // (This is not a strict requirement for app creation, just for progress tracking)

    return Math.round((completedCount / requiredFields.length) * 100);
  }
}

