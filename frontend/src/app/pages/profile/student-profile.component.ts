import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { StudentProfileService, StudentProfile } from '../../core/student-profile.service';
import { I18nService } from '../../core/i18n.service';
import { PincodeService, PostalLocation } from '../../core/pincode.service';

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
    MatCheckboxModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatProgressBarModule
  ],
  template: `
    <div class="student-profile-container">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="board-header">
          <h2>Maharashtra State Board Of Secondary & Higher Secondary Education, Pune</h2>
          <h3 id="divisional-board">{{ boardName }}</h3>
        </div>
        <h1>HSC Exam Application Form</h1>
        <p class="form-info">Complete all marked (*) fields to create your exam application</p>
        
        <!-- Instructions -->
        <div class="instructions-card">
          <mat-icon>info</mat-icon>
          <div class="instructions-content">
            <p><strong>Important Instructions:</strong></p>
            <ul>
              <li>All name fields must be entered in <strong>ENGLISH CAPITAL LETTERS ONLY</strong> (e.g., AMOL, RATHOD)</li>
              <li>Do not use special characters, numbers, or lowercase letters in name fields</li>
              <li>All personal information must match your official documents (Aadhar, SSC Certificate, etc.)</li>
              <li>Verify spelling carefully - Name once submitted cannot be changed without approval</li>
              <li>Mobile and Email should be current - you may receive important exam notifications</li>
            </ul>
          </div>
        </div>

        <!-- Profile Completion Progress -->
        <div class="profile-completion-card">
          <div class="completion-header">
            <mat-icon>task_alt</mat-icon>
            <h3>Profile Completion</h3>
          </div>
          <div class="progress-info">
            <div class="progress-stats">
              <span class="completion-text">{{ profileCompletionCount }}/{{ totalProfileFields }} fields completed</span>
              <span class="completion-percentage">{{ profileCompletionPercentage }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="profileCompletionPercentage" color="accent"></mat-progress-bar>
            <p class="completion-message" *ngIf="profileCompletionPercentage < 100">
              <mat-icon>warning</mat-icon>
              Complete your profile to enable exam application creation
            </p>
            <p class="completion-message success" *ngIf="profileCompletionPercentage === 100">
              <mat-icon>check_circle</mat-icon>
              Your profile is complete! You can now create an exam application.
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner-wrapper">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading your profile...</p>
        </div>
      </div>

      <!-- Error Message -->
      <div class="error-banner" *ngIf="error && !isLoading">
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
        <mat-tab-group class="profile-tabs">
          
          <!-- TAB 1: PERSONAL DETAILS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>person</mat-icon>
              <span>Personal Details</span>
            </ng-template>

            <form [formGroup]="personalDetailsForm" class="form-section">
              <!-- CANDIDATE IDENTIFICATION -->
              <div class="form-card">
                <h3 class="card-title">Candidate Identification</h3>
                <div class="form-grid-3">
                  <mat-form-field class="form-field">
                    <mat-label>Last Name / Surname *</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="lastName" placeholder="e.g., RATHOD" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'lastName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Candidate's Name (First Name) *</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="firstName" placeholder="e.g., PAYAL" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'firstName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Middle / Father's Name</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="middleName" placeholder="e.g., SURESH" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'middleName') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Mother's Name *</mat-label>
                    <mat-icon matPrefix>family_restroom</mat-icon>
                    <input matInput formControlName="motherName" placeholder="e.g., ANUSAYA" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'motherName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Date of Birth (DD/MM/YYYY)</mat-label>
                    <mat-icon matPrefix>cake</mat-icon>
                    <input matInput formControlName="dateOfBirth" [matDatepicker]="picker" placeholder="e.g., 07/04/2009" />
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'dateOfBirth') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-3">
                  <mat-form-field class="form-field">
                    <mat-label>Aadhar Number</mat-label>
                    <mat-icon matPrefix>badge</mat-icon>
                    <input matInput formControlName="aadharNumber" placeholder="e.g., 287047290812" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'aadharNumber') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Mobile Number *</mat-label>
                    <mat-icon matPrefix>phone</mat-icon>
                    <input matInput formControlName="mobile" placeholder="e.g., 8767287820" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'mobile') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Email *</mat-label>
                    <mat-icon matPrefix>email</mat-icon>
                    <input matInput formControlName="email" type="email" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'email') }}</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <!-- ADDRESS DETAILS -->
              <div class="form-card">
                <h3 class="card-title">Address Details</h3>
                
                <mat-form-field class="form-field-full">
                  <mat-label>Address Line One *</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="addressLineOne" placeholder="e.g., CHINCHOLI HINGOLI" required />
                  <mat-error>{{ getErrorMessage(personalDetailsForm, 'addressLineOne') }}</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field-full">
                  <mat-label>Address Line Two</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="addressLineTwo" />
                  <mat-error>{{ getErrorMessage(personalDetailsForm, 'addressLineTwo') }}</mat-error>
                </mat-form-field>

                <mat-form-field class="form-field-full">
                  <mat-label>Address Line Three</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <input matInput formControlName="addressLineThree" />
                  <mat-error>{{ getErrorMessage(personalDetailsForm, 'addressLineThree') }}</mat-error>
                </mat-form-field>

                <div class="form-grid-4">
                  <mat-form-field class="form-field">
                    <mat-label>Pincode *</mat-label>
                    <mat-icon matPrefix>location_on</mat-icon>
                    <input matInput 
                           formControlName="pincode" 
                           placeholder="e.g., 431513" 
                           [matAutocomplete]="pincodeAuto"
                           (input)="onPincodeInput($event)"
                           required />
                    <mat-autocomplete #pincodeAuto="matAutocomplete" (optionSelected)="onPincodeSelected($event)">
                      <mat-optgroup *ngIf="pincodeOptions.length > 0">
                        <mat-option *ngFor="let location of pincodeOptions" 
                                    [value]="location.pincode"
                                    class="pincode-option">
                          <div class="option-content">
                            <strong>{{ location.pincode }}</strong> - {{ location.village }}
                            <div class="option-details">
                              {{ location.district }}, {{ location.taluka }}
                            </div>
                          </div>
                        </mat-option>
                      </mat-optgroup>
                      <mat-option *ngIf="pincodeOptions.length === 0 && pincodeLookupLoading" disabled>
                        <mat-spinner diameter="20"></mat-spinner> Searching...
                      </mat-option>
                      <mat-option *ngIf="pincodeError && pincodeOptions.length === 0" disabled>
                        <span class="error-text">{{ pincodeError }}</span>
                      </mat-option>
                    </mat-autocomplete>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'pincode') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>District</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="district" placeholder="e.g., HINGOLI" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'district') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Taluka</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="taluka" placeholder="e.g., HINGOLI" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'taluka') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Revenue Circle</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="revenueCircle" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'revenueCircle') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field form-full-width">
                    <mat-label>Village</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="village" placeholder="e.g., hingoli" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'village') }}</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <!-- DEMOGRAPHICS & PERSONAL INFORMATION -->
              <div class="form-card">
                <h3 class="card-title">Demographics & Personal Information</h3>
                <p class="card-subtitle">Category, Minority Religion, Medium of Study</p>
                
                <div class="form-grid-3">
                  <mat-form-field class="form-field">
                    <mat-label>Category</mat-label>
                    <mat-icon matPrefix>group</mat-icon>
                    <mat-select formControlName="categoryCode">
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="GEN">General</mat-option>
                      <mat-option value="OBC">OBC</mat-option>
                      <mat-option value="SC">SC</mat-option>
                      <mat-option value="ST">ST</mat-option>
                      <mat-option value="NT">NT</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Minority Religion</mat-label>
                    <mat-icon matPrefix>people</mat-icon>
                    <mat-select formControlName="minorityReligionCode">
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="MUSLIM">Muslim</mat-option>
                      <mat-option value="CHRISTIAN">Christian</mat-option>
                      <mat-option value="SIKH">Sikh</mat-option>
                      <mat-option value="BUDDHIST">Buddhist</mat-option>
                      <mat-option value="PARSI">Parsi</mat-option>
                      <mat-option value="JEWISH">Jewish</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Medium of Study</mat-label>
                    <mat-icon matPrefix>language</mat-icon>
                    <mat-select formControlName="mediumCode">
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="MARATHI">Marathi</mat-option>
                      <mat-option value="HINDI">Hindi</mat-option>
                      <mat-option value="ENGLISH">English</mat-option>
                      <mat-option value="URDU">Urdu</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="savePersonalDetails()" [disabled]="personalDetailsForm.invalid || savingPersonal">
                  <mat-icon *ngIf="!savingPersonal">save</mat-icon>
                  <mat-spinner *ngIf="savingPersonal" diameter="20"></mat-spinner>
                  <span *ngIf="!savingPersonal">Save Personal Details</span>
                  <span *ngIf="savingPersonal">Saving...</span>
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- TAB 2: PREVIOUS EXAMINATION -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>history</mat-icon>
              <span>Previous Exams</span>
            </ng-template>

            <form [formGroup]="previousExamForm" class="form-section">
              <!-- SSC EXAMINATION -->
              <div class="form-card">
                <h3 class="card-title">SSC Examination Details</h3>
                <p class="card-subtitle">Fill details of your last SSC exam attempt</p>

                <div class="form-grid-4">
                  <mat-form-field class="form-field">
                    <mat-label>Seat Number</mat-label>
                    <mat-icon matPrefix>confirmation_number</mat-icon>
                    <input matInput formControlName="sscSeatNo" placeholder="e.g., k171622" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Month</mat-label>
                    <mat-icon matPrefix>calendar_today</mat-icon>
                    <mat-select formControlName="sscMonth">
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="JAN">January</mat-option>
                      <mat-option value="FEB">February</mat-option>
                      <mat-option value="MAR">March</mat-option>
                      <mat-option value="APR">April</mat-option>
                      <mat-option value="MAY">May</mat-option>
                      <mat-option value="JUN">June</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Year</mat-label>
                    <mat-icon matPrefix>calendar_today</mat-icon>
                    <input matInput type="number" formControlName="sscYear" placeholder="e.g., 2024" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Board / College</mat-label>
                    <mat-icon matPrefix>domain</mat-icon>
                    <input matInput formControlName="sscBoard" placeholder="e.g., STATE BOARD C SAMBHAGI NAGAR" />
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Percentage Obtained (%)</mat-label>
                    <mat-icon matPrefix>percent</mat-icon>
                    <input matInput type="number" formControlName="sscPercentage" placeholder="e.g., 85.5" min="0" max="100" step="0.01" />
                  </mat-form-field>
                </div>
              </div>

              <!-- XIth EXAMINATION -->
              <div class="form-card">
                <h3 class="card-title">XIth Examination Details</h3>
                <p class="card-subtitle">Fill details of your XIth exam (if applicable)</p>

                <div class="form-grid-4">
                  <mat-form-field class="form-field">
                    <mat-label>Seat Number</mat-label>
                    <mat-icon matPrefix>confirmation_number</mat-icon>
                    <input matInput formControlName="xithSeatNo" placeholder="e.g., 371" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Month</mat-label>
                    <mat-icon matPrefix>calendar_today</mat-icon>
                    <mat-select formControlName="xithMonth">
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="JAN">January</mat-option>
                      <mat-option value="FEB">February</mat-option>
                      <mat-option value="MAR">March</mat-option>
                      <mat-option value="APR">April</mat-option>
                      <mat-option value="MAY">May</mat-option>
                      <mat-option value="JUN">June</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Year</mat-label>
                    <mat-icon matPrefix>calendar_today</mat-icon>
                    <input matInput type="number" formControlName="xithYear" placeholder="e.g., 2025" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Jr. College</mat-label>
                    <mat-icon matPrefix>domain</mat-icon>
                    <input matInput formControlName="xithCollege" placeholder="e.g., S COLLEGE HINGOLI" />
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Percentage Obtained (%)</mat-label>
                    <mat-icon matPrefix>percent</mat-icon>
                    <input matInput type="number" formControlName="xithPercentage" placeholder="e.g., 78.5" min="0" max="100" step="0.01" />
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="savePreviousExams()" [disabled]="savingPrevious">
                  <mat-icon *ngIf="!savingPrevious">save</mat-icon>
                  <mat-spinner *ngIf="savingPrevious" diameter="20"></mat-spinner>
                  <span *ngIf="!savingPrevious">Save Previous Exams</span>
                  <span *ngIf="savingPrevious">Saving...</span>
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- TAB 4: BANK & PAYMENT -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>account_balance</mat-icon>
              <span>Bank Details</span>
            </ng-template>

            <form [formGroup]="bankDetailsForm" class="form-section">
              <!-- BANK ACCOUNT DETAILS -->
              <div class="form-card">
                <h3 class="card-title">Bank Account Information</h3>
                <p class="card-subtitle">For exam fee payment if applicable</p>
                
                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Account Holder Name *</mat-label>
                    <mat-icon matPrefix>account_circle</mat-icon>
                    <input matInput formControlName="accountHolder" required />
                    <mat-error>Account Holder is required</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Relation with Candidate *</mat-label>
                    <mat-icon matPrefix>people</mat-icon>
                    <mat-select formControlName="accountHolderRelation" required>
                      <mat-option value="">- Select -</mat-option>
                      <mat-option value="SELF">SELF</mat-option>
                      <mat-option value="PARENT">Parent</mat-option>
                      <mat-option value="GUARDIAN">Guardian</mat-option>
                    </mat-select>
                    <mat-error>Relation is required</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>IFSC Code *</mat-label>
                    <mat-icon matPrefix>code</mat-icon>
                    <input matInput formControlName="ifscCode" placeholder="e.g., SBIN0020652" required />
                    <mat-error>IFSC Code is required</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Account Number *</mat-label>
                    <mat-icon matPrefix>numbers</mat-icon>
                    <input matInput formControlName="accountNumber" placeholder="e.g., 39144685470" required />
                    <mat-error>Account Number is required</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveBankDetails()" [disabled]="bankDetailsForm.invalid || savingBank">
                  <mat-icon *ngIf="!savingBank">save</mat-icon>
                  <mat-spinner *ngIf="savingBank" diameter="20"></mat-spinner>
                  <span *ngIf="!savingBank">Save Bank Details</span>
                  <span *ngIf="savingBank">Saving...</span>
                </button>
              </div>
            </form>
          </mat-tab>

          <!-- TAB 5: SUMMARY & REVIEW -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>summarize</mat-icon>
              <span>Summary</span>
            </ng-template>

            <div class="summary-content">
              <mat-card class="summary-card">
                <mat-card-header>
                  <mat-card-title>Application Summary</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <div class="summary-sections">
                    <!-- Personal Info Summary -->
                    <div class="summary-section">
                      <h3 class="summary-section-title">Personal Information</h3>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <label>Full Name:</label>
                          <span>{{ profile.lastName }} {{ profile.firstName }} {{ profile.middleName }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Email:</label>
                          <span>{{ profile.email || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Mother's Name:</label>
                          <span>{{ profile.motherName }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Date of Birth:</label>
                          <span>{{ profile.dob || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Gender:</label>
                          <span>{{ profile.gender || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Mobile:</label>
                          <span>{{ profile.mobile || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Aadhar Number:</label>
                          <span>{{ profile.aadhaar || '-' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Address Summary -->
                    <div class="summary-section">
                      <h3 class="summary-section-title">Address Details</h3>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <label>Address:</label>
                          <span>{{ profile.address || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Pincode:</label>
                          <span>{{ profile.pinCode || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>District:</label>
                          <span>{{ profile.district || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Taluka:</label>
                          <span>{{ profile.taluka || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Village:</label>
                          <span>{{ profile.village || '-' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Education Summary -->
                    <div class="summary-section" *ngIf="profile.previousExams && profile.previousExams.length > 0">
                      <h3 class="summary-section-title">Previous Exam Details</h3>
                      <div *ngFor="let exam of profile.previousExams" class="summary-subsection">
                        <h4>{{ exam.examType === 'SSC' ? 'SSC / Equivalent' : exam.examType === 'XI' ? 'XIth Standard' : exam.examType }}</h4>
                        <div class="summary-grid">
                          <div class="summary-item">
                            <label>Seat Number:</label>
                            <span>{{ exam.seatNo || '-' }}</span>
                          </div>
                          <div class="summary-item">
                            <label>Month:</label>
                            <span>{{ exam.month || '-' }}</span>
                          </div>
                          <div class="summary-item">
                            <label>Year:</label>
                            <span>{{ exam.year || '-' }}</span>
                          </div>
                          <div class="summary-item">
                            <label>Board/College:</label>
                            <span>{{ exam.boardOrCollegeName || '-' }}</span>
                          </div>
                          <div class="summary-item">
                            <label>Percentage:</label>
                            <span>{{ exam.percentage || '-' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Bank Details Summary -->
                    <div class="summary-section" *ngIf="profile.bankDetails || bankDetailsForm.get('accountHolder')?.value">
                      <h3 class="summary-section-title">Bank Account Details</h3>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <label>Account Holder:</label>
                          <span>{{ profile.bankDetails?.accountHolder || bankDetailsForm.get('accountHolder')?.value || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Relation:</label>
                          <span>{{ profile.bankDetails?.accountHolderRelation || bankDetailsForm.get('accountHolderRelation')?.value || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>IFSC Code:</label>
                          <span>{{ profile.bankDetails?.ifscCode || bankDetailsForm.get('ifscCode')?.value || '-' }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Account Number:</label>
                          <span>{{ profile.bankDetails?.accountNo || bankDetailsForm.get('accountNumber')?.value || '-' }}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div class="summary-actions">
                    <mat-icon class="success-icon">check_circle</mat-icon>
                    <p class="summary-message">Your profile is complete and ready for exam application submission.</p>
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
      background: #f5f7fa;
      padding: 2rem 1rem;
      font-family: 'Segoe UI', Arial, sans-serif;
    }

    /* Header */
    .profile-header {
      max-width: 1000px;
      margin: 0 auto 2rem;
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .board-header {
      border-bottom: 2px solid #667eea;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }

    .board-header h2 {
      font-size: 1.05rem;
      color: #333;
      margin: 0 0 0.5rem 0;
      font-weight: 600;
    }

    .board-header h3 {
      font-size: 0.95rem;
      color: #667eea;
      margin: 0;
      font-weight: 600;
    }

    .profile-header h1 {
      font-size: 1.8rem;
      color: #333;
      margin: 1rem 0 0.5rem 0;
    }

    .form-info {
      font-size: 0.95rem;
      color: #666;
      margin: 0;
    }

    /* Loading & Error States */
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
    }

    .spinner-wrapper {
      text-align: center;
      color: white;
    }

    .error-banner {
      max-width: 900px;
      margin: 0 auto 2rem;
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-left: 5px solid #f44336;
      border-radius: 8px;
    }

    .error-content h3 {
      margin: 0 0 0.5rem 0;
      color: #f44336;
    }

    .error-content p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    /* Profile Content */
    .profile-content {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    /* Form Sections */
    .form-section {
      padding: 2.5rem;
    }

    .form-card {
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: #f9fafb;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 1rem 0;
    }

    .card-subtitle {
      font-size: 0.9rem;
      color: #666;
      margin: 0.5rem 0 1rem 0;
      font-style: italic;
    }

    /* Form Grids */
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

    .form-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-checkbox-group label {
      font-size: 0.95rem;
      font-weight: 500;
      color: #333;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      justify-content: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .form-actions button {
      min-width: 160px;
      height: 44px;
    }

    /* Summary Section */
    .summary-content {
      padding: 2.5rem;
    }

    .summary-card {
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .summary-sections {
      margin-bottom: 2rem;
    }

    .summary-section {
      margin-bottom: 2rem;
    }

    .summary-section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #667eea;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .summary-item {
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .summary-item label {
      display: block;
      font-weight: 600;
      color: #667eea;
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .summary-item span {
      color: #333;
      font-size: 1rem;
    }

    .summary-actions {
      text-align: center;
      padding: 2rem;
      background: #e8f5e9;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      display: block;
      margin: 0 auto 1rem;
    }

    /* Profile Completion Progress */
    .profile-completion-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem 0;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .completion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1.5rem;
    }

    .completion-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .completion-header mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .completion-text {
      font-size: 0.95rem;
      font-weight: 500;
    }

    .completion-percentage {
      font-size: 1.8rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }

    ::ng-deep .profile-completion-card .mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .completion-message {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .completion-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .completion-message.success {
      background: rgba(76, 175, 80, 0.3);
      color: #c8e6c9;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .student-profile-container {
        padding: 1rem;
      }

      .form-section,
      .summary-content {
        padding: 1.5rem;
      }

      .form-grid-2,
      .form-grid-3,
      .form-grid-4 {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .profile-header {
        padding: 1rem;
      }

      .profile-header h1 {
        font-size: 1.4rem;
      }

      .form-section {
        padding: 1rem;
      }

      .form-card {
        padding: 1rem;
      }

      .card-title {
        font-size: 1rem;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly profileService = inject(StudentProfileService);
  private readonly pincodeService = inject(PincodeService);
  private readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  profile: StudentProfile | null = null;
  boardName = 'CHH. SAMBHAJINAGAR DIVISIONAL BOARD';

  isLoading = true;
  error: string | null = null;
  savingPersonal = false;
  savingExam = false;
  savingPrevious = false;
  savingBank = false;

  // Profile completion tracking
  profileCompletionPercentage = 0;
  profileCompletionCount = 0;
  totalProfileFields = 10; // firstName, lastName, dob, gender, aadhaar, address, pinCode, mobile, sscYear, xithYear

  // Pincode lookup properties
  pincodeOptions: PostalLocation[] = [];
  pincodeLookupLoading = false;
  pincodeError: string | null = null;
  private pincodeSubject = new Subject<string>();

  // Form groups matching oficial Maharashtra HSC exam form structure
  personalDetailsForm: FormGroup;
  previousExamForm: FormGroup;
  bankDetailsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // PERSONAL DETAILS FORM - Exact sequence: Last Name, First Name, Middle Name, Mother's Name
    this.personalDetailsForm = this.fb.group({
      // Names - 2-50 chars, letters/spaces/hyphens/apostrophes
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      
      middleName: ['', [
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]*$/)
      ]],
      
      motherName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      
      // Date of Birth - valid date, not future, age >= 14
      dateOfBirth: ['', this.dateOfBirthValidator.bind(this)],
      
      // Aadhar - 12 digits
      aadharNumber: ['', [
        Validators.pattern(/^\d{12}$|^$/)
      ]],
      
      // Mobile - 10 digits, starts with 6-9
      mobile: ['', [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]],
      
      // Email - valid format
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      
      // Address - 3-100 chars
      addressLineOne: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      
      addressLineTwo: ['', [
        Validators.maxLength(100)
      ]],
      
      addressLineThree: ['', [
        Validators.maxLength(100)
      ]],
      
      // Pincode - 6 digits
      pincode: ['', [
        Validators.required,
        Validators.pattern(/^\d{6}$/)
      ]],
      
      // District - 2-50 chars
      district: ['', [
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      
      // Taluka - 2-50 chars
      taluka: ['', [
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      
      revenueCircle: ['', [
        Validators.maxLength(50)
      ]],
      
      // Village - 1-50 chars
      village: ['', [
        Validators.maxLength(50)
      ]],
      
      // Demographics
      categoryCode: [''],
      minorityReligionCode: [''],
      mediumCode: ['']
    });

    // PREVIOUS EXAM FORM
    this.previousExamForm = this.fb.group({
      sscSeatNo: [''],
      sscMonth: [''],
      sscYear: ['', [
        Validators.pattern(/^\d{4}$|^$/)
      ]],
      sscBoard: [''],
      sscPercentage: ['', [
        Validators.pattern(/^\d+(\.\d{1,2})?$|^$/),
        Validators.min(0),
        Validators.max(100)
      ]],
      xithSeatNo: [''],
      xithMonth: [''],
      xithYear: ['', [
        Validators.pattern(/^\d{4}$|^$/)
      ]],
      xithCollege: [''],
      xithPercentage: ['', [
        Validators.pattern(/^\d+(\.\d{1,2})?$|^$/),
        Validators.min(0),
        Validators.max(100)
      ]]
    });

    // BANK DETAILS FORM
    this.bankDetailsForm = this.fb.group({
      accountHolder: ['', [Validators.required]],
      accountHolderRelation: ['', [Validators.required]],
      ifscCode: ['', [Validators.required]],
      accountNumber: ['', [Validators.required]]
    });
  }

  /**
   * Async validator: Converts input to UPPERCASE as user types
   * Applied to all name fields
   */
  /**
   * Custom validator for date of birth
   * Validates:
   * - Valid date format
   * - Not in the future
   * - Age >= 14 years
   */
  dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const dob = new Date(control.value);
    const today = new Date();

    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return { invalidDate: { value: control.value } };
    }

    // Check if date is in the future
    if (dob > today) {
      return { futureDate: { value: control.value } };
    }

    // Check if age is at least 14 years
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 14) {
      return { minimumAge: { requiredAge: 14, actualAge: age } };
    }

    return null;
  }

  ngOnInit() {
    this.setupNameFieldTransformers();
    this.loadProfile();
    this.setupPincodeLookup();
  }

  /**
   * Setup uppercase transformation for name fields
   * Converts input to uppercase as user types
   */
  private setupNameFieldTransformers() {
    const nameFields = ['lastName', 'firstName', 'middleName', 'motherName'];
    nameFields.forEach(fieldName => {
      const control = this.personalDetailsForm.get(fieldName);
      if (control) {
        control.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(value => {
          if (value && value !== value.toUpperCase()) {
            control.setValue(value.toUpperCase(), { emitEvent: false });
          }
        });
      }
    });
  }

  /**
   * Setup pincode lookup with debounce and auto-fill
   */
  private setupPincodeLookup() {
    this.pincodeSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((pincode: string) => {
      if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        this.pincodeLookupLoading = true;
        this.pincodeError = null;
        this.pincodeOptions = [];

        this.pincodeService.getPincodeDetails(pincode).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (locations: PostalLocation[]) => {
            this.pincodeOptions = locations;
            this.pincodeLookupLoading = false;
            if (locations.length === 0) {
              this.pincodeError = 'No results found for this pincode';
            }
          },
          error: (err) => {
            console.error('Pincode lookup error:', err);
            this.pincodeError = 'Unable to fetch pincode details. Please try again.';
            this.pincodeLookupLoading = false;
          }
        });
      } else if (pincode.length > 0) {
        this.pincodeOptions = [];
        this.pincodeError = 'Please enter a valid 6-digit pincode';
      } else {
        this.pincodeOptions = [];
        this.pincodeError = null;
      }
    });
  }

  loadProfile() {
    this.isLoading = true;
    this.error = null;

    this.profileService.loadProfile()
      .then((profile: any) => {
        this.profile = profile as StudentProfile;
        
        // Bind personal details form
        this.personalDetailsForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          middleName: profile.middleName || '',
          motherName: profile.motherName || '',
          dateOfBirth: profile.dob || '',
          gender: profile.gender || '',
          aadharNumber: profile.aadhaar || '',
          addressLineOne: profile.address || '',
          pincode: profile.pinCode || '',
          mobile: profile.mobile || '',
          email: profile.email || '',
          streamCode: profile.streamCode || '',
          district: profile.district || '',
          taluka: profile.taluka || '',
          village: profile.village || '',
          categoryCode: profile.categoryCode || '',
          minorityReligionCode: profile.minorityReligionCode || '',
          mediumCode: profile.mediumCode || ''
        });

        // Bind previous exam form from previousExams array
        if (profile.previousExams && Array.isArray(profile.previousExams)) {
          // Find SSC and XIth exams from the array
          const sscExam = profile.previousExams.find((e: any) => e.examType === 'SSC');
          const xithExam = profile.previousExams.find((e: any) => e.examType === 'XI');

          this.previousExamForm.patchValue({
            sscSeatNo: sscExam?.seatNo || '',
            sscMonth: sscExam?.month || '',
            sscYear: sscExam?.year || '',
            sscBoard: sscExam?.boardOrCollegeName || '',
            sscPercentage: sscExam?.percentage || '',
            xithSeatNo: xithExam?.seatNo || '',
            xithMonth: xithExam?.month || '',
            xithYear: xithExam?.year || '',
            xithCollege: xithExam?.boardOrCollegeName || '',
            xithPercentage: xithExam?.percentage || ''
          });
        }

        // Calculate profile completion
        this.calculateProfileCompletion(profile);

        this.isLoading = false;
      })
      .catch((err: any) => {
        console.error('Failed to load profile:', err);
        const errorMsg = err?.error?.message || 'Failed to load profile. Please try again.';
        this.error = errorMsg;
        this.isLoading = false;
      });
  }

  /**
   * Calculate profile completion percentage
   * Counts non-empty required fields
   */
  private calculateProfileCompletion(profile: any) {
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

    // Check personal details
    requiredFields.forEach(field => {
      const value = profile[field];
      if (value && value !== null && value !== '') {
        completedCount++;
      }
    });

    // Check previous exams (at least one exam year)
    const hasPreviousExams = profile.previousExams && 
      profile.previousExams.some((e: any) => e.year);
    if (hasPreviousExams) {
      completedCount++;
    }

    // Check mobile from user data
    const hasMobile = profile.mobile || this.profile?.mobile;
    
    this.profileCompletionCount = completedCount;
    this.profileCompletionPercentage = Math.round((completedCount / this.totalProfileFields) * 100);
  }

  /**
   * Calculate if profile is complete (for exam application validation)
   */
  isProfileComplete(): boolean {
    return this.profileCompletionPercentage === 100;
  }

  retryLoadProfile() {
    this.loadProfile();
  }

  savePersonalDetails() {
    if (this.personalDetailsForm.valid) {
      this.savingPersonal = true;
      this.profileService.updatePersonalDetails(this.personalDetailsForm.value);
      setTimeout(() => {
        this.savingPersonal = false;
        this.snackBar.open('✓ Personal details saved', '', { duration: 3000 });
      }, 1500);
    }
  }

  savePreviousExams() {
    this.savingPrevious = true;
    this.profileService.updatePreviousExams(this.previousExamForm.value);
    setTimeout(() => {
      this.savingPrevious = false;
      this.snackBar.open('✓ Previous exam details saved', '', { duration: 3000 });
    }, 1500);
  }

  saveBankDetails() {
    if (this.bankDetailsForm.valid) {
      this.savingBank = true;
      const bankData = {
        accountHolder: this.bankDetailsForm.get('accountHolder')?.value,
        accountHolderRelation: this.bankDetailsForm.get('accountHolderRelation')?.value,
        ifscCode: this.bankDetailsForm.get('ifscCode')?.value,
        accountNumber: this.bankDetailsForm.get('accountNumber')?.value
      };
      this.profileService.updateBankDetails(bankData);
      setTimeout(() => {
        this.savingBank = false;
        this.snackBar.open('✓ Bank details saved successfully', '', { duration: 3000 });
      }, 1500);
    }
  }

  /**
   * Handle pincode input with debounce
   */
  onPincodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const pincode = input.value.trim();
    this.pincodeSubject.next(pincode);
  }

  /**
   * Handle pincode selection from autocomplete dropdown
   * Auto-fills district, taluka, and village
   */
  onPincodeSelected(event: MatAutocompleteSelectedEvent) {
    const selectedPincode = event.option.value;
    const location = this.pincodeOptions.find(loc => loc.pincode === selectedPincode);
    
    if (location) {
      // Auto-fill address fields
      this.personalDetailsForm.patchValue({
        pincode: location.pincode,
        district: location.district,
        taluka: location.taluka,
        village: location.village || location.officeName || ''
      });

      // Clear autocomplete options and error
      this.pincodeOptions = [];
      this.pincodeError = null;
      
      this.snackBar.open('✓ Address details auto-filled from pincode', '', { duration: 2000 });
    }
  }

  /**
   * Get readable error message for form field validation errors
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minLength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minLength'].requiredLength} characters`;
    if (errors['maxLength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxLength'].requiredLength} characters`;
    if (errors['email']) return 'Invalid email format';
    if (errors['pattern']) {
      if (fieldName.includes('mobile')) return 'Mobile number must be 10 digits and start with 6-9';
      if (fieldName.includes('aadhar')) return 'Aadhar number must be exactly 12 digits';
      if (fieldName.includes('pincode')) return 'Pincode must be exactly 6 digits';
      if (fieldName.includes('Name')) return 'Can only contain letters, spaces, hyphens, and apostrophes';
      if (fieldName.includes('Year')) return 'Year must be 4 digits';
      return 'Invalid format';
    }
    if (errors['invalidDate']) return 'Invalid date format';
    if (errors['futureDate']) return 'Date of birth cannot be in the future';
    if (errors['minimumAge']) return `Must be at least ${errors['minimumAge'].requiredAge} years old`;

    return Object.keys(errors)[0];
  }

  /**
   * Get readable field label from field name
   */
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      motherName: 'Mother\'s Name',
      dateOfBirth: 'Date of Birth',
      aadharNumber: 'Aadhar Number',
      mobile: 'Mobile Number',
      email: 'Email',
      addressLineOne: 'Address Line 1',
      addressLineTwo: 'Address Line 2',
      addressLineThree: 'Address Line 3',
      pincode: 'Pincode',
      district: 'District',
      taluka: 'Taluka',
      village: 'Village'
    };
    return labels[fieldName] || fieldName;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
