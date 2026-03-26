import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <mat-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:1.2rem;font-weight:700;">My Profile</div>
          <div style="color:#4b5563;">Update your account information and password.</div>
        </div>
      </div>

      @if (loading()) {
        <div style="color:#2563eb;margin-bottom:10px;">Loading profile...</div>
      }
      @if (error()) {
        <div style="color:#b91c1c;margin-bottom:10px;">{{ error() }}</div>
      }

      @if (!loading()) {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="username" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput [(ngModel)]="mobile" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Password (leave blank to keep current)</mat-label><input matInput type="password" [(ngModel)]="password" /></mat-form-field>
        </div>

        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
          <button mat-flat-button color="primary" (click)="save()">Save Profile</button>
          @if (success()) {
            <span style="color:#065f46;">{{ success() }}</span>
          }
          @if (saveError()) {
            <span style="color:#b91c1c;">{{ saveError() }}</span>
          }
        </div>
      }
    </mat-card>
  `
})
export class ProfileComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  username = '';
  email = '';
  mobile = '';
  password = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ user: any }>(`${API_BASE_URL}/me`).subscribe({
      next: (r) => {
        this.username = r.user.username;
        this.email = r.user.email || '';
        this.mobile = r.user.mobile || '';
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.error || 'Could not load profile');
        this.loading.set(false);
      }
    });
  }

  save() {
    this.saveError.set(null);
    this.success.set(null);
    const payload: any = {
      username: this.username,
      email: this.email,
      mobile: this.mobile
    };
    if (this.password.trim()) payload.password = this.password.trim();
    this.http.put(`${API_BASE_URL}/me`, payload).subscribe({
      next: () => {
        this.success.set('Profile updated successfully');
        this.password = '';
      },
      error: (e) => {
        this.saveError.set(e?.error?.error || 'Could not update profile');
      }
    });
  }
}
