import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { StudentProfileService, StudentProfile, SubjectMarks } from '../../core/student-profile.service';
import { I18nService } from '../../core/i18n.service';
import { InstituteService } from '../../core/institute.service';
import { AddSubjectMarkDialogComponent } from './add-subject-mark-dialog.component';
import { StudentImageUploadComponent } from '../../components/student-image-upload/student-image-upload.component';

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
    MatDialogModule,
    RouterModule,
    StudentImageUploadComponent
  ],
  template: `
    <div class="student-profile-container">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="header-content">
          <h1>{{ i18n.t('studentProfile') }}</h1>
          <p class="subtitle">{{ i18n.t('manageYourDetailsForAutoFill') }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner-wrapper">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ i18n.t('loadingProfile') }}</p>
        </div>
      </div>

      <!-- Error Message - Institute Not Selected -->
      <div class="error-banner" *ngIf="error && error.includes('institute') && !isLoading" style="background-color: #fff3cd; border-left-color: #ff9800;">
        <mat-icon style="color: #ff9800;">info</mat-icon>
        <div class="error-content">
          <h3 style="color: #ff9800;">Institute Selection Required</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" routerLink="/student/select-institute">
            <mat-icon>school</mat-icon>
            Select Institute & Stream
          </button>
        </div>
      </div>

      <!-- Error Message - Generic -->
      <div class="error-banner" *ngIf="error && !error.includes('institute') && !isLoading">
        <mat-icon>error_outline</mat-icon>
        <div class="error-content">
          <h3>Unable to Load Profile</h3>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="retryLoadProfile()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="profile-content" *ngIf="profile && !isLoading">
        <!-- Tabs Section -->
        <mat-tab-group class="profile-tabs">
          <!-- Personal Details Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>person</mat-icon>
              <span class="tab-label">{{ i18n.t('personalDetails') }}</span>
            </ng-template>

            <form [formGroup]="personalForm" class="form-section">
              <div class="profile-assets-grid">
                <app-student-image-upload
                  title="Photograph / छायाचित्र"
                  hint="Upload a clear passport-style photo. It will be cropped and compressed under 50 KB."
                  type="photo"
                  [imageUrl]="profile?.photoUrl || null"
                  [saving]="savingPhoto"
                  (saved)="handleProfileImageSaved($event)"
                  (removed)="handleProfileImageRemoved($event)">
                </app-student-image-upload>

                <app-student-image-upload
                  title="Student Signature / सही"
                  hint="Upload a clean signature on a plain background. It will be optimized for hall tickets."
                  type="signature"
                  [imageUrl]="profile?.signatureUrl || null"
                  [saving]="savingSignature"
                  (saved)="handleProfileImageSaved($event)"
                  (removed)="handleProfileImageRemoved($event)">
                </app-student-image-upload>
              </div>

              <div class="form-grid">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('firstName') }}</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="firstName" required />
                  <mat-error>First name is required</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('lastName') }}</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="lastName" required />
                  <mat-error>Last name is required</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Middle Name</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="middleName" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Mother's Name</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="motherName" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('email') }}</mat-label>
                  <mat-icon matPrefix>email</mat-icon>
                  <input matInput formControlName="email" required type="email" />
                  <mat-error>Valid email is required</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('mobile') }}</mat-label>
                  <mat-icon matPrefix>phone</mat-icon>
                  <input matInput formControlName="mobile" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Date of Birth</mat-label>
                  <mat-icon matPrefix>cake</mat-icon>
                  <input matInput formControlName="dateOfBirth" [matDatepicker]="picker" />
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Gender</mat-label>
                  <mat-icon matPrefix>wc</mat-icon>
                  <mat-select formControlName="gender">
                    <mat-option value="">- Select -</mat-option>
                    <mat-option value="MALE">Male</mat-option>
                    <mat-option value="FEMALE">Female</mat-option>
                    <mat-option value="OTHER">Other</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Aadhar Number</mat-label>
                  <mat-icon matPrefix>badge</mat-icon>
                  <input matInput formControlName="aadharNumber" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Roll Number</mat-label>
                  <mat-icon matPrefix>assignment</mat-icon>
                  <input matInput formControlName="rollNumber" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>Institute</mat-label>
                  <mat-icon matPrefix>school</mat-icon>
                  <mat-select formControlName="instituteId" required>
                    <mat-option value="">- Select Institute -</mat-option>
                    <mat-option *ngFor="let institute of institutes" [value]="institute.id">
                      {{ institute.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field class="form-field-full">
                <mat-label>{{ i18n.t('address') }}</mat-label>
                <mat-icon matPrefix>location_on</mat-icon>
                <textarea matInput formControlName="address" rows="3"></textarea>
              </mat-form-field>

              <div class="form-grid">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('city') }}</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="city" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('state') }}</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="state" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('pincode') }}</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="pincode" />
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="savePersonalDetails()" [disabled]="personalForm.invalid || savingPersonal">
                  <mat-icon *ngIf="!savingPersonal">save</mat-icon>
                  <mat-spinner *ngIf="savingPersonal" diameter="20"></mat-spinner>
                  <span *ngIf="!savingPersonal">{{ i18n.t('saveChanges') }}</span>
                  <span *ngIf="savingPersonal">Saving...</span>
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- College Information Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>school</mat-icon>
              <span class="tab-label">{{ i18n.t('collegeInfo') }}</span>
            </ng-template>

            <form [formGroup]="collegeForm" class="form-section">
              <div class="form-grid">
                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('collegeName') }}</mat-label>
                  <mat-icon matPrefix>school</mat-icon>
                  <input matInput formControlName="collegeName" required />
                  <mat-error>College name is required</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('collegeBranch') }}</mat-label>
                  <mat-icon matPrefix>account_balance</mat-icon>
                  <input matInput formControlName="collegeBranch" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('admissionYear') }}</mat-label>
                  <mat-icon matPrefix>calendar_today</mat-icon>
                  <input matInput formControlName="admissionYear" type="number" />
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('stream') }}</mat-label>
                  <mat-icon matPrefix>layers</mat-icon>
                  <mat-select formControlName="stream">
                    <mat-option value="">- Select -</mat-option>
                    <mat-option value="SCIENCE">{{ i18n.t('science') }}</mat-option>
                    <mat-option value="COMMERCE">{{ i18n.t('commerce') }}</mat-option>
                    <mat-option value="ARTS">{{ i18n.t('arts') }}</mat-option>
                    <mat-option value="VOCATIONAL">{{ i18n.t('vocational') }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field class="form-field">
                  <mat-label>{{ i18n.t('board') }}</mat-label>
                  <mat-icon matPrefix>domain</mat-icon>
                  <mat-select formControlName="board">
                    <mat-option value="">- Select -</mat-option>
                    <mat-option value="MSBSHSE">State Board</mat-option>
                    <mat-option value="CBSE">CBSE</mat-option>
                    <mat-option value="ICSE">ICSE</mat-option>
                    <mat-option value="OTHER">{{ i18n.t('other') }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveCollegeInfo()" [disabled]="collegeForm.invalid || savingCollege">
                  <mat-icon *ngIf="!savingCollege">save</mat-icon>
                  <mat-spinner *ngIf="savingCollege" diameter="20"></mat-spinner>
                  <span *ngIf="!savingCollege">{{ i18n.t('saveChanges') }}</span>
                  <span *ngIf="savingCollege">Saving...</span>
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- Subject Marks Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>book</mat-icon>
              <span class="tab-label">{{ i18n.t('subjectMarks') }}</span>
            </ng-template>

            <div class="subjects-content">
              <!-- Fresh Subjects -->
              <div class="subjects-section">
                <div class="section-header">
                  <h3>{{ i18n.t('freshAdmission') }}</h3>
                  <button mat-raised-button color="accent" (click)="openAddSubjectDialog(false)">
                    <mat-icon>add</mat-icon>
                    {{ i18n.t('addSubject') }}
                  </button>
                </div>

                <div class="table-container" *ngIf="freshSubjects && freshSubjects.length > 0">
                  <table class="subject-table">
                    <thead>
                      <tr>
                        <th>{{ i18n.t('subjectName') }}</th>
                        <th>{{ i18n.t('maxMarks') }}</th>
                        <th>{{ i18n.t('obtainedMarks') }}</th>
                        <th>%</th>
                        <th>{{ i18n.t('grade') }}</th>
                        <th>{{ i18n.t('actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let subject of freshSubjects">
                        <td>{{ subject.subjectName }}</td>
                        <td>{{ subject.maxMarks }}</td>
                        <td>{{ subject.obtainedMarks }}</td>
                        <td>{{ (subject.obtainedMarks / subject.maxMarks * 100) | number : '1.0-0' }}%</td>
                        <td>{{ subject.grade || '-' }}</td>
                        <td>
                          <button mat-icon-button color="warn" (click)="removeSubject(subject.subjectId)" title="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="no-data" *ngIf="!freshSubjects || freshSubjects.length === 0">
                  {{ i18n.t('noSubjectsAdded') }}
                </p>
              </div>

              <!-- Backlog Subjects -->
              <div class="subjects-section">
                <div class="section-header">
                  <h3>{{ i18n.t('backlogSubjects') }}</h3>
                  <button mat-raised-button color="accent" (click)="openAddSubjectDialog(true)">
                    <mat-icon>add</mat-icon>
                    {{ i18n.t('addBacklogSubject') }}
                  </button>
                </div>

                <div class="table-container" *ngIf="backlogSubjects && backlogSubjects.length > 0">
                  <table class="subject-table">
                    <thead>
                      <tr>
                        <th>{{ i18n.t('subjectName') }}</th>
                        <th>{{ i18n.t('maxMarks') }}</th>
                        <th>{{ i18n.t('obtainedMarks') }}</th>
                        <th>%</th>
                        <th>{{ i18n.t('grade') }}</th>
                        <th>{{ i18n.t('actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let subject of backlogSubjects">
                        <td>{{ subject.subjectName }}</td>
                        <td>{{ subject.maxMarks }}</td>
                        <td>{{ subject.obtainedMarks }}</td>
                        <td>{{ (subject.obtainedMarks / subject.maxMarks * 100) | number : '1.0-0' }}%</td>
                        <td>{{ subject.grade || '-' }}</td>
                        <td>
                          <button mat-icon-button color="warn" (click)="removeSubject(subject.subjectId)" title="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="no-data" *ngIf="!backlogSubjects || backlogSubjects.length === 0">
                  {{ i18n.t('noBacklogSubjectsAdded') }}
                </p>
              </div>
            </div>
          </mat-tab>

          <!-- Summary Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>summarize</mat-icon>
              <span class="tab-label">{{ i18n.t('summary') }}</span>
            </ng-template>

            <div class="summary-content">
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <mat-icon>person</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('name') }}</label>
                        <span>{{ profile.firstName }} {{ profile.lastName }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>email</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('email') }}</label>
                        <span>{{ profile.email }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>phone</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('mobile') }}</label>
                        <span>{{ profile.mobile || '-' }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>school</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('collegeName') }}</label>
                        <span>{{ profile.collegeName || '-' }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>layers</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('stream') }}</label>
                        <span>{{ profile.stream || '-' }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>book</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('freshSubjects') }}</label>
                        <span>{{ freshSubjects?.length || 0 }}</span>
                      </div>
                    </div>

                    <div class="summary-item">
                      <mat-icon>bookmark</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('backlogSubjects') }}</label>
                        <span>{{ backlogSubjects?.length || 0 }}</span>
                      </div>
                    </div>

                    <div class="summary-item" *ngIf="averagePercentage > 0">
                      <mat-icon>trending_up</mat-icon>
                      <div class="summary-text">
                        <label>{{ i18n.t('averagePercentage') }}</label>
                        <span>{{ averagePercentage | number : '1.0-0' }}%</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .student-profile-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Header Section */
    .profile-header {
      text-align: center;
      color: white;
      margin-bottom: 2rem;
      animation: slideDown 0.6s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .header-content .subtitle {
      font-size: 1.1rem;
      opacity: 0.95;
      margin: 0;
      font-weight: 300;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .spinner-wrapper {
      text-align: center;
      color: white;
    }

    .spinner-wrapper mat-spinner {
      margin: 0 auto 1rem;
    }

    .spinner-wrapper p {
      font-size: 1rem;
      margin: 0;
    }

    /* Error Banner */
    .error-banner {
      max-width: 700px;
      margin: 0 auto 2rem;
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-left: 5px solid #f44336;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-banner mat-icon {
      color: #f44336;
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      margin-top: 0.2rem;
    }

    .error-content h3 {
      margin: 0 0 0.5rem 0;
      color: #f44336;
      font-size: 1.1rem;
    }

    .error-content p {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.95rem;
    }

    /* Profile Content */
    .profile-content {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.6s ease-out 0.1s both;
    }

    .profile-tabs {
      padding: 0;
    }

    .tab-label {
      margin-left: 0.75rem;
      font-weight: 500;
    }

    /* Form Section */
    .form-section {
      padding: 2.5rem;
    }

    .profile-assets-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-field {
      width: 100%;
    }

    .form-field-full {
      width: 100%;
      margin-bottom: 1.5rem;
    }

    mat-form-field {
      display: block;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      justify-content: flex-end;
    }

    .form-actions button {
      min-width: 140px;
      height: 44px;
    }

    /* Subjects Section */
    .subjects-content {
      padding: 2.5rem;
    }

    .subjects-section {
      margin-bottom: 2.5rem;
    }

    .subjects-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }

    .subject-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .subject-table thead th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
    }

    .subject-table tbody td {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      color: #333;
    }

    .subject-table tbody tr:hover {
      background-color: #f9f9f9;
    }

    .subject-table button {
      padding: 0.5rem;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #999;
      font-size: 1rem;
    }

    /* Summary Content */
    .summary-content {
      padding: 2.5rem;
    }

    .summary-card {
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }

    .summary-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .summary-item mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .summary-text {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .summary-text label {
      color: #666;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-text span {
      color: #333;
      font-size: 1rem;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .student-profile-container {
        padding: 1rem;
      }

      .header-content h1 {
        font-size: 1.8rem;
      }

      .header-content .subtitle {
        font-size: 1rem;
      }

      .profile-content {
        border-radius: 8px;
      }

      .form-section,
      .subjects-content,
      .summary-content {
        padding: 1.5rem;
      }

      .profile-assets-grid,
      .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .table-container {
        font-size: 0.85rem;
      }

      .subject-table thead th,
      .subject-table tbody td {
        padding: 0.75rem;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .student-profile-container {
        padding: 0.75rem;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .header-content .subtitle {
        font-size: 0.95rem;
      }

      .tab-label {
        display: none;
      }

      .form-section,
      .subjects-content,
      .summary-content {
        padding: 1rem;
      }

      .section-header {
        margin-bottom: 1rem;
      }

      .section-header h3 {
        font-size: 1rem;
      }

      .error-banner {
        flex-direction: column;
        margin-bottom: 1rem;
      }

      .error-content button {
        width: 100%;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly profileService = inject(StudentProfileService);
  private readonly instituteService = inject(InstituteService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();

  profile: StudentProfile | null = null;
  institutes: any[] = [];
  freshSubjects: SubjectMarks[] = [];
  backlogSubjects: SubjectMarks[] = [];
  averagePercentage = 0;

  isLoading = true;
  error: string | null = null;
  savingPersonal = false;
  savingCollege = false;
  savingPhoto = false;
  savingSignature = false;

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
    this.loadProfile();
    this.loadInstitutes();
  }

  loadProfile() {
    this.isLoading = true;
    this.error = null;

    this.profileService.loadProfile()
      .then((profile: StudentProfile|any) => {
        this.profile = profile;
        this.freshSubjects = (profile.subjects || []).filter((s: any) => !s.isBacklog);
        this.backlogSubjects = (profile.subjects || []).filter((s: any) => s.isBacklog);
        
        this.personalForm.patchValue(profile);
        this.collegeForm.patchValue(profile);
        
        this.averagePercentage = this.profileService.getAveragePercentage();
        this.isLoading = false;
      })
      .catch((err: any) => {
        console.error('Failed to load profile:', err);
        
        // Extract error code from multiple possible locations
        const errorCode = err?.error?.error || err?.error?.status || err?.message || '';
        const serverMessage = err?.error?.message || err?.message || '';
        
        // Determine the error type and appropriate message
        let errorMsg = 'Failed to load profile. Please try again.';
        
        // Check if this is specifically an institute not selected error
        if (
          errorCode === 'INSTITUTE_NOT_SELECTED' || 
          errorCode?.includes('INSTITUTE') ||
          serverMessage?.includes('institute') ||
          !this.profile // If profile couldn't be loaded at all
        ) {
          errorMsg = 'Please select your institute and stream first before completing your profile.';
        } else if (errorCode === 'STUDENT_PROFILE_MISSING' || errorCode === 404) {
          errorMsg = 'Please select your institute and stream first before completing your profile.';
        } else {
          // Generic error
          errorMsg = err?.error?.message || 'Failed to load profile. Please try again.';
        }
        
        this.error = errorMsg;
        this.isLoading = false;
      });
  }

  loadInstitutes() {
    this.instituteService.getApprovedInstitutes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institutes: any[]) => {
          this.institutes = institutes;
        },
        error: (err) => {
          console.error('Failed to load institutes:', err);
        }
      });
  }

  retryLoadProfile() {
    this.loadProfile();
  }

  savePersonalDetails() {
    if (this.personalForm.valid) {
      this.savingPersonal = true;
      this.profileService.updatePersonalDetails(this.personalForm.value);
      setTimeout(() => {
        this.savingPersonal = false;
        this.snackBar.open('✓ Personal details saved successfully', '', { duration: 3000 });
      }, 1500);
    }
  }

  saveCollegeInfo() {
    if (this.collegeForm.valid) {
      this.savingCollege = true;
      this.profileService.updateCollegeInfo(this.collegeForm.value);
      setTimeout(() => {
        this.savingCollege = false;
        this.snackBar.open('✓ College information saved successfully', '', { duration: 3000 });
      }, 1500);
    }
  }

  async handleProfileImageSaved(event: { type: 'photo' | 'signature'; dataUrl: string; sizeKB: number }) {
    const isPhoto = event.type === 'photo';
    if (isPhoto) {
      this.savingPhoto = true;
    } else {
      this.savingSignature = true;
    }

    try {
      const response = await this.profileService.uploadProfileAsset(event.type, event.dataUrl);
      this.profile = {
        ...(this.profile || {}),
        ...response.student,
        [isPhoto ? 'photoUrl' : 'signatureUrl']: response.url
      } as StudentProfile;
      this.snackBar.open(`✓ ${isPhoto ? 'Photograph' : 'Signature'} saved (${event.sizeKB.toFixed(1)} KB)`, '', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message || `Failed to save ${isPhoto ? 'photograph' : 'signature'}.`, '', { duration: 4000 });
    } finally {
      if (isPhoto) {
        this.savingPhoto = false;
      } else {
        this.savingSignature = false;
      }
    }
  }

  async handleProfileImageRemoved(type: 'photo' | 'signature') {
    const isPhoto = type === 'photo';
    if (isPhoto) {
      this.savingPhoto = true;
    } else {
      this.savingSignature = true;
    }

    try {
      await this.profileService.removeProfileAsset(type);
      if (this.profile) {
        this.profile = {
          ...this.profile,
          [isPhoto ? 'photoUrl' : 'signatureUrl']: null
        } as StudentProfile;
      }
      this.snackBar.open(`✓ ${isPhoto ? 'Photograph' : 'Signature'} removed`, '', { duration: 2500 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message || `Failed to remove ${isPhoto ? 'photograph' : 'signature'}.`, '', { duration: 4000 });
    } finally {
      if (isPhoto) {
        this.savingPhoto = false;
      } else {
        this.savingSignature = false;
      }
    }
  }

  openAddSubjectDialog(isBacklog: boolean) {
    const dialogRef = this.dialog.open(AddSubjectMarkDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { isBacklog },
      panelClass: 'subject-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: any) => {
        if (result) {
          this.profileService.addSubjectMarks(result);
          this.snackBar.open('✓ Subject added successfully', '', { duration: 3000 });
          
          // Reload profile to get updated subjects
          setTimeout(() => {
            this.loadProfile();
          }, 500);
        }
      });
  }

  removeSubject(subjectId: number) {
    if (confirm('Are you sure you want to delete this subject?')) {
      this.profileService.removeSubjectMarks(subjectId);
      this.snackBar.open('✓ Subject removed successfully', '', { duration: 3000 });
      
      // Reload profile to get updated subjects
      setTimeout(() => {
        this.loadProfile();
      }, 500);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
