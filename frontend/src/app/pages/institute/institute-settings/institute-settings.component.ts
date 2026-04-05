import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { API_BASE_URL } from '../../../core/api';

type ExamCapacityRow = {
  examId: number;
  examName: string;
  academicYear: string;
  session: string;
  streamName: string;
  totalStudents: number | null;
  applicationsUsed: number;
  remainingApplications: number | null;
  isCapacityReached: boolean;
  isConfigured: boolean;
};

@Component({
  selector: 'app-institute-settings',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  template: `
    <mat-card class="card">
      <div class="header-row">
        <div>
          <div class="h">Institute Basic Details</div>
          <div class="p">Update institute address and contact details. Exam intake settings are now handled separately during exam or subject mapping.</div>
        </div>
      </div>

      <form [formGroup]="detailsForm" (ngSubmit)="saveDetails()">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Index No</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>UDISE No</mat-label><input matInput formControlName="udiseNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>College No</mat-label><input matInput formControlName="collegeNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Institute Name</mat-label><input matInput formControlName="name" /></mat-form-field>
        </div>

        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Address</mat-label><input matInput formControlName="address" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>District</mat-label><input matInput formControlName="district" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Taluka</mat-label><input matInput formControlName="taluka" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>City</mat-label><input matInput formControlName="city" /></mat-form-field>
        </div>

        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Pincode</mat-label><input matInput formControlName="pincode" maxlength="10" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Person</mat-label><input matInput formControlName="contactPerson" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput formControlName="contactEmail" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Mobile</mat-label><input matInput formControlName="contactMobile" maxlength="10" /></mat-form-field>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" [disabled]="detailsForm.invalid || loadingDetails()">
            {{ loadingDetails() ? 'Saving…' : 'Save institute details' }}
          </button>
        </div>
      </form>

      <p class="success" *ngIf="savedDetails()">Institute details updated successfully.</p>
      <div class="error" *ngIf="errorDetails()">{{ errorDetails() }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="header-row">
        <div>
          <div class="h">Exam-wise Student Capacity</div>
          <div class="p">Set the total number of students allowed for each exam. Remaining forms are calculated automatically.</div>
        </div>
      </div>

      <div *ngIf="loadingCapacities()" class="p">Loading exam capacities…</div>
      <div *ngIf="!loadingCapacities() && examCapacities().length === 0" class="p">No exams found yet for capacity setup.</div>

      <div class="capacity-list" *ngIf="examCapacities().length > 0">
        <div class="capacity-item" *ngFor="let row of examCapacities()">
          <div class="capacity-meta">
            <div class="capacity-title">{{ row.examName }}</div>
            <div class="capacity-subtitle">{{ row.session }} {{ row.academicYear }} • {{ row.streamName || 'Stream not set' }}</div>
            <div class="capacity-stats">
              <span class="tag">Used: {{ row.applicationsUsed }}</span>
              <span class="tag">Remaining: {{ row.remainingApplications ?? 'Not set' }}</span>
              <span class="tag" *ngIf="row.totalStudents !== null">Total: {{ row.totalStudents }}</span>
            </div>
          </div>

          <div class="capacity-actions">
            <mat-form-field appearance="outline">
              <mat-label>Total students</mat-label>
              <input
                matInput
                type="number"
                min="0"
                [ngModel]="capacityDrafts[row.examId] ?? row.totalStudents ?? 0"
                (ngModelChange)="capacityDrafts[row.examId] = $event"
              />
            </mat-form-field>
            <button mat-flat-button color="primary" type="button" (click)="saveExamCapacity(row)" [disabled]="savingCapacityFor() === row.examId">
              {{ savingCapacityFor() === row.examId ? 'Saving…' : 'Save limit' }}
            </button>
          </div>
        </div>
      </div>

      <p class="success" *ngIf="capacitySuccess()">{{ capacitySuccess() }}</p>
      <div class="error" *ngIf="capacityError()">{{ capacityError() }}</div>
    </mat-card>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 18px; }
    .header-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .h { font-weight: 800; margin-bottom: 4px; }
    .p { color: #6b7280; margin-bottom: 0; line-height: 1.45; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 12px; }
    .actions { display: flex; justify-content: flex-start; margin-top: 8px; }
    .capacity-list { display: grid; gap: 12px; }
    .capacity-item { display: grid; grid-template-columns: 1.4fr minmax(260px, 0.8fr); gap: 12px; align-items: start; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
    .capacity-meta { display: grid; gap: 4px; }
    .capacity-title { font-weight: 700; }
    .capacity-subtitle { color: #6b7280; font-size: 13px; }
    .capacity-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
    .capacity-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .tag { background: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
    .success { color: #065f46; font-size: 13px; margin-top: 10px; }
    .error { color: #b91c1c; font-size: 13px; margin-top: 10px; }
  `]
})
export class InstituteSettingsComponent implements OnInit {
  readonly detailsForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    udiseNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    collegeNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    name: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    taluka: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    pincode: new FormControl('', { nonNullable: true }),
    contactPerson: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    contactMobile: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,10}$/)] })
  });

  readonly loadingDetails = signal(false);
  readonly savedDetails = signal(false);
  readonly errorDetails = signal<string | null>(null);
  readonly examCapacities = signal<ExamCapacityRow[]>([]);
  readonly loadingCapacities = signal(false);
  readonly savingCapacityFor = signal<number | null>(null);
  readonly capacityError = signal<string | null>(null);
  readonly capacitySuccess = signal<string | null>(null);
  capacityDrafts: Record<number, number | null> = {};

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    this.load();
    this.loadExamCapacities();
  }

  load() {
    this.http.get<any>(`${API_BASE_URL}/institutes/me`).subscribe({
      next: (r) => {
        this.detailsForm.patchValue({
          code: r.institute.code ?? '',
          udiseNo: r.institute.udiseNo ?? '',
          collegeNo: r.institute.collegeNo ?? '',
          name: r.institute.name ?? '',
          address: r.institute.address ?? '',
          district: r.institute.district ?? '',
          taluka: r.institute.taluka ?? '',
          city: r.institute.city ?? '',
          pincode: r.institute.pincode ?? '',
          contactPerson: r.institute.contactPerson ?? '',
          contactEmail: r.institute.contactEmail ?? '',
          contactMobile: r.institute.contactMobile ?? ''
        });
      },
      error: (e) => this.showError(e, 'Unable to load institute data')
    });
  }

  saveDetails() {
    if (this.detailsForm.invalid) return;
    this.loadingDetails.set(true);
    this.savedDetails.set(false);
    this.errorDetails.set(null);

    const raw = this.detailsForm.getRawValue();
    const payload = {
      code: raw.code?.trim().toUpperCase() || undefined,
      address: raw.address,
      district: raw.district,
      taluka: raw.taluka,
      city: raw.city,
      pincode: raw.pincode,
      contactPerson: raw.contactPerson,
      contactEmail: raw.contactEmail,
      contactMobile: raw.contactMobile
    };

    this.http.patch(`${API_BASE_URL}/institutes/me`, payload).subscribe({
      next: () => {
        this.loadingDetails.set(false);
        this.savedDetails.set(true);
        this.snackBar.open('Institute details updated', 'Close', { duration: 2000 });
      },
      error: (e) => {
        this.loadingDetails.set(false);
        this.errorDetails.set('Save failed');
        this.showError(e, 'Save failed');
      }
    });
  }

  loadExamCapacities() {
    this.loadingCapacities.set(true);
    this.capacityError.set(null);

    this.http.get<{ exams: ExamCapacityRow[] }>(`${API_BASE_URL}/institutes/me/exam-capacities`).subscribe({
      next: (r) => {
        const exams = r.exams || [];
        this.examCapacities.set(exams);
        this.capacityDrafts = exams.reduce((acc, exam) => {
          acc[exam.examId] = exam.totalStudents ?? 0;
          return acc;
        }, {} as Record<number, number | null>);
        this.loadingCapacities.set(false);
      },
      error: (e) => {
        this.capacityError.set(e?.error?.message || e?.error?.error || 'Unable to load exam capacities');
        this.loadingCapacities.set(false);
      }
    });
  }

  saveExamCapacity(row: ExamCapacityRow) {
    const totalStudents = Number(this.capacityDrafts[row.examId] ?? row.totalStudents ?? 0);
    if (!Number.isFinite(totalStudents) || totalStudents < 0) {
      this.capacityError.set('Total students must be 0 or more');
      return;
    }

    this.savingCapacityFor.set(row.examId);
    this.capacityError.set(null);
    this.capacitySuccess.set(null);

    this.http.put<any>(`${API_BASE_URL}/institutes/me/exam-capacities/${row.examId}`, { totalStudents }).subscribe({
      next: (r) => {
        const remaining = r?.exam?.remainingApplications;
        this.capacitySuccess.set(`Saved student limit for ${row.examName}. Remaining applications: ${remaining ?? 'Not set'}.`);
        this.savingCapacityFor.set(null);
        this.loadExamCapacities();
      },
      error: (e) => {
        this.capacityError.set(e?.error?.message || e?.error?.error || 'Failed to save exam capacity');
        this.savingCapacityFor.set(null);
      }
    });
  }

  private showError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.error || err?.message || fallback;
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}

