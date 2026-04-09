import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, ErrorStateMatcher } from '@angular/material/core';
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
import { StudentImageUploadComponent } from '../../components/student-image-upload/student-image-upload.component';

class TouchedOnlyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.touched || control.dirty));
  }
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'always' }
    },
    {
      provide: ErrorStateMatcher,
      useValue: new TouchedOnlyErrorStateMatcher()
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
    RouterModule,
    StudentImageUploadComponent
  ],
  template: `
    <div class="student-profile-container">
      <div class="profile-progress-strip">
        <div class="progress-strip-top">
          <div>
            <div class="progress-strip-label">विद्यार्थी प्रोफाइल स्थिती</div>
            <div class="progress-strip-meta">
              <span>{{ profileCompletionCount }}/{{ totalProfileFields }} माहिती पूर्ण</span>
              <strong>{{ profileCompletionPercentage }}%</strong>
            </div>
          </div>

          <button mat-stroked-button type="button" class="instructions-trigger" (click)="openInstructionsPopup()">
            <mat-icon>info</mat-icon>
            कसे भरावे
          </button>
        </div>

        <mat-progress-bar mode="determinate" [value]="profileCompletionPercentage" color="accent"></mat-progress-bar>

        <p class="progress-strip-note" *ngIf="profileCompletionPercentage < 100">
          उरलेली माहिती पूर्ण केल्यास अर्ज भरणे अधिक सोपे होईल.
        </p>
        <p class="progress-strip-note success" *ngIf="profileCompletionPercentage === 100">
          तुमची प्रोफाइल पूर्ण झाली आहे. आता तुम्ही अर्ज भरू शकता.
        </p>
      </div>

      <div class="instructions-popup-backdrop" *ngIf="showInstructionsPopup">
        <div class="instructions-popup" role="dialog" aria-modal="true" aria-labelledby="profileInstructionsTitle">
          <div class="popup-header">
            <div>
              <h2 id="profileInstructionsTitle">प्रोफाइल भरण्यापूर्वी सूचना</h2>
              <p>खालील मुद्दे एकदा वाचा आणि मगच माहिती भरा.</p>
            </div>
            <button mat-icon-button type="button" (click)="closeInstructionsPopup()" aria-label="Close instructions popup">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="popup-body">
            <ul>
              <li>नावाची सर्व माहिती <strong>ENGLISH CAPITAL LETTERS</strong> मध्ये भरा.</li>
              <li>आधार, SSC प्रमाणपत्र आणि इतर कागदपत्रांप्रमाणेच माहिती भरा.</li>
              <li>माहिती जतन करण्यापूर्वी स्पेलिंग आणि क्रमांक तपासा.</li>
              <li>सक्रिय मोबाईल क्रमांक वापरा.</li>
              <li>महाविद्यालय, शाखा आणि मागील परीक्षेची माहिती जवळ ठेवा.</li>
            </ul>
          </div>

          <div class="popup-actions">
            <button mat-stroked-button type="button" (click)="closeInstructionsPopup(true)">पुन्हा दाखवू नका</button>
            <button mat-raised-button color="primary" type="button" (click)="closeInstructionsPopup()">ठीक आहे</button>
          </div>
        </div>
      </div>

      <div class="instructions-popup-backdrop" *ngIf="showInfoPopup">
        <div class="instructions-popup info-popup" role="dialog" aria-modal="true" aria-labelledby="sectionInfoTitle">
          <div class="popup-header">
            <div>
              <h2 id="sectionInfoTitle">{{ infoPopupTitle }}</h2>
            </div>
            <button mat-icon-button type="button" (click)="closeInfoPopup()" aria-label="Close info popup">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="popup-body info-popup-body">{{ infoPopupText }}</div>

          <div class="popup-actions">
            <button mat-raised-button color="primary" type="button" (click)="closeInfoPopup()">समजले</button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner-wrapper">
          <mat-spinner diameter="50"></mat-spinner>
          <p>तुमची प्रोफाइल लोड होत आहे...</p>
        </div>
      </div>

      <!-- Error Message - Institute Not Selected -->
      <div class="error-banner" *ngIf="error && error.includes('institute') && !isLoading" style="background-color: #fff3cd; border-left-color: #ff9800;">
        <mat-icon style="color: #ff9800;">info</mat-icon>
        <div class="error-content">
          <h3 style="color: #ff9800;">महाविद्यालय निवड आवश्यक</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" routerLink="/student/select-institute">
            <mat-icon>school</mat-icon>
            महाविद्यालय व शाखा निवडा
          </button>
        </div>
      </div>

      <!-- Error Message - Generic -->
      <div class="error-banner" *ngIf="error && !error.includes('institute') && !isLoading">
        <mat-icon>error_outline</mat-icon>
        <div class="error-content">
          <h3>प्रोफाइल लोड करता आली नाही</h3>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="retryLoadProfile()">
            <mat-icon>refresh</mat-icon>
            पुन्हा प्रयत्न करा
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
              <span class="tab-title">महाविद्यालय निवडा</span>
            </ng-template>

            <div class="form-section">
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">महाविद्यालय व शाखा निवड</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('महाविद्यालय व शाखा निवड', 'आपले महाविद्यालय शोधून निवडा. त्यानंतर योग्य शाखा निवडून जतन करा.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="example-full-width">
                    <mat-label>महाविद्यालय निवडा</mat-label>
                    <input 
                    type="text" 
                    matInput 
                    [formControl]="selectedInstitute" 
                    [matAutocomplete]="instituteAuto"
                    placeholder="महाविद्यालयाचे नाव टाइप करा">
                    <mat-autocomplete class="student-institute-autocomplete" #instituteAuto="matAutocomplete" [displayWith]="displayInstituteName.bind(this)" (optionSelected)="onInstituteAutocompleteSelected($event)">
                      @for (inst of getFilteredInstitutes() | async; track inst) {
                        <mat-option [value]="inst" class="institute-option">
                          <div class="institute-option-content">
                            <div class="institute-option-title">{{ inst.name }}</div>
                            <div class="institute-option-meta">{{ getInstituteCode(inst) || 'Code N/A' }}<span *ngIf="inst.city"> • {{ inst.city }}</span></div>
                          </div>
                        </mat-option>
                      }
                    </mat-autocomplete>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>शाखा निवडा*</mat-label>
                    <mat-icon matPrefix>layers</mat-icon>
                    <mat-select [(ngModel)]="selectedStreamCode" required panelClass="student-profile-select-panel">
                      <mat-option value="">- शाखा निवडा -</mat-option>
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
                    <span *ngIf="!savingInstitute">{{ profile?.instituteId ? 'महाविद्यालय अद्यतनित करा' : 'महाविद्यालय जतन करा' }}</span>
                    <span *ngIf="savingInstitute">जतन करत आहे...</span>
                  </button>

                  <button mat-stroked-button type="button" (click)="goToNextTab(1)" [disabled]="!profile?.instituteId && !selectedInstituteId">
                    पुढे
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                  
                  <!-- <div class="institute-info" *ngIf="profile?.instituteId">
                    <mat-icon>check_circle</mat-icon>
                    <span>सध्याची निवड: {{ getInstituteLabel(profile.instituteId) }} • {{ profile.streamCode }}</span>
                  </div> -->
                </div>
              </div>
            </div>
          </mat-tab>
          
          <!-- TAB 1: PERSONAL DETAILS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>person</mat-icon>
              <span class="tab-title">वैयक्तिक माहिती</span>
            </ng-template>

            <form [formGroup]="personalDetailsForm" class="form-section">
              <div class="profile-assets-grid">
                <app-student-image-upload
                  title="Photograph / छायाचित्र"
                  
                  type="photo"
                  [imageUrl]="profile?.photoUrl || null"
                  [saving]="savingPhoto"
                  (saved)="handleProfileImageSaved($event)"
                  (removed)="handleProfileImageRemoved($event)">
                </app-student-image-upload>

                <app-student-image-upload
                  title="Student Signature / सही"
                  
                  type="signature"
                  [imageUrl]="profile?.signatureUrl || null"
                  [saving]="savingSignature"
                  (saved)="handleProfileImageSaved($event)"
                  (removed)="handleProfileImageRemoved($event)">
                </app-student-image-upload>
              </div>

              <!-- CANDIDATE IDENTIFICATION -->
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">विद्यार्थ्याची ओळख माहिती</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('विद्यार्थ्याची ओळख माहिती', 'नाव, आईचे नाव, जन्मतारीख, लिंग आणि मोबाईल क्रमांक शैक्षणिक कागदपत्रांप्रमाणे भरा.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>
                <div class="form-grid-3">
                  <mat-form-field class="form-field">
                    <mat-label>आडनाव / Surname *</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="lastName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'lastName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>विद्यार्थ्याचे नाव / First Name *</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="firstName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'firstName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>वडिलांचे / मधले नाव</mat-label>
                    <mat-icon matPrefix>person</mat-icon>
                    <input matInput formControlName="middleName" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'middleName') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>आईचे नाव *</mat-label>
                    <mat-icon matPrefix>family_restroom</mat-icon>
                    <input matInput formControlName="motherName" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'motherName') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>जन्मतारीख (DD/MM/YYYY) *</mat-label>
                    <mat-icon matPrefix>cake</mat-icon>
                    <input matInput formControlName="dateOfBirth" [matDatepicker]="picker" />
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'dateOfBirth') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>लिंग *</mat-label>
                    <mat-icon matPrefix>wc</mat-icon>
                    <mat-select formControlName="gender" required>
                      <mat-option value="">- लिंग निवडा -</mat-option>
                      <mat-option value="Male">Male</mat-option>
                      <mat-option value="Female">Female</mat-option>
                      <mat-option value="Other">Other</mat-option>
                      <mat-option value="Prefer Not to Say">Prefer Not to Say</mat-option>
                    </mat-select>
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'gender') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>आधार क्रमांक</mat-label>
                    <mat-icon matPrefix>badge</mat-icon>
                    <input matInput formControlName="aadharNumber" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'aadharNumber') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>APAAR आयडी (12 अंकी)</mat-label>
                    <mat-icon matPrefix>verified_user</mat-icon>
                    <input matInput formControlName="apaarId" placeholder="e.g., APAAR123456" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'apaarId') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>विद्यार्थी सरल आयडी</mat-label>
                    <mat-icon matPrefix>badge</mat-icon>
                    <input matInput formControlName="studentSaralId" placeholder="Enter Student Saral ID" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'studentSaralId') }}</mat-error>
                  </mat-form-field>
                </div>

                <div class="form-grid-2">
                  <mat-form-field class="form-field">
                    <mat-label>मोबाईल क्रमांक *</mat-label>
                    <mat-icon matPrefix>phone</mat-icon>
                    <input matInput formControlName="mobile" required />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'mobile') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>लॉगिन ईमेल (Google)</mat-label>
                    <mat-icon matPrefix>email</mat-icon>
                    <input matInput [value]="profile?.email || auth.user()?.username || ''" readonly />
                    <mat-hint>हा ईमेल तुमच्या Google लॉगिनमधून आपोआप घेतला जातो.</mat-hint>
                  </mat-form-field>
                </div>
              </div>

              <!-- ADDRESS DETAILS -->
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">पत्ता माहिती</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('पत्ता माहिती', 'पूर्ण पत्ता, पिनकोड, जिल्हा, तालुका आणि गावाची माहिती अचूक भरा. पिनकोड टाकल्यास काही माहिती आपोआप भरेल.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>
                
                <mat-form-field class="form-field-full">
                  <mat-label>संपूर्ण पत्ता *</mat-label>
                  <mat-icon matPrefix>location_on</mat-icon>
                  <textarea matInput formControlName="addressLineOne" rows="3" required></textarea>
                  <mat-hint>पूर्ण पत्ता एका ठिकाणी भरा.</mat-hint>
                  <mat-error>{{ getErrorMessage(personalDetailsForm, 'addressLineOne') }}</mat-error>
                </mat-form-field>

                <div class="form-grid-4">
                  <mat-form-field class="form-field">
                    <mat-label>पिनकोड *</mat-label>
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
                    <mat-label>जिल्हा</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="district" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'district') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>तालुका</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="taluka" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'taluka') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>महसूल मंडळ</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="revenueCircle" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'revenueCircle') }}</mat-error>
                  </mat-form-field>

                  <mat-form-field class="form-field form-full-width">
                    <mat-label>गाव</mat-label>
                    <mat-icon matPrefix>public</mat-icon>
                    <input matInput formControlName="village" />
                    <mat-error>{{ getErrorMessage(personalDetailsForm, 'village') }}</mat-error>
                  </mat-form-field>
                </div>
              </div>

              <!-- DEMOGRAPHICS & PERSONAL INFORMATION -->
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">वैयक्तिक व सामाजिक माहिती</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('वैयक्तिक व सामाजिक माहिती', 'प्रवर्ग, अल्पसंख्याक धर्म आणि शिक्षणाचे माध्यम लागू असल्यासच निवडा.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>
                
                <div class="form-grid-3">
                  <mat-form-field class="form-field">
                    <mat-label>प्रवर्ग</mat-label>
                    <mat-icon matPrefix>group</mat-icon>
                    <mat-select formControlName="categoryCode">
                      <mat-option value="">-- Select Category --</mat-option>
                      <mat-option value="GEN">General</mat-option>
                      <mat-option value="OBC">OBC</mat-option>
                      <mat-option value="SC">SC</mat-option>
                      <mat-option value="ST">ST</mat-option>
                      <mat-option value="NT">NT</mat-option>
                    </mat-select>
                    
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>अल्पसंख्याक धर्म</mat-label>
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
                  
                  </mat-form-field>

                  <mat-form-field class="form-field">
                    <mat-label>शिक्षणाचे माध्यम</mat-label>
                    <mat-icon matPrefix>language</mat-icon>
                    <mat-select formControlName="mediumCode">
                      <mat-option value="">-- Select Medium of Study --</mat-option>
                      <mat-option value="MARATHI">Marathi</mat-option>
                      <mat-option value="HINDI">Hindi</mat-option>
                      <mat-option value="ENGLISH">English</mat-option>
                      <mat-option value="URDU">Urdu</mat-option>
                    </mat-select>
                    
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
                  <span *ngIf="!savingPersonal">वैयक्तिक माहिती जतन करा</span>
                  <span *ngIf="savingPersonal">जतन करत आहे...</span>
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
              <span class="tab-title">मागील परीक्षा</span>
            </ng-template>

            <form [formGroup]="previousExamForm" class="form-section">
              <!-- SSC EXAMINATION -->
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">SSC परीक्षा तपशील</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('SSC परीक्षा तपशील', 'तुमच्या शेवटच्या SSC परीक्षेचे आसन क्रमांक, महिना, वर्ष आणि बोर्ड तपशील येथे भरा.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>

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
                <div class="card-title-row">
                  <h3 class="card-title">इयत्ता ११ वी परीक्षा तपशील</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('इयत्ता ११ वी परीक्षा तपशील', '११ वी संबंधित माहिती लागू असल्यास येथे भरा. ही माहिती अर्ज पडताळणीसाठी उपयुक्त ठरते.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>

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
                  <span *ngIf="!savingPrevious">मागील परीक्षा तपशील जतन करा</span>
                  <span *ngIf="savingPrevious">जतन करत आहे...</span>
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
              <span class="tab-title">बँक तपशील</span>
            </ng-template>

            <form [formGroup]="bankDetailsForm" class="form-section">
              <!-- BANK ACCOUNT DETAILS -->
              <div class="form-card">
                <div class="card-title-row">
                  <h3 class="card-title">बँक खाते माहिती</h3>
                  <button mat-icon-button type="button" class="section-help-btn" (click)="openInfoPopup('बँक खाते माहिती', 'परीक्षा शुल्क परतावा किंवा संबंधित प्रक्रियेसाठी आवश्यक असल्यास खातेधारक, IFSC आणि खाते क्रमांक भरा.')">
                    <mat-icon>info_outline</mat-icon>
                  </button>
                </div>
                
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
                  <span *ngIf="!savingBank">बँक तपशील जतन करा</span>
                  <span *ngIf="savingBank">जतन करत आहे...</span>
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
              <span class="tab-title">सारांश</span>
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
                        <div class="summary-item">
                          <label>Student Saral ID:</label>
                          <span>{{ profile.studentSaralId || '-' }}</span>
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
                    <p class="summary-message">तुमची प्रोफाइल पूर्ण झाली आहे आणि अर्ज सादर करण्यासाठी तयार आहे.</p>
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
      width: 100%;
      max-width: none;
      margin: 0;
      background: var(--bg-light);
      padding: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .profile-header {
      width: 100%;
      max-width: none;
      margin: 0 0 var(--spacing-md);
      text-align: center;
      background: white;
      padding: var(--spacing-sm);
      border-radius: 0;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.14);
      animation: fadeInUp 0.45s ease-out;
    }

    .mobile-app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
      text-align: left;
      background: linear-gradient(135deg, #ffffff 0%, #f3f7ff 100%);
      border: 1px solid rgba(102, 126, 234, 0.15);
    }

    .header-main {
      min-width: 0;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      background: rgba(102, 126, 234, 0.12);
      color: var(--primary-color);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin-bottom: 0.55rem;
    }

    .header-help-btn {
      flex-shrink: 0;
      white-space: nowrap;
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
      max-width: none;
      margin: 0 0 var(--spacing-md);
      display: flex;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: white;
      border-left: 5px solid #f44336;
      border-radius: 0;
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
      max-width: none;
      margin: 0;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
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

    ::ng-deep .profile-tabs .mdc-tab__content {
      gap: 0.45rem;
    }

    ::ng-deep .profile-tabs .mat-mdc-tab {
      min-width: fit-content;
      padding: 0 0.4rem;
    }

    .tab-title {
      white-space: nowrap;
    }
    /* Form Sections */
    .form-section {
      
      width: 100%;
    }

    .form-card {
      margin-bottom: 12px;
      padding: var(--spacing-md);
      background: linear-gradient(180deg, #ffffff 0%, var(--bg-lighter) 100%);
      border: 1px solid var(--border-color);
      border-radius: 0;
      border-left: 4px solid var(--primary-color);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      animation: fadeInUp 0.35s ease-out;
    }

    .form-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
    }

    .card-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.65rem;
      margin-bottom: var(--spacing-sm);
    }

    .card-title {
      font-size: var(--heading-3-size);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .section-help-btn {
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.08);
      color: var(--primary-color);
    }

    .card-subtitle {
      display: none;
    }

    .info-popup-body {
      white-space: pre-line;
      line-height: 1.6;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
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

    ::ng-deep .student-institute-autocomplete.mat-mdc-autocomplete-panel {
      padding: 6px 0;
      max-height: min(320px, 70vh);
      border-radius: 14px;
    }

    ::ng-deep .student-institute-autocomplete .mat-mdc-option {
      min-height: 62px;
      align-items: flex-start;
      padding-top: 8px;
      padding-bottom: 8px;
      white-space: normal;
    }

    ::ng-deep .student-profile-select-panel .mat-mdc-option {
      min-height: 52px;
      white-space: normal;
      line-height: 1.35;
    }

    .institute-option-content {
      display: flex;
      flex-direction: column;
      gap: 0.18rem;
      width: 100%;
    }

    .institute-option-title {
      font-size: clamp(0.88rem, 2.8vw, 0.98rem);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.35;
      white-space: normal;
    }

    .institute-option-meta {
      font-size: clamp(0.74rem, 2.2vw, 0.82rem);
      color: var(--text-secondary);
      line-height: 1.35;
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
      padding: 0;
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

    /* Compact profile progress strip */
    .profile-progress-strip {
      border-top: 4px solid var(--primary-color);
      border-bottom: 1px solid rgba(148, 163, 184, 0.3);
      padding: 10px 0 12px;
      margin-bottom: var(--spacing-md);
      background: linear-gradient(180deg, rgba(239, 246, 255, 0.9) 0%, rgba(255, 255, 255, 0.98) 100%);
    }

    .progress-strip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .progress-strip-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .progress-strip-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .progress-strip-meta strong {
      font-size: 1rem;
      color: var(--primary-dark);
    }

    .instructions-trigger {
      white-space: nowrap;
    }

    ::ng-deep .profile-progress-strip .mat-progress-bar {
      height: 4px;
      border-radius: 999px;
    }

    .progress-strip-note {
      margin: 8px 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .progress-strip-note.success {
      color: #166534;
      font-weight: 600;
    }

    .instructions-popup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 1200;
    }

    .instructions-popup {
      width: min(680px, 100%);
      background: #fff;
      border-radius: var(--border-radius);
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
      padding: 18px;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .popup-header h2 {
      margin: 0 0 4px;
      font-size: 1.2rem;
      color: var(--text-primary);
    }

    .popup-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.92rem;
    }

    .popup-body ul {
      margin: 0;
      padding-left: 20px;
      display: grid;
      gap: 8px;
      color: var(--text-primary);
    }

    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 16px;
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
        padding: 0;
      }

      .profile-header {
        padding: var(--spacing-lg);
      }

      .form-section,
      .summary-content {
        padding: 0;
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

      .mobile-app-header {
        padding: 0.9rem;
        align-items: flex-start;
      }

      .header-help-btn {
        min-width: 0;
        padding-inline: 0.75rem;
      }

      .profile-header {
        margin-bottom: var(--spacing-md);
      }

      .profile-progress-strip {
        display: none;
      }

      .board-header {
        padding-bottom: var(--spacing-xs);
        margin-bottom: var(--spacing-xs);
      }

      .form-card {
        border-radius: 0;
      }

      .card-title-row {
        align-items: center;
      }

      ::ng-deep .profile-tabs .mat-mdc-tab-header {
        position: sticky;
        top: 0;
        z-index: 20;
      }

      ::ng-deep .profile-tabs .mdc-tab__text-label {
        padding: 0 4px !important;
        font-size: 0.72rem !important;
      }

      .form-actions {
        position: sticky;
        bottom: 0;
        z-index: 15;
        background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, #ffffff 100%);
        padding: 0.8rem;
        margin: 1rem -0.8rem -0.8rem;
        box-shadow: 0 -10px 24px rgba(15, 23, 42, 0.08);
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
        padding: 0;
      }

      .profile-header {
        margin-bottom: 2rem;
      }

      .form-section,
      .summary-content {
        padding: 0;
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
  savingPhoto = false;
  savingSignature = false;
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
  totalProfileFields = 11; // firstName, lastName, dob, gender, aadhaar, address, pinCode, mobile, email, sscYear, xiYear

  // Active tab index for auto-navigation after save
  selectedTabIndex = 0;
  showInstructionsPopup = false;
  showInfoPopup = false;
  infoPopupTitle = '';
  infoPopupText = '';

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

      studentSaralId: ['', [
        Validators.maxLength(50),
        Validators.pattern(/^[0-9A-Za-z-]*$/)
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

  openInstructionsPopup() {
    this.showInstructionsPopup = true;
  }

  closeInstructionsPopup(rememberChoice = false) {
    this.showInstructionsPopup = false;
    if (rememberChoice && typeof window !== 'undefined') {
      window.localStorage.setItem('studentProfileInstructionsDismissed', 'true');
    }
  }

  openInfoPopup(title: string, text: string) {
    this.infoPopupTitle = title;
    this.infoPopupText = text;
    this.showInfoPopup = true;
  }

  closeInfoPopup() {
    this.showInfoPopup = false;
  }

  private showInstructionsPopupIfNeeded() {
    this.showInstructionsPopup = false;
  }

  private resetFormVisualState() {
    [this.personalDetailsForm, this.previousExamForm, this.bankDetailsForm].forEach((form) => {
      form.markAsPristine();
      form.markAsUntouched();
      Object.values(form.controls).forEach((control) => {
        control.markAsPristine();
        control.markAsUntouched();
      });
      form.updateValueAndValidity({ emitEvent: false });
    });
  }

  private withAssetCacheBust(url?: string | null): string | null {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      parsedUrl.searchParams.set('v', String(Date.now()));
      return parsedUrl.toString();
    } catch {
      const cleanedUrl = String(url).replace(/([?&])v=\d+/g, '$1').replace(/[?&]$/, '');
      const separator = cleanedUrl.includes('?') ? '&' : '?';
      return `${cleanedUrl}${separator}v=${Date.now()}`;
    }
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
              this.pincodeError = 'या पिनकोडसाठी माहिती मिळाली नाही';
            }
          },
          error: (err) => {
            this.pincodeError = 'पिनकोड माहिती मिळवताना अडचण आली. कृपया पुन्हा प्रयत्न करा.';
            this.pincodeLookupLoading = false;
          }
        });
      } else if (pincode.length > 0) {
        this.pincodeOptions = [];
        this.pincodeError = 'कृपया योग्य 6 अंकी पिनकोड भरा';
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
        this.profile = {
          ...(profile as StudentProfile),
          photoUrl: this.withAssetCacheBust(profile?.photoUrl),
          signatureUrl: this.withAssetCacheBust(profile?.signatureUrl)
        } as StudentProfile;

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
          studentSaralId: profile.studentSaralId || '',
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
        this.resetFormVisualState();
        this.showInstructionsPopupIfNeeded();

        this.isLoading = false;
      })
      .catch((err: any) => {

        // Extract error code from multiple possible locations
        const errorCode = err?.error?.error || err?.error?.status || err?.message || '';
        const serverMessage = err?.error?.message || err?.message || '';

        // Determine the error type and appropriate message
        let errorMsg = 'प्रोफाइल लोड करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.';
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
          errorMsg = err?.error?.message || 'प्रोफाइल लोड करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.';
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
      'mobile',
      'email'
    ];

    let completedCount = 0;

    requiredFields.forEach(field => {
      const value = field === 'email' ? (profile.email || this.profile?.email) : profile[field];
      if (value && value !== null && value !== '') {
        completedCount++;
      }
    });

    const previousExams = profile.previousExams || [];
    const hasSSCYear = previousExams.some((e: any) => e.examType === 'SSC' && e.year);
    const hasXIYear = previousExams.some((e: any) => ['XI', '11TH', '11'].includes(String(e.examType || '').toUpperCase()) && e.year);

    if (hasSSCYear) completedCount++;
    if (hasXIYear) completedCount++;

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
      this.getInstituteCode(inst).toLowerCase().includes(term)
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
      const name = value.name || 'Unknown Institute';
      const codeValue = this.getInstituteCode(value);
      const code = codeValue ? ` (${codeValue})` : '';
      return `${name}${code}`;
    }
    // Handle if it's a number (ID) - look up from map
    if (typeof value === 'number') {
      const institute = this.institutesMap.get(value);
      if (institute) {
        const name = institute.name || 'Unknown Institute';
        const codeValue = this.getInstituteCode(institute);
        const code = codeValue ? ` (${codeValue})` : '';
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
      this.snackBar.open('कृपया महाविद्यालय आणि शाखा दोन्ही निवडा', 'बंद', { duration: 3000 });
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

        this.snackBar.open('\u2713 महाविद्यालय आणि शाखा यशस्वीरीत्या जतन झाली!', 'बंद', { duration: 3000 });
        this.savingInstitute = false;

        // Move to next tab after successful save
        this.goToNextTab(1);

        // Reload profile to update with institute/stream
        this.loadProfile();
      },
      error: (err) => {
        this.savingInstitute = false;

        if (err.status === 409) {
          this.snackBar.open('महाविद्यालय आधीच निवडले आहे. बदल करता येणार नाही.', 'बंद', { duration: 3000 });
        } else {
          this.snackBar.open('महाविद्यालय जतन करण्यात अडचण आली. पुन्हा प्रयत्न करा.', 'बंद', { duration: 3000 });
        }
      }
    });
  }

  getInstituteCode(institute: any): string {
    return String(institute?.code || institute?.collegeNo || institute?.centerNo || institute?.udiseNo || '').trim();
  }

  /**
   * Get institute label by id
   */
  getInstituteLabel(instituteId: number): string {
    const institute = this.institutesMap.get(instituteId);
    if (!institute) return 'Unknown Institute';
    const code = this.getInstituteCode(institute);
    return code ? `${institute.name} (${code})` : institute.name;
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
        [isPhoto ? 'photoUrl' : 'signatureUrl']: this.withAssetCacheBust(response.url)
      } as StudentProfile;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.snackBar.open(`✓ ${isPhoto ? 'फोटो' : 'स्वाक्षरी'} जतन झाली (${event.sizeKB.toFixed(1)} KB)`, '', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message || `${isPhoto ? 'फोटो' : 'स्वाक्षरी'} जतन करण्यात अडचण आली.`, '', { duration: 4000 });
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
      this.snackBar.open(`✓ ${isPhoto ? 'फोटो' : 'स्वाक्षरी'} काढली`, '', { duration: 2500 });
    } catch (err: any) {
      this.snackBar.open(err?.error?.message || `${isPhoto ? 'फोटो' : 'स्वाक्षरी'} काढण्यात अडचण आली.`, '', { duration: 4000 });
    } finally {
      if (isPhoto) {
        this.savingPhoto = false;
      } else {
        this.savingSignature = false;
      }
    }
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
        studentSaralId: formData.studentSaralId?.toUpperCase() || null,
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
        this.snackBar.open('✓ वैयक्तिक माहिती जतन झाली', '', { duration: 3000 });
        this.goToNextTab(2);
        // Reload profile to ensure all data is current
        this.loadProfile();
      }, 1500);
    } else {
      this.snackBar.open('❌ कृपया सर्व चुका दुरुस्त करून पुन्हा जतन करा', '', { duration: 3000 });
    }
  }

  savePreviousExams() {
    this.savingPrevious = true;
    this.profileService.updatePreviousExams(this.previousExamForm.value);
    setTimeout(() => {
      this.savingPrevious = false;
      this.snackBar.open('✓ मागील परीक्षेची माहिती जतन झाली', '', { duration: 3000 });
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
        this.snackBar.open('✓ बँक तपशील यशस्वीरीत्या जतन झाले', '', { duration: 3000 });
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

      this.snackBar.open('✓ पिनकोडवरून पत्ता माहिती भरली गेली', '', { duration: 2000 });
    }
  }

  /**
   * Get readable error message for form field validation errors
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors || !(control.touched || control.dirty)) return '';

    const errors = control.errors;

    if (errors['required']) return `${this.getFieldLabel(fieldName)} आवश्यक आहे`;
    if (errors['minLength']) return `${this.getFieldLabel(fieldName)} किमान ${errors['minLength'].requiredLength} अक्षरे असावी`;
    if (errors['maxLength']) return `${this.getFieldLabel(fieldName)} ${errors['maxLength'].requiredLength} अक्षरांपेक्षा जास्त नसावे`;
    if (errors['email']) return 'ईमेलचा नमुना योग्य नाही';
    if (errors['pattern']) {
      if (fieldName.includes('mobile')) return 'मोबाईल क्रमांक 10 अंकी आणि 6-9 ने सुरू होणारा असावा';
      if (fieldName.includes('aadhar')) return 'आधार क्रमांक 12 अंकी असावा';
      if (fieldName.includes('pincode')) return 'पिनकोड 6 अंकी असावा';
      if (fieldName.includes('Name')) return 'फक्त अक्षरे, स्पेस, हायफन आणि अपॉस्ट्रॉफ वापरा';
      if (fieldName.includes('Year')) return 'वर्ष 4 अंकी असावे';
      return 'कृपया योग्य नमुना वापरा';
    }
    if (errors['invalidDate']) return 'तारीख योग्य नाही';
    if (errors['futureDate']) return 'जन्मतारीख भविष्यातील असू शकत नाही';
    if (errors['minimumAge']) return `किमान वय ${errors['minimumAge'].requiredAge} वर्षे असावे`;

    return Object.keys(errors)[0];
  }

  /**
   * Get readable field label from field name
   */
  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'नाव',
      lastName: 'आडनाव',
      middleName: 'मधले नाव',
      motherName: 'आईचे नाव',
      dateOfBirth: 'जन्मतारीख',
      aadharNumber: 'आधार क्रमांक',
      mobile: 'मोबाईल क्रमांक',
      email: 'लॉगिन ईमेल',
      addressLineOne: 'संपूर्ण पत्ता',
      addressLineTwo: 'पत्ता ओळ २',
      addressLineThree: 'पत्ता ओळ ३',
      pincode: 'पिनकोड',
      district: 'जिल्हा',
      taluka: 'तालुका',
      village: 'गाव'
    };
    return labels[fieldName] || fieldName;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
