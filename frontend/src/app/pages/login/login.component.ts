import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="brand">
          <div class="title">HSC Exam Form System</div>
          <div class="subtitle">Login</div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>

          @if (error()) {
            <div class="error">{{ error() }}</div>
          }

          <button mat-flat-button color="primary" class="full" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <div class="hint">
          Institute self-registration:
          <a routerLink="/institute/register">Register institute</a>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(1200px 600px at 10% 0%, #e0f2fe 0%, transparent 60%),
          radial-gradient(1200px 600px at 90% 20%, #ede9fe 0%, transparent 60%), #f6f7fb;
      }
      .card {
        width: min(420px, 100%);
        padding: 18px;
      }
      .brand {
        margin-bottom: 10px;
      }
      .title {
        font-weight: 700;
        font-size: 18px;
      }
      .subtitle {
        color: #6b7280;
        margin-top: 4px;
      }
      .full {
        width: 100%;
      }
      form {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }
      .error {
        color: #b91c1c;
        font-size: 13px;
      }
      .hint {
        margin-top: 12px;
        font-size: 13px;
        color: #6b7280;
      }
      a {
        color: #2563eb;
        text-decoration: none;
      }
    `
  ]
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid credentials or account not approved yet.');
      }
    });
  }
}

