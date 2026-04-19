import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InstitutePickerComponent, InstituteOption } from '../../components/institute-picker/institute-picker.component';

import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-institute-letter-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    InstitutePickerComponent
  ],
  template: `
    <div class="page-wrap">
      <mat-card class="form-card no-print">
        <div class="card-header">
          <h1>Institute Letter Of Concern</h1>
          <p>Account activation letter generation (no login required)</p>
        </div>

        <form [formGroup]="letterForm" class="grid-form">
          <div class="picker-field">
            <app-institute-picker
              [selectedInstituteId]="selectedInstituteId"
              (selectedInstituteIdChange)="onInstitutePicked($event)">
            </app-institute-picker>
          </div>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>Institute / Trust Name</mat-label>
            <input
              matInput
              formControlName="governingBodyName"
              (focus)="onFieldFocus('governingBodyName')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('governingBodyName') ? 'उदा. XYZ शिक्षण संस्था' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>Junior College Name</mat-label>
            <input
              matInput
              formControlName="juniorCollegeName"
              (focus)="onFieldFocus('juniorCollegeName')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('juniorCollegeName') ? 'कनिष्ठ महाविद्यालयाचे नाव' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>College Index Number</mat-label>
            <input
              matInput
              formControlName="collegeIndexNo"
              (focus)="onFieldFocus('collegeIndexNo')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('collegeIndexNo') ? 'उदा. 57.02.018' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>District</mat-label>
            <input
              matInput
              formControlName="district"
              (focus)="onFieldFocus('district')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('district') ? 'उदा. बीड' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>Principal Full Name</mat-label>
            <input
              matInput
              formControlName="principalFullName"
              (focus)="onFieldFocus('principalFullName')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('principalFullName') ? 'प्राचार्य पूर्ण नाव' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>Principal / College Email ID</mat-label>
            <input
              matInput
              formControlName="email"
              (focus)="onFieldFocus('email')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('email') ? 'उदा. principal@college.edu' : ''" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="clean-field">
            <mat-label>Mobile Number</mat-label>
            <input
              matInput
              formControlName="mobile"
              maxlength="10"
              (focus)="onFieldFocus('mobile')"
              (blur)="onFieldBlur()"
              [placeholder]="showPlaceholder('mobile') ? '10 digit mobile number' : ''" />
          </mat-form-field>
        </form>

        <div class="actions">
          <button mat-stroked-button type="button" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back To Login
          </button>
          <button mat-raised-button color="primary" type="button" (click)="print()" [disabled]="letterForm.invalid">
            <mat-icon>print</mat-icon>
            Print Letter
          </button>
        </div>
      </mat-card>

      <div class="letter-sheet">
        <div class="letterhead-space"></div>

        <div class="letter-body">
          <div class="line">प्रति</div>
          <div class="line">व्यवस्थापक</div>
          <div class="line">Hisoft IT Solutions Pvt. Ltd.</div>
          <div class="line">छत्रपती संभाजी नगर, महाराष्ट्र</div>

          <div class="line subject-line">विषय: ऑनलाईन HSC परीक्षा फॉर्म संबंधित सेवा उपलब्ध करून देण्याबाबत</div>

          <div class="line">महोदय,</div>

          <p>
            वरील विषयास अनुसरून नम्र विनंती करण्यात येते की आमचे कनिष्ठ महाविद्यालय
            <strong>{{ textValue('juniorCollegeName') }}</strong>
            हे
            <strong>{{ textValue('governingBodyName') }}</strong>
            या संस्थेच्या अंतर्गत कार्यरत असून सदरील महाविद्यालयाचा Index क्रमांक
            <strong>{{ textValue('collegeIndexNo') }}</strong>
            असा आहे. सदरील महाविद्यालय
            <strong>{{ textValue('district') }}</strong>
            जिल्ह्यात कार्यरत आहे. बोर्डाच्या परीक्षा फॉर्म प्रक्रियेदरम्यान विद्यार्थ्यांना वारंवार तांत्रिक अडचणींचा सामना करावा लागतो.
          </p>

          <p>
            वरील अडचणी कमी करण्यासाठी आपल्याकडील ऑनलाईन HSC परीक्षा फॉर्म सेवा आमच्या महाविद्यालयासाठी उपलब्ध करून द्यावी, ही नम्र विनंती आहे.
          </p>

          <p>
            तसेच आम्ही आपले पोर्टल तपासले असून ते परीक्षेच्या दृष्टीने उपयुक्त व सोयीस्कर आढळले आहे. खाली नमूद नियम व अटी आम्हाला पूर्णतः मान्य असून, आमच्या संस्थेस लॉगिन प्रवेश सुविधा प्रदान करण्यात यावी.
          </p>

          <div class="sign-block">
            <div>आपला विश्वासू,</div>
            <div>प्राचार्य</div>
            <div>(<strong>{{ textValue('juniorCollegeName') }}</strong>)</div>
          </div>

          <div class="meta-row"><span>प्राचार्य पूर्ण नाव:</span> <strong>{{ textValue('principalFullName') }}</strong></div>
          <div class="meta-row"><span>कनिष्ठ महाविद्यालय/प्राचार्य ईमेल आयडी:</span> <strong>{{ textValue('email') }}</strong></div>
          <div class="meta-row"><span>मोबाईल क्रमांक:</span> <strong>{{ textValue('mobile') }}</strong></div>

          <div class="terms-title">मान्य असलेल्या नियम व अटी:</div>
          <ul class="terms-list">
            <li>सदरील परीक्षा फॉर्म सेवा ही ऐच्छिक स्वरूपाची असेल.</li>
            <li>महाविद्यालयीन लॉगिन संबंधी सेवा निशुल्क उपलब्ध राहील.</li>
            <li>विद्यार्थी लॉगीन संबंधित सेवा सशुल्क असतील.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #f3f5f7;
        min-height: 100vh;
      }

      .page-wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 20px;
        display: grid;
        gap: 16px;
      }

      .form-card {
        padding: 16px;
      }

      .card-header h1 {
        margin: 0;
        font-size: 22px;
      }

      .card-header p {
        margin: 6px 0 16px;
        color: #556070;
      }

      .grid-form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .picker-field {
        grid-column: 1 / -1;
      }

      .actions {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .clean-field {
        width: 100%;
      }

      :host ::ng-deep .clean-field .mat-mdc-form-field-infix {
        min-height: 48px;
      }

      /* In this form, keep only label visible for institute picker input */
      :host ::ng-deep app-institute-picker input::placeholder {
        color: transparent !important;
      }

      :host ::ng-deep app-institute-picker input:-ms-input-placeholder {
        color: transparent !important;
      }

      :host ::ng-deep app-institute-picker input::-ms-input-placeholder {
        color: transparent !important;
      }

      .letter-sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: #fff;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
        box-sizing: border-box;
        padding: 12mm 14mm 14mm;
      }

      .letterhead-space {
        height: 50mm;
        border: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        background: transparent;
      }

      .letter-body {
        font-size: 14px;
        line-height: 1.48;
        color: #111;
      }

      .line {
        margin: 0;
      }

      .subject-line {
        margin: 10px 0 8px;
        font-weight: 700;
      }

      p {
        margin: 6px 0;
        text-align: justify;
      }

      .sign-block {
        margin-top: 80px;
        margin-bottom: 8px;
      }

      .meta-row {
        margin: 4px 0;
      }

      .terms-title {
        margin-top: 12px;
        font-weight: 700;
      }

      .terms-list {
        margin: 6px 0 0;
        padding-left: 22px;
      }

      .terms-list li {
        margin-bottom: 2px;
      }

      @media (max-width: 900px) {
        .grid-form {
          grid-template-columns: 1fr;
        }

        .letter-sheet {
          width: 100%;
          min-height: auto;
          padding: 16px;
        }

        .letterhead-space {
          height: 60px;
          margin-bottom: 8px;
        }
      }

      @page {
        size: A4 portrait;
        margin: 0;
      }

      @media print {
        :host {
          background: #fff;
        }

        .no-print {
          display: none !important;
        }

        .page-wrap {
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .letter-sheet {
          box-shadow: none;
          margin: 0;
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 14mm 14mm;
        }

        .letterhead-space {
          height: 28mm;
          border: 0 !important;
          outline: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
        }
      }
    `
  ]
})
export class InstituteLetterGeneratorComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly institutes = signal<InstituteOption[]>([]);
  readonly activeField = signal<string | null>(null);
  selectedInstituteId: number | null = null;

  readonly letterForm = this.fb.group({
    governingBodyName: ['', [Validators.required]],
    juniorCollegeName: ['', [Validators.required]],
    collegeIndexNo: ['', [Validators.required]],
    district: ['', [Validators.required]],
    principalFullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
  });

  ngOnInit(): void {
    this.http.get<{ institutes: InstituteOption[] }>(`${API_BASE_URL}/institutes`).subscribe({
      next: (res) => {
        this.institutes.set(res?.institutes || []);
      },
      error: () => {
        this.institutes.set([]);
      }
    });
  }

  onInstitutePicked(instituteId: number) {
    this.selectedInstituteId = instituteId;
    const selectedId = Number(this.selectedInstituteId || 0);
    const selected = this.institutes().find((item) => item.id === selectedId);
    if (!selected) return;

    const indexFromInstitute = String(selected.code || selected.collegeNo || '').trim();

    this.letterForm.patchValue({
      juniorCollegeName: selected.name || this.letterForm.value.juniorCollegeName || '',
      collegeIndexNo: this.letterForm.value.collegeIndexNo || indexFromInstitute
    });
  }

  onFieldFocus(controlName: string) {
    this.activeField.set(controlName);
  }

  onFieldBlur() {
    this.activeField.set(null);
  }

  showPlaceholder(controlName: keyof typeof this.letterForm.value) {
    const control = this.letterForm.get(controlName as string);
    return this.activeField() === controlName || !!control?.touched;
  }

  textValue(key: keyof typeof this.letterForm.value) {
    const value = this.letterForm.get(key as string)?.value;
    const normalized = String(value || '').trim();
    return normalized || '________________';
  }

  print() {
    if (this.letterForm.invalid) {
      this.letterForm.markAllAsTouched();
      return;
    }
    window.print();
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
