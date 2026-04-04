import { Component, OnInit, signal, inject } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { API_BASE_URL } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { StudentProfileService } from '../../core/student-profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="profile-container">
      @if (userRole() === 'STUDENT') {
        <!-- Student-Specific Account Settings -->
        <mat-tab-group class="tabs">
          <!-- Account Tab -->
          <mat-tab label="Account Settings">
            <ng-template mat-tab-label>
              <mat-icon>account_circle</mat-icon>
              <span style="margin-left: 8px;">Account Settings</span>
            </ng-template>

            <mat-card class="tab-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div>
                  <div style="font-size:1.2rem;font-weight:700;">Account Information</div>
                  <div style="color:#4b5563;">Update your login credentials and password.</div>
                </div>
              </div>

              @if (loading()) {
                <div style="color:#2563eb;margin-bottom:10px;">Loading profile...</div>
              }
              @if (error()) {
                <div style="color:#b91c1c;margin-bottom:10px;">{{ error() }}</div>
              }

              @if (!loading()) {
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
                  <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="username" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput [(ngModel)]="mobile" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>New Password (optional)</mat-label><input matInput type="password" [(ngModel)]="password" placeholder="Leave blank to keep current" /></mat-form-field>
                </div>

                <div style="margin-top:16px;display:flex;gap:8px;align-items:center;">
                  <button mat-flat-button color="primary" (click)="save()">Save Account Settings</button>
                  @if (success()) {
                    <span style="color:#065f46;">✓ {{ success() }}</span>
                  }
                  @if (saveError()) {
                    <span style="color:#b91c1c;">{{ saveError() }}</span>
                  }
                </div>
              }
            </mat-card>
          </mat-tab>

          <!-- Institute & Stream Tab -->
          <mat-tab label="Institute & Stream">
            <ng-template mat-tab-label>
              <mat-icon>school</mat-icon>
              <span style="margin-left: 8px;">Institute & Stream</span>
            </ng-template>

            <mat-card class="tab-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div>
                  <div style="font-size:1.2rem;font-weight:700;">Your Institute Information</div>
                  <div style="color:#4b5563;">Your selected institute and stream (permanent selection).</div>
                </div>
              </div>

              @if (studentLoading()) {
                <div style="color:#2563eb;margin-bottom:10px;">Loading profile...</div>
              }
              @if (studentError()) {
                <div style="color:#b91c1c;margin-bottom:10px;">{{ studentError() }}</div>
              }

              @if (!studentLoading() && studentProfile()) {
                <div style="margin-top:16px;">
                  <div class="info-row">
                    <span class="info-label">Institute Name:</span>
                    <span class="info-value">{{ studentProfile()?.institute?.name || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Institute Code:</span>
                    <span class="info-value">{{ studentProfile()?.institute?.code || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Stream Code:</span>
                    <span class="info-value">{{ studentProfile()?.streamCode || '-' }}</span>
                  </div>
                </div>
              }
            </mat-card>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <!-- Non-Student Account Settings -->
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
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .tabs {
      margin-top: 16px;
    }

    .tab-card {
      padding: 24px;
      margin-top: 16px;
    }

    .info-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #374151;
    }

    .info-value {
      color: #6b7280;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly studentProfileService = inject(StudentProfileService);
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly userRole = () => this.auth.user()?.role;
  readonly studentLoading = this.studentProfileService.isLoading$;
  readonly studentError = this.studentProfileService.error$;
  readonly studentProfile = this.studentProfileService.profile$;

  username = '';
  email = '';
  mobile = '';
  password = '';

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
