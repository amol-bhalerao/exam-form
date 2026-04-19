import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { API_BASE_URL } from '../../../core/api';
import { StudentProfileService } from '../../../core/student-profile.service';
import { Subject as RxSubject, interval, Observable, startWith, map } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

type SubjectInfo = {
  id: number;
  code: string;
  name: string;
  category?: string;
  mappingId?: number;
  answerLanguageCode?: string;
};

type SubjectOption = {
  id: number;
  name: string;
  code: string;
  category?: string;
  mappingId?: number;
  answerLanguageCode?: string;
};

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
    MatAutocompleteModule,
    MatChipsModule,
    DatePipe,
    TitleCasePipe,
    LowerCasePipe
  ],
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
    MatAutocompleteModule,
    MatChipsModule,
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

        <!-- Quick Setup Progress -->
        @if (setupProgress() < 100) {
          <mat-card class="setup-card">
            <div class="setup-header">
              <mat-icon class="setup-icon">rocket_launch</mat-icon>
              <div>
                <h3>Quick Setup - {{ setupProgress() }}% Complete</h3>
                <p>Pre-filling your application with profile data...</p>
              </div>
            </div>
            <mat-progress-bar mode="determinate" [value]="setupProgress()" class="setup-progress"></mat-progress-bar>
          </mat-card>
        }

        <!-- Multi-step form -->
        <mat-card class="form-card">
          <mat-stepper #stepper [linear]="true" class="form-stepper">
            <!-- Step 1: Quick Setup & Verification -->
            <mat-step [stepControl]="getSetupGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>auto_fix_high</mat-icon>
                  Quick Setup
                </span>
              </ng-template>

              <div class="setup-step">
                <div class="setup-intro">
                  <mat-icon class="intro-icon">lightbulb</mat-icon>
                  <div>
                    <h3>Smart Pre-filling</h3>
                    <p>Your application is being pre-filled with data from your student profile. Review and update as needed.</p>
                  </div>
                </div>

                <form [formGroup]="getSetupGroup()" class="step-form">
                  <!-- Personal Details Summary -->
                  <div class="summary-section">
                    <h4 class="section-title">
                      <mat-icon>person</mat-icon>
                      Personal Details
                    </h4>
                    <div class="summary-grid">
                      <div class="summary-item">
                        <span class="label">Name:</span>
                        <span class="value">{{ form.get('setupGroup.studentName')?.value }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">DOB:</span>
                        <span class="value">{{ form.get('setupGroup.dob')?.value | date:'mediumDate' }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">Gender:</span>
                        <span class="value">{{ form.get('setupGroup.gender')?.value === 'M' ? 'Male' : form.get('setupGroup.gender')?.value === 'F' ? 'Female' : 'Other' }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">Category:</span>
                        <span class="value">{{ form.get('setupGroup.category')?.value }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Academic Details -->
                  <div class="summary-section">
                    <h4 class="section-title">
                      <mat-icon>school</mat-icon>
                      Academic Details
                    </h4>
                    <div class="form-row">
                      <mat-form-field class="form-field">
                        <mat-label>Stream</mat-label>
                        <mat-select formControlName="stream" required (selectionChange)="onStreamChange()">
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
                  </div>

                  <!-- Contact Details -->
                  <div class="summary-section">
                    <h4 class="section-title">
                      <mat-icon>contact_phone</mat-icon>
                      Contact Details
                    </h4>
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
                  </div>

                  <div class="step-actions">
                    <button mat-flat-button color="primary" matStepperNext [disabled]="getSetupGroup().invalid">
                      <mat-icon>arrow_forward</mat-icon>
                      <span>Continue to Subject Selection</span>
                    </button>
                  </div>
                </form>
              </div>
            </mat-step>

            <!-- Step 2: Subject Selection -->
            <mat-step [stepControl]="getSubjectsGroup()" [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>library_books</mat-icon>
                  Subjects (Min 3)
                </span>
              </ng-template>

              <div class="subjects-step">
                <div class="subjects-header">
                  <mat-icon class="header-icon">auto_stories</mat-icon>
                  <div>
                    <h3>Choose Your Subjects</h3>
                    <p>Select at least 3 subjects from your institute's curriculum. Start typing to search.</p>
                  </div>
                </div>

                <form [formGroup]="getSubjectsGroup()" class="step-form">
                  <!-- Subject Search and Selection -->
                  <div class="subject-selection">
                    <mat-form-field class="subject-search-field">
                      <mat-label>Search and Select Subjects</mat-label>
                      <input matInput
                             [formControl]="subjectSearchControl"
                             [matAutocomplete]="subjectAuto"
                             placeholder="Type subject name or code...">
                      <mat-autocomplete #subjectAuto="matAutocomplete"
                                       [displayWith]="displaySubject"
                                       (optionSelected)="onSubjectSelected($event)">
                        @for (subject of filteredSubjects(); track subject.id) {
                          <mat-option [value]="subject">
                            <div class="subject-option">
                              <span class="subject-name">{{ subject.name }}</span>
                              <span class="subject-code">({{ subject.code }})</span>
                              @if (subject.category) {
                                <span class="subject-category">{{ subject.category }}</span>
                              }
                            </div>
                          </mat-option>
                        }
                      </mat-autocomplete>
                    </mat-form-field>

                    <!-- Selected Subjects -->
                    @if (selectedSubjects().length > 0) {
                      <div class="selected-subjects">
                        <h4>Selected Subjects ({{ selectedSubjects().length }}/6)</h4>
                        <mat-chip-set>
                          @for (subject of selectedSubjects(); track subject.id) {
                            <mat-chip [removable]="true" (removed)="removeSubject(subject)">
                              {{ subject.name }} ({{ subject.code }})
                              <mat-icon matChipRemove>cancel</mat-icon>
                            </mat-chip>
                          }
                        </mat-chip-set>
                      </div>
                    }
                  </div>

                  <!-- Answer Language Selection -->
                  @if (selectedSubjects().length > 0) {
                    <div class="language-section">
                      <h4 class="section-title">
                        <mat-icon>language</mat-icon>
                        Answer Language
                      </h4>
                      <mat-form-field class="language-field">
                        <mat-label>Language for Answer Scripts</mat-label>
                        <mat-select formControlName="answerLanguage" required>
                          <mat-option value="ENG">English</mat-option>
                          <mat-option value="MAR">Marathi</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  }

                  <div class="step-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      <span>Back</span>
                    </button>
                    <button mat-flat-button color="primary" matStepperNext
                            [disabled]="getSubjectsGroup().invalid || selectedSubjects().length < 3">
                      <mat-icon>check_circle</mat-icon>
                      <span>Review & Pay (₹500)</span>
                    </button>
                  </div>
                </form>
              </div>
            </mat-step>

            <!-- Step 3: Review & Payment -->
            <mat-step [editable]="false">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>receipt</mat-icon>
                  Review & Pay
                </span>
              </ng-template>

              <div class="review-step">
                <div class="review-header">
                  <mat-icon class="review-icon">assignment</mat-icon>
                  <div>
                    <h3>Review Your Application</h3>
                    <p>Please verify all details before proceeding to payment.</p>
                  </div>
                </div>

                <div class="review-content">
                  <!-- Personal & Academic Summary -->
                  <div class="review-section">
                    <h4>Application Summary</h4>
                    <div class="review-grid">
                      <div class="review-item">
                        <span class="label">Application No:</span>
                        <span class="value">{{ application()!.applicationNo }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Name:</span>
                        <span class="value">{{ form.get('setupGroup.studentName')?.value }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Stream:</span>
                        <span class="value">{{ form.get('setupGroup.stream')?.value }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Medium:</span>
                        <span class="value">{{ form.get('setupGroup.medium')?.value === 'ENG' ? 'English' : 'Marathi' }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Answer Language:</span>
                        <span class="value">{{ form.get('subjectsGroup.answerLanguage')?.value === 'ENG' ? 'English' : 'Marathi' }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Subjects:</span>
                        <span class="value">{{ selectedSubjects().length }} selected</span>
                      </div>
                    </div>
                  </div>

                  <!-- Selected Subjects List -->
                  <div class="review-section">
                    <h4>Selected Subjects</h4>
                    <div class="subjects-list">
                      @for (subject of selectedSubjects(); track subject.id) {
                        <div class="subject-item">
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ subject.name }} ({{ subject.code }})</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Payment Section -->
                  <div class="payment-section">
                    <div class="payment-card">
                      <div class="payment-header">
                        <mat-icon class="payment-icon">payment</mat-icon>
                        <div>
                          <h4>Exam Fee Payment</h4>
                          <p>Secure payment powered by Cashfree</p>
                        </div>
                      </div>
                      <div class="payment-amount">
                        <span class="amount">₹500</span>
                        <span class="description">One-time exam fee</span>
                      </div>
                    </div>
                  </div>

                  <div class="review-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      <span>Back to Edit</span>
                    </button>
                    <button mat-flat-button color="accent" (click)="submit()" [disabled]="submitting()">
                      <mat-icon>{{ submitting() ? 'hourglass_empty' : 'credit_card' }}</mat-icon>
                      {{ submitting() ? 'Processing...' : 'Pay ₹500 & Submit' }}
                    </button>
                  </div>
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
                    <span>Next: Verify Details</span>
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Verify Details -->
            <mat-step [editable]="true">
              <ng-template matStepLabel>
                <span class="step-label">
                  <mat-icon>check_circle</mat-icon>
                  Verify Details
                </span>
              </ng-template>

              <div class="verification-form">
                <div class="verification-header">
                  <mat-icon class="header-icon">info</mat-icon>
                  <h3>Please verify your personal and academic details</h3>
                  <p class="verification-subtitle">These details will be used for your exam application. Make sure everything is correct before proceeding to subject selection.</p>
                </div>

                <div class="verification-section">
                  <h4 class="section-title">
                    <mat-icon>person</mat-icon>
                    Personal Information
                  </h4>
                  <div class="verification-grid">
                    <div class="verification-item">
                      <span class="label">Full Name:</span>
                      <span class="value">{{ form.get('personalGroup.studentName')?.value }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Date of Birth:</span>
                      <span class="value">{{ form.get('personalGroup.dob')?.value | date:'mediumDate' }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Father's Name:</span>
                      <span class="value">{{ form.get('personalGroup.fatherName')?.value }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Mother's Name:</span>
                      <span class="value">{{ form.get('personalGroup.motherName')?.value }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Gender:</span>
                      <span class="value">{{ form.get('personalGroup.gender')?.value === 'M' ? 'Male' : form.get('personalGroup.gender')?.value === 'F' ? 'Female' : 'Other' }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Category:</span>
                      <span class="value">{{ form.get('personalGroup.category')?.value }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Divyang Status:</span>
                      <span class="value">{{ form.get('personalGroup.divyangCode')?.value === 'DIVYANG' ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                </div>

                <div class="verification-section">
                  <h4 class="section-title">
                    <mat-icon>school</mat-icon>
                    Academic Details
                  </h4>
                  <div class="verification-grid">
                    <div class="verification-item">
                      <span class="label">Stream:</span>
                      <span class="value">{{ form.get('academicGroup.stream')?.value }}</span>
                    </div>
                    <div class="verification-item">
                      <span class="label">Medium:</span>
                      <span class="value">{{ form.get('academicGroup.medium')?.value === 'ENG' ? 'English' : 'Marathi' }}</span>
                    </div>
                  </div>
                </div>

                <div class="verification-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    <span>Back to Edit</span>
                  </button>
                  <button mat-flat-button color="primary" matStepperNext>
                    <mat-icon>check</mat-icon>
                    <span>Details Verified - Continue to Contact Info</span>
                  </button>
                </div>
              </div>
            </mat-step>

            <!-- Step 4: Contact Information -->
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

            <!-- Step 5: Subject Selection -->
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

            <!-- Step 6: Review & Submit -->
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
                    <span class="label">Gender:</span>
                    <span class="value">{{ form.get('personalGroup.gender')?.value === 'M' ? 'Male' : form.get('personalGroup.gender')?.value === 'F' ? 'Female' : 'Other' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Category:</span>
                    <span class="value">{{ form.get('personalGroup.category')?.value }}</span>
                  </div>
                  <div class="review-item">
                    <span class="label">Divyang Status:</span>
                    <span class="value">{{ form.get('personalGroup.divyangCode')?.value === 'DIVYANG' ? 'Yes' : 'No' }}</span>
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

    .warning-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin-bottom: 16px;
    }

    .warning-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .warning-icon {
      color: #f59e0b;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-text {
      flex: 1;
    }

    .warning-text h3 {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #92400e;
    }

    .warning-text p {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      color: #b45309;
      line-height: 1.4;
    }

    .warning-text button {
      font-size: 0.85rem;
      padding: 6px 12px;
      background: white;
      border: 1px solid #fcd34d;
      color: #92400e;
    }

    .warning-text button:hover {
      background: #fffbeb;
    }

    .verification-form {
      padding: 20px 0;
    }

    .verification-header {
      text-align: center;
      margin-bottom: 32px;
      padding: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      border: 1px solid #0ea5e9;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #0ea5e9;
      margin-bottom: 12px;
    }

    .verification-header h3 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0c4a6e;
    }

    .verification-subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: #0369a1;
      line-height: 1.5;
    }

    .verification-section {
      margin-bottom: 32px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-title mat-icon {
      color: #64748b;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .verification-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }

    .verification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }

    .verification-item .label {
      font-weight: 600;
      color: #475569;
    }

    .verification-item .value {
      color: #0f172a;
      font-weight: 500;
    }

    .verification-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }

    .verification-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
    }

    @media (max-width: 600px) {
      .verification-grid {
        grid-template-columns: 1fr;
      }

      .verification-actions {
        flex-direction: column;
      }

      .verification-actions button {
        width: 100%;
        justify-content: center;
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
  profileCompletionPercentage = signal(0);
  showProfileWarning = signal(false);
  setupProgress = signal(0);

  // Subject management
  availableSubjects = signal<SubjectOption[]>([]);
  selectedSubjects = signal<SubjectOption[]>([]);
  subjectSearchControl = new FormControl('');
  filteredSubjects = signal<SubjectOption[]>([]);

  private destroy$ = new RxSubject<void>();
  private autoSaveTimer$ = new RxSubject<void>();

  private readonly profileService = inject(StudentProfileService);
  private readonly router = inject(Router);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Load profile and check completion percentage
    this.profileService.loadProfile().then(profile => {
      const completionPercentage = this.profileService.completionPercentage$();
      this.profileCompletionPercentage.set(completionPercentage);
      this.showProfileWarning.set(completionPercentage < 100 && completionPercentage >= 70);

      if (completionPercentage < 100) {
        console.warn(`⚠️ Profile only ${completionPercentage}% complete. Consider completing your profile before submitting.`);
      }
    }).catch(err => {
      console.error('Failed to load profile:', err);
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.applicationId.set(params['id']);
      this.loadApplication();
    });

    // Setup subject search filtering
    this.subjectSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSubjects(value || ''))
    ).subscribe(filtered => {
      this.filteredSubjects.set(filtered);
    });

    // Auto-save on form changes (debounced)
    this.form?.valueChanges
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
  getSetupGroup(): FormGroup {
    return this.form?.get('setupGroup') as FormGroup;
  }

  getSubjectsGroup(): FormGroup {
    return this.form?.get('subjectsGroup') as FormGroup;
  }

  private async loadApplication() {
    this.http.get(`${API_BASE_URL}/applications/${this.applicationId()}`).subscribe({
      next: async (res: any) => {
        this.application.set(res.application);
        
        // Ensure profile is loaded before initializing form
        try {
          await this.profileService.loadProfile();
        } catch (err) {
          console.warn('Failed to load profile for pre-filling, continuing with application data only:', err);
        }
        
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

  private async initForm(app: any) {
    // Get student profile data for pre-filling
    const studentProfile = this.profileService.profile$();

    this.form = new FormGroup({
      setupGroup: new FormGroup({
        studentName: new FormControl(app.studentName || `${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}`.trim() || '', Validators.required),
        dob: new FormControl(app.dob || studentProfile?.dateOfBirth || '', Validators.required),
        gender: new FormControl(app.gender || studentProfile?.gender || '', Validators.required),
        category: new FormControl(app.category || '', Validators.required),
        stream: new FormControl(app.stream || studentProfile?.stream || '', Validators.required),
        medium: new FormControl(app.medium || '', Validators.required),
        mobile: new FormControl(app.mobile || studentProfile?.mobile || '', [Validators.required, Validators.pattern('[0-9]{10}')]),
        email: new FormControl(app.email || studentProfile?.email || '', [Validators.required, Validators.email])
      }),
      subjectsGroup: new FormGroup({
        answerLanguage: new FormControl(app.answerLanguage || 'ENG', Validators.required)
      })
    });

    // Load subjects for the selected stream
    if (this.form.get('setupGroup.stream')?.value) {
      await this.loadSubjects();
    }

    // Pre-fill selected subjects if they exist
    if (app.subjects && app.subjects.length > 0) {
      const selectedSubjectIds = app.subjects.map((s: any) => s.id);
      const preSelectedSubjects = this.availableSubjects().filter(subject =>
        selectedSubjectIds.includes(subject.id)
      );
      this.selectedSubjects.set(preSelectedSubjects);
    }

    this.setupProgress.set(100);
  }

  private async loadSubjects() {
    const stream = this.form.get('setupGroup.stream')?.value;
    if (!stream) return;

    try {
      const response = await this.http.get(`${API_BASE_URL}/institutes/subject-options?streamCode=${stream}`).toPromise() as any;

      if (response?.subjects?.length > 0) {
        this.availableSubjects.set(response.subjects);
        this.filteredSubjects.set(response.subjects);
        console.log(`Loaded ${response.subjects.length} subjects from ${response.source === 'institute' ? 'institute mapping' : 'all subjects'}`);
      } else {
        // Fallback to all subjects if no institute mapping
        const fallbackResponse = await this.http.get(`${API_BASE_URL}/subjects?stream=${stream}`).toPromise() as any;
        this.availableSubjects.set(fallbackResponse?.subjects || []);
        this.filteredSubjects.set(fallbackResponse?.subjects || []);
        console.log(`Fallback: Loaded ${fallbackResponse?.subjects?.length || 0} subjects from all subjects`);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
      this.showToast('error', 'Failed to load subjects. Please try again.');
    }
  }

  onStreamChange() {
    const stream = this.form.get('setupGroup.stream')?.value;
    if (stream) {
      this.selectedSubjects.set([]); // Clear selected subjects when stream changes
      this.loadSubjects();
    }
  }

  private _filterSubjects(value: string): SubjectOption[] {
    const filterValue = value.toLowerCase();
    return this.availableSubjects().filter(subject =>
      subject.name.toLowerCase().includes(filterValue) ||
      subject.code.toLowerCase().includes(filterValue)
    );
  }

  displaySubject(subject: SubjectOption): string {
    return subject ? `${subject.name} (${subject.code})` : '';
  }

  onSubjectSelected(event: any) {
    const subject = event.option.value as SubjectOption;
    if (subject && !this.selectedSubjects().some(s => s.id === subject.id)) {
      if (this.selectedSubjects().length < 6) {
        this.selectedSubjects.set([...this.selectedSubjects(), subject]);
        this.subjectSearchControl.setValue(''); // Clear search
        this.autoSave();
      } else {
        this.showToast('error', 'Maximum 6 subjects allowed');
      }
    }
  }

  removeSubject(subject: SubjectOption) {
    const current = this.selectedSubjects();
    this.selectedSubjects.set(current.filter(s => s.id !== subject.id));
    this.autoSave();
  }
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
