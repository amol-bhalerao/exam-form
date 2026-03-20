import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-institute-activate',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="title">Institute Account Activation</div>
        <div class="subtitle">Fill your account credentials and activate your institute admin account.</div>

        <div *ngIf="loading()" class="status">Loading invite details…</div>
        <div *ngIf="error()" class="status error">{{ error() }}</div>

        <div *ngIf="invite() && !loading()">
          <div class="info">
            <div><strong>Institute:</strong> {{ invite()?.institute?.name || 'N/A' }}</div>
            <div><strong>College Code:</strong> {{ invite()?.institute?.code || 'N/A' }}</div>
            <div><strong>UDISE:</strong> {{ invite()?.institute?.udiseNo || 'N/A' }}</div>
          </div>

          <div class="consent-block">
            <div class="consent-title">Letter of consent text (print on your letterhead)</div>
            <div class="consent-text">
              To,<br />
              Director, Hisoft IT Solutions Pvt. Ltd,<br />
              [City]<br /><br />
              Subject: Consent to register HSC exam student application with our institute.<br /><br />
              Respected Sir,<br />
              This is to certify that <strong>{{ invite()?.institute?.name || 'Institute Name' }}</strong> (College Code: <strong>{{ invite()?.institute?.code || 'N/A' }}</strong>, UDISE: <strong>{{ invite()?.institute?.udiseNo || 'N/A' }}</strong>) is authorized to process HSC exam applications for our students. We request activation of the account after receiving the scanned signed letter.
              <div style="margin-top:8px;">Sincerely,<br /><strong>Principal/Head of Institute</strong><br />{{ invite()?.institute?.name || 'Institute Name' }}</div>
            </div>
            <button mat-flat-button color="primary" (click)="printLetter()" style="margin-top:8px;">Print Letter of Consent</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" style="margin-top:16px; display:grid; gap:10px;">
            <mat-form-field appearance="outline"><mat-label>Admin username</mat-label><input matInput formControlName="username" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact email</mat-label><input matInput formControlName="email" type="email" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact mobile</mat-label><input matInput formControlName="mobile" /></mat-form-field>
            <button mat-flat-button color="primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Activate Account' }}</button>
          </form>

          <div class="status success" *ngIf="msg()">{{ msg() }}</div>
          <div class="status error" *ngIf="submitError()">{{ submitError() }}</div>
        </div>

        <div style="margin-top:10px;"><a routerLink="/login">Back to login</a></div>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
    .card { width: min(720px, 100%); padding: 18px; }
    .title { font-weight: 700; font-size: 1.3rem; }
    .subtitle { color: #4b5563; margin-top: 4px; }
    .info { margin-top: 12px; background:#f9fafb; border:1px solid #e2e8f0; border-radius:8px; padding:10px; color:#111827; }
    .consent-block { margin-top: 14px; border:1px solid #e2e8f0; border-radius:8px; padding:10px; background:#fff; }
    .consent-title { font-weight: 600; margin-bottom: 6px; }
    .consent-text { line-height: 1.45; color:#1f2937; font-size:.95rem; }
    .status { margin-top: 10px; color: #334155; }
    .status.error { color:#b91c1c; }
    .status.success { color:#065f46; }
  `]
})
export class InstituteActivateComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly msg = signal<string | null>(null);
  readonly invite = signal<any | null>(null);

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly http: HttpClient, private readonly route: ActivatedRoute, private readonly router: Router) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Activation token missing.');
      this.loading.set(false);
      return;
    }

    this.http.get<{ institute: any; username?: string }>(`${API_BASE_URL}/institutes/users/invite/${token}`).subscribe({
      next: (res) => {
        this.invite.set({ ...res, token });
        if (res.username) this.form.get('username')?.setValue(res.username);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.error || 'Invalid activation link.');
        this.loading.set(false);
      }
    });
  }

  printLetter() {
    window.print();
  }

  onSubmit() {
    if (!this.invite() || this.form.invalid) return;
    this.saving.set(true);
    this.submitError.set(null);
    this.msg.set(null);
    const token = this.invite()?.token;
    const raw = this.form.getRawValue();
    this.http.post(`${API_BASE_URL}/institutes/users/invite/${token}/complete`, {
      username: raw.username,
      password: raw.password,
      email: raw.email || undefined,
      mobile: raw.mobile || undefined
    }).subscribe({
      next: () => {
        this.msg.set('Account activated. Wait for super-admin confirmation and then login.');
        this.saving.set(false);
        setTimeout(() => this.router.navigateByUrl('/login'), 1800);
      },
      error: (e) => {
        this.submitError.set(e?.error?.error || 'Activation failed.');
        this.saving.set(false);
      }
    });
  }
}
