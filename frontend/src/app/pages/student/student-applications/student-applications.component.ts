import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { API_BASE_URL } from '../../../core/api';
import { StudentProfileService } from '../../../core/student-profile.service';

type Exam = {
  id: number;
  name: string;
  academicYear: string;
  session: string;
  applicationOpen: string;
  applicationClose: string;
  totalStudents?: number | null;
  applicationsUsed?: number;
  remainingApplications?: number | null;
  isCapacityReached?: boolean;
};
type Application = { id: number; applicationNo: string; status: string; candidateType: string; exam: Exam; updatedAt: string };

@Component({
  selector: 'app-student-applications',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule
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
              <mat-option [value]="e.id" [disabled]="!canCreateForExam(e)">
                {{ e.name }} ({{ e.session }} {{ e.academicYear }})
                <span style="color: #9ca3af; font-size: 0.8rem; margin-left: 6px;">
                  {{ !isExamOpen(e) ? 'Closed' : (e.isCapacityReached ? 'Full' : getExamCapacityLabel(e)) }}
                </span>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w240">
          <mat-label>Application Type</mat-label>
          <mat-select [value]="selectedCandidateType()" (selectionChange)="selectedCandidateType.set($event.value)">
            <mat-option value="REGULAR">Fresh / Regular</mat-option>
            <mat-option value="BACKLOG">Backlog</mat-option>
            <mat-option value="REPEATER">Repeater</mat-option>
            <mat-option value="ATKT">ATKT</mat-option>
            <mat-option value="IMPROVEMENT">Improvement</mat-option>
            <mat-option value="PRIVATE">Private</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="create()" [disabled]="!selectedExamId() || creating() || selectedExamCapacityReached()">
          {{ creating() ? 'Creating…' : 'New application' }}
        </button>
      </div>

      @if (selectedExamCapacityReached()) {
        <div style="margin-top:8px;color:#b91c1c;">
          No remaining application slots are available for the selected exam at your institute.
        </div>
      }
    </mat-card>

    @if (error()) {
      <mat-card class="card error-card">
        <div class="error-message">
          <strong>Error:</strong> {{ error() }}
        </div>
      </mat-card>
    }

    <mat-card class="card applications-section">
      @if (loading()) {
        <div class="loading">Loading applications...</div>
      } @else if (applications().length === 0) {
        <div class="empty-state">
          <p>No applications yet. Create a new one to get started!</p>
        </div>
      } @else {
        <div class="applications-grid">
          @for (app of applications(); track app.id) {
            <div class="application-tile" [class.draft-tile]="app.status === 'DRAFT'" [class.submitted-tile]="app.status === 'SUBMITTED'">
              <div class="tile-header">
                <div>
                  <div class="tile-app-no">{{ app.applicationNo }}</div>
                  <div class="tile-exam">{{ app.exam?.name }}</div>
                </div>
                <span class="status-pill" [class.status-draft]="app.status === 'DRAFT'" [class.status-submitted]="app.status === 'SUBMITTED'">
                  {{ app.status }}
                </span>
              </div>

              <div class="tile-meta-grid">
                <div class="tile-meta-item">
                  <label>Session</label>
                  <span>{{ app.exam?.session }} {{ app.exam?.academicYear }}</span>
                </div>
                <div class="tile-meta-item">
                  <label>Application Type</label>
                  <span>{{ formatCandidateType(app.candidateType) }}</span>
                </div>
                <div class="tile-meta-item full-width">
                  <label>Last Updated</label>
                  <span>{{ app.updatedAt ? (app.updatedAt | date:'medium') : '-' }}</span>
                </div>
              </div>

              <div class="tile-actions">
                <button mat-flat-button color="primary" (click)="openApplication(app)">
                  {{ app.status === 'DRAFT' ? 'Continue Draft' : 'Open Application' }}
                </button>
                <button mat-stroked-button (click)="printApplication(app)">
                  Print
                </button>
              </div>
            </div>
          }
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
      .applications-section {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      }
      .applications-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-top: 8px;
      }
      .application-tile {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px;
        background: #fff;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .draft-tile {
        border-color: #fbbf24;
        background: linear-gradient(180deg, #fffdf6 0%, #ffffff 100%);
      }
      .submitted-tile {
        border-color: #86efac;
      }
      .tile-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .tile-app-no {
        font-size: 1rem;
        font-weight: 800;
        color: #111827;
      }
      .tile-exam {
        margin-top: 4px;
        color: #4b5563;
        font-size: 0.92rem;
      }
      .status-pill {
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .status-draft {
        background: #fef3c7;
        color: #92400e;
      }
      .status-submitted {
        background: #dcfce7;
        color: #166534;
      }
      .tile-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .tile-meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .tile-meta-item.full-width {
        grid-column: 1 / -1;
      }
      .tile-meta-item label {
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #6b7280;
      }
      .tile-meta-item span {
        font-size: 0.95rem;
        color: #111827;
      }
      .tile-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: auto;
      }
      .table {
        width: 100%;
      }
      a {
        color: #2563eb;
        text-decoration: none;
      }

      @media (max-width: 768px) {
        .card {
          padding: 14px;
          border-radius: 16px;
        }

        .tile-header,
        .tile-meta-grid {
          grid-template-columns: 1fr;
        }

        .tile-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .tile-actions button {
          flex: 1 1 100%;
        }
      }
    `
  ]
})
export class StudentApplicationsComponent implements OnInit {
  readonly applications = signal<Application[]>([]);
  readonly exams = signal<Exam[]>([]);
  readonly creating = signal(false);
  readonly selectedExamId = signal<number | null>(null);
  readonly selectedCandidateType = signal<'REGULAR' | 'BACKLOG' | 'REPEATER' | 'ATKT' | 'IMPROVEMENT' | 'PRIVATE'>('REGULAR');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedApplication: Application | null = null;

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

  canCreateForExam(exam: Exam): boolean {
    return this.isExamOpen(exam) && !exam.isCapacityReached;
  }

  selectedExamCapacityReached(): boolean {
    const exam = this.exams().find((item) => item.id === this.selectedExamId());
    return !!exam?.isCapacityReached;
  }

  getExamCapacityLabel(exam: Exam): string {
    if (typeof exam.remainingApplications === 'number') {
      return `${exam.remainingApplications} remaining`;
    }
    return 'Apply now';
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

  formatCandidateType(value: string): string {
    const mapping: Record<string, string> = {
      REGULAR: 'Fresh Application',
      BACKLOG: 'Backlog Application',
      REPEATER: 'Repeater',
      ATKT: 'ATKT',
      IMPROVEMENT: 'Improvement',
      PRIVATE: 'Private'
    };
    return mapping[value] || value;
  }

  openApplication(app: Application | null) {
    if (!app) return;
    this.router.navigate(['/app/student/applications', app.id]);
  }

  printApplication(app: Application | null) {
    if (!app) return;
    this.router.navigate(['/app/student/forms', app.id, 'print']);
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
    if (profileCompletion < 70) {
      this.snackBar.open(
        `⚠️ Please complete your profile (${profileCompletion}% done) before creating an exam application`,
        'Go to Profile',
        { duration: 5000 }
      ).onAction().subscribe(() => {
        this.router.navigate(['/app/student/profile']);
      });
      this.error.set('Please complete at least 70% of your student profile before creating an exam application.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    // FIX: Added error handling and proper response typing
    this.http
      .post<{ application: Application }>(`${API_BASE_URL}/applications`, { examId, candidateType: this.selectedCandidateType() })
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

