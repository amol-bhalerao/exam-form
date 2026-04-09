import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { API_BASE_URL } from '../../../core/api';

type Row = {
  id: number;
  applicationNo: string;
  status: string;
  student: { firstName?: string; lastName?: string };
  exam: { name: string; session: string; academicYear: string };
  updatedAt: string;
};

@Component({
  selector: 'app-institute-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-card class="card hero-card">
      <div class="row hero-row">
        <div>
          <div class="eyebrow">Institute review desk</div>
          <div class="h">Student Applications</div>
          <div class="p">Submitted forms are now shown in a mobile-friendly list for quick institute verification.</div>
        </div>
        <div class="grow"></div>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search application or student</mat-label>
          <input matInput [(ngModel)]="search" (input)="load()" />
        </mat-form-field>
      </div>

      <div class="summary-row" *ngIf="rows().length > 0">
        <div class="summary-chip total-chip">
          <strong>{{ rows().length }}</strong>
          <span>Total</span>
        </div>
        <div class="summary-chip submitted-chip">
          <strong>{{ submittedCount() }}</strong>
          <span>Submitted</span>
        </div>
        <div class="summary-chip verified-chip">
          <strong>{{ verifiedCount() }}</strong>
          <span>Verified</span>
        </div>
        <div class="summary-chip rejected-chip">
          <strong>{{ rejectedCount() }}</strong>
          <span>Rejected</span>
        </div>
      </div>
    </mat-card>

    <mat-card class="card list-card">
      <div *ngIf="loading()" class="state-message loading">
        <mat-icon>sync</mat-icon>
        <span>Loading applications…</span>
      </div>

      <div *ngIf="errorMessage()" class="state-message error">
        <mat-icon>error_outline</mat-icon>
        <span>{{ errorMessage() }}</span>
      </div>

      <div *ngIf="!loading() && !errorMessage() && rows().length === 0" class="state-message empty">
        <mat-icon>inbox</mat-icon>
        <span>No applications found.</span>
      </div>

      <div class="application-list" *ngIf="!loading() && rows().length > 0">
        <article class="application-item" *ngFor="let row of rows(); trackBy: trackById">
          <div class="item-head">
            <div>
              <div class="app-no">{{ row.applicationNo }}</div>
              <div class="student-name">{{ formatStudentName(row) }}</div>
            </div>
            <span class="status-pill" [class.status-submitted]="row.status === 'SUBMITTED'"
              [class.status-verified]="row.status === 'INSTITUTE_VERIFIED' || row.status === 'BOARD_APPROVED'"
              [class.status-rejected]="row.status === 'REJECTED_BY_INSTITUTE' || row.status === 'REJECTED_BY_BOARD'"
              [class.status-draft]="row.status === 'DRAFT'">
              {{ formatStatus(row.status) }}
            </span>
          </div>

          <div class="item-grid">
            <div>
              <label>Exam</label>
              <span>{{ row.exam?.name || '-' }}</span>
            </div>
            <div>
              <label>Session</label>
              <span>{{ row.exam?.session }} {{ row.exam?.academicYear }}</span>
            </div>
            <div>
              <label>Last updated</label>
              <span>{{ row.updatedAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="item-actions">
            <button
              mat-flat-button
              color="primary"
              (click)="decide(row.id, 'VERIFY')"
              [disabled]="row.status !== 'SUBMITTED' || decidingId() === row.id">
              <mat-icon>verified</mat-icon>
              Verify
            </button>
            <button
              mat-stroked-button
              (click)="decide(row.id, 'REJECT')"
              [disabled]="row.status !== 'SUBMITTED' || decidingId() === row.id">
              <mat-icon>close</mat-icon>
              Reject
            </button>
          </div>
        </article>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
        border-radius: 18px;
      }

      .hero-card {
        background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);
        border: 1px solid #dbeafe;
      }

      .list-card {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      }

      .row {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .hero-row {
        align-items: flex-start;
      }

      .grow {
        flex: 1;
      }

      .eyebrow {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #4f46e5;
        margin-bottom: 4px;
      }

      .h {
        font-size: 1.35rem;
        font-weight: 900;
        color: #111827;
      }

      .p {
        color: #6b7280;
        margin-top: 6px;
        max-width: 720px;
      }

      .w260 {
        width: 320px;
        max-width: 100%;
      }

      .summary-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      .summary-chip {
        border-radius: 14px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        border: 1px solid #e5e7eb;
        background: #fff;
      }

      .summary-chip strong {
        font-size: 1.1rem;
        color: #111827;
      }

      .summary-chip span {
        font-size: 0.8rem;
        color: #6b7280;
      }

      .total-chip { border-color: #cbd5e1; }
      .submitted-chip { border-color: #bfdbfe; background: #eff6ff; }
      .verified-chip { border-color: #bbf7d0; background: #f0fdf4; }
      .rejected-chip { border-color: #fecaca; background: #fef2f2; }

      .state-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 10px;
        font-weight: 500;
      }

      .state-message.loading {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .state-message.error {
        background: #fef2f2;
        color: #b91c1c;
      }

      .state-message.empty {
        background: #f8fafc;
        color: #475569;
      }

      .application-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 14px;
      }

      .application-item {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 15px;
        background: #fff;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .item-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
      }

      .app-no {
        font-size: 1rem;
        font-weight: 800;
        color: #111827;
      }

      .student-name {
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
        background: #f3f4f6;
        color: #374151;
      }

      .status-submitted {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-verified {
        background: #dcfce7;
        color: #166534;
      }

      .status-rejected {
        background: #fee2e2;
        color: #b91c1c;
      }

      .status-draft {
        background: #fef3c7;
        color: #92400e;
      }

      .item-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .item-grid div {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .item-grid label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #6b7280;
      }

      .item-grid span {
        font-size: 0.92rem;
        color: #111827;
        word-break: break-word;
      }

      .item-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: auto;
      }

      @media (max-width: 768px) {
        .card {
          padding: 14px;
        }

        .item-grid {
          grid-template-columns: 1fr;
        }

        .item-actions button {
          flex: 1 1 100%;
        }
      }
    `
  ]
})
export class InstituteApplicationsComponent implements OnInit {
  readonly rows = signal<Row[]>([]);
  readonly loading = signal(false);
  readonly decidingId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submittedCount = computed(() => this.rows().filter((row) => row.status === 'SUBMITTED').length);
  readonly verifiedCount = computed(() => this.rows().filter((row) => ['INSTITUTE_VERIFIED', 'BOARD_APPROVED'].includes(row.status)).length);
  readonly rejectedCount = computed(() => this.rows().filter((row) => ['REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD'].includes(row.status)).length);
  search = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  trackById = (_index: number, row: Row) => row.id;

  formatStudentName(row: Row): string {
    const firstName = row.student?.firstName || '';
    const lastName = row.student?.lastName || '';
    return `${lastName} ${firstName}`.trim() || 'Student name unavailable';
  }

  formatStatus(status: string): string {
    return String(status || '').replace(/_/g, ' ');
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params = this.search ? `?search=${encodeURIComponent(this.search)}` : '';

    this.http.get<{ applications: Row[] }>(`${API_BASE_URL}/applications/institute/list${params}`).subscribe({
      next: (response) => {
        this.rows.set(response.applications || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error || 'Unable to load applications');
        this.loading.set(false);
      }
    });
  }

  decide(id: number, action: 'VERIFY' | 'REJECT') {
    this.decidingId.set(id);
    this.http.post(`${API_BASE_URL}/applications/${id}/institute/decision`, { action }).subscribe({
      next: () => {
        this.decidingId.set(null);
        this.load();
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error || `Unable to ${action === 'VERIFY' ? 'verify' : 'reject'} application`);
        this.decidingId.set(null);
      }
    });
  }
}

