import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { StudentProfileService, StudentProfile, SubjectMarks } from '../../core/student-profile.service';
import { I18nService } from '../../core/i18n.service';
import { InstituteService, Institute } from '../../core/institute.service';
import { AddSubjectMarkDialogComponent } from './add-subject-mark-dialog.component';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule
  ],
  template: `
    <div class="student-profile-container">
      <!-- Header -->
      <div class="profile-header">
        <h1>{{ i18n.t('studentProfile') }}</h1>
        <p class="subtitle">{{ i18n.t('manageYourDetailsForAutoFill') }}</p>
      </div>

      <!-- Loading State -->
      @if (isLoading$ | async) {
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ i18n.t('loadingProfile') }}</p>
        </div>
      }

      <!-- Error Message -->
      @if (error$ | async; as error) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          <p>{{ error }}</p>
        </div>
      }

      <!-- Profile Tabs -->
      @if (profile$ | async; as profile) {
        <mat-tab-group class="profile-tabs" [disabled]="(isLoading$ | async) || false">
          <!-- Personal Details Tab -->
          <mat-tab label="{{ i18n.t('personalDetails') }}">
            <ng-template mat-tab-label>
              <mat-icon>person</mat-icon>
              <span class="tab-label">{{ i18n.t('personalDetails') }}</span>
            </ng-template>

            <form [formGroup]="personalForm" class="form-section">
              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('firstName') }}</mat-label>
                  <input matInput formControlName="firstName" required />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('lastName') }}</mat-label>
                  <input matInput formControlName="lastName" required />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>Middle Name</mat-label>
                  <input matInput formControlName="middleName" />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>Mother's Name</mat-label>
                  <input matInput formControlName="motherName" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('email') }}</mat-label>
                  <input matInput formControlName="email" required />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('mobile') }}</mat-label>
                  <input matInput formControlName="mobile" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>Institute *</mat-label>
                  <mat-select formControlName="instituteId" required>
                    <mat-option value="">- Select Institute -</mat-option>
                    @for (institute of institutes$ | async; track institute.id) {
                      <mat-option [value]="institute.id">{{ institute.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('aadharNumber') }}</mat-label>
                  <input matInput formControlName="aadharNumber" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('rollNumber') }}</mat-label>
                  <input matInput formControlName="rollNumber" />
                </mat-form-field>
                <mat-form-field class="form-field"></mat-form-field>
              </div>

              <mat-form-field class="form-field-full">
                <mat-label>{{ i18n.t('address') }}</mat-label>
                <textarea matInput formControlName="address" rows="3"></textarea>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('city') }}</mat-label>
                  <input matInput formControlName="city" />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('state') }}</mat-label>
                  <input matInput formControlName="state" />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('pincode') }}</mat-label>
                  <input matInput formControlName="pincode" />
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="savePersonalDetails()" [disabled]="personalForm.invalid">
                  <mat-icon>save</mat-icon>
                  {{ i18n.t('saveChanges') }}
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- College Information Tab -->
          <mat-tab label="{{ i18n.t('collegeInfo') }}">
            <ng-template mat-tab-label>
              <mat-icon>school</mat-icon>
              <span class="tab-label">{{ i18n.t('collegeInfo') }}</span>
            </ng-template>

            <form [formGroup]="collegeForm" class="form-section">
              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('collegeName') }}</mat-label>
                  <input matInput formControlName="collegeName" required />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('collegeBranch') }}</mat-label>
                  <input matInput formControlName="collegeBranch" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('admissionYear') }}</mat-label>
                  <input matInput formControlName="admissionYear" type="number" />
                </mat-form-field>
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('stream') }}</mat-label>
                  <mat-select formControlName="stream">
                    <mat-option value="SCIENCE">{{ i18n.t('science') }}</mat-option>
                    <mat-option value="COMMERCE">{{ i18n.t('commerce') }}</mat-option>
                    <mat-option value="ARTS">{{ i18n.t('arts') }}</mat-option>
                    <mat-option value="VOCATIONAL">{{ i18n.t('vocational') }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field class="form-field-full">
                <mat-label>{{ i18n.t('board') }}</mat-label>
                <mat-select formControlName="board">
                  <mat-option value="MSBSHSE">Maharashtra State Board</mat-option>
                  <mat-option value="CBSE">CBSE</mat-option>
                  <mat-option value="ICSE">ICSE</mat-option>
                  <mat-option value="OTHER">{{ i18n.t('other') }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveCollegeInfo()" [disabled]="collegeForm.invalid">
                  <mat-icon>save</mat-icon>
                  {{ i18n.t('saveChanges') }}
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- Subject Marks Tab -->
          <mat-tab label="{{ i18n.t('subjectMarks') }}">
            <ng-template mat-tab-label>
              <mat-icon>book</mat-icon>
              <span class="tab-label">{{ i18n.t('subjectMarks') }}</span>
            </ng-template>

          <div class="subjects-section">
            <div class="section-header">
              <h3>{{ i18n.t('freshAdmission') }}</h3>
              <button mat-raised-button color="accent" (click)="openAddSubjectDialog(false)">
                <mat-icon>add</mat-icon>
                {{ i18n.t('addSubject') }}
              </button>
            </div>

            <table mat-table [dataSource]="freshSubjects$ | async" class="subject-table">
              <!-- Subject Name Column -->
              <ng-container matColumnDef="subjectName">
                <th mat-header-cell>{{ i18n.t('subjectName') }}</th>
                <td mat-cell data-cell="subjectName">{{ row.subjectName }}</td>
              </ng-container>

              <!-- Max Marks Column -->
              <ng-container matColumnDef="maxMarks">
                <th mat-header-cell>{{ i18n.t('maxMarks') }}</th>
                <td mat-cell data-cell="maxMarks">{{ row.maxMarks }}</td>
              </ng-container>

              <!-- Obtained Marks Column -->
              <ng-container matColumnDef="obtainedMarks">
                <th mat-header-cell>{{ i18n.t('obtainedMarks') }}</th>
                <td mat-cell data-cell="obtainedMarks">{{ row.obtainedMarks }}</td>
              </ng-container>

              <!-- Percentage Column -->
              <ng-container matColumnDef="percentage">
                <th mat-header-cell>{{ i18n.t('percentage') }}</th>
                <td mat-cell data-cell="percentage">
                  {{ (row.obtainedMarks / row.maxMarks * 100) | number : '1.0-0' }}%
                </td>
              </ng-container>

              <!-- Grade Column -->
              <ng-container matColumnDef="grade">
                <th mat-header-cell>{{ i18n.t('grade') }}</th>
                <td mat-cell data-cell="grade">{{ row.grade }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell>{{ i18n.t('actions') }}</th>
                <td mat-cell data-cell="actions">
                  <button mat-icon-button color="warn" (click)="removeSubject(row.subjectId)" [attr.aria-label]="i18n.t('delete')">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (!(freshSubjects$ | async) || (freshSubjects$ | async)?.length === 0) {
              <p class="no-data">{{ i18n.t('noSubjectsAdded') }}</p>
            }
          </div>

          <div class="subjects-section">
            <div class="section-header">
              <h3>{{ i18n.t('backlogSubjects') }}</h3>
              <button mat-raised-button color="accent" (click)="openAddSubjectDialog(true)">
                <mat-icon>add</mat-icon>
                {{ i18n.t('addBacklogSubject') }}
              </button>
            </div>

            <table mat-table [dataSource]="backlogSubjects$ | async" class="subject-table">
              <!-- Same columns as fresh subjects table -->
              <ng-container matColumnDef="subjectName">
                <th mat-header-cell>{{ i18n.t('subjectName') }}</th>
                <td mat-cell data-cell="subjectName">{{ row.subjectName }}</td>
              </ng-container>

              <ng-container matColumnDef="maxMarks">
                <th mat-header-cell>{{ i18n.t('maxMarks') }}</th>
                <td mat-cell data-cell="maxMarks">{{ row.maxMarks }}</td>
              </ng-container>

              <ng-container matColumnDef="obtainedMarks">
                <th mat-header-cell>{{ i18n.t('obtainedMarks') }}</th>
                <td mat-cell data-cell="obtainedMarks">{{ row.obtainedMarks }}</td>
              </ng-container>

              <ng-container matColumnDef="percentage">
                <th mat-header-cell>{{ i18n.t('percentage') }}</th>
                <td mat-cell data-cell="percentage">
                  {{ (row.obtainedMarks / row.maxMarks * 100) | number : '1.0-0' }}%
                </td>
              </ng-container>

              <ng-container matColumnDef="grade">
                <th mat-header-cell>{{ i18n.t('grade') }}</th>
                <td mat-cell data-cell="grade">{{ row.grade }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell>{{ i18n.t('actions') }}</th>
                <td mat-cell data-cell="actions">
                  <button mat-icon-button color="warn" (click)="removeSubject(row.subjectId)" [attr.aria-label]="i18n.t('delete')">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (!(backlogSubjects$ | async) || (backlogSubjects$ | async)?.length === 0) {
              <p class="no-data">{{ i18n.t('noBacklogSubjectsAdded') }}</p>
            }
          </div>
        </mat-tab>

        <!-- Summary Tab -->
        <mat-tab label="{{ i18n.t('summary') }}">
          <ng-template mat-tab-label>
            <mat-icon>summarize</mat-icon>
            <span class="tab-label">{{ i18n.t('summary') }}</span>
          </ng-template>

          <div class="summary-section">
            <mat-card class="summary-card">
              <mat-card-header>
                <mat-card-title>{{ i18n.t('profileSummary') }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="summary-rows">
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('name') }}:</span>
                    <span class="value">{{ profile.firstName }} {{ profile.lastName }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('email') }}:</span>
                    <span class="value">{{ profile.email }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('mobile') }}:</span>
                    <span class="value">{{ profile.mobile || '-' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('collegeName') }}:</span>
                    <span class="value">{{ profile.collegeName || '-' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('stream') }}:</span>
                    <span class="value">{{ profile.stream || '-' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('freshSubjects') }}:</span>
                    <span class="value">{{ (freshSubjects$ | async)?.length || 0 }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">{{ i18n.t('backlogSubjects') }}:</span>
                    <span class="value">{{ (backlogSubjects$ | async)?.length || 0 }}</span>
                  </div>
                  @if (averagePercentage > 0) {
                    <div class="summary-row">
                      <span class="label">{{ i18n.t('averagePercentage') }}:</span>
                      <span class="value">{{ averagePercentage | number : '1.0-0' }}%</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .student-profile-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .profile-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .profile-header h1 {
      font-size: 2rem;
      color: #333;
      margin: 0;
    }

    .profile-header .subtitle {
      font-size: 1rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .loading-state,
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
    }

    .error-message {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
    }

    .error-message mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .profile-tabs {
      margin-top: 2rem;
    }

    .tab-label {
      margin-left: 0.5rem;
    }

    .form-section {
      padding: 2rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-field {
      width: 100%;
    }

    .form-field-full {
      width: 100%;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      justify-content: flex-end;
    }

    .form-actions button {
      min-width: 120px;
    }

    .subjects-section {
      padding: 2rem 0;
      border-top: 1px solid #e0e0e0;
    }

    .subjects-section:first-child {
      border-top: none;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
    }

    .subject-table {
      width: 100%;
      margin-bottom: 1rem;
    }

    .subject-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      padding: 1rem;
    }

    .subject-table td {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .summary-section {
      padding: 2rem;
    }

    .summary-card {
      margin-bottom: 2rem;
    }

    .summary-rows {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      background-color: #f9f9f9;
      border-radius: 4px;
    }

    .summary-row .label {
      font-weight: 600;
      color: #333;
    }

    .summary-row .value {
      color: #666;
    }

    @media (max-width: 768px) {
      .student-profile-container {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .subject-table th,
      .subject-table td {
        padding: 0.5rem;
        font-size: 0.9rem;
      }

      .summary-rows {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly profileService = inject(StudentProfileService);
  private readonly instituteService = inject(InstituteService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Signals converted to Observables
  readonly profile$ = toObservable(this.profileService.profile$);
  readonly isLoading$ = toObservable(this.profileService.isLoading$);
  readonly error$ = toObservable(this.profileService.error$);
  readonly institutes$ = this.instituteService.getApprovedInstitutes();

  freshSubjects$ = toObservable(this.profileService.profile$).pipe(
    map((profile: any) => (profile?.freshSubjects || []) as any[])
  );
  backlogSubjects$ = toObservable(this.profileService.profile$).pipe(
    map((profile: any) => (profile?.backlogSubjects || []) as any[])
  );
  
  displayedColumns = ['subjectName', 'maxMarks', 'obtainedMarks', 'percentage', 'grade', 'actions'];
  averagePercentage = 0;

  personalForm: FormGroup;
  collegeForm: FormGroup;

  constructor() {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      middleName: [''],
      motherName: [''],
      email: ['', [Validators.required, Validators.email]],
      mobile: [''],
      dateOfBirth: [''],
      gender: [''],
      aadharNumber: [''],
      rollNumber: [''],
      address: [''],
      city: [''],
      state: [''],
      pincode: [''],
      instituteId: ['', [Validators.required]]
    });

    this.collegeForm = this.fb.group({
      collegeName: ['', [Validators.required]],
      collegeBranch: [''],
      admissionYear: [''],
      stream: [''],
      board: ['']
    });
  }

  ngOnInit() {
    // Subscribe to profile changes and update forms
    this.profile$.subscribe((profile: StudentProfile | null) => {
      if (profile) {
        this.personalForm.patchValue(profile);
        this.collegeForm.patchValue(profile);
        this.averagePercentage = this.profileService.getAveragePercentage();
      }
    });
  }

  savePersonalDetails() {
    if (this.personalForm.valid) {
      this.profileService.updatePersonalDetails(this.personalForm.value);
      this.snackBar.open(this.i18n.t('changesSaved'), '', { duration: 3000 });
    }
  }

  saveCollegeInfo() {
    if (this.collegeForm.valid) {
      this.profileService.updateCollegeInfo(this.collegeForm.value);
      this.snackBar.open(this.i18n.t('changesSaved'), '', { duration: 3000 });
    }
  }

  openAddSubjectDialog(isBacklog: boolean) {
    const dialogRef = this.dialog.open(AddSubjectMarkDialogComponent, {
      width: '500px',
      data: { isBacklog }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.profileService.addSubjectMarks(result);
        this.snackBar.open(this.i18n.t('subjectAdded'), '', { duration: 3000 });
      }
    });
  }

  removeSubject(subjectId: number) {
    if (confirm(this.i18n.t('confirmDelete'))) {
      this.profileService.removeSubjectMarks(subjectId);
      this.snackBar.open(this.i18n.t('subjectRemoved'), '', { duration: 3000 });
    }
  }
}
