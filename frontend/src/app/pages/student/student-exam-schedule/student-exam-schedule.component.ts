import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { API_BASE_URL } from '../../../core/api';

type Exam = { id: number; name: string; academicYear: string; session: string; applicationOpen: string; applicationClose: string; examStartDate?: string; examEndDate?: string };
type Application = { id: number; applicationNo: string; status: string; candidateType: string; updatedAt?: string; exam?: Exam };

@Component({
  selector: 'app-student-exam-schedule',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatTableModule],
  template: `
    <div class="schedule-container">
      <mat-card class="header-card">
        <div class="header-content">
          <div>
            <div class="header-title">Exam Schedule</div>
            <div class="header-sub">View your exam dates and important deadlines</div>
          </div>
          <mat-icon class="header-icon">calendar_month</mat-icon>
        </div>
      </mat-card>

      @if (loading()) {
        <mat-card class="loading-card">
          <div class="loading-text">Loading exam schedule...</div>
        </mat-card>
      } @else if (error()) {
        <mat-card class="error-card">
          <div class="error-text">{{ error() }}</div>
          <button mat-stroked-button (click)="reload()">
            <mat-icon>refresh</mat-icon> Retry
          </button>
        </mat-card>
      } @else if (exams().length === 0) {
        <mat-card class="empty-card">
          <div class="empty-text">No exams scheduled yet</div>
        </mat-card>
      } @else {
        @if (applications().length > 0) {
          <mat-card class="applications-card">
            <div class="section-title">My Applications</div>
            <div class="section-subtitle">Quickly continue a draft or print a submitted form.</div>

            <div class="application-list">
              @for (app of applications(); track app.id) {
                <div class="application-item">
                  <div>
                    <div class="application-title">{{ app.applicationNo }}</div>
                    <div class="application-meta">
                      {{ app.exam?.name || 'Exam' }} • {{ formatCandidateType(app.candidateType) }} • {{ app.status }}
                    </div>
                  </div>
                  <div class="application-actions">
                    <button mat-flat-button color="primary" (click)="openApplication(app)">
                      {{ app.status === 'DRAFT' ? 'Continue Draft' : 'Open' }}
                    </button>
                    <button mat-stroked-button (click)="printApplication(app)">
                      Print
                    </button>
                  </div>
                </div>
              }
            </div>
          </mat-card>
        }

        <div class="exam-card-list">
          @for (exam of exams(); track exam.id) {
            <mat-card class="info-card exam-schedule-card">
              <div class="info-grid">
                <div class="info-item">
                  <label>Exam Name</label>
                  <span>{{ exam.name }}</span>
                </div>
                <div class="info-item">
                  <label>Session</label>
                  <span>{{ exam.session }}</span>
                </div>
                <div class="info-item">
                  <label>Academic Year</label>
                  <span>{{ exam.academicYear }}</span>
                </div>
                <div class="info-item">
                  <label>Application Opens</label>
                  <span>{{ exam.applicationOpen | date: 'MMM dd, yyyy' }}</span>
                </div>
                <div class="info-item">
                  <label>Application Closes</label>
                  <span>{{ exam.applicationClose | date: 'MMM dd, yyyy' }}</span>
                </div>
                <div class="info-item">
                  <label>Exam Dates</label>
                  <span>{{ exam.examStartDate ? (exam.examStartDate | date: 'MMM dd, yyyy') : 'To be announced' }}
                    @if (exam.examEndDate) {
                      - {{ exam.examEndDate | date: 'MMM dd, yyyy' }}
                    }
                  </span>
                </div>
              </div>

              <div class="exam-footer">
                <div class="exam-status-chip" [class.open]="isApplicationOpen(exam)" [class.closed]="!isApplicationOpen(exam)">
                  {{ isApplicationOpen(exam) ? 'Applications Open' : 'Application Window Closed' }}
                </div>

                @if (getApplicationForExam(exam.id); as app) {
                  <div class="application-actions">
                    <button mat-flat-button color="primary" (click)="openApplication(app)">
                      {{ app.status === 'DRAFT' ? 'Continue Draft' : 'View Application' }}
                    </button>
                    <button mat-stroked-button (click)="printApplication(app)">Print</button>
                  </div>
                } @else {
                  <button mat-stroked-button (click)="goToApplications()">
                    {{ isApplicationOpen(exam) ? 'Apply from Applications Page' : 'View Applications' }}
                  </button>
                }
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .schedule-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-card {
      padding: 20px;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 4px;
    }

    .header-sub {
      font-size: 0.9rem;
      opacity: 0.9;
      margin: 0;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.3;
      flex-shrink: 0;
    }

    .loading-card, .error-card, .empty-card {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-text { color: #666; font-size: 1rem; }
    .error-text { color: #d32f2f; font-size: 1rem; }
    .empty-text { color: #999; font-size: 1rem; }

    .schedule-tabs {
      width: 100%;
    }

    .applications-card,
    .info-card {
      padding: 24px;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
    }

    .section-subtitle {
      margin-top: 4px;
      color: #6b7280;
      margin-bottom: 16px;
    }

    .application-list {
      display: grid;
      gap: 12px;
    }

    .application-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px;
      background: #f8fbff;
      flex-wrap: wrap;
    }

    .application-title {
      font-weight: 700;
      color: #111827;
    }

    .application-meta {
      margin-top: 4px;
      color: #6b7280;
      font-size: 0.92rem;
    }

    .application-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .exam-card-list {
      display: grid;
      gap: 16px;
    }

    .exam-schedule-card {
      display: grid;
      gap: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item label {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #2563eb;
    }

    .info-item span {
      font-size: 1rem;
      color: #333;
      font-weight: 500;
    }

    .exam-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }

    .exam-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .exam-status-chip.open {
      background: #dcfce7;
      color: #166534;
    }

    .exam-status-chip.closed {
      background: #f3f4f6;
      color: #4b5563;
    }

    @media (max-width: 600px) {
      .schedule-container {
        padding: 12px;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentExamScheduleComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly exams = signal<Exam[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.reload();
  }

  isApplicationOpen(exam: Exam): boolean {
    const now = new Date().getTime();
    return new Date(exam.applicationOpen).getTime() <= now && now <= new Date(exam.applicationClose).getTime();
  }

  getApplicationForExam(examId: number): Application | null {
    return this.applications().find((app) => app.exam?.id === examId) ?? null;
  }

  formatCandidateType(value: string): string {
    const mapping: Record<string, string> = {
      REGULAR: 'Fresh',
      BACKLOG: 'Backlog',
      REPEATER: 'Repeater',
      ATKT: 'ATKT',
      IMPROVEMENT: 'Improvement',
      PRIVATE: 'Private'
    };
    return mapping[value] || value;
  }

  openApplication(app: Application) {
    this.router.navigate(['/app/student/applications', app.id]);
  }

  printApplication(app: Application) {
    this.router.navigate(['/app/student/forms', app.id, 'print']);
  }

  goToApplications() {
    this.router.navigate(['/app/student/applications']);
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/exams`).subscribe({
      next: (response: any) => {
        const examsMap = new Map<number, Exam>();
        const exams = (response.exams || []) as Exam[];
        exams.forEach((exam: Exam) => {
          examsMap.set(exam.id, exam);
        });
        const uniqueExams = Array.from(examsMap.values()).sort((a: Exam, b: Exam) => {
          const aDate = new Date(a.applicationOpen).getTime();
          const bDate = new Date(b.applicationOpen).getTime();
          return aDate - bDate;
        });
        this.exams.set(uniqueExams);
        this.loading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.error?.error || 'Failed to load exam schedule';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });

    this.http.get<{ applications: Application[] }>(`${API_BASE_URL}/applications/my`).subscribe({
      next: (response: any) => {
        this.applications.set(response.applications || []);
      },
      error: (err: any) => {
        if (err?.status === 412) {
          this.applications.set([]);
          return;
        }
        const errorMsg = err?.error?.message || err?.error?.error;
        if (errorMsg && !this.error()) {
          this.error.set(errorMsg);
        }
      }
    });
  }
}
