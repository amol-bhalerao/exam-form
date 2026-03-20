import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { API_BASE_URL } from '../../core/api';
import { InstitutePickerComponent } from '../../components/institute-picker/institute-picker.component';

@Component({
  selector: 'app-institute-register',
  standalone: true,
  imports: [NgIf, FormsModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, InstitutePickerComponent],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="brand">
          <div class="title">Institute Admin Registration</div>
          <div class="subtitle">Select an existing institute and submit your admin account for approval.</div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <app-institute-picker [(selectedInstituteId)]="selectedInstituteId"></app-institute-picker>
        <input type="hidden" formControlName="instituteId" [value]="selectedInstituteId" />

          <mat-form-field appearance="outline" class="full">
            <mat-label>Admin username</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Admin password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Contact person (optional)</mat-label>
            <input matInput formControlName="contactPerson" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Contact email (optional)</mat-label>
            <input matInput formControlName="contactEmail" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Contact mobile (optional)</mat-label>
            <input matInput formControlName="contactMobile" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Letter of consent (optional)</mat-label>
            <textarea matInput formControlName="letterOfConsent" rows="5"></textarea>
          </mat-form-field>

          <div class="consent-box">
            <div class="consent-title">Sample letter of consent</div>
            <div class="consent-text">
              <strong>To,</strong><br />
              The District Education Officer,<br />
              [District Name]<br /><br />
              Subject: Consent for HSC exam registration of students from our institute.<br /><br />
              Respected Sir/Madam,<br />
              This is to certify that <strong>[Institute Name]</strong>, UDISE <strong>[UDISE]</strong>, is authorized to register and process HSC exam applications for our eligible students. We agree to follow all state board guidelines and submit the required documents.
              <div style="margin-top:8px;">Sincerely,<br />Institute Head/Principal<br />[Institute Name]</div>
            </div>
          </div>

          <div class="msg" *ngIf="msg()">{{ msg() }}</div>
          <div class="error" *ngIf="error()">{{ error() }}</div>

          <button mat-flat-button color="primary" class="full" [disabled]="form.invalid || loading()">{{ loading() ? 'Submitting…' : 'Submit for approval' }}</button>
        </form>

        <div class="hint"><a routerLink="/login">Back to login</a></div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .card { width: min(700px, 100%); padding: 18px; }
      form { display: grid; gap: 12px; margin-top: 12px; }
      .full { width: 100%; }
      .brand { margin-bottom: 6px; }
      .title { font-weight: 700; font-size: 1.3rem; }
      .subtitle { color: #4b5563; margin-top: 4px; }
      .msg { color: #065f46; font-size: 13px; }
      .error { color: #b91c1c; font-size: 13px; }
      .hint { margin-top: 12px; font-size: 13px; }
      a { color: #2563eb; text-decoration: none; }
      .consent-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #f9fafb; font-size: .93rem; }
      .consent-title { font-weight: 600; margin-bottom: 4px; }
      .consent-text { color: #374151; line-height: 1.4; }
    `
  ]
})
export class InstituteRegisterComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly msg = signal<string | null>(null);
  selectedInstituteId: number | null = null;

  readonly form = new FormGroup({
    instituteId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    contactPerson: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    contactMobile: new FormControl('', { nonNullable: true }),
    letterOfConsent: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.msg.set(null);

    this.form.patchValue({ instituteId: this.selectedInstituteId });
    const raw = this.form.getRawValue();
    this.http
      .post(`${API_BASE_URL}/institutes/register`, {
        instituteId: this.selectedInstituteId,
        username: raw.username,
        password: raw.password,
        contactPerson: raw.contactPerson || undefined,
        contactEmail: raw.contactEmail || undefined,
        contactMobile: raw.contactMobile || undefined,
        letterOfConsent: raw.letterOfConsent || undefined
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.msg.set('Institute admin registration submitted. Wait for super admin approval.');
          setTimeout(() => this.router.navigateByUrl('/login'), 1300);
        },
        error: (e) => {
          this.loading.set(false);
          const code = e?.error?.error;
          if (code === 'USERNAME_TAKEN') this.error.set('Username already taken.');
          else if (code === 'INSTITUTE_ADMIN_ALREADY_EXISTS') this.error.set('This institute already has an assigned institute admin.');
          else this.error.set('Submission failed. Please retry.');
        }
      });
  }
}

