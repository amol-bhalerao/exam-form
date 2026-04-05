import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';
import { InstituteSearchModalComponent } from '../../../components/institute-search-modal/institute-search-modal.component';

interface InstituteUser {
  id: number;
  username: string;
  email?: string;
  mobile?: string;
  status: string;
  institute: {
    id: number;
    name: string;
    status: string;
    code?: string;
    collegeNo?: string;
    udiseNo?: string;
  } | null;
}

@Component({
  selector: 'app-super-institute-users',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    AgGridModule,
    NgIf,
    NgFor,
    FormsModule,
    InstituteSearchModalComponent
  ],
  styles: [`
    .header-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
    .title { font-size:1.2rem; font-weight:700; }
    .subtitle { color:#4b5563; margin-top:4px; }
    .filter-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    .w240 { width: 240px; max-width: 100%; }
    .table-box { width:100%; height:430px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .invite-block { margin-top:16px; border-top:1px solid #e5e7eb; padding-top:14px; }
    .invite-title { font-weight:700; margin-bottom:8px; }
    .invite-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; }
    .invite-link { color:#065f46; font-size:.9rem; word-break: break-all; }
    .picker-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .picker-card { width:min(520px, calc(100vw - 24px)); padding:12px; }
    .editor-box { margin-top:12px; border:1px solid #e5e7eb; border-radius:10px; padding:12px; background:#fff9db; }
    .error { margin-top:10px; color:#b91c1c; }
    @media (max-width: 900px) { .invite-grid { grid-template-columns: 1fr; } }
  `],
  template: `
    <mat-card>
      <div class="header-row">
        <div>
          <div class="title">Institute Users</div>
          <div class="subtitle">View, filter, approve, and manage all institute login users in one grid.</div>
        </div>
        <button mat-flat-button color="primary" (click)="load()">Refresh</button>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline" class="w240">
          <mat-label>Search user or institute</mat-label>
          <input matInput [ngModel]="searchText()" (ngModelChange)="searchText.set($event)" placeholder="username, email, institute" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w240">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <mat-option value="">All</mat-option>
            <mat-option value="ACTIVE">Active</mat-option>
            <mat-option value="PENDING">Pending</mat-option>
            <mat-option value="DISABLED">Disabled</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="loading()" style="color:#2563eb; margin-bottom:8px;">Loading institute users...</div>
      <div *ngIf="!loading() && users().length === 0" style="color:#4b5563; margin-bottom:8px;">No institute users found.</div>

      <div class="ag-theme-alpine table-box">
        <ag-grid-angular
          [rowData]="filteredUsers()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="20"
          [paginationPageSizeSelector]="[10, 20, 50, 100]"
          style="width:100%; height:100%;"
          class="ag-theme-alpine"
          (cellClicked)="onGridAction($event)">
        </ag-grid-angular>
      </div>

      <div class="invite-block">
        <div class="invite-title">Create Institute User + Activation Link</div>
        <div class="invite-grid">
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button mat-flat-button color="primary" type="button" (click)="showInstituteFinder.set(true)">Search institute</button>
            <div *ngIf="inviteInstituteId">Selected: {{ selectedInstituteName || ('ID ' + inviteInstituteId) }}</div>
          </div>
        </div>

        <app-institute-search-modal
          [visible]="showInstituteFinder()"
          (visibleChange)="showInstituteFinder.set($event)"
          (selected)="onInstituteSelected($event)">
        </app-institute-search-modal>

        <div *ngIf="inviteInstituteId" style="margin-top: 10px; border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#f9fafb;">
          <div style="font-weight:700; margin-bottom:6px;">Actions for selected institute</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <button mat-flat-button color="primary" (click)="createInvite()">Create Invite Link</button>
            <button mat-flat-button color="accent" (click)="showCreateUser.set(true)">Create User</button>
            <span class="invite-link" *ngIf="inviteLink">Link: <a [href]="inviteLink" target="_blank">{{ inviteLink }}</a></span>
          </div>

          <div *ngIf="selectedPendingUsers().length > 0" style="margin-top:8px;"><strong>Pending users for selected institute</strong></div>
          <div *ngFor="let u of selectedPendingUsers()" style="display:flex;gap:8px;align-items:center;margin-top:4px;border-top:1px solid #e5e7eb;padding-top:6px;">
            <div style="flex:1;">{{ u.username }} · {{ u.email || 'no email' }} · {{ u.mobile || 'no mobile' }}</div>
            <button mat-stroked-button color="primary" type="button" (click)="approve(u.id)">Approve</button>
          </div>
        </div>

        <div *ngIf="showCreateUser()" class="picker-overlay">
          <mat-card class="picker-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div><strong>Create institute user</strong></div>
              <button mat-icon-button type="button" (click)="showCreateUser.set(false)"><mat-icon>close</mat-icon></button>
            </div>
            <div style="display:grid;gap:10px;">
              <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="createUsername" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" [(ngModel)]="createPassword" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email (optional)</mat-label><input matInput [(ngModel)]="createEmail" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Mobile (optional)</mat-label><input matInput [(ngModel)]="createMobile" /></mat-form-field>
              <button mat-flat-button color="primary" (click)="createUser()">Create User</button>
              <div *ngIf="createUserError()" style="color:#b91c1c;">{{ createUserError() }}</div>
              <div *ngIf="createUserMsg()" style="color:#065f46;">{{ createUserMsg() }}</div>
            </div>
          </mat-card>
        </div>
      </div>

      <div *ngIf="editingUser" class="editor-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <strong>Edit user {{ editingUser.username }} (id {{ editingUser.id }})</strong>
          <button mat-icon-button (click)="editingUser = null"><mat-icon>close</mat-icon></button>
        </div>
        <div style="display:grid;gap:8px;grid-template-columns:1fr 1fr; margin-top:8px;">
          <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="editUsername" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput [(ngModel)]="editEmail" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput [(ngModel)]="editMobile" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Password (optional)</mat-label><input matInput type="password" [(ngModel)]="editPassword" /></mat-form-field>
        </div>
        <div style="margin-top:8px;">
          <button mat-flat-button color="primary" (click)="updateUser()">Save</button>
          <span style="color:#065f46; margin-left:8px;" *ngIf="editMsg()">{{ editMsg() }}</span>
          <span style="color:#b91c1c; margin-left:8px;" *ngIf="editError()">{{ editError() }}</span>
        </div>
      </div>

      <div *ngIf="error()" class="error">{{ error() }}</div>
      <div *ngIf="inviteError()" class="error">{{ inviteError() }}</div>
    </mat-card>
  `
})
export class SuperInstituteUsersComponent implements OnInit {
  readonly users = signal<InstituteUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteError = signal<string | null>(null);
  readonly searchText = signal('');
  readonly statusFilter = signal('');

  inviteLink = '';
  inviteInstituteId: number | null = null;
  selectedInstituteName = '';
  showInstituteFinder = signal(false);

  showCreateUser = signal(false);
  createUsername = '';
  createPassword = '';
  createEmail = '';
  createMobile = '';
  createUserError = signal<string | null>(null);
  createUserMsg = signal<string | null>(null);

  editingUser: InstituteUser | null = null;
  editUsername = '';
  editEmail = '';
  editMobile = '';
  editPassword = '';
  editMsg = signal<string | null>(null);
  editError = signal<string | null>(null);

  readonly filteredUsers = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const status = this.statusFilter();
    return this.users().filter((user) => {
      const matchesStatus = !status || user.status === status;
      const haystack = [
        user.username,
        user.email,
        user.mobile,
        user.status,
        user.institute?.name,
        user.institute?.code,
        user.institute?.collegeNo,
        user.institute?.udiseNo
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesSearch;
    });
  });

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };
  readonly columnDefs: ColDef[] = [
    { field: 'username', headerName: 'Username', pinned: 'left', minWidth: 140 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
    { field: 'mobile', headerName: 'Mobile', minWidth: 130 },
    { field: 'status', headerName: 'User Status', minWidth: 120 },
    { headerName: 'Institute', valueGetter: (params: any) => params.data?.institute?.name ?? '-', minWidth: 200 },
    { headerName: 'Institute Status', valueGetter: (params: any) => params.data?.institute?.status ?? '-', minWidth: 130 },
    { headerName: 'Center No', valueGetter: (params: any) => params.data?.institute?.code ?? '-', minWidth: 120 },
    { headerName: 'College No (Unique)', valueGetter: (params: any) => params.data?.institute?.collegeNo ?? '-', minWidth: 140 },
    { headerName: 'UDISE', valueGetter: (params: any) => params.data?.institute?.udiseNo ?? '-', minWidth: 140 },
    {
      headerName: 'Actions',
      field: 'actions',
      pinned: 'right',
      minWidth: 250,
      cellRenderer: () => `
        <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
          <button data-action="activate" style="border:none;background:#dcfce7;color:#166534;padding:3px 6px;border-radius:4px;">Activate</button>
          <button data-action="pending" style="border:none;background:#fef3c7;color:#92400e;padding:3px 6px;border-radius:4px;">Pending</button>
          <button data-action="disable" style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 6px;border-radius:4px;">Disable</button>
          <button data-action="edit" style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 6px;border-radius:4px;">Edit</button>
        </div>`
    }
  ];

  private readonly http = inject(HttpClient);

  ngOnInit() {
    this.load();
  }

  selectedPendingUsers() {
    if (!this.inviteInstituteId) return [];
    return this.users().filter((user) => user.institute?.id === this.inviteInstituteId && user.status === 'PENDING');
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ users: InstituteUser[] }>(`${API_BASE_URL}/institutes/users/all`).subscribe({
      next: (res) => {
        this.users.set(res.users || []);
        this.loading.set(false);
      },
      error: (e: any) => {
        this.error.set(e?.error?.error || 'Could not load users');
        this.loading.set(false);
      }
    });
  }

  approve(id: number) {
    this.http.patch(`${API_BASE_URL}/institutes/users/${id}/status`, { status: 'ACTIVE' }).subscribe({
      next: () => this.load(),
      error: (e: any) => this.error.set(e?.error?.error || 'Approval failed')
    });
  }

  setStatus(user: InstituteUser, status: 'ACTIVE' | 'PENDING' | 'DISABLED') {
    this.http.patch(`${API_BASE_URL}/institutes/users/${user.id}/status`, { status }).subscribe({
      next: () => this.load(),
      error: (e: any) => this.error.set(e?.error?.error || 'Failed to update status')
    });
  }

  onGridAction(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const user = event.data as InstituteUser | undefined;
    if (!action || !user) return;

    if (action === 'activate') return this.setStatus(user, 'ACTIVE');
    if (action === 'pending') return this.setStatus(user, 'PENDING');
    if (action === 'disable') return this.setStatus(user, 'DISABLED');
    if (action === 'edit') return this.startEdit(user);
  }

  startEdit(user: InstituteUser) {
    this.editingUser = user;
    this.editUsername = user.username;
    this.editEmail = user.email || '';
    this.editMobile = user.mobile || '';
    this.editPassword = '';
    this.editMsg.set(null);
    this.editError.set(null);
  }

  updateUser() {
    if (!this.editingUser) return;
    const payload: any = {
      username: this.editUsername.trim(),
      email: this.editEmail.trim(),
      mobile: this.editMobile.trim()
    };
    if (this.editPassword.trim()) payload.password = this.editPassword.trim();

    this.http.patch<{ user: InstituteUser }>(`${API_BASE_URL}/institutes/users/${this.editingUser.id}`, payload).subscribe({
      next: () => {
        this.editMsg.set('User updated successfully');
        this.load();
        this.editingUser = null;
      },
      error: (e: any) => {
        this.editError.set(e?.error?.error || 'Failed to update user');
      }
    });
  }

  onInstituteSelected(inst: any) {
    this.inviteInstituteId = inst.id;
    this.selectedInstituteName = inst.name;
  }

  createInvite() {
    this.inviteError.set(null);
    this.inviteLink = '';
    if (!this.inviteInstituteId) {
      this.inviteError.set('Institute ID is required');
      return;
    }
    const payload: any = { instituteId: this.inviteInstituteId };
    this.http.post<{ activationLink: string }>(`${API_BASE_URL}/institutes/users/invite`, payload).subscribe({
      next: (res: any) => {
        this.inviteLink = `${window.location.origin}${res.activationLink}`;
        this.load();
      },
      error: (e: any) => {
        this.inviteError.set(e?.error?.error || 'Failed to create invite');
      }
    });
  }

  createUser() {
    this.createUserError.set(null);
    this.createUserMsg.set(null);
    if (!this.inviteInstituteId) {
      this.createUserError.set('Select institute first');
      return;
    }
    if (!this.createUsername.trim() || !this.createPassword.trim()) {
      this.createUserError.set('Username and password are required');
      return;
    }

    this.http.post(`${API_BASE_URL}/institutes/users/create`, {
      instituteId: this.inviteInstituteId,
      username: this.createUsername.trim(),
      password: this.createPassword.trim(),
      email: this.createEmail.trim() || undefined,
      mobile: this.createMobile.trim() || undefined
    }).subscribe({
      next: () => {
        this.createUserMsg.set('Institute user created successfully.');
        this.showCreateUser.set(false);
        this.createUsername = '';
        this.createPassword = '';
        this.createEmail = '';
        this.createMobile = '';
        this.load();
      },
      error: (e: any) => {
        const err = e?.error;
        if (err?.error === 'INSTITUTE_ADMIN_ALREADY_EXISTS') {
          const existing = err?.existingUser;
          this.createUserError.set(err?.message || 'Institute admin already exists');
          if (existing) {
            this.createUserError.set(`${this.createUserError()} (id: ${existing.id}, username: ${existing.username}, status: ${existing.status})`);
          }
        } else {
          this.createUserError.set(err?.error || 'Could not create user');
        }
      }
    });
  }
}

