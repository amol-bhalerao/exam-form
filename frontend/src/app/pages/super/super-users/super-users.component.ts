import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

ModuleRegistry.registerModules([AllCommunityModule]);

type User = {
  id: number;
  username: string;
  email?: string;
  mobile?: string;
  status: string;
  createdAt: string;
  role: { name: string };
  institute?: { name: string; code: string };
};

@Component({
  selector: 'app-super-users',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, AgGridModule, NgIf],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">Board Users Management</div>
          <div class="p">Manage board users and super administrators.</div>
        </div>
        <div class="grow"></div>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="load()" />
        </mat-form-field>
      </div>
    </mat-card>

    <mat-card class="card">
      <div class="h">Create New User</div>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="createForm.username" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" [(ngModel)]="createForm.password" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="createForm.email" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput [(ngModel)]="createForm.mobile" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Role</mat-label><mat-select [(ngModel)]="createForm.roleName"><mat-option value="BOARD">Board User</mat-option><mat-option value="SUPER_ADMIN">Super Admin</mat-option></mat-select></mat-form-field>
      </div>
      <div class="card-actions">
        <button mat-flat-button color="primary" (click)="createUser()">Create User</button>
        <button mat-stroked-button (click)="resetCreateForm()">Reset</button>
      </div>
      <div class="msg error" *ngIf="createError">{{ createError }}</div>
      <div class="msg success" *ngIf="createSuccess">{{ createSuccess }}</div>
    </mat-card>

    <mat-card class="card">
      <div class="ag-theme-alpine" style="width:100%; height:360px; margin-top:10px;">
        <ag-grid-angular
          [rowData]="users()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          class="ag-theme-alpine"
          style="width:100%; height:280px;"
          (cellClicked)="onGridCellClicked($event)"
        ></ag-grid-angular>
      </div>
      <div *ngIf="selectedUser" class="selected-row">
        <span><strong>Selected:</strong> {{ selectedUser.username }} ({{ selectedUser.role.name }}) - {{ selectedUser.status }}</span>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button mat-stroked-button color="accent" (click)="openEditUser()">Edit User</button>
          <button mat-stroked-button color="warn" (click)="openResetPassword()">Reset Password</button>
          <button mat-flat-button color="primary" (click)="toggleUserStatus()">{{ selectedUser.status === 'ACTIVE' ? 'Disable' : 'Enable' }} User</button>
        </div>
      </div>
    </mat-card>

    <div class="modal-backdrop" *ngIf="showEditUserModal">
      <div class="modal" style="max-width: 500px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-weight:700;">Edit User</div>
          <button style="border:none;background:transparent;font-size:1.1rem;cursor:pointer;" (click)="showEditUserModal = false">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:10px;">
          <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="editUserForm.username" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="editUserForm.email" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput [(ngModel)]="editUserForm.mobile" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Role</mat-label><mat-select [(ngModel)]="editUserForm.roleName"><mat-option value="BOARD">Board User</mat-option><mat-option value="SUPER_ADMIN">Super Admin</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="editUserForm.status"><mat-option value="ACTIVE">Active</mat-option><mat-option value="PENDING">Pending</mat-option><mat-option value="DISABLED">Disabled</mat-option></mat-select></mat-form-field>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
          <button mat-flat-button color="primary" (click)="saveEditedUser()">Save</button>
          <span style="color:#065f46;">{{ editUserSuccess }}</span>
          <span style="color:#b91c1c;">{{ editUserError }}</span>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showResetPasswordModal">
      <div class="modal" style="max-width: 400px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-weight:700;">Reset Password</div>
          <button style="border:none;background:transparent;font-size:1.1rem;cursor:pointer;" (click)="showResetPasswordModal = false">&times;</button>
        </div>
        <div style="margin-bottom:10px;">Reset password for user: <strong>{{ selectedUser?.username }}</strong></div>
        <mat-form-field appearance="outline" style="width:100%;"><mat-label>New Password</mat-label><input matInput type="password" [(ngModel)]="newPassword" /></mat-form-field>
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
          <button mat-flat-button color="primary" (click)="resetPassword()">Reset Password</button>
          <span style="color:#065f46;">{{ resetPasswordSuccess }}</span>
          <span style="color:#b91c1c;">{{ resetPasswordError }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        margin-bottom: 14px;
        padding: 16px;
      }
      .row {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .grow {
        flex: 1;
      }
      .h {
        font-weight: 900;
      }
      .p {
        color: #6b7280;
        margin-top: 4px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 10px;
      }
      .card-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
      }
      .msg {
        margin-top: 8px;
        font-weight: 700;
      }
      .error {
        color: #b91c1c;
      }
      .success {
        color: #065f46;
      }
      .w260 {
        width: 280px;
        max-width: 100%;
      }
      .selected-row {
        margin-top: 10px;
        padding: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: #fff;
        border-radius: 8px;
        padding: 16px;
        width: min(500px, 90vw);
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      }
    `
  ]
})
export class SuperUsersComponent implements OnInit {
  readonly users = signal<User[]>([]);
  selectedUser: User | null = null;
  showEditUserModal = false;
  showResetPasswordModal = false;
  newPassword = '';

  readonly columnDefs: ColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1, sortable: true, filter: true },
    { field: 'role.name', headerName: 'Role', flex: 1, sortable: true, filter: true, valueGetter: (params: any) => params.data.role.name },
    { field: 'status', headerName: 'Status', flex: 1, sortable: true, filter: true },
    { field: 'email', headerName: 'Email', flex: 1, sortable: true, filter: true, valueGetter: (params: any) => params.data.email || '—' },
    { field: 'mobile', headerName: 'Mobile', flex: 1, sortable: true, filter: true, valueGetter: (params: any) => params.data.mobile || '—' },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 140, cellRenderer: (params: any) => {
        return `<div style="display:flex;flex-wrap:wrap;gap:4px;"><button data-action=select style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 8px;border-radius:4px;">Select</button></div>`;
      } }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };
  search = '';

  createForm = {
    username: '',
    password: '',
    email: '',
    mobile: '',
    roleName: 'BOARD' as 'BOARD' | 'SUPER_ADMIN'
  };
  createError = '';
  createSuccess = '';

  editUserForm = {
    username: '',
    email: '',
    mobile: '',
    roleName: 'BOARD' as 'BOARD' | 'SUPER_ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'DISABLED'
  };
  editUserError = '';
  editUserSuccess = '';

  resetPasswordError = '';
  resetPasswordSuccess = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const params = this.search ? `?search=${encodeURIComponent(this.search)}` : '';
    this.http.get<{ users: User[] }>(`${API_BASE_URL}/users${params}`).subscribe((r) => this.users.set(r.users));
  }

  createUser() {
    this.createError = '';
    this.createSuccess = '';

    if (!this.createForm.username.trim() || !this.createForm.password.trim()) {
      this.createError = 'Username and password are required';
      return;
    }

    const payload = { ...this.createForm };
    this.http.post(`${API_BASE_URL}/users`, payload).subscribe({
      next: () => {
        this.createSuccess = 'User created successfully';
        this.resetCreateForm();
        this.load();
      },
      error: (err) => {
        this.createError = err.error?.error || 'Failed to create user';
      }
    });
  }

  resetCreateForm() {
    this.createForm = {
      username: '',
      password: '',
      email: '',
      mobile: '',
      roleName: 'BOARD'
    };
  }

  onGridCellClicked(event: any) {
    if (event.colDef.field === 'actions' && event.event.target.dataset.action === 'select') {
      this.selectedUser = event.data;
    }
  }

  openEditUser() {
    if (!this.selectedUser) return;
    this.editUserForm = {
      username: this.selectedUser.username,
      email: this.selectedUser.email || '',
      mobile: this.selectedUser.mobile || '',
      roleName: this.selectedUser.role.name as 'BOARD' | 'SUPER_ADMIN',
      status: this.selectedUser.status as 'ACTIVE' | 'PENDING' | 'DISABLED'
    };
    this.showEditUserModal = true;
    this.editUserError = '';
    this.editUserSuccess = '';
  }

  saveEditedUser() {
    if (!this.selectedUser) return;

    this.editUserError = '';
    this.editUserSuccess = '';

    const payload = { ...this.editUserForm };
    this.http.put(`${API_BASE_URL}/users/${this.selectedUser.id}`, payload).subscribe({
      next: () => {
        this.editUserSuccess = 'User updated successfully';
        this.load();
        setTimeout(() => {
          this.showEditUserModal = false;
        }, 1500);
      },
      error: (err) => {
        this.editUserError = err.error?.error || 'Failed to update user';
      }
    });
  }

  openResetPassword() {
    if (!this.selectedUser) return;
    this.newPassword = '';
    this.showResetPasswordModal = true;
    this.resetPasswordError = '';
    this.resetPasswordSuccess = '';
  }

  resetPassword() {
    if (!this.selectedUser || !this.newPassword.trim()) {
      this.resetPasswordError = 'Password is required';
      return;
    }

    this.resetPasswordError = '';
    this.resetPasswordSuccess = '';

    this.http.post(`${API_BASE_URL}/users/${this.selectedUser.id}/reset-password`, { newPassword: this.newPassword }).subscribe({
      next: () => {
        this.resetPasswordSuccess = 'Password reset successfully';
        setTimeout(() => {
          this.showResetPasswordModal = false;
        }, 1500);
      },
      error: (err) => {
        this.resetPasswordError = err.error?.error || 'Failed to reset password';
      }
    });
  }

  toggleUserStatus() {
    if (!this.selectedUser) return;

    const newStatus = this.selectedUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    this.http.put(`${API_BASE_URL}/users/${this.selectedUser.id}`, { status: newStatus }).subscribe({
      next: () => {
        this.load();
      },
      error: (err) => {
        console.error('Failed to update user status', err);
      }
    });
  }
}