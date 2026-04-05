import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { API_BASE_URL } from '../../../core/api';

@Component({
  selector: 'app-institute-settings',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
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
          <mat-form-field appearance="outline" class="full-width"><mat-label>Institute Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>College No (Unique No)</mat-label><input matInput formControlName="collegeNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>UDISE No</mat-label><input matInput formControlName="udiseNo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Center No</mat-label><input matInput formControlName="code" placeholder="Optional" /><mat-hint>Optional field</mat-hint></mat-form-field>
        </div>

        <div class="grid">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Address</mat-label><input matInput formControlName="address" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>District</mat-label><input matInput formControlName="district" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Taluka</mat-label><input matInput formControlName="taluka" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Pincode</mat-label><input matInput formControlName="pincode" maxlength="10" /></mat-form-field>
        </div>

        <div class="grid">
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

  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 18px; }
    .header-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .h { font-weight: 800; margin-bottom: 4px; }
    .p { color: #6b7280; margin-bottom: 0; line-height: 1.45; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 12px; }
    .full-width { grid-column: 1 / -1; }
    .actions { display: flex; justify-content: flex-start; margin-top: 8px; }
    .success { color: #065f46; font-size: 13px; margin-top: 10px; }
    .error { color: #b91c1c; font-size: 13px; margin-top: 10px; }
  `]
})
export class InstituteSettingsComponent implements OnInit {
  readonly detailsForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    collegeNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    udiseNo: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    name: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    taluka: new FormControl('', { nonNullable: true }),
    pincode: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    contactMobile: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,10}$/)] })
  });

  readonly loadingDetails = signal(false);
  readonly savedDetails = signal(false);
  readonly errorDetails = signal<string | null>(null);

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<any>(`${API_BASE_URL}/institutes/me`).subscribe({
      next: (r) => {
        this.detailsForm.patchValue({
          code: r.institute.centerNo ?? r.institute.code ?? '',
          collegeNo: r.institute.uniqueNo ?? r.institute.collegeNo ?? '',
          udiseNo: r.institute.udiseNo ?? '',
          name: r.institute.name ?? '',
          address: r.institute.address ?? '',
          district: r.institute.district ?? '',
          taluka: r.institute.taluka ?? '',
          pincode: r.institute.pincode ?? '',
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
      code: raw.code?.trim().toUpperCase(),
      address: raw.address,
      district: raw.district,
      taluka: raw.taluka,
      pincode: raw.pincode,
      contactEmail: raw.contactEmail,
      contactMobile: raw.contactMobile
    };

    this.http.patch(`${API_BASE_URL}/institutes/me`, payload).subscribe({
      next: () => {
        this.loadingDetails.set(false);
        this.savedDetails.set(true);
        this.load();
        this.snackBar.open('Institute details updated', 'Close', { duration: 2000 });
      },
      error: (e) => {
        this.loadingDetails.set(false);
        this.errorDetails.set('Save failed');
        this.showError(e, 'Save failed');
      }
    });
  }

  private showError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.error || err?.message || fallback;
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}

