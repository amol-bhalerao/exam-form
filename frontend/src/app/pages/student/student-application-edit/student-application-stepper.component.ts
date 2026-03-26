import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl
} from '@angular/forms';
import { NgIf, NgFor, DatePipe, TitleCasePipe, CommonModule, LowerCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { API_BASE_URL } from '../../../core/api';
import { Subject as RxSubject, interval } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

type SubjectInfo = { id: number; code: string; name: string; category?: string };

@Component({
  selector: 'app-student-application-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DatePipe,
    TitleCasePipe,
    LowerCasePipe
  ],
  template: `
    @if (application()) {
      <div class="application-container fade-in-up">
        <!-- Header -->
        <mat-card class="header-card">
          <div class="header-content">
            <div>
              <h2 class="app-title">Application {{ application()!.applicationNo }}</h2>
              <div class="app-status" [ngClass]="'status-' + (application()!.status | lowercase)">
                {{ application()!.status | titlecase }}
              </div>
            </div>
            <div class="header-actions">
              <span class="last-saved">
                @if (lastSaved()) {
                  <mat-icon class="check-icon">check_circle</mat-icon>
                  Last saved: {{ lastSaved() | date:'short' }}
                }
              </span>
              <button mat-stroked-button routerLink="/app/student/applications" class="back-btn">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
            </div>
          </div>
        </mat-card>

        <!-- Auto-save Progress -->
        @if (autoSaveProgress() > 0 && autoSaveProgress() < 100) {
          <mat-progress-bar mode="determinate" [value]="autoSaveProgress()" class="autosave-progress"></mat-progress-bar>
        }

        <!-- Multi-step form -->
        <mat-card class="form-card">
          <mat-stepper #stepper [linear]="true" class="form-stepper">
            <!-- Step 1: Personal Information -->
            <mat-step [stepControl]="getPersonalGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>person</mat-icon>
                  Personal Info
                </span>
              </ng-template>

              <form [formGroup]="getPersonalGroup()" class="step-form">
                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="studentName" required placeholder="Enter your full name">
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Date of Birth</mat-label>
                    <input matInput [matDatepicker]="dob" formControlName="dob" required>
                    <mat-datepicker-toggle matIconSuffix [for]="dob"></mat-datepicker-toggle>
                    <mat-datepicker #dob></mat-datepicker>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>Father's Name</mat-label>
                    <input matInput formControlName="fatherName" required>
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Mother's Name</mat-label>
                    <input matInput formControlName="motherName" required>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>Gender</mat-label>
                    <mat-select formControlName="gender" required>
                      <mat-option value="M">Male</mat-option>
                      <mat-option value="F">Female</mat-option>
                      <mat-option value="O">Other</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Category</mat-label>
                    <mat-select formControlName="category" required>
                      <mat-option value="GEN">General</mat-option>
                      <mat-option value="OBC">OBC</mat-option>
                      <mat-option value="SC">SC</mat-option>
                      <mat-option value="ST">ST</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperNext [disabled]="getPersonalGroup().invalid">
                    <span>Next: Academic Details</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Academic Details -->
            <mat-step [stepControl]="getAcademicGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>school</mat-icon>
                  Academic
                </span>
              </ng-template>

              <form [formGroup]="getAcademicGroup()" class="step-form">
                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>Stream</mat-label>
                    <mat-select formControlName="stream" required (change)="onStreamChange()">
                      <mat-option value="SCIENCE">Science</mat-option>
                      <mat-option value="COMMERCE">Commerce</mat-option>
                      <mat-option value="ARTS">Arts</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Medium</mat-label>
                    <mat-select formControlName="medium" required>
                      <mat-option value="ENG">English</mat-option>
                      <mat-option value="MAR">Marathi</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    <span>Back</span>
                  </button>
                  <button mat-button matStepperNext [disabled]="getAcademicGroup().invalid">
                    <span>Next: Contact Info</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Contact Information -->
            <mat-step [stepControl]="getContactGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>phone</mat-icon>
                  Contact
                </span>
              </ng-template>

              <form [formGroup]="getContactGroup()" class="step-form">
                <div class="form-row">
                  <mat-form-field class="form-field full-width">
                    <mat-label>Address</mat-label>
                    <input matInput formControlName="address" required placeholder="House No., Building Name">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>City</mat-label>
                    <input matInput formControlName="city" required>
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Pin Code</mat-label>
                    <input matInput formControlName="pin" required pattern="[0-9]{6}">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field class="form-field">
                    <mat-label>Mobile Number</mat-label>
                    <input matInput formControlName="mobile" required pattern="[0-9]{10}">
                  </mat-form-field>
                  <mat-form-field class="form-field">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" required type="email">
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    <span>Back</span>
                  </button>
                  <button mat-button matStepperNext [disabled]="getContactGroup().invalid">
                    <span>Next: Subject Selection</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 4: Subject Selection -->
            <mat-step [stepControl]="getSubjectsGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>library_books</mat-icon>
                  Subjects (Min 3)
                </span>
              </ng-template>

              <form [formGroup]="getSubjectsGroup()" class="step-form">
                <div class="subjects-info">
                  <p class="info-text">
                    <mat-icon>info</mat-icon>
                    Select your subjects based on your stream. Your school will have configured the available subjects.
                  </p>
                </div>

                <div class="subjects-grid">
                  @for (subject of availableSubjects(); track subject.id) {
                    <div class="subject-checkbox">
                      <mat-form-field>
                        <mat-checkbox 
                          [formControl]="getSubjectControl(subject.id)" 
                          class="subject-item">
                          {{ subject.name }}
                          <span class="subject-code">({{ subject.code }})</span>
                        </mat-checkbox>
                      </mat-form-field>
                    </div>
                  }
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    <span>Back</span>
                  </button>
                  <button mat-button matStepperNext [disabled]="getSubjectsGroup().invalid">
                    <span>Next: Review & Submit</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 5: Review & Submit -->
            <mat-step [editable]="false">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>check_circle</mat-icon>
                  Review
                </span>
              </ng-template>

              <div class="review-form">
                <div class="review-section">
                  <h3 class="review-title">Personal Information</h3>
                  <div class="review-item">
                    <span class="label">Name:</span>
                    <span class="value">{{ form.get('personalGroup.studentName')?.value }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Date of Birth:</span>
                    <span class="value">{{ form.get('personalGroup.dob')?.value | date }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Category:</span>
                    <span class="value">{{ form.get('personalGroup.category')?.value }}</span>
                  </div>
                </div>

                <div class="review-section">
                  <h3 class="review-title">Academic Details</h3>
                  <div class="review-item">
                    <span class="label">Stream:</span>
                    <span class="value">{{ form.get('academicGroup.stream')?.value }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Medium:</span>
                    <span class="value">{{ form.get('academicGroup.medium')?.value }}</span>
                  </div>
                </div>

                <div class="review-section">
                  <h3 class="review-title">Selected Subjects</h3>
                  <div class="review-item">
                    <ul class="subject-list">
                      @for (subject of selectedSubjectsDisplay(); track subject.id) {
                        <li>{{ subject.name }} ({{ subject.code }})</li>
                      }
                    </ul>
                  </div>
                </div>

                <div class="warning-box">
                  <mat-icon class="warning-icon">info</mat-icon>
                  <div>
                    <p><strong>Important:</strong> Please review all information carefully. You will need to pay the exam fee (₹500) after submitting.</p>
                  </div>
                </div>

                <div class="step-actions final-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    <span>Back to Edit</span>
                  </button>
                  <button mat-flat-button color="accent" (click)="submit()" [disabled]="submitting() || !form.valid">
                    <mat-icon>payment</mat-icon>
                    {{ submitting() ? 'Processing...' : 'Submit & Pay Exam Fee' }}
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card>

        <!-- Floating Save Status -->
        @if (saveStatus()) {
          <div class="save-toast" [ngClass]="'status-' + saveStatus()">
            <mat-icon>{{ saveStatus() === 'success' ? 'check_circle' : 'error' }}</mat-icon>
            <span>{{ saveMessage() }}</span>
          </div>
        }
      </div>
    } @else {
      <mat-card class="card">
        <div class="loading">
          <mat-icon class="loading-spinner">hourglass_empty</mat-icon>
          <p>Loading application...</p>
        </div>
      </mat-card>
    }
  `,
  styles: [`
    .application-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px 0;
      display: grid;
      gap: 20px;
    }

    .header-card {
      padding: 20px;
      box-shadow: var(--card-shadow);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .app-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .app-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }

    .app-status.status-draft {
      background: #fef3c7;
      color: #92400e;
    }

    .app-status.status-submitted {
      background: #dbeafe;
      color: #082f4a;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .last-saved {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #059669;
    }

    .check-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .back-btn {
      white-space: nowrap;
    }

    .autosave-progress {
      height: 2px;
    }

    .form-card {
      padding: 20px;
      box-shadow: var(--card-shadow);
    }

    .form-stepper {
      max-width: 100%;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .step-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .step-form {
      padding: 20px 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .step-actions button {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .step-actions.final-actions {
      justify-content: flex-end;
    }

    .subjects-info {
      background: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .info-text {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #082f4a;
    }

    .info-text mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .subject-item {
      display: flex;
      align-items: center;
    }

    .subject-code {
      font-size: 0.8rem;
      color: #64748b;
      margin-left: 4px;
    }

    .review-form {
      padding: 20px 0;
    }

    .review-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .review-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 0.9rem;
    }

    .review-item .label {
      font-weight: 600;
      color: #475569;
    }

    .review-item .value {
      color: #0f172a;
    }

    .subject-list {
      margin: 0;
      padding-left: 20px;
    }

    .subject-list li {
      margin-bottom: 6px;
      color: #0f172a;
    }

    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 20px 0;
      display: flex;
      gap: 12px;
    }

    .warning-icon {
      color: #d97706;
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .warning-box p {
      margin: 0;
      font-size: 0.9rem;
      color: #92400e;
    }

    .save-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      animation: slideInUp 0.3s ease;
      z-index: 1000;
    }

    .save-toast.status-success {
      background: #d1fae5;
      color: #047857;
    }

    .save-toast.status-error {
      background: #fee2e2;
      color: #dc2626;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .loading-spinner {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 16px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .application-container {
        padding: 0;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column;
      }

      .step-actions button {
        width: 100%;
      }

      .subjects-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentApplicationEditComponent implements OnInit, OnDestroy {
  applicationId = signal<number | null>(null);
  application = signal<any>(null);
  form!: FormGroup;
  saving = signal(false);
  submitting = signal(false);
  autoSaveProgress = signal(0);
  saveStatus = signal<'success' | 'error' | null>(null);
  saveMessage = signal('');
  lastSaved = signal<Date | null>(null);
  availableSubjects = signal<SubjectInfo[]>([]);

  private destroy$ = new RxSubject<void>();
  private autoSaveTimer$ = new RxSubject<void>();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.applicationId.set(params['id']);
      this.loadApplication();
    });

    // Auto-save on form changes (debounced)
    this.form.valueChanges
      .pipe(
        debounceTime(3000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.autoSave();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper methods to safely get form groups for template binding
  getPersonalGroup(): FormGroup {
    return this.form?.get('personalGroup') as FormGroup;
  }

  getAcademicGroup(): FormGroup {
    return this.form?.get('academicGroup') as FormGroup;
  }

  getContactGroup(): FormGroup {
    return this.form?.get('contactGroup') as FormGroup;
  }

  getSubjectsGroup(): FormGroup {
    return this.form?.get('subjectsGroup') as FormGroup;
  }

  private loadApplication() {
    this.http.get(`${API_BASE_URL}/applications/${this.applicationId()}`).subscribe({
      next: (res: any) => {
        this.application.set(res.application);
        this.initForm(res.application);
        this.loadSubjects();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load application';
        console.error('Failed to load application:', errorMsg);
        this.showToast('error', `Failed to load: ${errorMsg}`);
      }
    });
  }

  private initForm(app: any) {
    this.form = new FormGroup({
      personalGroup: new FormGroup({
        studentName: new FormControl(app.studentName || '', Validators.required),
        dob: new FormControl(app.dob || '', Validators.required),
        fatherName: new FormControl(app.fatherName || '', Validators.required),
        motherName: new FormControl(app.motherName || '', Validators.required),
        gender: new FormControl(app.gender || '', Validators.required),
        category: new FormControl(app.category || '', Validators.required)
      }),
      academicGroup: new FormGroup({
        stream: new FormControl(app.stream || '', Validators.required),
        medium: new FormControl(app.medium || '', Validators.required)
      }),
      contactGroup: new FormGroup({
        address: new FormControl(app.address || '', Validators.required),
        city: new FormControl(app.city || '', Validators.required),
        pin: new FormControl(app.pin || '', [Validators.required, Validators.pattern('[0-9]{6}')]),
        mobile: new FormControl(app.mobile || '', [Validators.required, Validators.pattern('[0-9]{10}')]),
        email: new FormControl(app.email || '', [Validators.required, Validators.email])
      }),
      subjectsGroup: new FormGroup({})
    });
  }

  private loadSubjects() {
    const stream = this.form.get('academicGroup.stream')?.value;
    this.http.get(`${API_BASE_URL}/subjects?stream=${stream || 'SCIENCE'}`).subscribe({
      next: (res: any) => {
        this.availableSubjects.set(res.subjects || []);
        this.updateSubjectCheckboxes();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load subjects';
        console.error('Failed to load subjects:', errorMsg);
        this.showToast('error', `Failed to load subjects: ${errorMsg}`);
      }
    });
  }

  private updateSubjectCheckboxes() {
    const subjectsGroup = this.form.get('subjectsGroup') as FormGroup;
    subjectsGroup.reset({}, { emitEvent: false });

    this.availableSubjects().forEach(subject => {
      subjectsGroup.addControl(
        `subject_${subject.id}`,
        new FormControl(false)
      );
    });
  }

  onStreamChange() {
    this.loadSubjects();
  }

  getSubjectControl(subjectId: number) {
    return this.form.get(`subjectsGroup.subject_${subjectId}`) as FormControl;
  }

  selectedSubjectsDisplay() {
    const selected: SubjectInfo[] = [];
    const subjectsGroup = this.form.get('subjectsGroup') as FormGroup;

    this.availableSubjects().forEach(subject => {
      if (subjectsGroup.get(`subject_${subject.id}`)?.value) {
        selected.push(subject);
      }
    });

    return selected;
  }

  private autoSave() {
    this.autoSaveProgress.set(30);
    
    const payload = {
      ...this.form.get('personalGroup')?.value,
      ...this.form.get('academicGroup')?.value,
      ...this.form.get('contactGroup')?.value,
      selectedSubjects: this.selectedSubjectsDisplay().map(s => s.id)
    };

    this.http.put(`${API_BASE_URL}/applications/${this.applicationId()}`, payload).subscribe({
      next: () => {
        this.autoSaveProgress.set(100);
        this.lastSaved.set(new Date());
        this.showToast('success', 'Saved automatically');
        setTimeout(() => this.autoSaveProgress.set(0), 500);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to auto-save';
        console.error('Auto-save failed:', errorMsg);
        this.showToast('error', `Auto-save failed: ${errorMsg}`);
      }
    });
  }

  save() {
    this.saving.set(true);
    const payload = {
      ...this.form.value,
      selectedSubjects: this.selectedSubjectsDisplay().map(s => s.id)
    };

    this.http.put(`${API_BASE_URL}/applications/${this.applicationId()}`, payload).subscribe({
      next: () => {
        this.lastSaved.set(new Date());
        this.showToast('success', 'Application saved successfully');
        this.saving.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save application';
        console.error('Save failed:', errorMsg);
        this.showToast('error', `Save failed: ${errorMsg}`);
        this.saving.set(false);
      }
    });
  }

  submit() {
    this.submitting.set(true);

    const payload = {
      ...this.form.value,
      selectedSubjects: this.selectedSubjectsDisplay().map(s => s.id),
      status: 'SUBMITTED'
    };

    this.http.put(`${API_BASE_URL}/applications/${this.applicationId()}`, payload).subscribe({
      next: () => {
        this.showToast('success', 'Application submitted successfully');
        this.submitting.set(false);
        // Redirect to payment
        this.router.navigate(['/app/student/applications', this.applicationId(), 'payment']);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to submit application';
        console.error('Submit failed:', errorMsg);
        this.showToast('error', `Submit failed: ${errorMsg}`);
        this.submitting.set(false);
      }
    });
  }

  private showToast(status: 'success' | 'error', message: string) {
    this.saveStatus.set(status);
    this.saveMessage.set(message);
    setTimeout(() => this.saveStatus.set(null), 3000);
  }
}
