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
type ManagedStudent = {
  id: number;
  instituteId: number;
  instituteName?: string | null;
  streamCode?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  mobile?: string | null;
  profileCompletion?: number;
};

type Application = {
  id: number;
  applicationNo: string;
  status: string;
  candidateType: string;
  exam: Exam;
  student?: { id: number; firstName?: string; middleName?: string; lastName?: string };
  updatedAt: string;
};

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
          <div class="p">Choose student, exam, and application type to start a new form.</div>
        </div>
        <div class="grow"></div>
        <mat-form-field appearance="outline" class="w240">
          <mat-label>Student</mat-label>
          <mat-select [value]="selectedStudentId()" (selectionChange)="selectedStudentId.set($event.value)">
            @for (s of managedStudents(); track s.id) {
              <mat-option [value]="s.id">{{ displayStudentName(s) }} • {{ s.instituteName || 'Institute N/A' }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
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
        <button mat-stroked-button type="button" (click)="showAddStudentForm.set(!showAddStudentForm())">
          {{ showAddStudentForm() ? 'Hide Add Student' : 'Add New Student' }}
        </button>
        <button mat-flat-button color="primary" (click)="create()" [disabled]="!selectedStudentId() || !selectedExamId() || creating() || selectedExamCapacityReached()">
          {{ creating() ? 'Creating…' : 'New application' }}
        </button>
      </div>

      @if (showAddStudentForm()) {
        <div class="managed-student-form">
          <mat-form-field appearance="outline" class="w240"><mat-label>First Name</mat-label><input matInput [value]="newStudentFirstName()" (input)="newStudentFirstName.set($any($event.target).value)" /></mat-form-field>
          <mat-form-field appearance="outline" class="w240"><mat-label>Middle Name</mat-label><input matInput [value]="newStudentMiddleName()" (input)="newStudentMiddleName.set($any($event.target).value)" /></mat-form-field>
          <mat-form-field appearance="outline" class="w240"><mat-label>Last Name</mat-label><input matInput [value]="newStudentLastName()" (input)="newStudentLastName.set($any($event.target).value)" /></mat-form-field>
          <mat-form-field appearance="outline" class="w240"><mat-label>Institute</mat-label><mat-select [value]="newStudentInstituteId()" (selectionChange)="newStudentInstituteId.set($event.value)">@for (inst of institutes(); track inst.id) { <mat-option [value]="inst.id">{{ inst.name }}</mat-option> }</mat-select></mat-form-field>
          <mat-form-field appearance="outline" class="w240"><mat-label>Stream</mat-label><mat-select [value]="newStudentStreamCode()" (selectionChange)="newStudentStreamCode.set($event.value)"><mat-option value="SCIENCE">Science</mat-option><mat-option value="ARTS">Arts</mat-option><mat-option value="COMMERCE">Commerce</mat-option><mat-option value="VOCATIONAL">Vocational</mat-option><mat-option value="TECHNOLOGY">Technology</mat-option><mat-option value="1">1-Science</mat-option><mat-option value="2">2-Arts</mat-option><mat-option value="3">3-Commerce</mat-option><mat-option value="4">4-Vocational</mat-option><mat-option value="5">5-Technology</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline" class="w240"><mat-label>Mobile</mat-label><input matInput [value]="newStudentMobile()" (input)="newStudentMobile.set($any($event.target).value)" /></mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="createManagedStudent()" [disabled]="creatingStudent()">{{ creatingStudent() ? 'Saving…' : 'Save Student' }}</button>
        </div>
      }

      @if (selectedExamCapacityReached()) {
        <div style="margin-top:8px;color:#b91c1c;">
          No remaining application slots are available for the selected exam at your institute.
        </div>
      }

      @if (managedStudents().length > 0) {
        <div class="managed-students-table-wrap">
          <table class="managed-students-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Institute</th>
                <th>Stream</th>
                <th>Profile %</th>
              </tr>
            </thead>
            <tbody>
              @for (s of managedStudents(); track s.id) {
                <tr [class.active]="s.id === selectedStudentId()" (click)="selectedStudentId.set(s.id)">
                  <td>{{ displayStudentName(s) }}</td>
                  <td>{{ s.instituteName || '-' }}</td>
                  <td>{{ s.streamCode || '-' }}</td>
                  <td>{{ s.profileCompletion ?? 0 }}%</td>
                </tr>
              }
            </tbody>
          </table>
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
                  <div class="tile-student">{{ studentNameFromApplication(app) }}</div>
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
      .tile-student {
        margin-top: 4px;
        color: #0f172a;
        font-size: 0.82rem;
        font-weight: 700;
      }
      .managed-student-form {
        margin-top: 12px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }
      .managed-students-table-wrap {
        margin-top: 12px;
        border: 1px solid #dbe1ea;
        border-radius: 10px;
        overflow: auto;
      }
      .managed-students-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 640px;
      }
      .managed-students-table th,
      .managed-students-table td {
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
        padding: 10px;
        font-size: 0.9rem;
      }
      .managed-students-table tr.active {
        background: #eef6ff;
      }
      .managed-students-table tbody tr {
        cursor: pointer;
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
  readonly managedStudents = signal<ManagedStudent[]>([]);
  readonly institutes = signal<Array<{ id: number; name: string }>>([]);
  readonly exams = signal<Exam[]>([]);
  readonly creating = signal(false);
  readonly creatingStudent = signal(false);
  readonly showAddStudentForm = signal(false);
  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedExamId = signal<number | null>(null);
  readonly selectedCandidateType = signal<'REGULAR' | 'BACKLOG' | 'REPEATER' | 'ATKT' | 'IMPROVEMENT' | 'PRIVATE'>('REGULAR');
  readonly newStudentFirstName = signal('');
  readonly newStudentMiddleName = signal('');
  readonly newStudentLastName = signal('');
  readonly newStudentInstituteId = signal<number | null>(null);
  readonly newStudentStreamCode = signal('');
  readonly newStudentMobile = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedApplication: Application | null = null;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly profileService = inject(StudentProfileService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit() {
    this.loadManagedStudents();
    this.loadInstitutes();
    this.reload();
    this.loadExams();
  }

  private loadManagedStudents() {
    this.http.get<{ students: ManagedStudent[] }>(`${API_BASE_URL}/students/managed`).subscribe({
      next: (response) => {
        const students = response.students || [];
        this.managedStudents.set(students);
        if (!this.selectedStudentId() && students.length) {
          this.selectedStudentId.set(students[0].id);
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to load students');
      }
    });
  }

  private loadInstitutes() {
    this.http.get<{ institutes: Array<{ id: number; name: string }> }>(`${API_BASE_URL}/institutes/search`).subscribe({
      next: (response) => this.institutes.set(response.institutes || []),
      error: () => this.institutes.set([])
    });
  }

  createManagedStudent() {
    if (!this.newStudentFirstName().trim() || !this.newStudentLastName().trim() || !this.newStudentInstituteId() || !this.newStudentStreamCode().trim()) {
      this.error.set('Please fill First Name, Last Name, Institute and Stream for new student.');
      return;
    }

    this.creatingStudent.set(true);
    this.error.set(null);

    this.http.post(`${API_BASE_URL}/students/managed`, {
      firstName: this.newStudentFirstName().trim(),
      middleName: this.newStudentMiddleName().trim() || undefined,
      lastName: this.newStudentLastName().trim(),
      instituteId: this.newStudentInstituteId(),
      streamCode: this.newStudentStreamCode().trim(),
      mobile: this.newStudentMobile().trim() || undefined
    }).subscribe({
      next: () => {
        this.creatingStudent.set(false);
        this.newStudentFirstName.set('');
        this.newStudentMiddleName.set('');
        this.newStudentLastName.set('');
        this.newStudentStreamCode.set('');
        this.newStudentMobile.set('');
        this.newStudentInstituteId.set(null);
        this.showAddStudentForm.set(false);
        this.loadManagedStudents();
      },
      error: (err: any) => {
        this.creatingStudent.set(false);
        this.error.set(err?.error?.message || 'Failed to create student');
      }
    });
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
    const studentId = this.selectedStudentId();
    const examId = this.selectedExamId();
    if (!studentId || !examId) return;

    const selectedStudent = this.managedStudents().find((item) => item.id === studentId);
    const selectedStudentCompletion = Number(selectedStudent?.profileCompletion ?? 0);
    
    const exam = this.exams().find((e) => e.id === examId);
    if (!exam || !this.isExamOpen(exam)) {
      this.error.set('Cannot apply: selected exam is closed or invalid.');
      return;
    }

    // Check if student profile is complete before allowing application creation
    const profileCompletion = selectedStudentCompletion || this.getProfileCompletion();
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
    .post<{ application: Application }>(`${API_BASE_URL}/applications`, { examId, studentId, candidateType: this.selectedCandidateType() })
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

  displayStudentName(student: ManagedStudent | null | undefined): string {
    if (!student) return '-';
    return student.fullName || [student.lastName, student.firstName, student.middleName].filter(Boolean).join(' ') || `Student #${student.id}`;
  }

  studentNameFromApplication(app: Application): string {
    return this.displayStudentName({
      id: app.student?.id || 0,
      firstName: app.student?.firstName,
      middleName: app.student?.middleName,
      lastName: app.student?.lastName,
      fullName: [app.student?.lastName, app.student?.firstName, app.student?.middleName].filter(Boolean).join(' ')
    } as ManagedStudent);
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

