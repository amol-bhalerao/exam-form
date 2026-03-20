import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InstituteSearchModalComponent } from '../../../components/institute-search-modal/institute-search-modal.component';

import { API_BASE_URL } from '../../../core/api';

type Subject = { id: number; code: string; name: string; category?: string };

@Component({
  selector: 'app-student-application-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIf,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    InstituteSearchModalComponent
  ],
  template: `
    @if (application()) {
      <mat-card class="card">
        <div class="row">
          <div>
            <div class="h">Application {{ application()!.applicationNo }}</div>
            <div class="p">Status: <b>{{ application()!.status }}</b></div>
          </div>
          <div class="grow"></div>
          <a mat-stroked-button [routerLink]="['/student/forms', application()!.id, 'print']" target="_blank">Print</a>
          <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || form.invalid || application()!.status !== 'DRAFT'">
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
          <button mat-flat-button color="accent" (click)="submit()" [disabled]="submitting() || application()!.status !== 'DRAFT'">
            {{ submitting() ? 'Submitting…' : 'Submit to institute' }}
          </button>
        </div>
      </mat-card>

      <mat-card class="card">
        <div class="row">
          <div>
            <div class="h">Institute details</div>
            <div class="p">Search and prefill institute fields for your application.</div>
          </div>
          <div class="grow"></div>
          <button mat-stroked-button type="button" (click)="showInstitutePicker.set(true)">Search college</button>
        </div>
        <div *ngIf="selectedInstitute()" style="margin-top: 8px;">
          <div><b>{{ selectedInstitute()!.name }}</b> ({{ selectedInstitute()!.code || 'No code' }})</div>
          <div>{{ selectedInstitute()!.address || 'No address' }}, {{ selectedInstitute()!.city || '' }} {{ selectedInstitute()!.district || '' }}</div>
          <div>Contact: {{ selectedInstitute()!.contactPerson || 'N/A' }} | {{ selectedInstitute()!.contactMobile || 'N/A' }}</div>
        </div>
      </mat-card>

      <app-institute-search-modal
        [visible]="showInstitutePicker()"
        (visibleChange)="showInstitutePicker.set($event)"
        (selected)="selectInstitute($event)">
      </app-institute-search-modal>

      <form [formGroup]="form">
        <mat-card class="card">
          <div class="h2">PDF Fields (1–14)</div>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Index No (1a)</mat-label>
              <input matInput formControlName="indexNo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>UDISE No (1b)</mat-label>
              <input matInput formControlName="udiseNo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Student Saral ID (1c)</mat-label>
              <input matInput formControlName="studentSaralId" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Appl.Sr.No (2a)</mat-label>
              <input matInput formControlName="applSrNo" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Centre No (2b)</mat-label>
              <input matInput formControlName="centreNo" />
            </mat-form-field>
          </div>

          <mat-divider class="div"></mat-divider>
          <div class="h2">Candidate details (3–13)</div>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Last name / Surname (3a)</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Candidate’s name (3b)</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Middle/Father’s name (3c)</mat-label>
              <input matInput formControlName="middleName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Mother’s name (3d)</mat-label>
              <input matInput formControlName="motherName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="span2">
              <mat-label>Residential Address (4)</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Pin code</mat-label>
              <input matInput formControlName="pinCode" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Mobile (5)</mat-label>
              <input matInput formControlName="mobile" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>DOB</mat-label>
              <input matInput [matDatepicker]="dobPicker" formControlName="dob" />
              <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
              <mat-datepicker #dobPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Aadhaar (7)</mat-label>
              <input matInput formControlName="aadhaar" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Stream code (8)</mat-label>
              <mat-select formControlName="streamCode">
                <mat-option value="1">1) Science</mat-option>
                <mat-option value="2">2) Arts</mat-option>
                <mat-option value="3">3) Commerce</mat-option>
                <mat-option value="4">4) HSC Vocational</mat-option>
                <mat-option value="5">5) Technology Science</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Gender (9)</mat-label>
              <mat-select formControlName="gender">
                <mat-option value="MALE">Male</mat-option>
                <mat-option value="FEMALE">Female</mat-option>
                <mat-option value="TRANSGENDER">Trans Gender</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Minority religion code (10)</mat-label>
              <input matInput formControlName="minorityReligionCode" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Category code (11)</mat-label>
              <input matInput formControlName="categoryCode" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Divyang code (12)</mat-label>
              <input matInput formControlName="divyangCode" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Medium code (13)</mat-label>
              <input matInput formControlName="mediumCode" />
            </mat-form-field>
          </div>
        </mat-card>

        <mat-card class="card">
          <div class="row">
            <div class="h2">Subject details (15)</div>
            <div class="grow"></div>
            <button mat-stroked-button type="button" (click)="addSubject()" [disabled]="subjects().length >= 9 || application()!.status !== 'DRAFT'">
              Add subject row
            </button>
          </div>

          <div class="subjects">
            @for (g of subjects().controls; track $index) {
              <div class="subrow" [formGroup]="g">
                <mat-form-field appearance="outline" class="w320">
                  <mat-label>Subject</mat-label>
                  <mat-select formControlName="subjectId">
                    @for (s of masterSubjects(); track s.id) {
                      <mat-option [value]="s.id">{{ s.code }} - {{ s.name }} ({{ s.category || 'General' }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w160">
                  <mat-label>Lang of Ans code</mat-label>
                  <input matInput formControlName="langOfAnsCode" />
                </mat-form-field>
                <button mat-button type="button" (click)="removeSubject($index)" [disabled]="application()!.status !== 'DRAFT'">Remove</button>
              </div>
            }
          </div>
        </mat-card>
      </form>
    } @else {
      <mat-card class="card">Loading…</mat-card>
    }
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
      }
      .row {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .grow {
        flex: 1;
      }
      .h {
        font-weight: 900;
      }
      .p {
        color: #6b7280;
        margin-top: 4px;
      }
      .h2 {
        font-weight: 800;
        margin-bottom: 12px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 12px;
      }
      mat-form-field {
        grid-column: span 4;
      }
      .span2 {
        grid-column: span 8;
      }
      @media (max-width: 900px) {
        mat-form-field {
          grid-column: span 12;
        }
        .span2 {
          grid-column: span 12;
        }
      }
      .div {
        margin: 16px 0;
      }
      .subjects {
        display: grid;
        gap: 10px;
      }
      .subrow {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .w320 {
        width: min(420px, 100%);
      }
      .picker-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .picker-card {
        width: min(800px, 95%);
        max-height: 80vh;
        overflow: auto;
      }
      .institute-result {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      .w160 {
        width: 200px;
      }
    `
  ]
})
export class StudentApplicationEditComponent implements OnInit {
  readonly application = signal<any | null>(null);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly masterSubjects = signal<Subject[]>([]);
  readonly showInstitutePicker = signal(false);
  readonly instituteQuery = signal('');
  readonly instituteSearchResults = signal<any[]>([]);
  readonly selectedInstitute = signal<any | null>(null);

  readonly form = new FormGroup({
    indexNo: new FormControl(''),
    udiseNo: new FormControl(''),
    studentSaralId: new FormControl(''),
    applSrNo: new FormControl(''),
    centreNo: new FormControl(''),

    lastName: new FormControl('', { validators: [Validators.required] }),
    firstName: new FormControl('', { validators: [Validators.required] }),
    middleName: new FormControl(''),
    motherName: new FormControl(''),
    address: new FormControl(''),
    pinCode: new FormControl(''),
    mobile: new FormControl(''),
    dob: new FormControl<Date | null>(null),
    aadhaar: new FormControl(''),
    streamCode: new FormControl(''),
    gender: new FormControl(''),
    minorityReligionCode: new FormControl(''),
    categoryCode: new FormControl(''),
    divyangCode: new FormControl(''),
    mediumCode: new FormControl(''),

    subjects: new FormArray<FormGroup>([])
  });

  readonly subjects = computed(() => this.form.controls.subjects as FormArray<FormGroup>);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.http.get<{ subjects: Subject[] }>(`${API_BASE_URL}/masters/subjects`).subscribe((r) => this.masterSubjects.set(r.subjects));
    this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe((r) => {
      this.application.set(r.application);
      this.patchFromApplication(r.application);
    });
  }

  addSubject() {
    this.subjects().push(
      new FormGroup({
        subjectId: new FormControl<number | null>(null, { validators: [Validators.required] }),
        langOfAnsCode: new FormControl('')
      })
    );
  }

  removeSubject(i: number) {
    this.subjects().removeAt(i);
  }

  save() {
    const app = this.application();
    if (!app) return;
    this.saving.set(true);

    const raw: any = this.form.getRawValue();
    const payload = {
      indexNo: raw.indexNo || undefined,
      udiseNo: raw.udiseNo || undefined,
      studentSaralId: raw.studentSaralId || undefined,
      applSrNo: raw.applSrNo || undefined,
      centreNo: raw.centreNo || undefined,
      student: {
        lastName: raw.lastName || undefined,
        firstName: raw.firstName || undefined,
        middleName: raw.middleName || undefined,
        motherName: raw.motherName || undefined,
        address: raw.address || undefined,
        pinCode: raw.pinCode || undefined,
        mobile: raw.mobile || undefined,
        dob: raw.dob ? new Date(raw.dob).toISOString() : undefined,
        aadhaar: raw.aadhaar || undefined,
        streamCode: raw.streamCode || undefined,
        gender: raw.gender || undefined,
        minorityReligionCode: raw.minorityReligionCode || undefined,
        categoryCode: raw.categoryCode || undefined,
        divyangCode: raw.divyangCode || undefined,
        mediumCode: raw.mediumCode || undefined
      },
      subjects: (raw.subjects ?? []).filter((s: any) => !!s.subjectId)
    };

    this.http.put(`${API_BASE_URL}/applications/${app.id}`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.reload(app.id);
      },
      error: () => this.saving.set(false)
    });
  }

  submit() {
    const app = this.application();
    if (!app) return;
    this.submitting.set(true);
    this.http.post(`${API_BASE_URL}/applications/${app.id}/submit`, {}).subscribe({
      next: () => {
        this.submitting.set(false);
        this.reload(app.id);
      },
      error: () => this.submitting.set(false)
    });
  }

  searchInstitute() {
    const query = this.instituteQuery().trim();
    this.http
      .get<{ institutes: any[] }>(`${API_BASE_URL}/institutes/search`, { params: { query } })
      .subscribe((r) => this.instituteSearchResults.set(r.institutes || []));
  }

  selectInstitute(inst: any) {
    this.selectedInstitute.set(inst);
    this.form.patchValue({
      address: inst.address ?? '',
      pinCode: inst.pincode ?? '',
      centreNo: inst.code ?? ''
    });
    this.showInstitutePicker.set(false);
  }

  private reload(id: number) {
    this.http.get<{ application: any }>(`${API_BASE_URL}/applications/${id}`).subscribe((r) => {
      this.application.set(r.application);
      this.patchFromApplication(r.application);
    });
  }

  private patchFromApplication(a: any) {
    const student = a.student ?? {};
    this.form.patchValue({
      indexNo: a.indexNo ?? '',
      udiseNo: a.udiseNo ?? '',
      studentSaralId: a.studentSaralId ?? '',
      applSrNo: a.applSrNo ?? '',
      centreNo: a.centreNo ?? '',
      lastName: student.lastName ?? '',
      firstName: student.firstName ?? '',
      middleName: student.middleName ?? '',
      motherName: student.motherName ?? '',
      address: student.address ?? '',
      pinCode: student.pinCode ?? '',
      mobile: student.mobile ?? '',
      dob: student.dob ? new Date(student.dob) : null,
      aadhaar: student.aadhaar ?? '',
      streamCode: student.streamCode ?? '',
      gender: student.gender ?? '',
      minorityReligionCode: student.minorityReligionCode ?? '',
      categoryCode: student.categoryCode ?? '',
      divyangCode: student.divyangCode ?? '',
      mediumCode: student.mediumCode ?? ''
    });

    this.selectedInstitute.set(a.institute ?? null);
    this.subjects().clear();
    for (const s of a.subjects ?? []) {
      this.subjects().push(
        new FormGroup({
          subjectId: new FormControl<number | null>(s.subjectId ?? s.subject?.id ?? null, { validators: [Validators.required] }),
          langOfAnsCode: new FormControl(s.langOfAnsCode ?? '')
        })
      );
    }
  }
}

