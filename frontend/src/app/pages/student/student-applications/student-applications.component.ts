import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
  paymentCompleted?: boolean;
  printable?: boolean;
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
    MatAutocompleteModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="card launcher-card">
      <div class="launcher-header">
        <div class="launcher-copy">
          <div class="h">Exam Application Desk</div>
          <div class="p">Select student, exam, and application type to start a new form quickly.</div>
        </div>
      </div>

      <div class="launcher-form-grid">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Student</mat-label>
          <input
            matInput
            type="text"
            [value]="studentSearchText()"
            (input)="onStudentSearchInput($event)"
            [matAutocomplete]="studentAuto"
            placeholder="Type to search student"
          />
          <mat-autocomplete #studentAuto="matAutocomplete">
            @for (s of filteredManagedStudents(); track s.id) {
              <mat-option [value]="displayStudentName(s)" (onSelectionChange)="onStudentOptionPicked(s, $event.isUserInput)">{{ displayStudentName(s) }} • {{ s.instituteName || 'Institute N/A' }}</mat-option>
            }
            @if (!filteredManagedStudents().length) {
              <mat-option [disabled]="true">No matching students found</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
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

        <mat-form-field appearance="outline" class="field">
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

        <button
          mat-flat-button
          color="primary"
          class="create-btn"
          (click)="create()"
          [disabled]="!selectedStudentId() || !selectedExamId() || creating() || selectedExamCapacityReached()"
        >
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
        <div class="table-wrap">
          <table class="applications-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Student</th>
                <th>Exam</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications(); track app.id) {
                <tr>
                  <td>{{ app.applicationNo }}</td>
                  <td>{{ studentNameFromApplication(app) }}</td>
                  <td>{{ app.exam?.name }} ({{ app.exam?.session }} {{ app.exam?.academicYear }})</td>
                  <td>{{ formatCandidateType(app.candidateType) }}</td>
                  <td>
                    <span class="status-pill" [class.status-draft]="app.status === 'DRAFT'" [class.status-submitted]="app.status === 'SUBMITTED'">
                      {{ app.status }}
                    </span>
                  </td>
                  <td>{{ app.updatedAt ? (app.updatedAt | date:'medium') : '-' }}</td>
                  <td class="actions-cell">
                    <button mat-stroked-button color="primary" (click)="openApplication(app)">{{ app.status === 'DRAFT' ? 'Continue Draft' : 'View' }}</button>
                    @if (canPrintApplication(app)) {
                      <button mat-stroked-button class="mini-action-btn" (click)="printApplication(app)">Print Form</button>
                      <button mat-stroked-button color="accent" class="mini-action-btn" (click)="openReceipt(app)">Print Receipt</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin: 0 0 16px 0;
        padding: 18px;
        border-radius: 14px;
      }
      .launcher-card {
        background: radial-gradient(circle at top left, #f8fbff 0%, #ffffff 52%, #f5fbf7 100%);
        border: 1px solid #d8e4ef;
      }
      .launcher-header {
        margin-bottom: 16px;
      }
      .launcher-form-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        align-items: stretch;
        padding-top: 4px;
      }
      .launcher-copy {
        min-width: 0;
      }
      .field {
        width: 100%;
        margin-top: 2px;
      }
      .create-btn {
        height: 56px;
        align-self: start;
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
      .h {
        font-weight: 800;
      }
      .p {
        color: #6b7280;
        margin-top: 4px;
      }
      .applications-section {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      }
      .table-wrap {
        margin-top: 8px;
        overflow: auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #fff;
      }
      .applications-table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
      }
      .applications-table th,
      .applications-table td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: middle;
        font-size: 0.82rem;
      }
      .applications-table thead th {
        background: #f8fafc;
        color: #334155;
        font-weight: 700;
        font-size: 0.78rem;
      }
      .actions-cell {
        display: flex;
        gap: 8px;
        flex-wrap: nowrap;
        align-items: center;
        white-space: nowrap;
      }
      .actions-cell button {
        min-width: 64px;
        height: 28px;
        line-height: 26px;
        padding: 0 8px;
        font-size: 0.72rem;
      }
      .mini-action-btn {
        min-width: 78px;
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
      .student-summary-row {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
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
      .completion-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 999px;
        background: #e0f2fe;
        color: #075985;
        font-weight: 700;
        font-size: 0.8rem;
      }
      .student-modal {
        max-width: 860px;
        width: calc(100vw - 24px);
      }
      .student-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #e2e8f0;
        padding: 14px 16px;
      }
      .student-modal-header h3 {
        margin: 0;
      }
      .student-modal-body {
        padding: 14px 16px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .student-modal-actions {
        border-top: 1px solid #e2e8f0;
        padding: 12px 16px;
        display: flex;
        justify-content: flex-end;
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

        .launcher-form-grid {
          grid-template-columns: 1fr;
          gap: 10px;
          padding-top: 2px;
        }

        .student-summary-row {
          grid-template-columns: 1fr;
        }

        .actions-cell {
          flex-wrap: wrap;
          white-space: normal;
        }

        .actions-cell button {
          min-width: 100%;
          height: 34px;
        }

        .applications-table {
          min-width: 680px;
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
  readonly showStudentEditor = signal(false);
  readonly studentEditorMode = signal<'create' | 'edit'>('create');
  readonly editingStudentId = signal<number | null>(null);
  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedExamId = signal<number | null>(null);
  readonly selectedCandidateType = signal<'REGULAR' | 'BACKLOG' | 'REPEATER' | 'ATKT' | 'IMPROVEMENT' | 'PRIVATE'>('REGULAR');
  readonly editorFirstName = signal('');
  readonly editorMiddleName = signal('');
  readonly editorLastName = signal('');
  readonly editorInstituteId = signal<number | null>(null);
  readonly editorStreamCode = signal('');
  readonly editorMobile = signal('');
  readonly studentSearchText = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  selectedApplication: Application | null = null;

  readonly filteredManagedStudents = computed(() => {
    const query = this.studentSearchText().trim().toLowerCase();
    const all = this.managedStudents();
    if (!query) return all;
    return all.filter((student) => {
      const haystack = `${this.displayStudentName(student)} ${student.instituteName || ''} ${student.streamCode || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  });

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly profileService = inject(StudentProfileService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit() {
    this.loadManagedStudents();
    // this.loadInstitutes(); // Removed unnecessary institutes search call
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
          this.studentSearchText.set(this.displayStudentName(students[0]));
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to load students');
      }
    });
  }

  openCreateStudentModal() {
    this.studentEditorMode.set('create');
    this.editingStudentId.set(null);
    this.editorFirstName.set('');
    this.editorMiddleName.set('');
    this.editorLastName.set('');
    this.editorInstituteId.set(null);
    this.editorStreamCode.set('');
    this.editorMobile.set('');
    this.showStudentEditor.set(true);
  }

  openEditStudentModal(student: ManagedStudent, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.studentEditorMode.set('edit');
    this.editingStudentId.set(student.id);
    this.editorFirstName.set(student.firstName || '');
    this.editorMiddleName.set(student.middleName || '');
    this.editorLastName.set(student.lastName || '');
    this.editorInstituteId.set(student.instituteId || null);
    this.editorStreamCode.set(student.streamCode || '');
    this.editorMobile.set(student.mobile || '');
    this.showStudentEditor.set(true);
  }

  closeStudentModal() {
    this.showStudentEditor.set(false);
  }

  saveStudentFromModal() {
    if (!this.editorFirstName().trim() || !this.editorLastName().trim() || !this.editorInstituteId() || !this.editorStreamCode().trim()) {
      this.error.set('Please fill First Name, Last Name, Institute and Stream for new student.');
      return;
    }

    this.creatingStudent.set(true);
    this.error.set(null);

    const payload = {
      firstName: this.editorFirstName().trim(),
      middleName: this.editorMiddleName().trim() || undefined,
      lastName: this.editorLastName().trim(),
      instituteId: this.editorInstituteId(),
      streamCode: this.editorStreamCode().trim(),
      mobile: this.editorMobile().trim() || undefined
    };

    const request$ = this.studentEditorMode() === 'edit' && this.editingStudentId()
      ? this.http.patch(`${API_BASE_URL}/students/managed/${this.editingStudentId()}`, payload)
      : this.http.post(`${API_BASE_URL}/students/managed`, payload);

    request$.subscribe({
      next: () => {
        this.creatingStudent.set(false);
        this.closeStudentModal();
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

  onStudentSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.studentSearchText.set(value);
    this.selectedStudentId.set(null);
  }

  onStudentOptionPicked(student: ManagedStudent, isUserInput: boolean) {
    if (!isUserInput) return;
    this.selectedStudentId.set(student.id);
    this.studentSearchText.set(this.displayStudentName(student));
  }

  goToProfileManager() {
    this.router.navigate(['/app/student/profile']);
  }

  printApplication(app: Application | null) {
    if (!app || !this.canPrintApplication(app)) return;
    this.router.navigate(['/app/student/forms', app.id, 'print']);
  }

  canPrintApplication(app: Application | null): boolean {
    if (!app) return false;
    if (typeof app.printable === 'boolean') return app.printable;
    return app.status === 'SUBMITTED' && !!app.paymentCompleted;
  }

  openReceipt(app: Application | null) {
    if (!app || !this.canPrintApplication(app)) return;
    this.router.navigate(['/app/student/applications', app.id, 'receipt']);
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

  selectedStudentLabel() {
    const selected = this.managedStudents().find((student) => student.id === this.selectedStudentId());
    return selected ? this.displayStudentName(selected) : '-';
  }

  draftApplicationsCount() {
    return this.applications().filter((application) => application.status === 'DRAFT').length;
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

