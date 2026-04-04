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
          <mat-form-field appearance="outline"><mat-label>Institute Code</mat-label><input matInput formControlName="code" [disabled]="true" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>UDISE No</mat-label><input matInput formControlName="udiseNo" [disabled]="true" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>College No</mat-label><input matInput formControlName="collegeNo" [disabled]="true" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Institute Name</mat-label><input matInput formControlName="name" [disabled]="true" /></mat-form-field>
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
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 18px; }
    .header-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .h { font-weight: 800; margin-bottom: 4px; }
    .p { color: #6b7280; margin-bottom: 0; line-height: 1.45; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 12px; }
    .actions { display: flex; justify-content: flex-start; margin-top: 8px; }
    .success { color: #065f46; font-size: 13px; margin-top: 10px; }
    .error { color: #b91c1c; font-size: 13px; margin-top: 10px; }
  `]
})
export class InstituteSettingsComponent implements OnInit {
  readonly detailsForm = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    udiseNo: new FormControl('', { nonNullable: true }),
    collegeNo: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
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

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    this.load();
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

    const payload = {
      address: this.detailsForm.value.address,
      district: this.detailsForm.value.district,
      taluka: this.detailsForm.value.taluka,
      city: this.detailsForm.value.city,
      pincode: this.detailsForm.value.pincode,
      contactPerson: this.detailsForm.value.contactPerson,
      contactEmail: this.detailsForm.value.contactEmail,
      contactMobile: this.detailsForm.value.contactMobile
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

  private showError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.error || err?.message || fallback;
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}

