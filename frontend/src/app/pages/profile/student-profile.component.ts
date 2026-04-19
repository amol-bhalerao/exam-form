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
import { InstitutePickerComponent } from '../../components/institute-picker/institute-picker.component';
import { StudentImageUploadComponent } from '../../components/student-image-upload/student-image-upload.component';
import { EnglishOnlyDirective } from '../../directives/english-only.directive';

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
    InstitutePickerComponent,
    StudentImageUploadComponent,
    EnglishOnlyDirective
  ],
  template: `
    <div class="student-profile-container">
      <div class="registration-header">
        <div class="registration-title">
          <h1>Student Registration</h1>
          <p>नोंदणीकृत सर्व विद्यार्थी व्यवस्थापित करा, त्यांचा सध्याचा डेटा पाहा आणि खालील मोडलद्वारे नवीन विद्यार्थी जोडा.</p>
        </div>
        <button mat-stroked-button type="button" class="instructions-trigger" (click)="openInstructionsPopup()">
          <mat-icon>info</mat-icon>
          How to use
        </button>
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

      <div class="instructions-popup-backdrop" *ngIf="showManagedStudentModal">
        <div class="instructions-popup info-popup managed-student-popup" role="dialog" aria-modal="true" aria-labelledby="managedStudentTitle">
          <div class="popup-header">
            <div>
              <h2 id="managedStudentTitle">{{ managedStudentMode === 'edit' ? 'व्यवस्थापित विद्यार्थी संपादित करा' : 'नवीन विद्यार्थी जोडा' }}</h2>
              <p>महाविद्यालय आणि शाखेच्या तपशीलांसह विद्यार्थ्याची नोंदणी करा.</p>
            </div>
            <button mat-icon-button type="button" (click)="closeManagedStudentModal()" aria-label="Close managed student popup">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="popup-body managed-student-modal" [formGroup]="managedStudentForm">
            <!-- Validation Error Summary -->
            <div class="validation-error-summary" *ngIf="managedStudentForm.invalid && managedStudentForm.touched && selectedTabIndex === 6">
              <mat-icon>error</mat-icon>
              <span>जतन करण्यापूर्वी लाल रंगाने दर्शवलेली सर्व आवश्यक माहिती भरा.</span>
            </div>

            <mat-tab-group
              class="managed-student-tabs"
              [selectedIndex]="selectedTabIndex"
              (selectedIndexChange)="onManagedTabIndexChange($event)"
              animationDuration="300">
              <!-- TAB 0: Aadhaar Lookup -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>fingerprint</mat-icon>
                  <span>Aadhaar Lookup</span>
                </ng-template>

                <div class="form-section">
                  <p class="tab-instruction">विद्यार्थी आधीपासून नोंदणीकृत आहे का हे तपासण्यासाठी आधार क्रमांक भरा. माहिती सापडल्यास फॉर्म आपोआप भरला जाईल.</p>
                  
                  <div class="form-grid-1">
                    <mat-form-field class="form-field form-field-full" [class.error-field]="managedStudentForm.get('aadhaar')?.invalid && managedStudentForm.get('aadhaar')?.touched">
                      <mat-label>Aadhaar Number *</mat-label>
                      <input matInput 
                             formControlName="aadhaar" 
                             placeholder="12-digit Aadhaar number"
                             maxlength="12"
                             appEnglishOnly
                         [readonly]="managedAadhaarLocked"
                             (input)="onOnlyDigitsInput($event)"
                             (blur)="onAadhaarBlur($event)" />
                      <mat-icon matPrefix>fingerprint</mat-icon>
                      <button mat-icon-button matSuffix type="button" 
                             (click)="fetchStudentByAadhaar()" 
                         [disabled]="managedStudentMode === 'edit' || !managedStudentForm.get('aadhaar')?.value || managedStudentForm.get('aadhaar')?.value.length !== 12" 
                             aria-label="Lookup student by Aadhaar">
                        <mat-icon>search</mat-icon>
                      </button>
                      <mat-error *ngIf="managedStudentForm.get('aadhaar')?.hasError('pattern')">
                        आधार क्रमांक नेमका 12 अंकी असावा
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="lookup-result" *ngIf="managedStudentMode === 'create' && managedStudentForm.get('aadhaar')?.value?.length === 12">
                    <p style="color: #666; font-size: 0.9rem; text-align: center;"><strong>Search</strong> वर क्लिक करून विद्यार्थ्याची माहिती शोधा किंवा नवीन नोंदणीसाठी पुढील टॅबवर जा.</p>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 1: Institute & Stream Selection -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>school</mat-icon>
                  <span>Institute & Stream</span>
                </ng-template>

                <div class="form-section">
                  <div class="form-grid-1">
                    <div class="form-field form-field-full">
                      <app-institute-picker [(selectedInstituteId)]="managedStudentInstituteId"></app-institute-picker>
                    </div>

                    <mat-form-field class="form-field form-field-full" [class.error-field]="managedStudentForm.get('streamCode')?.invalid && managedStudentForm.get('streamCode')?.touched">
                      <mat-label>Stream *</mat-label>
                      <mat-icon matPrefix>school</mat-icon>
                      <mat-select formControlName="streamCode" required>
                        <mat-option value="">- Select stream -</mat-option>
                        <mat-option *ngFor="let stream of streams" [value]="stream.name">{{ stream.name }}</mat-option>
                      </mat-select>
                      <mat-error>Stream is required</mat-error>
                    </mat-form-field>

                    <mat-form-field class="form-field form-field-full">
                      <mat-label>Medium</mat-label>
                      <mat-icon matPrefix>translate</mat-icon>
                      <mat-select formControlName="mediumCode">
                        <mat-option value="">- Select medium -</mat-option>
                        <mat-option value="MARATHI">Marathi</mat-option>
                        <mat-option value="HINDI">Hindi</mat-option>
                        <mat-option value="ENGLISH">English</mat-option>
                        <mat-option value="URDU">Urdu</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 2: Personal Details -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>person</mat-icon>
                  <span>Personal Details</span>
                </ng-template>

                <div class="form-section">
                  <div class="form-grid-compact">
                    <mat-form-field class="form-field" [class.error-field]="managedStudentForm.get('firstName')?.invalid && managedStudentForm.get('firstName')?.touched">
                      <mat-label>First Name *</mat-label>
                      <mat-icon matPrefix>person</mat-icon>
                      <input matInput 
                             formControlName="firstName" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                      <mat-error *ngIf="managedStudentForm.get('firstName')?.hasError('required')">First name is required</mat-error>
                      <mat-error *ngIf="managedStudentForm.get('firstName')?.hasError('minlength')">Minimum 2 characters</mat-error>
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Middle Name</mat-label>
                      <mat-icon matPrefix>badge</mat-icon>
                      <input matInput 
                             formControlName="middleName" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                    </mat-form-field>
                    <mat-form-field class="form-field" [class.error-field]="managedStudentForm.get('lastName')?.invalid && managedStudentForm.get('lastName')?.touched">
                      <mat-label>Last Name *</mat-label>
                      <mat-icon matPrefix>person</mat-icon>
                      <input matInput 
                             formControlName="lastName" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                      <mat-error *ngIf="managedStudentForm.get('lastName')?.hasError('required')">Last name is required</mat-error>
                      <mat-error *ngIf="managedStudentForm.get('lastName')?.hasError('minlength')">Minimum 2 characters</mat-error>
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Mother Name</mat-label>
                      <mat-icon matPrefix>female</mat-icon>
                      <input matInput 
                             formControlName="motherName" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                    </mat-form-field>
                  </div>

                  <div class="form-grid-compact">
                    <mat-form-field class="form-field">
                      <mat-label>Date of Birth</mat-label>
                      <mat-icon matPrefix>calendar_month</mat-icon>
                      <input matInput [matDatepicker]="managedDobPicker" formControlName="dob" />
                      <mat-datepicker-toggle matSuffix [for]="managedDobPicker"></mat-datepicker-toggle>
                      <mat-datepicker #managedDobPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field class="form-field">
                      <mat-label>Gender</mat-label>
                      <mat-icon matPrefix>wc</mat-icon>
                      <mat-select formControlName="gender">
                        <mat-option value="">- Select gender -</mat-option>
                        <mat-option value="Male">Male</mat-option>
                        <mat-option value="Female">Female</mat-option>
                        <mat-option value="Other">Other</mat-option>
                        <mat-option value="Prefer Not to Say">Prefer Not to Say</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field class="form-field">
                      <mat-label>Mobile</mat-label>
                      <mat-icon matPrefix>call</mat-icon>
                      <input matInput 
                             formControlName="mobile" 
                             placeholder="10 digit mobile"
                             maxlength="10"
                             appEnglishOnly
                             (input)="onOnlyDigitsInput($event)" />
                    </mat-form-field>
                  </div>

                  <div class="form-grid-compact">
                    <mat-form-field class="form-field">
                      <mat-label>APAAR ID</mat-label>
                      <mat-icon matPrefix>badge</mat-icon>
                      <input matInput 
                             formControlName="apaarId" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Udise / Saral ID</mat-label>
                      <mat-icon matPrefix>assignment_ind</mat-icon>
                      <input matInput 
                             formControlName="studentSaralId" 
                             appEnglishOnly 
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                    </mat-form-field>
                  </div>

                  <div class="form-grid-compact">
                    <mat-form-field class="form-field">
                      <mat-label>SSC from Maharashtra</mat-label>
                      <mat-icon matPrefix>verified_user</mat-icon>
                      <mat-select formControlName="sscPassedFromMaharashtra">
                        <mat-option [value]="null">- Select -</mat-option>
                        <mat-option [value]="true">Yes</mat-option>
                        <mat-option [value]="false">No</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field class="form-field">
                      <mat-label>Eligibility Certificate Issued</mat-label>
                      <mat-icon matPrefix>fact_check</mat-icon>
                      <mat-select formControlName="eligibilityCertIssued">
                        <mat-option [value]="null">- Select -</mat-option>
                        <mat-option [value]="true">Yes</mat-option>
                        <mat-option [value]="false">No</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field class="form-field">
                      <mat-label>Eligibility Certificate No</mat-label>
                      <mat-icon matPrefix>confirmation_number</mat-icon>
                      <input matInput
                             formControlName="eligibilityCertNo"
                             appEnglishOnly
                             [disabled]="managedStudentForm.get('eligibilityCertIssued')?.value !== true"
                             (input)="$event.target.value = $event.target.value.toUpperCase()" />
                      <mat-error *ngIf="managedStudentForm.get('eligibilityCertNo')?.hasError('required')">
                        Eligibility Certificate No is required when certificate is issued
                      </mat-error>
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 3: Address Information -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>location_on</mat-icon>
                  <span>Address</span>
                </ng-template>

                <div class="form-section">
                  <p class="form-note">पत्ता विद्यार्थ्याच्या महाविद्यालयीन जिल्ह्यानुसार ट्रॅक केला जातो. कृपया तुमचा निवासी पत्ता भरा.</p>
                  
                  <mat-form-field class="form-field form-field-full">
                    <mat-label>Residential Address</mat-label>
                    <mat-icon matPrefix>home</mat-icon>
                    <textarea matInput rows="3" formControlName="address" placeholder="Enter complete residential address"></textarea>
                  </mat-form-field>

                  <div class="form-grid-compact">
                    <mat-form-field class="form-field">
                      <mat-label>PinCode</mat-label>
                      <mat-icon matPrefix>pin_drop</mat-icon>
                      <input matInput 
                             formControlName="pinCode" 
                             maxlength="6"
                             appEnglishOnly
                             (input)="onOnlyDigitsInput($event); onPincodeInput($event)"
                             (blur)="onPincodeInput($event)" />
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>District</mat-label>
                      <mat-icon matPrefix>map</mat-icon>
                      <input matInput formControlName="district" appEnglishOnly />
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Taluka</mat-label>
                      <mat-icon matPrefix>location_city</mat-icon>
                      <input matInput formControlName="taluka" appEnglishOnly />
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Village</mat-label>
                      <mat-icon matPrefix>cottage</mat-icon>
                      <input matInput formControlName="village" appEnglishOnly />
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 4: Demographics -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>category</mat-icon>
                  <span>Demographics</span>
                </ng-template>

                <div class="form-section">
                  <div class="form-grid-compact">
                    <mat-form-field class="form-field">
                      <mat-label>Category</mat-label>
                      <mat-icon matPrefix>groups</mat-icon>
                      <mat-select formControlName="categoryCode">
                        <mat-option value="">- Select category -</mat-option>
                        <mat-option value="OPEN">Open</mat-option>
                        <mat-option value="OBC">OBC</mat-option>
                        <mat-option value="SC">SC</mat-option>
                        <mat-option value="ST">ST</mat-option>
                        <mat-option value="VJA">VJ/DT</mat-option>
                        <mat-option value="NTB">NT-B</mat-option>
                        <mat-option value="NTC">NT-C</mat-option>
                        <mat-option value="NTD">NT-D</mat-option>
                        <mat-option value="SBC">SBC</mat-option>
                        <mat-option value="SEBC">SEBC</mat-option>
                        <mat-option value="EWS">EWS</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Minority / Religion</mat-label>
                      <mat-icon matPrefix>account_balance</mat-icon>
                      <mat-select formControlName="minorityReligionCode">
                        <mat-option value="">- Select -</mat-option>
                        <mat-option value="HINDU_NON_MINORITY">Hindu / Non-minority</mat-option>
                        <mat-option value="MUSLIM">Muslim</mat-option>
                        <mat-option value="CHRISTIAN">Christian</mat-option>
                        <mat-option value="SIKH">Sikh</mat-option>
                        <mat-option value="BUDDHIST">Buddhist</mat-option>
                        <mat-option value="JAIN">Jain</mat-option>
                        <mat-option value="PARSI">Parsi</mat-option>
                        <mat-option value="JEWISH">Jewish</mat-option>
                        <mat-option value="OTHER">Other</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="form-field">
                      <mat-label>Divyang Status</mat-label>
                      <mat-icon matPrefix>accessible</mat-icon>
                      <mat-select formControlName="divyangCode">
                        <mat-option value="">- Select -</mat-option>
                        <mat-option value="NONE">None</mat-option>
                        <mat-option value="DIVYANG">Divyang</mat-option>
                        <mat-option value="VISUALLY_IMPAIRED">Visually Impaired</mat-option>
                        <mat-option value="HEARING_IMPAIRED">Hearing Impaired</mat-option>
                        <mat-option value="PHYSICALLY_DISABLED">Physically Disabled</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 5: Photo & Signature -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>badge</mat-icon>
                  <span>Photo & Signature</span>
                </ng-template>

                <div class="form-section">
                  <p class="tab-instruction">परीक्षा फॉर्मसाठी विद्यार्थ्याचा फोटो आणि स्वाक्षरी अपलोड करा.</p>
                  <div class="form-grid-2 managed-assets-grid">
                    <app-student-image-upload
                      type="photo"
                      title="विद्यार्थ्याचा फोटो"
                      hint="पासपोर्ट आकाराचा फोटो, साध्या पार्श्वभूमीसह"
                      [imageUrl]="managedPhotoPreviewUrl"
                      [saving]="managedStudentSaving"
                      (saved)="onManagedAssetSaved($event)"
                      (removed)="onManagedAssetRemoved($event)">
                    </app-student-image-upload>

                    <app-student-image-upload
                      type="signature"
                      title="विद्यार्थ्याची स्वाक्षरी"
                      hint="पांढऱ्या पार्श्वभूमीवर गडद शाईतील स्वाक्षरी"
                      [imageUrl]="managedSignaturePreviewUrl"
                      [saving]="managedStudentSaving"
                      (saved)="onManagedAssetSaved($event)"
                      (removed)="onManagedAssetRemoved($event)">
                    </app-student-image-upload>
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 6: Previous Exams -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>school</mat-icon>
                  <span>Previous Exams</span>
                </ng-template>

                <div class="form-section">
                  <div class="form-card form-card-compact form-card-span">
                    <div class="card-title-row">
                      <h3 class="card-title">SSC Details</h3>
                    </div>
                    <div class="form-grid-4">
                      <mat-form-field class="form-field">
                        <mat-label>SSC Seat No.</mat-label>
                        <mat-icon matPrefix>badge</mat-icon>
                        <input matInput 
                               formControlName="sscSeatNo" 
                               appEnglishOnly 
                               (input)="$event.target.value = $event.target.value.toUpperCase()" />
                      </mat-form-field>
                      <mat-form-field class="form-field">
                        <mat-label>SSC Month</mat-label>
                        <mat-icon matPrefix>calendar_month</mat-icon>
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
                        <mat-label>SSC Year</mat-label>
                        <mat-icon matPrefix>event</mat-icon>
                        <input type="number" matInput formControlName="sscYear" />
                      </mat-form-field>
                      <mat-form-field class="form-field">
                        <mat-label>SSC Board</mat-label>
                        <mat-icon matPrefix>account_balance</mat-icon>
                        <input matInput formControlName="sscBoard" appEnglishOnly />
                      </mat-form-field>
                    </div>
                    <div class="form-grid-2">
                      <mat-form-field class="form-field">
                        <mat-label>SSC Percentage</mat-label>
                        <mat-icon matPrefix>percent</mat-icon>
                        <input type="number" matInput formControlName="sscPercentage" min="0" max="100" step="0.01" />
                      </mat-form-field>
                    </div>
                  </div>

                  <div class="form-card form-card-compact form-card-span">
                    <div class="card-title-row">
                      <h3 class="card-title">XIth Details</h3>
                    </div>
                    <div class="form-grid-4">
                      <mat-form-field class="form-field">
                        <mat-label>XI Seat No.</mat-label>
                        <mat-icon matPrefix>badge</mat-icon>
                        <input matInput 
                               formControlName="xithSeatNo" 
                               appEnglishOnly 
                               (input)="$event.target.value = $event.target.value.toUpperCase()" />
                      </mat-form-field>
                      <mat-form-field class="form-field">
                        <mat-label>XI Month</mat-label>
                        <mat-icon matPrefix>calendar_month</mat-icon>
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
                        <mat-label>XI Year</mat-label>
                        <mat-icon matPrefix>event</mat-icon>
                        <input type="number" matInput formControlName="xithYear" />
                      </mat-form-field>
                      <mat-form-field class="form-field">
                        <mat-label>XI College</mat-label>
                        <mat-icon matPrefix>school</mat-icon>
                        <input matInput formControlName="xithCollege" appEnglishOnly />
                      </mat-form-field>
                    </div>
                    <div class="form-grid-2">
                      <mat-form-field class="form-field">
                        <mat-label>XI Percentage</mat-label>
                        <mat-icon matPrefix>percent</mat-icon>
                        <input type="number" matInput formControlName="xithPercentage" min="0" max="100" step="0.01" />
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>

            <!-- Tab Navigation Buttons with Step Counter -->
            <div class="tab-navigation">
              <button mat-stroked-button type="button" 
                     [disabled]="selectedTabIndex === 0" 
                     (click)="selectedTabIndex = selectedTabIndex - 1"
                     class="nav-btn back-btn">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <span class="tab-counter">Step {{ selectedTabIndex + 1 }} of 7</span>
              <button mat-raised-button color="primary" type="button" 
                [disabled]="selectedTabIndex === 6" 
                     (click)="onNextTabClick()"
                     class="nav-btn next-btn">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>

          <div class="popup-actions">
            <button mat-stroked-button type="button" (click)="closeManagedStudentModal()">Cancel</button>
            <button mat-raised-button color="primary" type="button" [disabled]="managedStudentSaving" (click)="saveManagedStudent()">
              {{ managedStudentSaving ? 'Saving...' : (managedStudentMode === 'edit' ? 'Update Student' : 'Save Student') }}
            </button>
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
        <div class="form-card managed-students-card">
          <div class="card-title-row">
            <h3 class="card-title">Managed Students</h3>
            <button mat-stroked-button type="button" (click)="openManagedStudentModal('create')">
              <mat-icon>person_add</mat-icon>
              Add Student
            </button>
          </div>
          <p class="managed-students-note">या लॉगिनखाली एकापेक्षा जास्त विद्यार्थी इथून जोडा आणि व्यवस्थापित करा.</p>

          <div class="managed-students-table-wrap" *ngIf="managedStudents.length; else noManagedStudents">
            <table class="managed-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Institute</th>
                  <th>Stream</th>
                  <th>Mobile</th>
                  <th>Profile</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of managedStudents">
                  <td>{{ displayManagedStudentName(student) }}</td>
                  <td>{{ student.instituteName || '-' }}</td>
                  <td>{{ student.streamCode || '-' }}</td>
                  <td>{{ student.mobile || '-' }}</td>
                  <td><span class="completion-pill">{{ student.profileCompletion ?? 0 }}%</span></td>
                  <td><button mat-stroked-button type="button" (click)="openManagedStudentModal('edit', student)">Edit</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #noManagedStudents>
            <p class="managed-students-empty">अतिरिक्त विद्यार्थी अद्याप जोडलेले नाहीत.</p>
          </ng-template>
        </div>

       
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

    .managed-students-card {
      margin-bottom: 12px;
      border-left-color: #059669;
    }

    .managed-students-note {
      margin: 0 0 10px 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .managed-students-table-wrap {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: auto;
      background: #fff;
    }

    .managed-students-table {
      width: 100%;
      min-width: 640px;
      border-collapse: collapse;
    }

    .managed-students-table th,
    .managed-students-table td {
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      padding: 10px;
      font-size: var(--font-size-sm);
    }

    .managed-students-table thead th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
    }

    .managed-students-empty {
      margin: 0;
      padding: 10px;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      background: #fff;
      color: var(--text-secondary);
    }

    .completion-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: #e0f2fe;
      color: #075985;
      font-weight: 700;
      font-size: 0.8rem;
    }

    .managed-student-popup {
      width: min(95vw, 1000px);
      max-height: calc(100vh - 96px);
      overflow: auto;
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border-radius: 16px;
      box-shadow: 0 32px 64px rgba(15, 23, 42, 0.15);
      border: 1px solid rgba(102, 126, 234, 0.1);
    }

    .managed-student-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 10px;
    }

    /* Tab Styles */
    ::ng-deep .profile-tabs .mat-mdc-tab-header {
      background: white;
      border-bottom: 2px solid var(--border-color);
      overflow: hidden;
    }

    ::ng-deep .profile-tabs .mat-mdc-tab-label-container {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      touch-action: pan-x;
      cursor: grab;
    }

    ::ng-deep .profile-tabs .mat-mdc-tab-label-container::-webkit-scrollbar {
      display: none;
    }

    ::ng-deep .profile-tabs .mat-mdc-tab-labels,
    ::ng-deep .profile-tabs .mat-mdc-tab-list {
      background: white;
      min-width: max-content;
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
      user-select: none;
    }

    .tab-title {
      white-space: nowrap;
    }
    /* Form Sections */
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .form-card {
      margin-bottom: 12px;
      padding: var(--spacing-lg);
      background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border: 1px solid rgba(102, 126, 234, 0.08);
      border-radius: 12px;
      border-left: 4px solid var(--primary-color);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .form-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
    }

    .form-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
      border-color: rgba(102, 126, 234, 0.15);
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

    .form-grid-compact {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }

    .form-field {
      width: 100%;
    }

    .form-field-full {
      width: 100%;
      margin-bottom: var(--spacing-md);
    }

    ::ng-deep .student-profile-container .mat-mdc-form-field .mdc-floating-label,
    ::ng-deep .student-profile-container .mat-mdc-form-field.mat-form-field-invalid .mdc-floating-label,
    ::ng-deep .student-profile-container .mat-mdc-form-field-required-marker {
      color: #64748b !important;
    }

    ::ng-deep .student-profile-container .mat-mdc-form-field.mat-focused .mdc-floating-label {
      color: var(--primary-color) !important;
    }

    ::ng-deep .student-profile-container .mat-mdc-form-field .mat-mdc-form-field-error {
      color: #dc2626 !important;
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

    .registration-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
    }

    .registration-title h1 {
      margin: 0 0 8px;
      font-size: clamp(1.4rem, 2.2vw, 2rem);
      color: var(--text-primary);
    }

    .registration-title p {
      margin: 0;
      max-width: 640px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .page-info-card {
      margin: var(--spacing-lg) 0;
    }

    .page-info-text {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .instructions-trigger {
      align-self: center;
      white-space: nowrap;
    }

    .instructions-popup-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 9999 !important;
      overflow-y: auto;
      width: 100vw;
      height: 100vh;
    }

    .instructions-popup {
      width: min(95vw, 980px);
      max-width: 95vw;
      max-height: min(90vh, calc(100vh - 40px));
      background: #fff;
      border-radius: var(--border-radius);
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
      padding: 18px;
      overflow: auto;
      margin: 0 auto;
    }

    @media (max-width: 640px) {
      .instructions-popup {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        padding: 16px;
      }

      .instructions-popup-backdrop {
        padding: 0;
      }
    }

    ::ng-deep .managed-student-modal .mat-mdc-tab-header {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 2px solid rgba(102, 126, 234, 0.1);
      border-radius: 12px 12px 0 0;
      margin-bottom: 0;
      padding: 0 1rem;
    }

    ::ng-deep .managed-student-modal .mat-mdc-tab {
      min-height: 56px;
      border-radius: 8px 8px 0 0;
      margin: 0 2px;
      transition: all 0.3s ease;
    }

    ::ng-deep .managed-student-modal .mat-mdc-tab.mdc-tab--active {
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      border-top: 3px solid var(--primary-color);
    }

    ::ng-deep .managed-student-modal .mdc-tab__text-label {
      font-weight: 600;
      color: #64748b;
      transition: color 0.3s ease;
    }

    ::ng-deep .managed-student-modal .mdc-tab--active .mdc-tab__text-label {
      color: var(--primary-color);
    }

    .popup-tab-actions {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .popup-tab-actions button {
      min-width: 140px;
    }

    .managed-student-modal .form-grid-1 {
      display: grid;
      gap: var(--spacing-md);
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-bottom: var(--spacing-sm);
    }

    .managed-student-modal .form-grid-2,
    .managed-student-modal .form-grid-3,
    .managed-student-modal .form-grid-4,
    .managed-student-modal .form-grid-compact {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-sm);
    }

    @media (min-width: 640px) and (max-width: 1024px) {
      .instructions-popup {
        width: min(92vw, 700px);
        max-width: 92vw;
      }
    }

    .managed-student-modal .form-field,
    .managed-student-modal .form-field-full {
      width: 100%;
      margin: 0;
    }

    .managed-student-modal .mat-form-field .mat-mdc-form-field-flex,
    .managed-student-modal .mat-mdc-text-field-wrapper {
      min-height: 56px;
    }

    .managed-student-modal .mat-mdc-select .mat-mdc-select-trigger {
      min-height: 56px;
      align-items: center;
    }

    .managed-student-modal .mat-form-field .mat-mdc-text-field-input,
    .managed-student-modal .mat-mdc-select .mat-mdc-select-value,
    .managed-student-modal textarea.mat-mdc-input-element {
      min-height: 40px;
      box-sizing: border-box;
    }

    .managed-student-modal .form-section {
      margin-top: 8px;
      gap: var(--spacing-md);
    }

    ::ng-deep .managed-student-tabs .mat-mdc-tab-body-content {
      padding-top: 10px;
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
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid rgba(148, 163, 184, 0.22);
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

      .form-grid-compact {
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

      .form-grid-compact {
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

      .form-grid-compact {
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

      ::ng-deep .profile-tabs .mat-mdc-tab-header-pagination {
        display: none !important;
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

    /* ============================================================
       ERROR HIGHLIGHTING & VALIDATION
       ============================================================ */

    .error-field ::ng-deep .mat-mdc-form-field-outline {
      color: #f44336 !important;
    }

    .error-field ::ng-deep .mat-mdc-form-field-label {
      color: #f44336 !important;
    }

    .error-field ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 0.5rem;
    }

    .error-field input, 
    .error-field textarea {
      border-color: #f44336 !important;
    }

    ::ng-deep .error-field .mat-mdc-text-field-wrapper {
      border-color: #f44336 !important;
    }

    .validation-error-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 1rem;
      animation: slideInDown 0.3s ease;
    }

    .validation-error-summary mat-icon {
      color: #f44336;
      flex-shrink: 0;
    }

    @keyframes slideInDown {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* ============================================================
       TAB IMPROVEMENTS
       ============================================================ */

    .tab-instruction {
      color: #555;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      padding: 10px 12px;
      background: #f5f5f5;
      border-left: 3px solid #667eea;
      border-radius: 4px;
      line-height: 1.5;
    }

    .tab-counter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 0.85rem;
      font-weight: 500;
      background: #f5f5f5;
      padding: 6px 12px;
      border-radius: 4px;
      min-width: 80px;
    }

    .tab-navigation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 2rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(102, 126, 234, 0.1);
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 0 0 12px 12px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      min-width: 120px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
    }

    .back-btn {
      background: #f1f5f9;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }

    .back-btn:hover:not(:disabled) {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .next-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      border: 2px solid var(--primary-color);
    }

    .next-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
    }

    .back-btn {
      order: 1;
      flex-direction: row-reverse;
    }

    .next-btn {
      order: 3;
    }

    .tab-counter {
      order: 2;
      flex: 1;
      text-align: center;
    }

    @media (max-width: 600px) {
      .tab-navigation {
        flex-direction: column;
        gap: 16px;
        padding: 1.5rem;
      }

      .nav-btn,
      .tab-counter {
        width: 100%;
        order: unset !important;
        min-height: 48px;
      }

      .back-btn {
        order: 1;
        flex-direction: row;
      }

      .tab-counter {
        order: 2;
        margin: 8px 0;
      }

      .next-btn {
        order: 3;
      }

      .managed-student-popup {
        max-width: 95vw;
        max-height: 95vh;
        overflow-y: auto;
        border-radius: 12px;
      }

      .form-grid-compact {
        grid-template-columns: 1fr !important;
        gap: var(--spacing-xs);
      }

      .managed-student-modal .form-grid-1,
      .managed-student-modal .form-grid-compact,
      .managed-student-modal .form-grid-2,
      .managed-student-modal .form-grid-3,
      .managed-student-modal .form-grid-4 {
        grid-template-columns: 1fr !important;
      }

      .popup-tab-actions button {
        min-width: 0;
        width: 100%;
      }

      .form-card {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        border-radius: 8px;
      }
    }

    @media (max-width: 480px) {
      .managed-students-table {
        min-width: 560px;
      }

      ::ng-deep .managed-student-modal .mat-mdc-tab-header {
        padding: 0 0.35rem;
      }

      ::ng-deep .managed-student-modal .mat-mdc-tab {
        min-height: 48px;
        margin: 0 1px;
      }

      ::ng-deep .managed-student-modal .mdc-tab__content {
        gap: 0.3rem;
      }

      ::ng-deep .managed-student-modal .mdc-tab__text-label {
        font-size: 0.74rem;
      }

      .popup-actions {
        gap: 8px;
        margin-top: 12px;
        padding-top: 8px;
      }

      .popup-actions button {
        width: 100%;
      }

      .managed-student-popup {
        padding: 10px;
      }
    }

    .lookup-result {
      margin-top: 1rem;
      padding: 12px;
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
      border-radius: 4px;
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
  totalProfileFields = 13; // + photo and signature are mandatory for completion

  // Active tab index for auto-navigation after save
  selectedTabIndex = 0;
  showInstructionsPopup = false;
  showInfoPopup = false;
  infoPopupTitle = '';
  infoPopupText = '';
  managedStudents: any[] = [];
  showManagedStudentModal = false;
  managedStudentMode: 'create' | 'edit' = 'create';
  managedStudentSaving = false;
  editingManagedStudentId: number | null = null;
  managedAadhaarLocked = false;
  private _managedStudentInstituteId: number | null = null;
  managedPhotoDataUrl: string | null = null;
  managedSignatureDataUrl: string | null = null;
  managedPhotoPreviewUrl: string | null = null;
  managedSignaturePreviewUrl: string | null = null;
  managedPhotoRemoved = false;
  managedSignatureRemoved = false;

  get managedStudentInstituteId(): number | null {
    return this._managedStudentInstituteId;
  }

  set managedStudentInstituteId(value: number | null) {
    this._managedStudentInstituteId = value;
    if (this.managedStudentForm) {
      this.managedStudentForm.patchValue({ instituteId: value ?? null }, { emitEvent: false });
    }
  }

  // Pincode lookup properties
  pincodeOptions: PostalLocation[] = [];
  pincodeLookupLoading = false;
  pincodeError: string | null = null;
  private pincodeSubject = new Subject<string>();

  // Form groups matching HSC exam form structure
  personalDetailsForm: FormGroup;
  previousExamForm: FormGroup;
  bankDetailsForm: FormGroup;
  managedStudentForm: FormGroup;

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
      mediumCode: [''],
      sscPassedFromMaharashtra: [null as boolean | null],
      eligibilityCertIssued: [null as boolean | null],
      eligibilityCertNo: ['', [Validators.maxLength(100)]]
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

    this.managedStudentForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      middleName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      motherName: ['', [Validators.maxLength(100)]],
      dob: [null],
      gender: [''],
      instituteId: [null, [Validators.required]],
      streamCode: ['', [Validators.required]],
      mobile: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      aadhaar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      categoryCode: ['', [Validators.maxLength(10)]],
      minorityReligionCode: ['', [Validators.maxLength(20)]],
      divyangCode: ['', [Validators.maxLength(10)]],
      mediumCode: ['', [Validators.maxLength(10)]],
      pinCode: ['', [Validators.maxLength(10)]],
      district: ['', [Validators.maxLength(100)]],
      taluka: ['', [Validators.maxLength(100)]],
      village: ['', [Validators.maxLength(100)]],
      address: ['', [Validators.maxLength(500)]],
      apaarId: ['', [Validators.maxLength(20)]],
      studentSaralId: ['', [Validators.maxLength(50)]],
      sscPassedFromMaharashtra: [null],
      eligibilityCertIssued: [null],
      eligibilityCertNo: ['', [Validators.maxLength(100)]],
      sscSeatNo: ['', [Validators.maxLength(50), Validators.pattern(/^[A-Z0-9]*$/)]],
      sscMonth: [''],
      sscYear: ['', [Validators.minLength(4), Validators.maxLength(4), Validators.pattern(/^\d{4}$|^$/)]],
      sscBoard: ['', [Validators.maxLength(200)]],
      sscPercentage: ['', [Validators.minLength(1), Validators.maxLength(5), Validators.pattern(/^\d+(\.\d{1,2})?$|^$/), Validators.min(0), Validators.max(100)]],
      xithSeatNo: ['', [Validators.maxLength(50), Validators.pattern(/^[A-Z0-9]*$/)]],
      xithMonth: [''],
      xithYear: ['', [Validators.minLength(4), Validators.maxLength(4), Validators.pattern(/^\d{4}$|^$/)]],
      xithCollege: ['', [Validators.maxLength(200)]],
      xithPercentage: ['', [Validators.minLength(1), Validators.maxLength(5), Validators.pattern(/^\d+(\.\d{1,2})?$|^$/), Validators.min(0), Validators.max(100)]]
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
    this.setupManagedEligibilityValidation();
    this.setupPincodeLookup();
    this.setupInstituteAutocomplete();
    // Load institutes and streams FIRST, then load profile
    // This ensures institutes array is populated before pre-population logic runs
    this.loadInstitutesAndStreams().then(() => {
      this.loadProfile();
      this.loadManagedStudents();
    });
  }

  private setupManagedEligibilityValidation() {
    const issuedControl = this.managedStudentForm.get('eligibilityCertIssued');
    const certNoControl = this.managedStudentForm.get('eligibilityCertNo');
    if (!issuedControl || !certNoControl) return;

    const applyRules = (issued: unknown) => {
      if (issued === true) {
        certNoControl.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        certNoControl.setValidators([Validators.maxLength(100)]);
        if (certNoControl.value) {
          certNoControl.setValue('', { emitEvent: false });
        }
      }
      certNoControl.updateValueAndValidity({ emitEvent: false });
    };

    applyRules(issuedControl.value);
    issuedControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((issued) => applyRules(issued));
  }

  loadManagedStudents() {
    this.http.get<{ students: any[] }>(`${API_BASE_URL}/students/managed`).subscribe({
      next: (response) => {
        this.managedStudents = response?.students || [];
      },
      error: () => {
        this.managedStudents = [];
      }
    });
  }

  displayManagedStudentName(student: any): string {
    const fromApi = String(student?.fullName || '').trim();
    if (fromApi) return fromApi;
    return [student?.lastName, student?.firstName, student?.middleName].filter(Boolean).join(' ') || '-';
  }

  openManagedStudentModal(mode: 'create' | 'edit', student?: any) {
    this.managedStudentMode = mode;
    this.editingManagedStudentId = mode === 'edit' ? Number(student?.id || 0) : null;
    this.managedStudentInstituteId = null;
    this.selectedTabIndex = 0;
    this.managedAadhaarLocked = false;
    this.managedStudentForm.get('aadhaar')?.enable({ emitEvent: false });

    if (mode === 'edit' && student) {
      this.http.get<{ ok: boolean; student: any }>(`${API_BASE_URL}/students/managed/${student.id}`).subscribe({
        next: (response) => {
          const studentData = response.student;
          this.managedStudentInstituteId = studentData.instituteId || null;
          this.managedStudentForm.patchValue({
            firstName: studentData.firstName || '',
            middleName: studentData.middleName || '',
            lastName: studentData.lastName || '',
            motherName: studentData.motherName || '',
            dob: studentData.dob ? new Date(studentData.dob) : null,
            gender: studentData.gender || '',
            instituteId: studentData.instituteId || null,
            streamCode: studentData.streamCode || '',
            mobile: studentData.mobile || '',
            aadhaar: studentData.aadhaar || '',
            categoryCode: studentData.categoryCode || '',
            minorityReligionCode: studentData.minorityReligionCode || '',
            divyangCode: studentData.divyangCode || '',
            mediumCode: studentData.mediumCode || '',
            pinCode: studentData.pinCode || '',
            district: studentData.district || '',
            taluka: studentData.taluka || '',
            village: studentData.village || '',
            address: studentData.address || '',
            apaarId: studentData.apaarId || '',
            studentSaralId: studentData.studentSaralId || '',
            sscPassedFromMaharashtra: studentData.sscPassedFromMaharashtra ?? null,
            eligibilityCertIssued: studentData.eligibilityCertIssued ?? null,
            eligibilityCertNo: studentData.eligibilityCertNo || '',
            sscSeatNo: studentData.previousExams?.find((e: any) => e.examType === 'SSC')?.seatNo || '',
            sscMonth: studentData.previousExams?.find((e: any) => e.examType === 'SSC')?.month || '',
            sscYear: studentData.previousExams?.find((e: any) => e.examType === 'SSC')?.year || '',
            sscBoard: studentData.previousExams?.find((e: any) => e.examType === 'SSC')?.boardOrCollegeName || '',
            sscPercentage: studentData.previousExams?.find((e: any) => e.examType === 'SSC')?.percentage || '',
            xithSeatNo: studentData.previousExams?.find((e: any) => e.examType === 'XI')?.seatNo || '',
            xithMonth: studentData.previousExams?.find((e: any) => e.examType === 'XI')?.month || '',
            xithYear: studentData.previousExams?.find((e: any) => e.examType === 'XI')?.year || '',
            xithCollege: studentData.previousExams?.find((e: any) => e.examType === 'XI')?.boardOrCollegeName || '',
            xithPercentage: studentData.previousExams?.find((e: any) => e.examType === 'XI')?.percentage || ''
          });
          this.managedPhotoPreviewUrl = studentData.photoUrl || null;
          this.managedSignaturePreviewUrl = studentData.signatureUrl || null;
          this.managedAadhaarLocked = !!studentData.aadhaar;
          if (this.managedAadhaarLocked) {
            this.managedStudentForm.get('aadhaar')?.disable({ emitEvent: false });
          } else {
            this.managedStudentForm.get('aadhaar')?.enable({ emitEvent: false });
          }
          this.managedPhotoDataUrl = null;
          this.managedSignatureDataUrl = null;
          this.managedPhotoRemoved = false;
          this.managedSignatureRemoved = false;
          this.showManagedStudentModal = true;
        },
        error: () => {
          this.managedStudentForm.patchValue({
            firstName: student.firstName || '',
            middleName: student.middleName || '',
            lastName: student.lastName || '',
            motherName: student.motherName || '',
            dob: student.dob ? new Date(student.dob) : null,
            gender: student.gender || '',
            instituteId: student.instituteId || null,
            streamCode: student.streamCode || '',
            mobile: student.mobile || '',
            aadhaar: student.aadhaar || '',
            categoryCode: student.categoryCode || '',
            minorityReligionCode: student.minorityReligionCode || '',
            divyangCode: student.divyangCode || '',
            mediumCode: student.mediumCode || '',
            pinCode: student.pinCode || '',
            district: student.district || '',
            taluka: student.taluka || '',
            village: student.village || '',
            address: student.address || '',
            apaarId: student.apaarId || '',
            studentSaralId: student.studentSaralId || '',
            sscPassedFromMaharashtra: student.sscPassedFromMaharashtra ?? null,
            eligibilityCertIssued: student.eligibilityCertIssued ?? null,
            eligibilityCertNo: student.eligibilityCertNo || ''
          });
          this.managedPhotoPreviewUrl = student.photoUrl || null;
          this.managedSignaturePreviewUrl = student.signatureUrl || null;
          this.managedAadhaarLocked = !!student.aadhaar;
          if (this.managedAadhaarLocked) {
            this.managedStudentForm.get('aadhaar')?.disable({ emitEvent: false });
          } else {
            this.managedStudentForm.get('aadhaar')?.enable({ emitEvent: false });
          }
          this.managedPhotoDataUrl = null;
          this.managedSignatureDataUrl = null;
          this.managedPhotoRemoved = false;
          this.managedSignatureRemoved = false;
          this.managedStudentInstituteId = student.instituteId || null;
          this.showManagedStudentModal = true;
        }
      });
      return;
    }

    this.managedStudentForm.reset({
      firstName: '',
      middleName: '',
      lastName: '',
      motherName: '',
      dob: null,
      gender: '',
      instituteId: null,
      streamCode: '',
      mobile: '',
      aadhaar: '',
      categoryCode: '',
      minorityReligionCode: '',
      divyangCode: '',
      mediumCode: '',
      pinCode: '',
      district: '',
      taluka: '',
      village: '',
      address: '',
      apaarId: '',
      studentSaralId: '',
      sscPassedFromMaharashtra: null,
      eligibilityCertIssued: null,
      eligibilityCertNo: '',
      sscSeatNo: '',
      sscMonth: '',
      sscYear: '',
      sscBoard: '',
      sscPercentage: '',
      xithSeatNo: '',
      xithMonth: '',
      xithYear: '',
      xithCollege: '',
      xithPercentage: ''
    });
    this.managedPhotoPreviewUrl = null;
    this.managedSignaturePreviewUrl = null;
    this.managedAadhaarLocked = false;
    this.managedStudentForm.get('aadhaar')?.enable({ emitEvent: false });
    this.managedPhotoDataUrl = null;
    this.managedSignatureDataUrl = null;
    this.managedPhotoRemoved = false;
    this.managedSignatureRemoved = false;
    this.selectedTabIndex = 0;
    this.showManagedStudentModal = true;

    // Always start Add Student from first tab with clean state.
    if (mode === 'create') {
      this.clearFormProgress();
    }
  }

  closeManagedStudentModal() {
    this.showManagedStudentModal = false;
    this.editingManagedStudentId = null;
  }

  saveManagedStudent() {
    if (this.managedStudentInstituteId !== null) {
      this.managedStudentForm.patchValue({ instituteId: this.managedStudentInstituteId });
    }

    if (this.managedStudentForm.invalid) {
      this.managedStudentForm.markAllAsTouched();
      this.snackBar.open('Please fill required fields for managed student.', 'Close', { duration: 2500 });
      return;
    }

    for (let tabIndex = 0; tabIndex <= 6; tabIndex++) {
      if (!this.isManagedTabComplete(tabIndex)) {
        this.markManagedTabTouched(tabIndex);
        this.selectedTabIndex = tabIndex;
        this.snackBar.open(this.getManagedTabValidationMessage(tabIndex), 'Close', { duration: 3000 });
        return;
      }
    }

    // Check for duplicate student in same account
    const rawValue = this.managedStudentForm.getRawValue();
    const aadhaar = rawValue.aadhaar;
    if (aadhaar) {
      const existingStudent = this.managedStudents.find(student => {
        if (String(student?.aadhaar || '') !== String(aadhaar)) return false;
        if (this.managedStudentMode === 'edit' && this.editingManagedStudentId) {
          return Number(student?.id) !== Number(this.editingManagedStudentId);
        }
        return true;
      });
      if (existingStudent) {
        this.snackBar.open('This student is already registered under your account.', 'Close', { duration: 3000 });
        return;
      }
    }

    const dobValue = this.managedStudentForm.value.dob;

    const payload = {
      firstName: String(rawValue.firstName || '').trim().toUpperCase(),
      middleName: String(rawValue.middleName || '').trim().toUpperCase() || undefined,
      lastName: String(rawValue.lastName || '').trim().toUpperCase(),
      motherName: String(rawValue.motherName || '').trim() || undefined,
      dob: dobValue ? (dobValue instanceof Date ? dobValue.toISOString() : String(dobValue).trim()) : undefined,
      gender: String(rawValue.gender || '').trim() || undefined,
      instituteId: Number(rawValue.instituteId),
      streamCode: String(rawValue.streamCode || '').trim(),
      mobile: String(rawValue.mobile || '').trim() || undefined,
      aadhaar: String(rawValue.aadhaar || '').trim() || undefined,
      address: String(rawValue.address || '').trim() || undefined,
      pinCode: String(rawValue.pinCode || '').trim() || undefined,
      district: String(rawValue.district || '').trim() || undefined,
      taluka: String(rawValue.taluka || '').trim() || undefined,
      village: String(rawValue.village || '').trim() || undefined,
      categoryCode: String(rawValue.categoryCode || '').trim() || undefined,
      minorityReligionCode: String(rawValue.minorityReligionCode || '').trim() || undefined,
      divyangCode: String(rawValue.divyangCode || '').trim() || undefined,
      mediumCode: String(rawValue.mediumCode || '').trim() || undefined,
      apaarId: String(rawValue.apaarId || '').trim() || undefined,
      studentSaralId: String(rawValue.studentSaralId || '').trim() || undefined,
      sscPassedFromMaharashtra: rawValue.sscPassedFromMaharashtra ?? undefined,
      eligibilityCertIssued: rawValue.eligibilityCertIssued ?? undefined,
      eligibilityCertNo: rawValue.eligibilityCertIssued === true
        ? (String(rawValue.eligibilityCertNo || '').trim().toUpperCase() || undefined)
        : null,
      photoDataUrl: this.managedPhotoRemoved ? null : (this.managedPhotoDataUrl || undefined),
      signatureDataUrl: this.managedSignatureRemoved ? null : (this.managedSignatureDataUrl || undefined),
      sscSeatNo: String(rawValue.sscSeatNo || '').trim() || undefined,
      sscMonth: String(rawValue.sscMonth || '').trim() || undefined,
      sscYear: rawValue.sscYear ? Number(rawValue.sscYear) : undefined,
      sscBoard: String(rawValue.sscBoard || '').trim() || undefined,
      sscPercentage: String(rawValue.sscPercentage || '').trim() || undefined,
      xithSeatNo: String(rawValue.xithSeatNo || '').trim() || undefined,
      xithMonth: String(rawValue.xithMonth || '').trim() || undefined,
      xithYear: rawValue.xithYear ? Number(rawValue.xithYear) : undefined,
      xithCollege: String(rawValue.xithCollege || '').trim() || undefined,
      xithPercentage: String(rawValue.xithPercentage || '').trim() || undefined
    };

    this.managedStudentSaving = true;
    const request$ = this.managedStudentMode === 'edit' && this.editingManagedStudentId
      ? this.http.patch(`${API_BASE_URL}/students/managed/${this.editingManagedStudentId}`, payload)
      : this.http.post(`${API_BASE_URL}/students/managed`, payload);

    request$.subscribe({
      next: () => {
        this.managedStudentSaving = false;
        this.closeManagedStudentModal();
        this.loadManagedStudents();
        this.snackBar.open(this.managedStudentMode === 'edit' ? 'Managed student updated.' : 'Managed student added.', 'Close', { duration: 2500 });
        
        // Clear form and redirect to first tab for new student
        if (this.managedStudentMode === 'create') {
          this.managedStudentForm.reset({
            firstName: '',
            middleName: '',
            lastName: '',
            motherName: '',
            dob: null,
            gender: '',
            instituteId: null,
            streamCode: '',
            mobile: '',
            aadhaar: '',
            categoryCode: '',
            minorityReligionCode: '',
            divyangCode: '',
            mediumCode: '',
            pinCode: '',
            district: '',
            taluka: '',
            village: '',
            address: '',
            apaarId: '',
            studentSaralId: '',
            sscPassedFromMaharashtra: null,
            eligibilityCertIssued: null,
            eligibilityCertNo: '',
            sscSeatNo: '',
            sscMonth: '',
            sscYear: '',
            sscBoard: '',
            sscPercentage: '',
            xithSeatNo: '',
            xithMonth: '',
            xithYear: '',
            xithCollege: '',
            xithPercentage: ''
          });
          this.managedPhotoPreviewUrl = null;
          this.managedSignaturePreviewUrl = null;
          this.managedPhotoDataUrl = null;
          this.managedSignatureDataUrl = null;
          this.managedPhotoRemoved = false;
          this.managedSignatureRemoved = false;
          this.managedStudentInstituteId = null;
          this.selectedTabIndex = 0;
          this.clearFormProgress(); // Clear saved progress after successful save
          this.openManagedStudentModal('create'); // Reopen modal with cleared form
        }
      },
      error: (err) => {
        this.managedStudentSaving = false;
        const message = err?.error?.message || err?.error?.error || 'Failed to save managed student.';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Fetch student by Aadhaar number from database
   * If found, auto-fill the form with existing student data
   */
  async fetchStudentByAadhaar() {
    if (this.managedStudentMode === 'edit') {
      return;
    }
    const aadhaar = String(this.managedStudentForm.get('aadhaar')?.value || '').trim();
    
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      this.snackBar.open('कृपया वैध 12 अंकी आधार क्रमांक भरा', 'बंद', { duration: 2500 });
      return;
    }

    try {
      const response = await this.http.get<any>(`${API_BASE_URL}/students/lookup-by-aadhaar/${aadhaar}`).toPromise();
      
      if (response?.found) {
        const student = response.fullStudent;
        // Auto-fill the form with found student data
        this.managedStudentForm.patchValue({
          firstName: student.firstName || '',
          middleName: student.middleName || '',
          lastName: student.lastName || '',
          motherName: student.motherName || '',
          dob: student.dob ? new Date(student.dob) : null,
          gender: student.gender || '',
          mobile: student.mobile || '',
          instituteId: student.instituteId || null,
          streamCode: student.streamCode || '',
          categoryCode: student.categoryCode || '',
          minorityReligionCode: student.minorityReligionCode || '',
          divyangCode: student.divyangCode || '',
          mediumCode: student.mediumCode || '',
          pinCode: student.pinCode || '',
          district: student.district || '',
          taluka: student.taluka || '',
          village: student.village || '',
          address: student.address || '',
          apaarId: student.apaarId || '',
          studentSaralId: student.studentSaralId || '',
          sscPassedFromMaharashtra: student.sscPassedFromMaharashtra ?? null,
          eligibilityCertIssued: student.eligibilityCertIssued ?? null,
          eligibilityCertNo: student.eligibilityCertNo || ''
        });
        this.managedStudentInstituteId = student.instituteId || null;
        this.snackBar.open(`विद्यार्थी सापडला: ${student.firstName} ${student.lastName}. फॉर्ममधील माहिती आपोआप भरली आहे.`, 'बंद', { duration: 4000 });
      } else {
        // Keep the entered Aadhaar and any already typed data intact on not-found.
        this.snackBar.open('या आधार क्रमांकासाठी नोंद सापडली नाही. कृपया माहिती मॅन्युअली भरा.', 'बंद', { duration: 3000 });
      }
    } catch (err) {
      this.snackBar.open('आधार शोधताना अडचण आली. कृपया पुन्हा प्रयत्न करा.', 'बंद', { duration: 2500 });
    }
  }

  onNextTabClick() {
    if (!this.isManagedTabComplete(this.selectedTabIndex)) {
      this.markManagedTabTouched(this.selectedTabIndex);
      this.snackBar.open(this.getManagedTabValidationMessage(this.selectedTabIndex), 'Close', { duration: 3000 });
      return;
    }
    this.selectedTabIndex = Math.min(this.selectedTabIndex + 1, 6);
    // Save progress to localStorage
    this.saveFormProgress();
  }

  onManagedTabIndexChange(nextIndex: number) {
    if (nextIndex <= this.selectedTabIndex) {
      this.selectedTabIndex = nextIndex;
      return;
    }

    for (let tabIndex = 0; tabIndex < nextIndex; tabIndex++) {
      if (!this.isManagedTabComplete(tabIndex)) {
        this.markManagedTabTouched(tabIndex);
        this.snackBar.open(this.getManagedTabValidationMessage(tabIndex), 'Close', { duration: 3000 });
        this.selectedTabIndex = tabIndex;
        return;
      }
    }

    this.selectedTabIndex = nextIndex;
    this.saveFormProgress();
  }

  private markManagedTabTouched(tabIndex: number) {
    const fieldsByTab: Record<number, string[]> = {
      0: ['aadhaar'],
      1: ['instituteId', 'streamCode'],
      2: ['firstName', 'lastName', 'motherName', 'dob', 'gender', 'mobile'],
      3: ['address', 'pinCode', 'district', 'taluka', 'village'],
      4: ['categoryCode', 'minorityReligionCode', 'divyangCode', 'mediumCode', 'sscPassedFromMaharashtra', 'eligibilityCertIssued', 'eligibilityCertNo'],
      5: [],
      6: ['sscSeatNo', 'sscMonth', 'sscYear', 'sscBoard', 'sscPercentage', 'xithSeatNo', 'xithMonth', 'xithYear', 'xithCollege', 'xithPercentage']
    };
    for (const field of fieldsByTab[tabIndex] || []) {
      this.managedStudentForm.get(field)?.markAsTouched();
    }
  }

  private isManagedTabComplete(tabIndex: number): boolean {
    const value = this.managedStudentForm.getRawValue();
    const filled = (v: unknown) => String(v ?? '').trim() !== '';

    switch (tabIndex) {
      case 0:
        return /^\d{12}$/.test(String(value.aadhaar || '').trim());
      case 1:
        return !!value.instituteId && filled(value.streamCode);
      case 2:
        return filled(value.firstName) && filled(value.lastName) && filled(value.motherName) && !!value.dob && filled(value.gender) && /^\d{10}$/.test(String(value.mobile || '').trim());
      case 3:
        return filled(value.address) && /^\d{6}$/.test(String(value.pinCode || '').trim()) && filled(value.district) && filled(value.taluka) && filled(value.village);
      case 4:
        if (!filled(value.categoryCode) || !filled(value.minorityReligionCode) || !filled(value.divyangCode) || !filled(value.mediumCode)) {
          return false;
        }
        if (value.sscPassedFromMaharashtra === null || value.sscPassedFromMaharashtra === undefined) return false;
        if (value.eligibilityCertIssued === null || value.eligibilityCertIssued === undefined) return false;
        if (value.eligibilityCertIssued === true && !filled(value.eligibilityCertNo)) return false;
        return true;
      case 5:
        return !!(this.managedPhotoDataUrl || this.managedPhotoPreviewUrl) && !!(this.managedSignatureDataUrl || this.managedSignaturePreviewUrl);
      case 6:
        return filled(value.sscSeatNo) && filled(value.sscMonth) && filled(value.sscYear) && filled(value.sscBoard) && filled(value.sscPercentage)
          && filled(value.xithSeatNo) && filled(value.xithMonth) && filled(value.xithYear) && filled(value.xithCollege) && filled(value.xithPercentage);
      default:
        return true;
    }
  }

  private getManagedTabValidationMessage(tabIndex: number): string {
    const messages: Record<number, string> = {
      0: 'पुढे जाण्यापूर्वी 12 अंकी आधार क्रमांक भरा.',
      1: 'पुढे जाण्यापूर्वी महाविद्यालय आणि शाखा निवडा.',
      2: 'पुढे जाण्यापूर्वी वैयक्तिक माहिती पूर्ण भरा.',
      3: 'पुढे जाण्यापूर्वी पत्ता माहिती पूर्ण भरा.',
      4: 'पुढे जाण्यापूर्वी डेमोग्राफिक माहिती पूर्ण भरा.',
      5: 'पुढे जाण्यापूर्वी फोटो आणि स्वाक्षरी अपलोड करा.',
      6: 'जतन करण्यापूर्वी मागील परीक्षेची माहिती पूर्ण भरा.'
    };
    return messages[tabIndex] || 'कृपया आवश्यक माहिती भरा.';
  }

  onManagedAssetSaved(event: { type: 'photo' | 'signature'; dataUrl: string; sizeKB: number }) {
    if (event.type === 'photo') {
      this.managedPhotoDataUrl = event.dataUrl;
      this.managedPhotoPreviewUrl = event.dataUrl;
      this.managedPhotoRemoved = false;
    } else {
      this.managedSignatureDataUrl = event.dataUrl;
      this.managedSignaturePreviewUrl = event.dataUrl;
      this.managedSignatureRemoved = false;
    }
  }

  onManagedAssetRemoved(type: 'photo' | 'signature') {
    if (type === 'photo') {
      this.managedPhotoDataUrl = null;
      this.managedPhotoPreviewUrl = null;
      this.managedPhotoRemoved = true;
    } else {
      this.managedSignatureDataUrl = null;
      this.managedSignaturePreviewUrl = null;
      this.managedSignatureRemoved = true;
    }
  }

  private saveFormProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = this.auth.user()?.userId;
      if (userId) {
        const progressData = {
          formData: this.managedStudentForm.value,
          selectedTabIndex: this.selectedTabIndex,
          managedStudentInstituteId: this.managedStudentInstituteId,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`studentFormProgress_${userId}`, JSON.stringify(progressData));
      }
    }
  }

  private loadFormProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = this.auth.user()?.userId;
      if (userId) {
        const savedData = localStorage.getItem(`studentFormProgress_${userId}`);
        if (savedData) {
          try {
            const progressData = JSON.parse(savedData);
            // Check if data is not too old (24 hours)
            const savedTime = new Date(progressData.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              this.managedStudentForm.patchValue(progressData.formData);
              this.selectedTabIndex = progressData.selectedTabIndex || 0;
              this.managedStudentInstituteId = progressData.managedStudentInstituteId || null;
              this.snackBar.open('Previous form progress restored', 'Close', { duration: 2000 });
            } else {
              // Clear old data
              localStorage.removeItem(`studentFormProgress_${userId}`);
            }
          } catch (err) {
            // Invalid data, clear it
            localStorage.removeItem(`studentFormProgress_${userId}`);
          }
        }
      }
    }
  }

  private clearFormProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = this.auth.user()?.userId;
      if (userId) {
        localStorage.removeItem(`studentFormProgress_${userId}`);
      }
    }
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
            } else {
              this.applyPincodeToAddressForms(pincode, locations[0]);
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
          mediumCode: profile.mediumCode || '',
          sscPassedFromMaharashtra: profile.sscPassedFromMaharashtra ?? null,
          eligibilityCertIssued: profile.eligibilityCertIssued ?? null,
          eligibilityCertNo: profile.eligibilityCertNo || ''
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
    const hasPhoto = this.hasMeaningfulAsset(profile?.photoUrl);
    const hasSignature = this.hasMeaningfulAsset(profile?.signatureUrl);

    if (hasSSCYear) completedCount++;
    if (hasXIYear) completedCount++;
    if (hasPhoto) completedCount++;
    if (hasSignature) completedCount++;

    this.profileCompletionCount = completedCount;
    this.profileCompletionPercentage = Math.round((completedCount / this.totalProfileFields) * 100);
  }

  private hasMeaningfulAsset(url: unknown) {
    const value = String(url || '').trim().toLowerCase();
    if (!value) return false;
    // Do not count placeholder/default images as completed profile assets.
    return !/(default|placeholder|avatar)/.test(value);
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
      GEN: 'Open',
      GENERAL: 'Open',
      OPEN: 'Open',
      OBC: 'OBC',
      SC: 'Scheduled Caste (SC)',
      ST: 'Scheduled Tribe (ST)',
      VJA: 'VJ/DT (VJ-A)',
      NT: 'Nomadic Tribe (NT)',
      NTB: 'Nomadic Tribe (NT-B)',
      NTC: 'Nomadic Tribe (NT-C)',
      NTD: 'Nomadic Tribe (NT-D)',
      SBC: 'SBC',
      SEBC: 'SEBC',
      EWS: 'EWS'
    };
    return code ? (labels[code] || code) : '-';
  }

  getReligionLabel(code?: string | null): string {
    const labels: Record<string, string> = {
      
      HINDU_NON_MINORITY: 'Hindu & Other Non-Minority',
      MUSLIM: 'Muslim',
      CHRISTIAN: 'Christian',
      SIKH: 'Sikh',
      BUDDHIST: 'Buddhist',
      JAIN: 'Jain',
      PARSI: 'Parsi',
      JEWISH: 'Jewish',
      OTHER: 'Other'
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
      this.calculateProfileCompletion(this.profile);
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
        this.calculateProfileCompletion(this.profile);
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
        mobile: formData.mobile || '',
        sscPassedFromMaharashtra: formData.sscPassedFromMaharashtra ?? null,
        eligibilityCertIssued: formData.eligibilityCertIssued ?? null,
        eligibilityCertNo: formData.eligibilityCertIssued === true
          ? (formData.eligibilityCertNo?.toUpperCase() || '')
          : null
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

  onOnlyDigitsInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const cleaned = input.value.replace(/\D+/g, '');

    const controlName = input.getAttribute('formControlName');
    if (controlName && cleaned !== input.value) {
      const control = this.managedStudentForm.get(controlName)
        || this.personalDetailsForm.get(controlName)
        || this.previousExamForm.get(controlName)
        || this.bankDetailsForm.get(controlName);

      if (control) {
        control.setValue(cleaned, { emitEvent: false });
      }
    }
  }

  onAadhaarBlur(event: Event) {
    this.onOnlyDigitsInput(event);
    if (this.managedStudentMode === 'edit') return;
    const input = event.target as HTMLInputElement;
    if (input?.value?.length === 12) {
      this.fetchStudentByAadhaar();
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
      this.applyPincodeToAddressForms(selectedPincode, location);

      // Clear autocomplete options and error
      this.pincodeOptions = [];
      this.pincodeError = null;

      this.snackBar.open('✓ पिनकोडवरून पत्ता माहिती भरली गेली', '', { duration: 2000 });
    }
  }

  private applyPincodeToAddressForms(pincode: string, location: PostalLocation) {
    const patchData = {
      district: location.district || '',
      taluka: location.taluka || '',
      village: location.village || location.officeName || ''
    };

    const personalPincode = String(this.personalDetailsForm.get('pincode')?.value || '').trim();
    if (personalPincode === pincode) {
      this.personalDetailsForm.patchValue({
        pincode: location.pincode,
        ...patchData
      }, { emitEvent: false });
    }

    const managedPincode = String(this.managedStudentForm.get('pinCode')?.value || '').trim();
    if (managedPincode === pincode) {
      this.managedStudentForm.patchValue({
        pinCode: location.pincode,
        ...patchData
      }, { emitEvent: false });
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
