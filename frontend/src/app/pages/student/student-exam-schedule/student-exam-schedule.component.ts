import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { API_BASE_URL } from '../../../core/api';

type Exam = { id: number; name: string; academicYear: string; session: string; applicationOpen: string; applicationClose: string; examStartDate?: string; examEndDate?: string };

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
        <mat-tab-group class="schedule-tabs">
          @for (exam of exams(); track exam.id) {
            <mat-tab>
              <ng-template mat-tab-label>
                <span>{{ exam.name }}</span>
                <mat-icon matTabLabelPadding>calendar_today</mat-icon>
              </ng-template>

              <div class="exam-details">
                <mat-card class="info-card">
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
                    @if (exam.examStartDate) {
                      <div class="info-item">
                        <label>Exam Starts</label>
                        <span>{{ exam.examStartDate | date: 'MMM dd, yyyy' }}</span>
                      </div>
                    }
                    @if (exam.examEndDate) {
                      <div class="info-item">
                        <label>Exam Ends</label>
                        <span>{{ exam.examEndDate | date: 'MMM dd, yyyy' }}</span>
                      </div>
                    }
                  </div>
                </mat-card>
              </div>
            </mat-tab>
          }
        </mat-tab-group>
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

    .exam-details {
      padding: 20px;
    }

    .info-card {
      padding: 24px;
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

  readonly exams = signal<Exam[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/exams`).subscribe({
      next: (response: any) => {
        // Deduplicate exams by ID
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
  }
}
