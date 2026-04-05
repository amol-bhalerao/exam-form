import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InstituteSearchModalComponent } from '../../../components/institute-search-modal/institute-search-modal.component';

import { API_BASE_URL } from '../../../core/api';

type Subject = { id: number; code: string; name: string; category?: string; answerLanguageCode?: string | null; mappingId?: number };

@Component({
  selector: 'app-student-application-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatStepperModule,
    MatIconModule,
    MatProgressBarModule,
    DatePipe,
    InstituteSearchModalComponent
  ],
  template: `
    @if (loading()) {
      <mat-card class="card">
        <div class="loading-indicator">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading application...</p>
        </div>
      </mat-card>
    }

    @if (error()) {
      <mat-card class="card error-card">
        <div class="error-message">
          <mat-icon>error_outline</mat-icon>
          <div>
            <strong>Error:</strong> {{ error() }}
          </div>
        </div>
      </mat-card>
    }

    @if (application()) {
      <div class="application-container">
        <!-- Header Card -->
        <mat-card class="header-card">
          <div class="header-row">
            <div>
              <h2 class="app-title">Application {{ application()!.applicationNo }}</h2>
              <div class="app-status" [ngClass]="getStatusClass()">
                {{ application()!.status }}
              </div>
            </div>
            <div class="grow"></div>
            <a mat-stroked-button [routerLink]="['/app/student/forms', application()!.id, 'print']" target="_blank">
              <mat-icon>print</mat-icon> Print
            </a>
          </div>
        </mat-card>

        <!-- Multi-Step Form -->
        <mat-card class="form-card">
          <p class="stepper-help">Complete each step below for institute, exam, personal details, academic details, and subjects before submitting.</p>
          <mat-stepper #stepper [linear]="false" class="application-stepper">
            <!-- Step 1: Institute & Reference -->
            <mat-step [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>apartment</mat-icon>
                  Institute
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Institute Information</h3>
                <p class="step-desc">Search and select your college/institute.</p>

                @if (selectedInstitute()) {
                  <div class="institute-card">
                    <div><strong>{{ selectedInstitute()!.name }}</strong></div>
                    <div>{{ selectedInstitute()!.address }}, {{ selectedInstitute()!.city }}</div>
                    <button mat-stroked-button class="mt-16" (click)="showInstitutePicker.set(true)">
                      <mat-icon>edit</mat-icon> Change
                    </button>
                  </div>
                } @else {
                  <button mat-raised-button class="block-button" (click)="showInstitutePicker.set(true)">
                    <mat-icon>search</mat-icon> Search Institute
                  </button>
                }

                <app-institute-search-modal
                  [visible]="showInstitutePicker()"
                  (visibleChange)="showInstitutePicker.set($event)"
                  (selected)="selectInstitute($event)">
                </app-institute-search-modal>

                <mat-divider class="my-24"></mat-divider>

                <h3 class="step-title">Reference Fields</h3>
                <mat-card class="info-card">
                  <mat-icon class="info-icon">verified</mat-icon>
                  <div>
                    <strong>Auto-filled by institute / board</strong>
                    <p>Index No, UDISE No, application serial number, and centre details should normally be set by the institute or system and are kept read-only for students.</p>
                  </div>
                </mat-card>

                <form [formGroup]="form">
                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>Index No (1a)</mat-label>
                      <input matInput formControlName="indexNo" [readonly]="true" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>UDISE No (1b)</mat-label>
                      <input matInput formControlName="udiseNo" [readonly]="true" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>Student Saral ID (1c)</mat-label>
                      <input matInput formControlName="studentSaralId" [readonly]="true" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>Appl.Sr.No (2a)</mat-label>
                      <input matInput formControlName="applSrNo" [readonly]="true" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>Centre No (2b)</mat-label>
                      <input matInput formControlName="centreNo" [readonly]="true" />
                    </mat-form-field>
                  </div>
                </form>

                <div class="step-actions">
                  <button mat-button matStepperNext>
                    Next: Select Exam
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 2: Exam Selection -->
            <mat-step [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>assignment</mat-icon>
                  Exam
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Select Exam</h3>
                <p class="step-desc">Choose which exam you want to apply for.</p>

                <form [formGroup]="form" class="form-grid">
                  @if (exams().length > 0) {
                    <mat-form-field appearance="outline" class="w100">
                      <mat-label>Exam</mat-label>
                      <mat-select formControlName="examId" required>
                        <mat-option value="">-- Select Exam --</mat-option>
                        @for (exam of exams(); track exam.id) {
                          <mat-option [value]="exam.id">
                            {{ exam.name }} ({{ exam.examType }})
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  } @else {
                    <mat-card class="info-card">
                      <mat-icon class="info-icon">info</mat-icon>
                      <div>
                        <strong>No Exams Available</strong>
                        <p>There are currently no exams available for registration. Please check back later.</p>
                      </div>
                    </mat-card>
                  }
                </form>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-button matStepperNext [disabled]="!form.get('examId')?.value">
                    Next: Exam Type
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 3: Exam Type Selection -->
            <mat-step [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>task_alt</mat-icon>
                  Exam Type
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Select Exam Type</h3>
                <p class="step-desc">Choose whether this is a fresh exam or backlog attempt.</p>

                <form [formGroup]="form" class="exam-type-container">
                  <div class="exam-type-options">
                    <label class="exam-type-option">
                      <input type="radio" formControlName="examType" value="fresh" />
                      <span class="option-label">
                        <strong>Fresh Exam</strong>
                        <span class="option-desc">New exam with all subjects</span>
                      </span>
                    </label>
                    <label class="exam-type-option">
                      <input type="radio" formControlName="examType" value="backlog" />
                      <span class="option-label">
                        <strong>Backlog Exam</strong>
                        <span class="option-desc">Re-attempt failed subjects from previous exam</span>
                      </span>
                    </label>
                  </div>

                  @if (examType() === 'backlog') {
                    <mat-card class="info-card">
                      <mat-icon class="info-icon">info</mat-icon>
                      <div>
                        <strong>Previous Exam Details</strong>
                        <p>You can now enter your previous exam month, year, seat number, and subject-wise marks for reference.</p>
                      </div>
                    </mat-card>

                    <div class="form-grid backlog-grid">
                      <mat-form-field appearance="outline" class="w100">
                        <mat-label>Previous Exam Month</mat-label>
                        <mat-select formControlName="lastExamMonth">
                          <mat-option value="">-- Select Month --</mat-option>
                          <mat-option value="FEB">February</mat-option>
                          <mat-option value="MAR">March</mat-option>
                          <mat-option value="JUN">June</mat-option>
                          <mat-option value="JUL">July</mat-option>
                          <mat-option value="AUG">August</mat-option>
                          <mat-option value="OCT">October</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w100">
                        <mat-label>Previous Exam Year</mat-label>
                        <input matInput type="number" formControlName="lastExamYear" min="1990" max="2100" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w100">
                        <mat-label>Previous Exam Seat No</mat-label>
                        <input matInput formControlName="lastExamSeatNo" />
                      </mat-form-field>
                    </div>
                  }
                </form>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-button matStepperNext>
                    Next: Personal Details
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 4: Personal Details -->
            <mat-step [stepControl]="personFormGroup()" [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>person</mat-icon>
                  Personal
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Candidate Details (3–13)</h3>
                <p class="step-desc">Enter your personal information as per HSC records.</p>

                <mat-card class="info-card">
                  <mat-icon class="info-icon">info</mat-icon>
                  <div>
                    <strong>Save Progress:</strong> You can save your personal information as you fill it. Fill at least First Name and Last Name to proceed to next step.
                  </div>
                </mat-card>

                <form [formGroup]="personFormGroup()" class="form-grid">
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Last Name / आडनाव (3a)</mat-label>
                    <input matInput formControlName="lastName" required />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>First Name / नाव (3b)</mat-label>
                    <input matInput formControlName="firstName" required />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Middle Name (3c)</mat-label>
                    <input matInput formControlName="middleName" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Mother's Name / आईचे नाव (3d)</mat-label>
                    <input matInput formControlName="motherName" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w200">
                    <mat-label>Address / पत्ता (4)</mat-label>
                    <input matInput formControlName="address" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Pin Code / पिनकोड</mat-label>
                    <input matInput formControlName="pinCode" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Mobile / मोबाईल (5)</mat-label>
                    <input matInput formControlName="mobile" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Date of Birth / जन्मतारीख</mat-label>
                    <input matInput [matDatepicker]="dobPicker" formControlName="dob" />
                    <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
                    <mat-datepicker #dobPicker></mat-datepicker>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Aadhaar / आधार (7)</mat-label>
                    <input matInput formControlName="aadhaar" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Gender / लिंग (9)</mat-label>
                    <mat-select formControlName="gender">
                      <mat-option value="Male">Male</mat-option>
                      <mat-option value="Female">Female</mat-option>
                      <mat-option value="Other">Other</mat-option>
                      <mat-option value="Prefer Not to Say">Prefer Not to Say</mat-option>
                    </mat-select>
                  </mat-form-field>
                </form>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-button matStepperNext [disabled]="!personFormGroup().get('firstName')?.value?.trim() || !personFormGroup().get('lastName')?.value?.trim()">
                    Next: Academic Details
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 3: Academic Details -->
            <mat-step [stepControl]="academicFormGroup()" [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>school</mat-icon>
                  Academic
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Academic Details (8–13)</h3>
                <p class="step-desc">Enter your stream, category, and medium information.</p>

                <form [formGroup]="academicFormGroup()" class="form-grid">
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Stream / प्रवाह (8)</mat-label>
                    <mat-select formControlName="streamCode">
                      <mat-option value="1">1) Science</mat-option>
                      <mat-option value="2">2) Arts</mat-option>
                      <mat-option value="3">3) Commerce</mat-option>
                      <mat-option value="4">4) HSC Vocational</mat-option>
                      <mat-option value="5">5) Technology Science</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Minority Religion Code (10)</mat-label>
                    <input matInput formControlName="minorityReligionCode" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Category / जात प्रवर्ग (11)</mat-label>
                    <input matInput formControlName="categoryCode" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Divyang Code (12)</mat-label>
                    <input matInput formControlName="divyangCode" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w100">
                    <mat-label>Medium / माध्यम (13)</mat-label>
                    <input matInput formControlName="mediumCode" />
                  </mat-form-field>
                </form>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-button matStepperNext [disabled]="academicFormGroup().invalid">
                    Next: Subjects
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 5: Subjects -->
            <mat-step [editable]="isEditable()">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>library_books</mat-icon>
                  Subjects ({{ subjects().length }})
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">{{ examType() === 'backlog' ? 'Selected Subjects & Previous Marks / मागील गुण' : 'Subject Selection / विषय निवड' }}</h3>
                <p class="step-desc">{{ examType() === 'backlog' ? 'Select your failed subjects and enter marks from previous exam (optional).' : 'Select your subjects. If your institute has already mapped subjects for your stream, only those subjects are shown here.' }}</p>

                @if (subjectSource() === 'institute') {
                  <mat-card class="info-card">
                    <mat-icon class="info-icon">verified</mat-icon>
                    <div>
                      <strong>Institute mapped subjects loaded</strong>
                      <p>Only the subjects configured by your institute for this stream are shown. The answer language is auto-filled wherever the institute has already set it.</p>
                    </div>
                  </mat-card>
                }

                <div class="subjects-list">
                  <div class="subject-item-grid">
                    @for (idx of getSubjectIndices(); track idx) {
                      <div class="subject-input-group" [formGroup]="getSubjectFormGroup(idx)">
                        <mat-form-field appearance="outline" class="flex-1">
                          <mat-label>Subject / विषय (15)</mat-label>
                          <mat-select formControlName="subjectId" required (selectionChange)="onSubjectSelectionChange(idx)">
                            <mat-option value="">-- None --</mat-option>
                            @for (s of masterSubjects(); track s.id) {
                              <mat-option [value]="s.id">{{ s.code }} - {{ s.name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        @if (examType() === 'backlog') {
                          <mat-form-field appearance="outline" class="marks-field">
                            <mat-label>Prev. Marks / मागील गुण</mat-label>
                            <input matInput type="number" formControlName="marks" min="0" max="100" />
                          </mat-form-field>
                        } @else {
                          <mat-form-field appearance="outline" class="w120">
                            <mat-label>Answer Language / उत्तर भाषा</mat-label>
                            <input matInput formControlName="langOfAnsCode" [readonly]="isLanguageLocked(getSubjectFormGroup(idx).get('subjectId')?.value)" placeholder="Auto from institute" />
                            @if (isLanguageLocked(getSubjectFormGroup(idx).get('subjectId')?.value)) {
                              <mat-hint>Set by institute</mat-hint>
                            }
                          </mat-form-field>
                        }
                        <button mat-icon-button type="button" (click)="removeSubject(idx)" [disabled]="!isEditable()" class="remove-btn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <button mat-stroked-button type="button" (click)="addSubject()" [disabled]="subjects().length >= 9 || !isEditable()" class="add-subject">
                  <mat-icon>add</mat-icon> Add Subject
                </button>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-button matStepperNext [disabled]="subjects().length === 0">
                    Next: Review
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 6: Review -->
            <mat-step [editable]="false">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>check_circle</mat-icon>
                  Review
                </span>
              </ng-template>

              <div class="step-content">
                <h3 class="step-title">Review Your Application</h3>
                <p class="step-desc">Please review all information carefully before submitting.</p>

                <div class="review-section">
                  <h4 class="review-heading">Institute</h4>
                  @if (selectedInstitute()) {
                    <div class="review-item">
                      <span class="review-label">Name:</span>
                      <strong>{{ selectedInstitute()!.name }}</strong>
                    </div>
                    <div class="review-item">
                      <span class="review-label">Address:</span>
                      <span>{{ selectedInstitute()!.address }}, {{ selectedInstitute()!.city }}</span>
                    </div>
                  }
                </div>

                <div class="review-section">
                  <h4 class="review-heading">Exam Information</h4>
                  <div class="review-item">
                    <span class="review-label">Exam:</span>
                    <strong>{{ getExamName(form.get('examId')?.value) }}</strong>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Exam Type:</span>
                    <span class="badge" [class.badge-fresh]="examType() === 'fresh'" [class.badge-backlog]="examType() === 'backlog'">
                      {{ examType() === 'fresh' ? 'Fresh Exam' : 'Backlog Exam' }}
                    </span>
                  </div>
                </div>

                <div class="review-section">
                  <h4 class="review-heading">Personal Information</h4>
                  <div class="review-item">
                    <span class="review-label">Name:</span>
                    <span>{{ form.get('personGroup.firstName')?.value }} {{ form.get('personGroup.lastName')?.value }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">DOB:</span>
                    <span>{{ form.get('personGroup.dob')?.value | date:'medium' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Mobile:</span>
                    <span>{{ form.get('personGroup.mobile')?.value }}</span>
                  </div>
                </div>

                <div class="review-section">
                  <h4 class="review-heading">Subjects ({{ subjects().length }})</h4>
                  <div class="subject-review-list">
                    @for (idx of getSubjectIndices(); track idx) {
                      @if (getSubjectFormGroup(idx).get('subjectId')?.value) {
                        <div class="subject-review-item">
                          <div class="subject-name">{{ getSubjectName(getSubjectFormGroup(idx).get('subjectId')?.value) }}</div>
                          @if (examType() === 'backlog' && getSubjectFormGroup(idx).get('marks')?.value) {
                            <div class="subject-marks">Previous Marks: {{ getSubjectFormGroup(idx).get('marks')?.value }}</div>
                          }
                        </div>
                      }
                    }
                  </div>
                </div>

                <div class="warning-card">
                  <mat-icon>info</mat-icon>
                  <div>
                    <strong>Important:</strong> Please ensure all information is correct. After submission, you will proceed to payment.
                  </div>
                </div>

                <div class="step-actions final-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back to Edit
                  </button>
                  @if (isEditable()) {
                    <button mat-flat-button color="accent" (click)="submit()" [disabled]="submitting() || !form.valid">
                      <mat-icon>{{ submitting() ? 'hourglass_empty' : 'check' }}</mat-icon>
                      {{ submitting() ? 'Submitting…' : 'Submit Application' }}
                    </button>
                  } @else {
                    <div class="already-submitted">
                      <mat-icon>check_circle</mat-icon>
                      <span>This application has been submitted.</span>
                    </div>
                  }
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card>

        <!-- Save Bar -->
        @if (isEditable()) {
          <div class="save-bar">
            <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.dirty">
              <mat-icon>{{ saving() ? 'hourglass_empty' : 'save' }}</mat-icon>
              {{ saving() ? 'Saving…' : 'Save Draft' }}
            </button>
            @if (lastSaved()) {
              <span class="save-status">
                <mat-icon class="save-icon">check_circle</mat-icon>
                Last saved: {{ lastSaved() }}
              </span>
            }
          </div>
        }
      </div>
    } @else {
      <mat-card class="card">
        <div class="loading">
          <mat-icon class="spinner">hourglass_empty</mat-icon>
          <p>Loading application...</p>
        </div>
      </mat-card>
    }
  `,
  styles: [`
    :host {
      --card-radius: 8px;
      --card-shadow: 0 2px 8px rgba(0,0,0,0.1);
      --transition: all 0.2s ease;
    }

    .application-container {
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 24px 12px;
      display: grid;
      gap: 20px;
    }

    .header-card {
      padding: 20px;
      box-shadow: var(--card-shadow);
      border-radius: var(--card-radius);
    }

    .header-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .grow {
      flex: 1;
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

    .form-card {
      padding: 20px;
      box-shadow: var(--card-shadow);
      border-radius: var(--card-radius);
    }

    .stepper-help {
      margin: 0 0 12px 0;
      color: #475569;
      font-size: 0.95rem;
    }

    .application-stepper {
      background: transparent;
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

    .step-content {
      padding: 24px 0;
    }

    .step-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .step-desc {
      color: #64748b;
      margin: 0 0 16px 0;
      font-size: 0.9rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .w100 {
      grid-column: span 1;
    }

    .w120 {
      width: 120px;
    }

    .w200 {
      grid-column: span 2;
    }

    .block-button {
      width: 100%;
      height: 48px;
    }

    .institute-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .mt-16 {
      margin-top: 16px;
    }

    .my-24 {
      margin: 24px 0;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 32px;
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

    .subjects-list {
      display: grid;
      gap: 12px;
      margin-bottom: 20px;
    }

    .subject-row {
      display: grid;
      grid-template-columns: 1fr 120px auto;
      gap: 12px;
      align-items: center;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .flex-1 {
      flex: 1;
    }

    .add-subject {
      align-self: flex-start;
      margin-bottom: 20px;
    }

    .review-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .review-heading {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }

    .review-item {
      display: flex;
      gap: 16px;
      padding: 8px 0;
      font-size: 0.9rem;
    }

    .review-label {
      font-weight: 600;
      color: #64748b;
      min-width: 120px;
    }

    .subject-review-list {
      display: grid;
      gap: 8px;
    }

    .subject-review-item {
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #0f172a;
    }

    .warning-card {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      display: flex;
      gap: 12px;
    }

    .warning-card mat-icon {
      color: #d97706;
      flex-shrink: 0;
    }

    .warning-card div {
      font-size: 0.9rem;
      color: #92400e;
    }

    .warning-card strong {
      color: #78350f;
    }

    .already-submitted {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #d1fae5;
      color: #047857;
      border-radius: 6px;
      font-weight: 500;
    }

    .save-bar {
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: var(--card-radius);
      display: flex;
      align-items: center;
      gap: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .save-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #059669;
      margin-left: auto;
    }

    .save-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .spinner {
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

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .w200 {
        grid-column: span 1;
      }

      .subject-row {
        grid-template-columns: 1fr;
      }

      .step-actions {
        flex-direction: column;
      }

      .step-actions button {
        width: 100%;
      }

      .save-bar {
        flex-direction: column;
      }

      .save-status {
        margin-left: 0;
      }
    }

    ::ng-deep .mat-mdc-stepper-vertical .mdc-linear-progress {
      display: none;
    }

    /* Exam Type Selection Styles */
    .exam-type-container {
      margin: 20px 0;
    }

    .exam-type-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .exam-type-option {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8fafc;
    }

    .exam-type-option:hover {
      border-color: #60a5fa;
      background: #f0f9ff;
    }

    .exam-type-option input[type="radio"] {
      margin-top: 2px;
      margin-right: 12px;
      cursor: pointer;
    }

    .exam-type-option input[type="radio"]:checked + .option-label {
      color: #1e40af;
    }

    .option-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .option-desc {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 400;
    }

    .info-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      margin-top: 16px;
    }

    .info-icon {
      color: #2563eb;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Subject Input Group Styles */
    .subject-item-grid {
      display: grid;
      gap: 12px;
    }

    .subject-input-group {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .marks-field {
      flex: 0 0 140px;
    }

    .subject-marks {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 4px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-fresh {
      background: #dbeafe;
      color: #0369a1;
    }

    .badge-backlog {
      background: #fed7aa;
      color: #92400e;
    }

    /* Error and Loading Styles */
    .card {
      margin-bottom: 16px;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .error-card {
      background-color: #fee;
      border: 1px solid #fcc;
    }

    .error-message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      color: #c33;
    }

    .error-message mat-icon {
      color: #c33;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      gap: 12px;
    }

    .loading-indicator p {
      color: #666;
      margin: 0;
      font-size: 1rem;
    }
  `]
})
export class StudentApplicationEditComponent implements OnInit {
  readonly application = signal<any | null>(null);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly masterSubjects = signal<Subject[]>([]);
  readonly exams = signal<any[]>([]);
  readonly showInstitutePicker = signal(false);
  readonly selectedInstitute = signal<any | null>(null);
  readonly lastSaved = signal<string | null>(null);
  readonly examType = signal<'fresh' | 'backlog'>('fresh');
  readonly candidateType = signal('REGULAR');
  readonly subjectSource = signal<'institute' | 'stream' | 'all'>('all');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly personalInfoComplete = signal(false);

  form!: FormGroup;
  private subjectWatcherInitialized = false;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  constructor() {
    // Initialize form immediately to avoid binding errors
    this.form = this.createDefaultFormGroup();
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.error.set(null);

    if (!this.subjectWatcherInitialized) {
      this.subjectWatcherInitialized = true;
      this.form.get('academicGroup.streamCode')?.valueChanges.subscribe((value: any) => {
        this.refreshSubjectOptions(value);
      });
    }

    // Load exams list
    this.http.get<{ exams: any[] }>(`${API_BASE_URL}/exams`).subscribe({
      next: (r: any) => {
        // Deduplicate exams by ID
        const examsArray = (r.exams || []) as any[];
        const examsMap = new Map<number, any>();
        examsArray.forEach((exam: any) => {
          examsMap.set(exam.id, exam);
        });
        const uniqueExams: any[] = Array.from(examsMap.values());
        this.exams.set(uniqueExams);
      },
      error: (err: any) => {
        console.error('Failed to load exams:', err?.error?.message || err?.message);
      }
    });

    this.refreshSubjectOptions();
    
    // Fetch student profile to pre-fill personal information
    this.http.get<{ student: any }>(`${API_BASE_URL}/me`).subscribe({
      next: (profileResp: any) => {
        // Store student profile for pre-filling
        const studentProfile = profileResp.student;
        
        // If editing an existing application, fetch that data
        if (id > 0) {
          this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe({
            next: (r: any) => {
              this.application.set(r.application);
              this.patchFromApplication(r.application);
              this.loading.set(false);
            },
            error: (err: any) => {
              const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load application';
              console.error('Failed to load application:', errorMsg);
              this.error.set(errorMsg);
              this.loading.set(false);
            }
          });
        } else {
          // For new application, pre-fill from student profile
          this.patchFromProfile(studentProfile);
          this.loading.set(false);
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load student profile';
        console.error('Failed to load student profile:', errorMsg);
        
        // Fallback: if profile fetch fails, try to load application
        if (id > 0) {
          this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe({
            next: (r: any) => {
              this.application.set(r.application);
              this.patchFromApplication(r.application);
              this.loading.set(false);
            },
            error: (appErr: any) => {
              const appErrorMsg = appErr?.error?.error || appErr?.error?.message || 'Failed to load application';
              console.error('Failed to load application:', appErrorMsg);
              this.error.set(appErrorMsg);
              this.loading.set(false);
            }
          });
        } else {
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      }
    });
  }

  isEditable = () => this.application()?.status === 'DRAFT';

  getStatusClass() {
    const status = this.application()?.status?.toLowerCase() || '';
    return `status-${status}`;
  }

  personFormGroup() {
    return this.form.get('personGroup') as FormGroup;
  }

  academicFormGroup() {
    return this.form.get('academicGroup') as FormGroup;
  }

  subjects() {
    return this.form.get('subjects') as FormArray;
  }

  addSubject() {
    this.subjects().push(
      new FormGroup({
        subjectId: new FormControl<number | null>(null, { validators: [Validators.required] }),
        langOfAnsCode: new FormControl(''),
        marks: new FormControl('', [Validators.min(0), Validators.max(100)])
      })
    );
  }

  removeSubject(i: number) {
    this.subjects().removeAt(i);
  }

  selectInstitute(inst: any) {
    this.selectedInstitute.set(inst);
    this.applyInstituteDefaults(inst);
    this.form.patchValue({
      personGroup: {
        ...(this.form.get('personGroup')?.value ?? {}),
        address: this.form.get('personGroup.address')?.value || inst.address || ''
      }
    });
    this.refreshSubjectOptions(this.form.get('academicGroup.streamCode')?.value, inst.id);
    this.showInstitutePicker.set(false);
  }

  private applyInstituteDefaults(inst: any) {
    if (!inst) return;
    const existing = this.form.getRawValue();
    this.form.patchValue({
      indexNo: existing.indexNo || inst.code || '',
      udiseNo: existing.udiseNo || inst.udiseNo || '',
      centreNo: existing.centreNo || inst.collegeNo || '',
      applSrNo: existing.applSrNo || this.application()?.applicationNo || ''
    }, { emitEvent: false });
  }

  getSubjectName(subjectId: number): string {
    return this.masterSubjects().find((s: any) => s.id === subjectId)?.name || 'Unknown';
  }

  getExamName(examId: number | null): string {
    if (!examId) return 'Not Selected';
    return this.exams().find((e: any) => e.id === examId)?.name || 'Unknown';
  }

  getMappedLanguage(subjectId: number | null | undefined): string {
    if (!subjectId) return '';
    return this.masterSubjects().find((subject: Subject) => subject.id === subjectId)?.answerLanguageCode || '';
  }

  isLanguageLocked(subjectId: number | null | undefined): boolean {
    return !!this.getMappedLanguage(subjectId);
  }

  onSubjectSelectionChange(index: number) {
    const group = this.getSubjectFormGroup(index);
    const subjectId = group.get('subjectId')?.value;
    const mappedLanguage = this.getMappedLanguage(subjectId);
    if (mappedLanguage) {
      group.patchValue({ langOfAnsCode: mappedLanguage }, { emitEvent: false });
    }
  }

  private applyMappedLanguagesToSelectedRows() {
    for (const idx of this.getSubjectIndices()) {
      this.onSubjectSelectionChange(idx);
    }
  }

  private refreshSubjectOptions(streamCode?: string | null, instituteId?: number | null) {
    const effectiveStreamCode = streamCode ?? this.form.get('academicGroup.streamCode')?.value ?? '';
    const effectiveInstituteId = instituteId ?? this.selectedInstitute()?.id ?? this.application()?.institute?.id ?? this.application()?.instituteId ?? null;

    const params: Record<string, string> = {};
    if (effectiveStreamCode) params['streamCode'] = String(effectiveStreamCode);
    if (effectiveInstituteId) params['instituteId'] = String(effectiveInstituteId);

    this.http.get<{ ok: boolean; source: 'institute' | 'stream' | 'all'; subjects: Subject[] }>(`${API_BASE_URL}/institutes/subject-options`, { params }).subscribe({
      next: (response: any) => {
        this.masterSubjects.set(response.subjects || []);
        this.subjectSource.set(response.source || 'all');
        this.applyMappedLanguagesToSelectedRows();
      },
      error: (err: any) => {
        console.error('Failed to load subject options:', err?.error?.message || err?.message);
      }
    });
  }

  private normalizeGenderValue(value: string | null | undefined): string {
    if (!value) return '';
    const normalized = String(value).toUpperCase();
    if (normalized === 'MALE') return 'Male';
    if (normalized === 'FEMALE') return 'Female';
    if (normalized === 'TRANSGENDER') return 'Other';
    return value;
  }

  private createDefaultFormGroup(): FormGroup {
    return new FormGroup({
      examId: new FormControl<number | null>(null, [Validators.required]),
      examType: new FormControl('fresh', [Validators.required]),
      indexNo: new FormControl(''),
      udiseNo: new FormControl(''),
      studentSaralId: new FormControl(''),
      applSrNo: new FormControl(''),
      centreNo: new FormControl(''),
      lastExamMonth: new FormControl(''),
      lastExamYear: new FormControl<number | null>(null),
      lastExamSeatNo: new FormControl(''),

      personGroup: new FormGroup({
        lastName: new FormControl('', [Validators.required]),
        firstName: new FormControl('', [Validators.required]),
        middleName: new FormControl(''),
        motherName: new FormControl(''),
        address: new FormControl(''),
        pinCode: new FormControl(''),
        mobile: new FormControl(''),
        dob: new FormControl<Date | null>(null),
        aadhaar: new FormControl(''),
        gender: new FormControl('')
      }),

      academicGroup: new FormGroup({
        streamCode: new FormControl(''),
        minorityReligionCode: new FormControl(''),
        categoryCode: new FormControl(''),
        divyangCode: new FormControl(''),
        mediumCode: new FormControl('')
      }),

      subjects: new FormArray<FormGroup>([])
    });
  }

  private checkPersonalInfoComplete(): boolean {
    const personGroup = this.form.get('personGroup') as FormGroup;
    if (!personGroup) return false;
    const firstName = personGroup.get('firstName')?.value?.trim();
    const lastName = personGroup.get('lastName')?.value?.trim();
    return !!firstName && !!lastName;
  }

  getSubjectFormGroup(index: number) {
    return this.subjects().at(index) as FormGroup;
  }

  getSubjectIndices() {
    return Array.from({ length: this.subjects().length }, (_, i) => i);
  }

  private buildApplicationPayload() {
    const raw: any = this.form.getRawValue();
    const candidateType = this.candidateType() || (raw.examType === 'backlog' ? 'BACKLOG' : 'REGULAR');
    const isBacklogFlow = ['BACKLOG', 'ATKT', 'REPEATER', 'IMPROVEMENT'].includes(candidateType);
    const selectedSubjects = (raw.subjects ?? []).filter((s: any) => !!s.subjectId);

    const exemptedSubjects = isBacklogFlow
      ? selectedSubjects.map((s: any) => {
          const subjectMeta = this.masterSubjects().find((subject: any) => subject.id === s.subjectId);
          return {
            subjectName: subjectMeta?.name || undefined,
            subjectCode: subjectMeta?.code || undefined,
            seatNo: raw.lastExamSeatNo || undefined,
            month: raw.lastExamMonth || undefined,
            year: raw.lastExamYear ? Number(raw.lastExamYear) : undefined,
            marksObt: s.marks !== null && s.marks !== undefined && s.marks !== '' ? String(s.marks) : undefined
          };
        })
      : [];

    return {
      examId: raw.examId || undefined,
      candidateType,
      indexNo: raw.indexNo || undefined,
      udiseNo: raw.udiseNo || undefined,
      studentSaralId: raw.studentSaralId || undefined,
      applSrNo: raw.applSrNo || undefined,
      centreNo: raw.centreNo || undefined,
      lastExamMonth: raw.lastExamMonth || undefined,
      lastExamYear: raw.lastExamYear ? Number(raw.lastExamYear) : undefined,
      lastExamSeatNo: raw.lastExamSeatNo || undefined,
      student: {
        lastName: raw.personGroup.lastName || undefined,
        firstName: raw.personGroup.firstName || undefined,
        middleName: raw.personGroup.middleName || undefined,
        motherName: raw.personGroup.motherName || undefined,
        address: raw.personGroup.address || undefined,
        pinCode: raw.personGroup.pinCode || undefined,
        mobile: raw.personGroup.mobile || undefined,
        dob: raw.personGroup.dob ? new Date(raw.personGroup.dob).toISOString() : undefined,
        aadhaar: raw.personGroup.aadhaar || undefined,
        streamCode: raw.academicGroup.streamCode || undefined,
        gender: raw.personGroup.gender || undefined,
        minorityReligionCode: raw.academicGroup.minorityReligionCode || undefined,
        categoryCode: raw.academicGroup.categoryCode || undefined,
        divyangCode: raw.academicGroup.divyangCode || undefined,
        mediumCode: raw.academicGroup.mediumCode || undefined
      },
      subjects: selectedSubjects.map((s: any) => ({
        subjectId: s.subjectId,
        langOfAnsCode: s.langOfAnsCode || this.getMappedLanguage(s.subjectId) || undefined,
        isExemptedClaim: isBacklogFlow
      })),
      exemptedSubjects
    };
  }

  save() {
    const app = this.application();
    if (!app) return;
    this.saving.set(true);

    const payload = this.buildApplicationPayload();

    this.http.put(`${API_BASE_URL}/applications/${app.id}`, payload).subscribe({
      next: () => {
        this.lastSaved.set(new Date().toLocaleTimeString());
        this.saving.set(false);
        this.error.set(null);
        this.form.markAsPristine();
        this.reload(app.id);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save application. Your changes may be lost. Please try again.';
        console.error('Failed to save application:', errorMsg);
        this.error.set(errorMsg);
        this.saving.set(false);
      }
    });
  }

  submit() {
    const app = this.application();
    if (!app) return;
    this.submitting.set(true);
    this.error.set(null);

    const payload = this.buildApplicationPayload();

    this.http.put(`${API_BASE_URL}/applications/${app.id}`, payload).subscribe({
      next: () => {
        this.http.post(`${API_BASE_URL}/applications/${app.id}/submit`, {}).subscribe({
          next: () => {
            this.submitting.set(false);
            this.error.set(null);
            this.reload(app.id);
          },
          error: (err: any) => {
            const errorMsg = err?.error?.error || err?.error?.message || 'Failed to submit application';
            console.error('Failed to submit application:', errorMsg);
            this.error.set(errorMsg);
            this.submitting.set(false);
          }
        });
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save application before submission';
        console.error('Failed to save application before submission:', errorMsg);
        this.error.set(errorMsg);
        this.submitting.set(false);
      }
    });
  }

  private reload(id: number) {
    this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe({
      next: (r: any) => {
        this.application.set(r.application);
        this.patchFromApplication(r.application);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to reload application';
        console.error('Failed to reload application:', errorMsg);
        this.error.set(errorMsg);
      }
    });
  }

  private patchFromApplication(a: any) {
    const student = a.student ?? {};
    const derivedExamType = ['BACKLOG', 'ATKT', 'REPEATER', 'IMPROVEMENT'].includes(a.candidateType) ? 'backlog' : 'fresh';

    this.examType.set(derivedExamType as 'fresh' | 'backlog');
    this.candidateType.set(a.candidateType ?? (derivedExamType === 'backlog' ? 'BACKLOG' : 'REGULAR'));

    // Patch existing form instead of recreating it
    this.form.patchValue({
      examId: a.exam?.id ?? a.examId ?? null,
      examType: derivedExamType,
      indexNo: a.indexNo ?? '',
      udiseNo: a.udiseNo ?? '',
      studentSaralId: a.studentSaralId ?? '',
      applSrNo: a.applSrNo ?? '',
      centreNo: a.centreNo ?? '',
      lastExamMonth: a.lastExamMonth ?? '',
      lastExamYear: a.lastExamYear ?? null,
      lastExamSeatNo: a.lastExamSeatNo ?? '',

      personGroup: {
        lastName: student.lastName ?? '',
        firstName: student.firstName ?? '',
        middleName: student.middleName ?? '',
        motherName: student.motherName ?? '',
        address: student.address ?? '',
        pinCode: student.pinCode ?? '',
        mobile: student.mobile ?? '',
        dob: student.dob ? new Date(student.dob) : null,
        aadhaar: student.aadhaar ?? '',
        gender: this.normalizeGenderValue(student.gender)
      },

      academicGroup: {
        streamCode: student.streamCode ?? '',
        minorityReligionCode: student.minorityReligionCode ?? '',
        categoryCode: student.categoryCode ?? '',
        divyangCode: student.divyangCode ?? '',
        mediumCode: student.mediumCode ?? ''
      }
    });

    this.selectedInstitute.set(a.institute ?? null);
    this.applyInstituteDefaults(a.institute ?? null);
    this.refreshSubjectOptions(student.streamCode ?? a.exam?.stream?.name ?? null, a.institute?.id ?? a.instituteId ?? student.instituteId ?? null);

    const subjects = this.form.get('subjects') as FormArray;
    subjects.clear();
    for (const s of a.subjects ?? []) {
      const matchedExempted = (a.exemptedSubjects ?? []).find((e: any) =>
        (e.subjectCode && e.subjectCode === s.subject?.code) ||
        (e.subjectName && e.subjectName === s.subject?.name)
      );

      subjects.push(
        new FormGroup({
          subjectId: new FormControl<number | null>(s.subjectId ?? s.subject?.id ?? null, { validators: [Validators.required] }),
          langOfAnsCode: new FormControl(s.langOfAnsCode ?? ''),
          marks: new FormControl(matchedExempted?.marksObt ?? '', [Validators.min(0), Validators.max(100)])
        })
      );
    }

    if (subjects.length === 0) {
      this.addSubject();
    }

    // Watch examType changes to toggle display
    this.form.get('examType')?.valueChanges.subscribe((value: any) => {
      this.examType.set(value);
    });
  }

  private patchFromProfile(student: any) {
    // Initialize empty form for new application
    this.examType.set('fresh');
    this.candidateType.set('REGULAR');
    
    // Patch existing form instead of recreating it
    this.form.patchValue({
      examType: 'fresh',
      indexNo: '',
      udiseNo: '',
      studentSaralId: '',
      applSrNo: '',
      centreNo: '',

      personGroup: {
        lastName: student?.lastName ?? '',
        firstName: student?.firstName ?? '',
        middleName: student?.middleName ?? '',
        motherName: student?.motherName ?? '',
        address: student?.address ?? '',
        pinCode: student?.pinCode ?? '',
        mobile: student?.mobile ?? '',
        dob: student?.dob ? new Date(student.dob) : null,
        aadhaar: student?.aadhaar ?? '',
        gender: this.normalizeGenderValue(student?.gender)
      },

      academicGroup: {
        streamCode: student?.streamCode ?? '',
        minorityReligionCode: student?.minorityReligionCode ?? '',
        categoryCode: student?.categoryCode ?? '',
        divyangCode: student?.divyangCode ?? '',
        mediumCode: student?.mediumCode ?? ''
      }
    });

    this.selectedInstitute.set(null);
    this.refreshSubjectOptions(student?.streamCode ?? null, student?.instituteId ?? null);

    if (this.subjects().length === 0) {
      this.addSubject();
    }

    // Watch examType changes to toggle display
    this.form.get('examType')?.valueChanges.subscribe((value: any) => {
      this.examType.set(value);
    });
  }
}

