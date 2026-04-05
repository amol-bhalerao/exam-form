import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
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
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';

import { StudentProfileService, StudentProfile } from '../../core/student-profile.service';
import { I18nService } from '../../core/i18n.service';
import { PincodeService, PostalLocation } from '../../core/pincode.service';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'always' }
    }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatProgressBarModule,
    RouterModule
  ],
  template: `
    <div class="student-profile-container">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="board-header">
          <h2>HSC Exam Management System</h2>
          <h3 id="divisional-board">{{ examPortalName }}</h3>
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
              <li>Mobile number should be current - you may receive important exam notifications</li>
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
        <mat-tab-group
          class="profile-tabs"
          [selectedIndex]="selectedTabIndex"
          (selectedIndexChange)="selectedTabIndex = $event">
          
          <!-- TAB 0: INSTITUTE & STREAM SELECTION -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>school</mat-icon>
              <span>Institute & Stream</span>
            </ng-template>

            <div class="form-section">
              <div class="form-card">
                <h3 class="card-title">Institute & Stream Selection</h3>
                <p class="card-subtitle">Select your institute and academic stream</p>

                <div class="form-grid-2">
                  <mat-form-field class="example-full-width">
                    <mat-label>Institute</mat-label>
                    <input 
                    type="text" 
                    matInput 
                    [formControl]="selectedInstitute" 
                    [matAutocomplete]="instituteAuto">
                    <mat-autocomplete #instituteAuto="matAutocomplete" [displayWith]="displayInstituteName.bind(this)" (optionSelected)="onInstituteAutocompleteSelected($event)">
                      @for (inst of getFilteredInstitutes() | async; track inst) {
                        <mat-option [value]="inst">{{inst.name}}</mat-option>
                      }
                    </mat-autocomplete>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Stream *</mat-label>
                    <mat-icon matPrefix>layers</mat-icon>
                    <mat-select [(ngModel)]="selectedStreamCode" required>
                      <mat-option value="">- Select Stream -</mat-option>
                      <mat-option *ngFor="let stream of streams" [value]="stream.name">
                        {{ stream.name }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-raised-button color="primary" 
                          (click)="saveInstituteSelection()"
                          [disabled]="!selectedInstituteId || !selectedStreamCode || savingInstitute">
                    <mat-icon *ngIf="!savingInstitute">check_circle</mat-icon>
                    <mat-spinner *ngIf="savingInstitute" diameter="20"></mat-spinner>
                    <span *ngIf="!savingInstitute">{{ profile?.instituteId ? 'Update' : 'Save' }} Institute & Stream</span>
                    <span *ngIf="savingInstitute">Saving...</span>
                  </button>

                  <button mat-stroked-button type="button" (click)="goToNextTab(1)" [disabled]="!profile?.instituteId && !selectedInstituteId">
                    Next
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                  
                  <div class="institute-info" *ngIf="profile?.instituteId">
                    <mat-icon>check_circle</mat-icon>
                    <span>Current: {{ getInstituteLabel(profile.instituteId) }} • {{ profile.streamCode }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
          
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
                    <input matInput formControlName="lastName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'lastName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Candidate's Name (First Name) *</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="firstName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'firstName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Middle / Father's Name</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="middleName" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'middleName') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Mother's Name *</mat-label>
                    <mat-icon matPrefix>family_restroom</mat-icon>
                    <input matInput formControlName="motherName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'motherName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Date of Birth (DD/MM/YYYY) *</mat-label>
                    <mat-icon matPrefix>cake</mat-icon>
                    <input matInput formControlName="dateOfBirth" [matDatepicker]="picker" />
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'dateOfBirth') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Gender *</mat-label>
                    <mat-icon matPrefix>wc</mat-icon>
                    <mat-select formControlName="gender" required>
                      <mat-option value="">- Select Gender -</mat-option>
                      <mat-option value="Male">Male</mat-option>
                      <mat-option value="Female">Female</mat-option>
                      <mat-option value="Other">Other</mat-option>
                      <mat-option value="Prefer Not to Say">Prefer Not to Say</mat-option>
                    </mat-select>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'gender') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Aadhar Number</mat-label>
                    <mat-icon matPrefix>badge</mat-icon>
                    <input matInput formControlName="aadharNumber" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'aadharNumber') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>APAAR ID (12-digit)</mat-label>
                    <mat-icon matPrefix>verified_user</mat-icon>
                    <input matInput formControlName="apaarId" placeholder="e.g., APAAR123456" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'apaarId') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Mobile Number *</mat-label>
                    <mat-icon matPrefix>phone</mat-icon>
                    <input matInput formControlName="mobile" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'mobile') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Login Email (Google)</mat-label>
                    <mat-icon matPrefix>email</mat-icon>
                    <input matInput [value]="profile?.email || auth.user()?.username || ''" readonly />
                    <mat-hint>This email is automatically taken from your Google sign-in.</mat-hint>
                  </mat-form-field>
                </div>
              </div>

              <!-- ADDRESS DETAILS -->
              <div class="form-card">
                <h3 class="card-title">Address Details</h3>
                
                <mat-form-field class="form-field-full">
                  <mat-label>Complete Address *</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <textarea matInput formControlName="addressLineOne" rows="3" required></textarea>
                  <mat-hint>Enter full address in one field.</mat-hint>
                  <mat-error>{{ getErrorMessage(personalDetailsForm, 'addressLineOne') }}</mat-error>
                </mat-form-field>

                <div class="form-grid-4">
                  <mat-form-field class="form-field">
                    <mat-label>Pincode *</mat-label>
                    <mat-icon matPrefix>location_on</mat-icon>
                    <input matInput 
                           formControlName="pincode" 
 
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
                    <input matInput formControlName="district" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'district') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Taluka</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="taluka" />
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
                    <input matInput formControlName="village" />
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
                      <mat-option value="">-- Select Category --</mat-option>
                      <mat-option value="GEN">General</mat-option>
                      <mat-option value="OBC">OBC</mat-option>
                      <mat-option value="SC">SC</mat-option>
                      <mat-option value="ST">ST</mat-option>
                      <mat-option value="NT">NT</mat-option>
                    </mat-select>
                    <mat-hint>Select your social category</mat-hint>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Minority Religion</mat-label>
                    <mat-icon matPrefix>people</mat-icon>
                    <mat-select formControlName="minorityReligionCode">
                      <mat-option value="">-- Select Minority Religion --</mat-option>
                      <mat-option value="MUSLIM">Muslim</mat-option>
                      <mat-option value="CHRISTIAN">Christian</mat-option>
                      <mat-option value="SIKH">Sikh</mat-option>
                      <mat-option value="BUDDHIST">Buddhist</mat-option>
                      <mat-option value="PARSI">Parsi</mat-option>
                      <mat-option value="JEWISH">Jewish</mat-option>
                    </mat-select>
                    <mat-hint>Select minority religion if applicable</mat-hint>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Medium of Study</mat-label>
                    <mat-icon matPrefix>language</mat-icon>
                    <mat-select formControlName="mediumCode">
                      <mat-option value="">-- Select Medium of Study --</mat-option>
                      <mat-option value="MARATHI">Marathi</mat-option>
                      <mat-option value="HINDI">Hindi</mat-option>
                      <mat-option value="ENGLISH">English</mat-option>
                      <mat-option value="URDU">Urdu</mat-option>
                    </mat-select>
                    <mat-hint>Select the language medium you studied in</mat-hint>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="goToPreviousTab()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-raised-button color="primary" (click)="savePersonalDetails()" [disabled]="personalDetailsForm.invalid || savingPersonal">
                  <mat-icon *ngIf="!savingPersonal">save</mat-icon>
                  <mat-spinner *ngIf="savingPersonal" diameter="20"></mat-spinner>
                  <span *ngIf="!savingPersonal">Save / Update Personal Details</span>
                  <span *ngIf="savingPersonal">Saving...</span>
                </button>
                <button mat-stroked-button type="button" (click)="goToNextTab(2)">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
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
                    <input matInput formControlName="sscSeatNo" />
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
                    <input matInput type="number" formControlName="sscYear" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Board / College</mat-label>
                    <mat-icon matPrefix>domain</mat-icon>
                    <input matInput formControlName="sscBoard" />
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Percentage Obtained (%)</mat-label>
                    <mat-icon matPrefix>percent</mat-icon>
                    <input matInput type="number" formControlName="sscPercentage" min="0" max="100" step="0.01" />
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
                    <input matInput formControlName="xithSeatNo" />
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
                    <input matInput type="number" formControlName="xithYear" />
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Jr. College</mat-label>
                    <mat-icon matPrefix>domain</mat-icon>
                    <input matInput formControlName="xithCollege" />
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>Percentage Obtained (%)</mat-label>
                    <mat-icon matPrefix>percent</mat-icon>
                    <input matInput type="number" formControlName="xithPercentage" min="0" max="100" step="0.01" />
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="goToPreviousTab()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-raised-button color="primary" (click)="savePreviousExams()" [disabled]="savingPrevious">
                  <mat-icon *ngIf="!savingPrevious">save</mat-icon>
                  <mat-spinner *ngIf="savingPrevious" diameter="20"></mat-spinner>
                  <span *ngIf="!savingPrevious">Save / Update Previous Exams</span>
                  <span *ngIf="savingPrevious">Saving...</span>
                </button>
                <button mat-stroked-button type="button" (click)="goToNextTab(3)">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
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
                    <input matInput formControlName="ifscCode" required style="text-transform: uppercase;" />
                    <mat-error>IFSC Code is required</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>Account Number *</mat-label>
                    <mat-icon matPrefix>numbers</mat-icon>
                    <input matInput formControlName="accountNumber" required />
                    <mat-error>Account Number is required</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <div class="form-actions">
                <button mat-stroked-button type="button" (click)="goToPreviousTab()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <button mat-raised-button color="primary" (click)="saveBankDetails()" [disabled]="bankDetailsForm.invalid || savingBank">
                  <mat-icon *ngIf="!savingBank">save</mat-icon>
                  <mat-spinner *ngIf="savingBank" diameter="20"></mat-spinner>
                  <span *ngIf="!savingBank">Save / Update Bank Details</span>
                  <span *ngIf="savingBank">Saving...</span>
                </button>
                <button mat-stroked-button type="button" (click)="goToNextTab(4)">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
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
                        <div class="summary-item">
                          <label>APAAR ID:</label>
                          <span>{{ profile.apaarId || '-' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Demographics Summary -->
                    <div class="summary-section">
                      <h3 class="summary-section-title">Demographics & Personal Information</h3>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <label>Category:</label>
                          <span>{{ getCategoryLabel(profile.categoryCode) }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Minority Religion:</label>
                          <span>{{ getReligionLabel(profile.minorityReligionCode) }}</span>
                        </div>
                        <div class="summary-item">
                          <label>Medium of Study:</label>
                          <span>{{ getMediumLabel(profile.mediumCode) }}</span>
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
    /* ============================================================
       CSS VARIABLES - Define responsive values
       ============================================================ */
    :host {
      --spacing-xs: 0.5rem;
      --spacing-sm: 1rem;
      --spacing-md: 1.5rem;
      --spacing-lg: 2rem;
      --spacing-xl: 2.5rem;
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --primary-color: #667eea;
      --primary-dark: #764ba2;
      --text-primary: #333;
      --text-secondary: #666;
      --bg-light: #f5f7fa;
      --bg-lighter: #f9fafb;
      --border-color: #e0e0e0;
      --font-size-base: 1rem;
      --font-size-sm: 0.95rem;
      --font-size-xs: 0.85rem;
      /* Responsive typography */
      --heading-2-size: clamp(1rem, 5vw, 1.8rem);
      --heading-3-size: clamp(0.95rem, 3vw, 1.3rem);
      --body-size: clamp(0.9rem, 2vw, 1rem);
      --button-height: clamp(40px, 10vw, 44px);
    }

    /* ============================================================
       BASE STYLES - Mobile-first approach
       ============================================================ */
    * {
      box-sizing: border-box;
    }

    .student-profile-container {
      min-height: 100vh;
      background: var(--bg-light);
      padding: var(--spacing-sm);
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .profile-header {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto var(--spacing-md);
      text-align: center;
      background: white;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .board-header {
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }

    .board-header h2 {
      font-size: clamp(0.85rem, 3vw, 1.05rem);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .board-header h3 {
      font-size: clamp(0.8rem, 2.5vw, 0.95rem);
      color: var(--primary-color);
      margin: 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .profile-header h1 {
      font-size: var(--heading-2-size);
      color: var(--text-primary);
      margin: var(--spacing-sm) 0 var(--spacing-xs) 0;
      font-weight: 700;
    }

    .form-info {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
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
      padding: var(--spacing-sm);
    }

    .spinner-wrapper {
      text-align: center;
      color: white;
      background: rgba(0, 0, 0, 0.7);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-sm);
    }

    .spinner-wrapper p {
      margin-top: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .error-banner {
      width: 100%;
      max-width: 900px;
      margin: 0 auto var(--spacing-md);
      display: flex;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: white;
      border-left: 5px solid #f44336;
      border-radius: var(--border-radius-sm);
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .error-banner mat-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .error-content {
      flex: 1;
      min-width: 200px;
    }

    .error-content h3 {
      margin: 0 0 var(--spacing-xs) 0;
      color: #f44336;
      font-size: var(--heading-3-size);
    }

    .error-content p {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      line-height: 1.5;
    }

    .error-content button {
      width: 100%;
    }

    /* Profile Content */
    .profile-content {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: var(--border-radius);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    /* Tab Styles */
    ::ng-deep .profile-tabs .mat-mdc-tab-header {
      background: white;
      border-bottom: 2px solid var(--border-color);
    }

    ::ng-deep .profile-tabs .mat-mdc-tab-labels {
      background: white;
    }

    ::ng-deep .profile-tabs .mdc-tab__text-label {
      font-size: clamp(0.75rem, 2vw, 0.95rem) !important;
    }

    /* Form Sections */
    .form-section {
      padding: var(--spacing-md);
      width: 100%;
    }

    .form-card {
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--bg-lighter);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      border-left: 4px solid var(--primary-color);
    }

    .card-title {
      font-size: var(--heading-3-size);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .card-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: var(--spacing-xs) 0 var(--spacing-sm) 0;
      font-style: italic;
      line-height: 1.5;
    }

    /* Form Grids - Mobile-first, progressive enhancement */
    .form-grid-2,
    .form-grid-3,
    .form-grid-4 {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .form-field {
      width: 100%;
    }

    .form-field-full {
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    .form-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .form-checkbox-group label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    /* Form Actions - Stack on mobile, row on desktop */
    .form-actions {
      display: flex;
      flex-direction: column-reverse;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--border-color);
      width: 100%;
    }

    .form-actions button {
      width: 100%;
      min-height: var(--button-height);
      font-size: var(--font-size-sm);
      font-weight: 600;
      white-space: nowrap;
      padding: 0 var(--spacing-sm);
    }

    /* Summary Section */
    .summary-content {
      padding: var(--spacing-md);
      width: 100%;
    }

    .summary-card {
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .summary-sections {
      margin-bottom: var(--spacing-md);
    }

    .summary-section {
      margin-bottom: var(--spacing-md);
    }

    .summary-section-title {
      font-size: var(--heading-3-size);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-md) 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--primary-color);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .summary-item {
      padding: var(--spacing-md);
      background: var(--bg-lighter);
      border-radius: var(--border-radius-sm);
      border-left: 4px solid var(--primary-color);
      word-break: break-word;
    }

    .summary-item label {
      display: block;
      font-weight: 600;
      color: var(--primary-color);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      margin-bottom: var(--spacing-xs);
      letter-spacing: 0.5px;
    }

    .summary-item span {
      color: var(--text-primary);
      font-size: var(--font-size-base);
      line-height: 1.6;
      display: block;
      word-wrap: break-word;
    }

    .summary-actions {
      text-align: center;
      padding: var(--spacing-md);
      background: #e8f5e9;
      border-radius: var(--border-radius-sm);
      margin-top: var(--spacing-md);
    }

    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      display: block;
      margin: 0 auto var(--spacing-sm);
    }

    /* Profile Completion Progress */
    .profile-completion-card {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      border-radius: var(--border-radius);
      padding: var(--spacing-md);
      margin: var(--spacing-md) 0;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .completion-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
    }

    .completion-header h3 {
      margin: 0;
      font-size: var(--heading-3-size);
      font-weight: 700;
      flex: 1;
      min-width: 150px;
    }

    .completion-header mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .progress-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .completion-text {
      font-size: var(--font-size-sm);
      font-weight: 500;
      flex: 1;
      min-width: 150px;
    }

    .completion-percentage {
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      font-weight: 800;
      background: rgba(255, 255, 255, 0.2);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      min-width: 70px;
      text-align: center;
    }

    ::ng-deep .profile-completion-card .mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }

    .completion-message {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      margin: 0;
      padding: var(--spacing-sm);
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--border-radius-sm);
      font-size: var(--font-size-sm);
      font-weight: 500;
      line-height: 1.5;
    }

    .completion-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .completion-message.success {
      background: rgba(76, 175, 80, 0.3);
      color: #c8e6c9;
    }

    /* Instructions Card */
    .instructions-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--spacing-sm);
      background: #fffbea;
      border-left: 4px solid #ff9800;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-sm);
      margin: var(--spacing-md) 0;
      align-items: start;
    }

    .instructions-card mat-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .instructions-content {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      line-height: 1.6;
    }

    .instructions-content p {
      margin: 0 0 var(--spacing-sm) 0;
      font-weight: 600;
    }

    .instructions-content ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .instructions-content li {
      margin-bottom: 0.5rem;
    }

    .instructions-content strong {
      color: #ff9800;
    }

    /* ============================================================
       RESPONSIVE BREAKPOINTS - Tablet and Desktop
       ============================================================ */
    
    /* Tablet: 600px+ */
    @media (min-width: 600px) {
      :host {
        --spacing-sm: 1.25rem;
        --spacing-md: 1.75rem;
        --spacing-lg: 2.25rem;
      }

      .student-profile-container {
        padding: var(--spacing-sm);
      }

      .profile-header {
        padding: var(--spacing-lg);
      }

      .form-section,
      .summary-content {
        padding: var(--spacing-lg);
      }

      .form-card,
      .summary-item {
        padding: var(--spacing-lg);
      }

      .form-actions {
        flex-direction: row;
        justify-content: flex-end;
      }

      .form-actions button {
        width: auto;
        min-width: 140px;
      }

      .error-banner {
        flex-wrap: nowrap;
        align-items: center;
      }

      .error-content button {
        width: auto;
      }

      .instructions-card {
        padding: var(--spacing-lg);
      }
    }

    /* Small Tablet: 768px+ */
    @media (min-width: 768px) {
      .form-grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-grid-3 {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .progress-stats {
        flex-wrap: nowrap;
      }

      .completion-text {
        flex: 1;
      }
    }

    /* Laptop: 960px+ */
    @media (min-width: 960px) {
      .form-grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .form-grid-4 {
        grid-template-columns: repeat(3, 1fr);
      }

      .summary-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* Desktop: 1200px+ */
    @media (min-width: 1200px) {
      .form-grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .form-grid-4 {
        grid-template-columns: repeat(4, 1fr);
      }

      .summary-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    /* ============================================================
       MOBILE OPTIMIZATIONS - Touch-friendly, readable
       ============================================================ */
    
    @media (max-width: 599px) {
      :host {
        --spacing-xs: 0.4rem;
        --spacing-sm: 0.8rem;
        --button-height: 40px;
      }

      .student-profile-container {
        padding: 0;
      }

      .profile-header,
      .profile-content,
      .error-banner {
        border-radius: 0;
        margin-left: 0;
        margin-right: 0;
      }

      .profile-header {
        margin-bottom: var(--spacing-md);
      }

      .board-header {
        padding-bottom: var(--spacing-xs);
        margin-bottom: var(--spacing-xs);
      }

      .form-card {
        border-radius: var(--border-radius-sm);
      }

      ::ng-deep .profile-tabs .mdc-tab__text-label {
        padding: 0 8px !important;
      }

      .instructions-card {
        grid-template-columns: 24px 1fr;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
      }

      .instructions-content ul {
        padding-left: 1rem;
      }

      .instructions-content li {
        margin-bottom: 0.4rem;
        font-size: 0.85rem;
      }
    }

    /* Extra Small Phone: 360px - 480px */
    @media (max-width: 480px) {
      .board-header h2 {
        font-size: 0.8rem;
      }

      .board-header h3 {
        font-size: 0.75rem;
      }

      .profile-header h1 {
        font-size: 1.3rem;
        margin: 0.75rem 0 0.5rem 0;
      }

      .form-info {
        font-size: 0.85rem;
      }

      .form-card {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
      }

      .card-title {
        font-size: 0.95rem;
      }

      .completion-percentage {
        min-width: 60px;
        font-size: 1.2rem;
      }

      .error-content h3 {
        font-size: 1rem;
      }

      .error-content p {
        font-size: 0.8rem;
      }

      .form-actions {
        gap: var(--spacing-xs);
      }

      .form-actions button {
        min-height: 40px;
        font-size: 0.85rem;
      }
    }

    /* Large Desktop: 1400px+ */
    @media (min-width: 1400px) {
      .student-profile-container {
        padding: 2rem;
      }

      .profile-header {
        margin-bottom: 2rem;
      }

      .form-section,
      .summary-content {
        padding: 3rem;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly profileService = inject(StudentProfileService);
  private readonly pincodeService = inject(PincodeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  profile: StudentProfile | null = null;
  examPortalName = 'Powered by Hisoft IT Solutions';

  isLoading = true;
  error: string | null = null;
  savingPersonal = false;
  savingExam = false;
  savingPrevious = false;
  savingBank = false;
  savingInstitute = false;

  // Institute and Stream selection
  institutes: any[] = [];
  institutesMap: Map<number, any> = new Map(); // Map of ID -> institute object for quick lookup
  selectedInstitute = new FormControl(null); // FormControl for institute autocomplete
  filteredInstitutes$: Observable<any[]> = of([]); // Observable for filtered institutes
  streams: any[] = [];
  selectedInstituteId: number | null = null;
  selectedStreamCode: string | null = null;

  // Profile completion tracking
  profileCompletionPercentage = 0;
  profileCompletionCount = 0;
  totalProfileFields = 11; // firstName, lastName, dob, gender, aadhaar, address, pinCode, mobile, email, sscYear, xithYear

  // Active tab index for auto-navigation after save
  selectedTabIndex = 0;

  // Pincode lookup properties
  pincodeOptions: PostalLocation[] = [];
  pincodeLookupLoading = false;
  pincodeError: string | null = null;
  private pincodeSubject = new Subject<string>();

  // Form groups matching HSC exam form structure
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
      dateOfBirth: ['', [Validators.required, this.dateOfBirthValidator.bind(this)]],

      // Gender - required
      gender: ['', Validators.required],

      // Aadhar - exactly 12 digits
      aadharNumber: ['', [
        Validators.minLength(12),
        Validators.maxLength(12),
        Validators.pattern(/^\d{12}$|^$/)
      ]],

      // APAAR ID - Automated Permanent Academic Account Registry (12 characters)
      apaarId: ['', [
        Validators.minLength(12),
        Validators.maxLength(12),
        Validators.pattern(/^[0-9A-Za-z]*$/)
      ]],

      // Mobile - exactly 10 digits, starts with 6-9
      mobile: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^[6-9]\d{9}$/)
      ]],

      // Email - shown from Google sign-in and kept read-only in the UI
      email: ['', [
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

      // Pincode - exactly 6 digits
      pincode: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
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
      sscSeatNo: ['', [
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]*$/)
      ]],
      sscMonth: [''],
      sscYear: ['', [
        Validators.minLength(4),
        Validators.maxLength(4),
        Validators.pattern(/^\d{4}$|^$/)
      ]],
      sscBoard: [''],
      sscPercentage: ['', [
        Validators.minLength(1),
        Validators.maxLength(5),
        Validators.pattern(/^\d+(\.\d{1,2})?$|^$/),
        Validators.min(0),
        Validators.max(100)
      ]],
      xithSeatNo: ['', [
        Validators.maxLength(10),
        Validators.pattern(/^[a-zA-Z0-9]*$/)
      ]],
      xithMonth: [''],
      xithYear: ['', [
        Validators.minLength(4),
        Validators.maxLength(4),
        Validators.pattern(/^\d{4}$|^$/)
      ]],
      xithCollege: ['', [
        Validators.maxLength(100)
      ]],
      xithPercentage: ['', [
        Validators.minLength(1),
        Validators.maxLength(5),
        Validators.pattern(/^\d+(\.\d{1,2})?$|^$/),
        Validators.min(0),
        Validators.max(100)
      ]]
    });

    // BANK DETAILS FORM
    this.bankDetailsForm = this.fb.group({
      accountHolder: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      accountHolderRelation: ['', [Validators.required]],
      ifscCode: ['', [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      ]],
      accountNumber: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(18),
        Validators.pattern(/^\d{8,18}$/)
      ]]
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
    this.setupPincodeLookup();
    this.setupInstituteAutocomplete();
    // Load institutes and streams FIRST, then load profile
    // This ensures institutes array is populated before pre-population logic runs
    this.loadInstitutesAndStreams().then(() => {
      this.loadProfile();
    });
  }

  /**
   * Setup uppercase transformation for name fields
   * Converts input to uppercase as user types
   */
  private setupNameFieldTransformers() {
    const nameFields = ['lastName', 'firstName', 'middleName', 'motherName'];
    const seatFields = ['sscSeatNo', 'xithSeatNo'];

    // Uppercase transformers for name fields
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

    // Uppercase transformers for seat numbers
    seatFields.forEach(fieldName => {
      const control = this.previousExamForm.get(fieldName);
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

    // Uppercase IFSC while typing so validation passes for lowercase input too
    const ifscControl = this.bankDetailsForm.get('ifscCode');
    if (ifscControl) {
      ifscControl.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(value => {
        if (value && value !== value.toUpperCase()) {
          ifscControl.setValue(value.toUpperCase(), { emitEvent: false });
        }
      });
    }
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

        // Pre-populate institute and stream selections if already set
        if (profile.instituteId) {
          this.selectedInstituteId = profile.instituteId;
          const institute = this.institutesMap.get(profile.instituteId);
          if (institute) {
            this.selectedInstitute.setValue(institute); // Set the full object to FormControl
          }
        }
        if (profile.streamCode) {
          this.selectedStreamCode = profile.streamCode;
        }

        // Bind personal details form
        this.personalDetailsForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          middleName: profile.middleName || '',
          motherName: profile.motherName || '',
          dateOfBirth: profile.dob || '',
          gender: profile.gender || '',
          aadharNumber: profile.aadhaar || '',
          apaarId: profile.apaarId || '',
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

        // Bind bank details form
        this.bankDetailsForm.patchValue({
          accountHolder: profile.bankDetails?.accountHolder || '',
          accountHolderRelation: profile.bankDetails?.accountHolderRelation || '',
          ifscCode: profile.bankDetails?.ifscCode || '',
          accountNumber: profile.bankDetails?.accountNumber || profile.bankDetails?.accountNo || ''
        });

        // Calculate profile completion
        this.calculateProfileCompletion(profile);

        this.isLoading = false;
      })
      .catch((err: any) => {

        // Extract error code from multiple possible locations
        const errorCode = err?.error?.error || err?.error?.status || err?.message || '';
        const serverMessage = err?.error?.message || err?.message || '';

        // Determine the error type and appropriate message
        let errorMsg = 'Failed to load profile. Please try again.';
        let isInstituteError = false;

        // Check if this is specifically an institute not selected error
        if (
          errorCode === 'INSTITUTE_NOT_SELECTED' ||
          errorCode?.includes('INSTITUTE') ||
          serverMessage?.includes('institute') ||
          !this.profile // If profile couldn't be loaded at all
        ) {
          isInstituteError = true;
          errorMsg = 'Please select your institute and stream first before completing your profile.';
        } else if (errorCode === 'STUDENT_PROFILE_MISSING' || errorCode === 404) {
          isInstituteError = true;
          errorMsg = 'Please select your institute and stream first before completing your profile.';
        } else {
          // Generic error
          errorMsg = err?.error?.message || 'Failed to load profile. Please try again.';
        }

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

  /**
   * Setup institute autocomplete filtering - creates Observable from form control
   */
  private setupInstituteAutocomplete() {
    this.filteredInstitutes$ = this.selectedInstitute.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInstitutes(value)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Filter institutes based on search term (internal helper)
   */
  private _filterInstitutes(value: any): any[] {
    if (!this.institutes || this.institutes.length === 0) {
      return [];
    }
    // If value is an object, show all institutes (user selected something)
    if (value && typeof value === 'object' && value.id) {
      return this.institutes;
    }
    // Filter by user input text
    const term = (typeof value === 'string' ? value : '').toLowerCase();
    if (!term) {
      return this.institutes;
    }
    return this.institutes.filter(inst =>
      inst.name?.toLowerCase().includes(term) ||
      inst.code?.toLowerCase().includes(term)
    );
  }

  /**
   * Get filtered institutes (for template use with | async)
   */
  getFilteredInstitutes(): Observable<any[]> {
    return this.filteredInstitutes$;
  }

  /**
   * Display institute name in autocomplete field
   */
  displayInstituteName(value: any): string {
    // Handle if value is an institute object
    if (value && typeof value === 'object' && value.id) {
      // Build display string with available properties
      const name = value.name || 'Unknown Institute';
      const code = value.code ? ` (${value.code})` : '';
      const display = `${name}${code}`;
      return display;
    }
    // Handle if it's a number (ID) - look up from map
    if (typeof value === 'number') {
      const institute = this.institutesMap.get(value);
      if (institute) {
        const name = institute.name || 'Unknown Institute';
        const code = institute.code ? ` (${institute.code})` : '';
        return `${name}${code}`;
      }
      return '';
    }
    // Handle if it's a string (user input or already formatted)
    if (typeof value === 'string') {
      return value;
    }
    // Handle null, undefined, or other values
    return '';
  }

  /**
   * Handle institute autocomplete selection
   */
  onInstituteAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    const institute = event.option.value;

    // Handle if value is an institute object with id
    if (institute && typeof institute === 'object' && institute.id) {
      this.selectedInstituteId = institute.id;
      
      // Set the institute object to FormControl
      // This will trigger displayWith to show the formatted name
      this.selectedInstitute.setValue(institute, { emitEvent: false });
      
      // Also update the institutes map for lookup
      this.institutesMap.set(institute.id, institute);
      
      // Force view update
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    } else {
      // Try to recover by clearing and showing error
      this.selectedInstituteId = null;
      this.selectedInstitute.setValue(null);
    }
  }
  loadInstitutesAndStreams(): Promise<void> {
    return Promise.all([
      // Load institutes
      this.http.get<{ institutes: any[] }>(`${API_BASE_URL}/institutes`).toPromise()
        .then((response: any) => {
          this.institutes = response?.institutes || [];

          // Build map for quick ID lookup
          this.institutesMap.clear();
          this.institutes.forEach(inst => {
            if (inst.id) {
              this.institutesMap.set(inst.id, inst);
            }
          });
        })
        .catch((err) => {
          this.institutes = [];
          this.institutesMap.clear();
        }),

      // Load streams
      this.http.get<{ streams: any[] }>(`${API_BASE_URL}/masters/streams`).toPromise()
        .then((response: any) => {
          this.streams = response?.streams || [];
        })
        .catch((err) => {
          this.streams = [];
        })
    ]).then(() => {
      // Both loading complete
    });
  }

  /**
   * Handle institute selection change
   */
  onInstituteSelected(event: any) {
    this.selectedInstituteId = event.value;
  }

  /**
   * Save institute and stream selection
   */
  saveInstituteSelection() {
    if (!this.selectedInstituteId || !this.selectedStreamCode) {
      this.snackBar.open('Please select both institute and stream', 'Close', { duration: 3000 });
      return;
    }

    this.savingInstitute = true;

    this.http.post<any>(`${API_BASE_URL}/students/select-institute`, {
      instituteId: this.selectedInstituteId,
      streamCode: this.selectedStreamCode
    }).subscribe({
      next: (response) => {
        // Update access token if provided
        if (response.accessToken) {
          this.auth.updateAccessToken(response.accessToken);
        }

        this.snackBar.open('\u2713 Institute and Stream saved successfully!', 'Close', { duration: 3000 });
        this.savingInstitute = false;

        // Move to next tab after successful save
        this.goToNextTab(1);

        // Reload profile to update with institute/stream
        this.loadProfile();
      },
      error: (err) => {
        this.savingInstitute = false;

        if (err.status === 409) {
          this.snackBar.open('Institute already selected. Cannot change.', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to save institute selection. Please try again.', 'Close', { duration: 3000 });
        }
      }
    });
  }

  /**
   * Get institute label by id
   */
  getInstituteLabel(instituteId: number): string {
    const institute = this.institutesMap.get(instituteId);
    return institute ? `${institute.name} (${institute.code})` : 'Unknown Institute';
  }

  getCategoryLabel(code?: string | null): string {
    const labels: Record<string, string> = {
      GEN: 'General',
      OBC: 'OBC',
      SC: 'SC',
      ST: 'ST',
      NT: 'NT'
    };
    return code ? (labels[code] || code) : '-';
  }

  getReligionLabel(code?: string | null): string {
    const labels: Record<string, string> = {
      MUSLIM: 'Muslim',
      CHRISTIAN: 'Christian',
      SIKH: 'Sikh',
      BUDDHIST: 'Buddhist',
      PARSI: 'Parsi',
      JEWISH: 'Jewish'
    };
    return code ? (labels[code] || code) : '-';
  }

  getMediumLabel(code?: string | null): string {
    const labels: Record<string, string> = {
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      ENGLISH: 'English',
      URDU: 'Urdu'
    };
    return code ? (labels[code] || code) : '-';
  }

  retryLoadProfile() {
    this.loadProfile();
  }

  savePersonalDetails() {
    if (this.personalDetailsForm.valid) {
      this.savingPersonal = true;
      const formData = this.personalDetailsForm.value;

      // Ensure all values are properly formatted before sending
      const cleanedData = {
        ...formData,
        // Ensure capitalization
        firstName: formData.firstName?.toUpperCase() || '',
        lastName: formData.lastName?.toUpperCase() || '',
        middleName: formData.middleName?.toUpperCase() || '',
        motherName: formData.motherName?.toUpperCase() || '',
        apaarId: formData.apaarId?.toUpperCase() || null,
        // Ensure optional fields aren't undefined
        gender: formData.gender || null,
        email: formData.email || '',
        mobile: formData.mobile || ''
      };

      this.profileService.updatePersonalDetails(cleanedData);

      setTimeout(() => {
        this.savingPersonal = false;
        // Recalculate progress after save
        if (this.profile) {
          this.calculateProfileCompletion(this.profile);
        }
        this.snackBar.open('✓ Personal details saved', '', { duration: 3000 });
        this.goToNextTab(2);
        // Reload profile to ensure all data is current
        this.loadProfile();
      }, 1500);
    } else {
      this.snackBar.open('❌ Please fix all errors before saving', '', { duration: 3000 });
    }
  }

  savePreviousExams() {
    this.savingPrevious = true;
    this.profileService.updatePreviousExams(this.previousExamForm.value);
    setTimeout(() => {
      this.savingPrevious = false;
      this.snackBar.open('✓ Previous exam details saved', '', { duration: 3000 });
      this.goToNextTab(3);
    }, 1500);
  }

  saveBankDetails() {
    if (this.bankDetailsForm.valid) {
      this.savingBank = true;
      const bankData = {
        accountHolder: this.bankDetailsForm.get('accountHolder')?.value,
        accountHolderRelation: this.bankDetailsForm.get('accountHolderRelation')?.value,
        ifscCode: this.bankDetailsForm.get('ifscCode')?.value?.toUpperCase(),
        accountNumber: this.bankDetailsForm.get('accountNumber')?.value
      };
      this.profileService.updateBankDetails(bankData);
      setTimeout(() => {
        this.savingBank = false;
        this.snackBar.open('✓ Bank details saved successfully', '', { duration: 3000 });
        this.loadProfile();
        this.goToNextTab(4);
      }, 1500);
    }
  }

  goToNextTab(targetIndex?: number) {
    const maxTabIndex = 4;
    if (typeof targetIndex === 'number') {
      this.selectedTabIndex = Math.min(targetIndex, maxTabIndex);
      return;
    }
    this.selectedTabIndex = Math.min(this.selectedTabIndex + 1, maxTabIndex);
  }

  goToPreviousTab(targetIndex?: number) {
    if (typeof targetIndex === 'number') {
      this.selectedTabIndex = Math.max(targetIndex, 0);
      return;
    }
    this.selectedTabIndex = Math.max(this.selectedTabIndex - 1, 0);
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
      email: 'Login Email',
      addressLineOne: 'Complete Address',
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
