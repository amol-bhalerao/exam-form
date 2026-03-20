import { Component, computed, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div style="display:grid;gap:14px;">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Dashboard</mat-card-title>
          <mat-card-subtitle>Welcome, {{ user()?.username }} ({{ user()?.role }}).</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a routerLink="/profile" style="text-decoration:none;"><button mat-button color="primary">Edit Profile</button></a>
        </mat-card-actions>
      </mat-card>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px,1fr));gap:12px;">
        <mat-card appearance="outlined"><mat-card-header><mat-card-title>Your role</mat-card-title></mat-card-header><mat-card-content>{{ user()?.role }}</mat-card-content></mat-card>
        <mat-card appearance="outlined"><mat-card-header><mat-card-title>Username</mat-card-title></mat-card-header><mat-card-content>{{ user()?.username }}</mat-card-content></mat-card>
        <mat-card appearance="outlined"><mat-card-header><mat-card-title>Institute ID</mat-card-title></mat-card-header><mat-card-content>{{ user()?.instituteId || 'N/A' }}</mat-card-content></mat-card>
      </div>

      <div *ngIf="user()?.role === 'SUPER_ADMIN'" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Total Institutes</mat-card-title><mat-card-subtitle>Super admin</mat-card-subtitle></mat-card-header>
          <mat-card-content style="font-size:1.7rem; font-weight:700;">{{ superInstituteTotal() }}</mat-card-content>
          <div style="color:#6b7280;">Active: {{ superInstituteActive() }} | Pending: {{ superInstitutePending() }} | Disabled: {{ superInstituteDisabled() }}</div>
          <mat-card-actions><a routerLink="/super/institutes"><button mat-button>View details</button></a></mat-card-actions>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Institute Users</mat-card-title><mat-card-subtitle>Super admin</mat-card-subtitle></mat-card-header>
          <mat-card-content style="font-size:1.7rem; font-weight:700;">{{ superUsersTotal() }}</mat-card-content>
          <div style="color:#6b7280;">Active: {{ superUsersActive() }} | Pending: {{ superUsersPending() }} | Disabled: {{ superUsersDisabled() }}</div>
          <mat-card-actions><a routerLink="/super/institute-users"><button mat-button>View details</button></a></mat-card-actions>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Exam Applications</mat-card-title><mat-card-subtitle>Super admin tracking</mat-card-subtitle></mat-card-header>
          <mat-card-content style="font-size:1.7rem; font-weight:700;">{{ appTotal() }}</mat-card-content>
          <div style="color:#6b7280;">Received: {{ appReceived() }} | Verified: {{ appVerified() }} | Approved: {{ appApproved() }}</div>
          <mat-card-actions><a routerLink="/board/exams"><button mat-button>View board apps</button></a></mat-card-actions>
        </mat-card>
      </div>

      <div *ngIf="user()?.role !== 'SUPER_ADMIN'" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Exam Applications</mat-card-title><mat-card-subtitle>Your institute</mat-card-subtitle></mat-card-header>
          <mat-card-content style="font-size:1.7rem; font-weight:700;">{{ appTotal() }}</mat-card-content>
          <div style="color:#6b7280;">Received: {{ appReceived() }} | Verified: {{ appVerified() }} | Approved: {{ appApproved() }}</div>
          <mat-card-actions>
            <a *ngIf="user()?.role==='INSTITUTE'" routerLink="/institute/applications"><button mat-button>View institute apps</button></a>
            <a *ngIf="user()?.role==='BOARD'" routerLink="/board/exams"><button mat-button>View board apps</button></a>
          </mat-card-actions>
        </mat-card>

        <mat-card appearance="outlined" *ngIf="user()?.role==='INSTITUTE'">
          <mat-card-header><mat-card-title>Teachers</mat-card-title><mat-card-subtitle>Total teachers in institute</mat-card-subtitle></mat-card-header>
          <mat-card-content style="font-size:1.7rem; font-weight:700;">{{ teachersTotal() }}</mat-card-content>
          <mat-card-actions><a routerLink="/institute/teachers"><button mat-button>Manage teachers</button></a></mat-card-actions>
        </mat-card>
      </div>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>Quick Actions</mat-card-title><mat-card-subtitle>Jump to important pages</mat-card-subtitle></mat-card-header>
        <mat-card-actions style="display:flex; flex-wrap:wrap; gap:8px;">
          <button mat-button routerLink="/super/institutes" *ngIf="user()?.role==='SUPER_ADMIN'">Manage Institutes</button>
          <button mat-button routerLink="/super/institute-users" *ngIf="user()?.role==='SUPER_ADMIN'">Manage Users</button>
          <button mat-button routerLink="/institute/settings" *ngIf="user()?.role==='INSTITUTE'">Institute Settings</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 14px;
      }
      .card {
        grid-column: span 12;
        padding: 16px;
      }
      .link { cursor: pointer; }
      .h { font-weight: 800; }
      .p { color: #6b7280; margin-top: 6px; }
      @media (min-width: 900px) { .card { grid-column: span 6; } }
    `
  ]
})
export class DashboardComponent implements OnInit {
  readonly user = computed(() => this.auth.user());
  readonly superInstituteTotal = signal(0);
  readonly superInstitutePending = signal(0);
  readonly superInstituteActive = signal(0);
  readonly superInstituteDisabled = signal(0);
  readonly superUsersTotal = signal(0);
  readonly superUsersActive = signal(0);
  readonly superUsersPending = signal(0);
  readonly superUsersDisabled = signal(0);
  readonly appTotal = signal(0);
  readonly appReceived = signal(0);
  readonly appVerified = signal(0);
  readonly appApproved = signal(0);
  readonly teachersTotal = signal(0);

  constructor(private readonly auth: AuthService, private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadCounts();
  }

  loadCounts() {
    const role = this.user()?.role;

    if (role === 'SUPER_ADMIN') {
      this.http.get<{ institutes: any[] }>(`${API_BASE_URL}/institutes`).subscribe({
        next: (r) => {
          const all = r.institutes || [];
          this.superInstituteTotal.set(all.length);
          this.superInstitutePending.set(all.filter((i: any) => i.status === 'PENDING').length);
          this.superInstituteActive.set(all.filter((i: any) => i.status === 'APPROVED').length);
          this.superInstituteDisabled.set(all.filter((i: any) => i.status === 'DISABLED').length);
        },
        error: () => {}
      });

      this.http.get<{ users: any[] }>(`${API_BASE_URL}/institutes/users/all`).subscribe({
        next: (r) => {
          const all = r.users || [];
          this.superUsersTotal.set(all.length);
          this.superUsersActive.set(all.filter((u: any) => u.status === 'ACTIVE').length);
          this.superUsersPending.set(all.filter((u: any) => u.status === 'PENDING').length);
          this.superUsersDisabled.set(all.filter((u: any) => u.status === 'DISABLED').length);
        },
        error: () => {}
      });

      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/board/list`, { params: { limit: '500' } }).subscribe({
        next: (r) => {
          const all = r.applications || [];
          this.appTotal.set(all.length);
          this.appReceived.set(all.filter((a: any) => a.status === 'SUBMITTED').length);
          this.appVerified.set(all.filter((a: any) => a.status === 'INSTITUTE_VERIFIED').length);
          this.appApproved.set(all.filter((a: any) => a.status === 'BOARD_APPROVED').length);
        },
        error: () => {}
      });
    }

    if (role === 'INSTITUTE') {
      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/institute/list`, { params: { limit: '500' } as any }).subscribe({
        next: (r) => {
          const all = r.applications || [];
          this.appTotal.set(all.length);
          this.appReceived.set(all.filter((a: any) => a.status === 'SUBMITTED').length);
          this.appVerified.set(all.filter((a: any) => a.status === 'INSTITUTE_VERIFIED').length);
          this.appApproved.set(all.filter((a: any) => a.status === 'BOARD_APPROVED').length);
        },
        error: () => {}
      });
      this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers`).subscribe({
        next: (r) => this.teachersTotal.set(r.teachers?.length || 0),
        error: () => {}
      });
    }

    if (role === 'BOARD') {
      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/board/list`, { params: { limit: '500' } }).subscribe({
        next: (r) => {
          const all = r.applications || [];
          this.appTotal.set(all.length);
          this.appReceived.set(all.filter((a: any) => a.status === 'SUBMITTED').length);
          this.appVerified.set(all.filter((a: any) => a.status === 'INSTITUTE_VERIFIED').length);
          this.appApproved.set(all.filter((a: any) => a.status === 'BOARD_APPROVED').length);
        },
        error: () => {}
      });
    }
  }
}

