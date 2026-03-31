import { Component, OnInit, signal, inject } from '@angular/core';
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

type Institute = {
  id: number;
  collegeNo: string;
  udiseNo: string;
  name: string;
  code?: string;
  address?: string;
  district?: string;
  taluka?: string;
  city?: string;
  pincode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactMobile?: string;
  status: string;
  acceptingApplications?: boolean;
  createdAt: string;
};

@Component({
  selector: 'app-super-institutes',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, AgGridModule],
  template: `
    <mat-card class="card">
      <div class="row">
        <div>
          <div class="h">Institutes</div>
          <div class="p">Manage institutes - create new ones and approve pending registrations.</div>
        </div>
        <div class="grow"></div>
        <button mat-flat-button color="primary" (click)="showCreateInstitute.set(true)">Add New Institute</button>
        <mat-form-field appearance="outline" class="w260">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" (input)="load()" />
        </mat-form-field>
      </div>
    </mat-card>

    <mat-card class="card">
      <div class="ag-theme-alpine" style="width:100%; height:360px; margin-top:10px;">
        <ag-grid-angular
          [rowData]="institutes()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="{ mode: 'singleRow' }"
          class="ag-theme-alpine"
          style="width:100%; height:280px;"
          (cellClicked)="onGridCellClicked($event)"
        ></ag-grid-angular>
      </div>
      @if (selectedInstitute) {
        <div class="selected-row">
          <span><strong>Selected:</strong> {{ selectedInstitute.name }} ({{ selectedInstitute.status }})</span>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button mat-stroked-button color="accent" (click)="generateInvite(selectedInstitute.id)">Generate Activation Link</button>
            <button mat-flat-button color="primary" (click)="openEditInstitute()">Edit Institute</button>
          </div>
        </div>
      }
      @if (inviteLink) {
        <div style="margin-top:8px; font-size:.9rem; color:#065f46;">Activation Link: <a [href]="inviteLink" target="_blank">{{ inviteLink }}</a></div>
      }
    </mat-card>

    @if (viewingInstitute) {
      <div class="modal-backdrop">
        <div class="modal">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="font-weight: 700;">Institute Details</div>
            <button style="border:none;background:transparent;font-size:1.1rem;cursor:pointer;" (click)="closeView()">&times;</button>
          </div>
        <div style="margin-bottom:8px;"><strong>Name:</strong> {{ viewingInstitute.name }}</div>
        <div style="margin-bottom:8px;"><strong>Code:</strong> {{ viewingInstitute.code || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Status:</strong> {{ viewingInstitute.status }}</div>
        <div style="margin-bottom:8px;"><strong>College No:</strong> {{ viewingInstitute.collegeNo }}</div>
        <div style="margin-bottom:8px;"><strong>UDISE No:</strong> {{ viewingInstitute.udiseNo }}</div>
        <div style="margin-bottom:8px;"><strong>Address:</strong> {{ viewingInstitute.address || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>District:</strong> {{ viewingInstitute.district || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Taluka:</strong> {{ viewingInstitute.taluka || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>City:</strong> {{ viewingInstitute.city || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Pincode:</strong> {{ viewingInstitute.pincode || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Contact Person:</strong> {{ viewingInstitute.contactPerson || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Contact Email:</strong> {{ viewingInstitute.contactEmail || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Contact Mobile:</strong> {{ viewingInstitute.contactMobile || '—' }}</div>
        <div style="margin-bottom:8px;"><strong>Accepting Applications:</strong> {{ viewingInstitute.acceptingApplications ? 'Yes' : 'No' }}</div>
        <div style="margin-bottom:8px;"><strong>Created At:</strong> {{ viewingInstitute.createdAt }}</div>
        <div style="text-align:right;"><button mat-flat-button color="primary" (click)="closeView()">Close</button></div>
        </div>
      </div>
    }

    @if (showCreateInstitute()) {
      <div class="modal-backdrop">
        <div class="modal" style="max-width: 700px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;">Create New Institute</div>
            <button style="border:none;background:transparent;font-size:1.1rem;cursor:pointer;" (click)="showCreateInstitute.set(false); resetCreateForm()">&times;</button>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Institute Name</mat-label><input matInput [(ngModel)]="createForm.name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Institute Code</mat-label><input matInput [(ngModel)]="createForm.code" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Address</mat-label><input matInput [(ngModel)]="createForm.address" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Person</mat-label><input matInput [(ngModel)]="createForm.contactPerson" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput type="email" [(ngModel)]="createForm.contactEmail" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Mobile</mat-label><input matInput [(ngModel)]="createForm.contactMobile" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Username</mat-label><input matInput [(ngModel)]="createForm.username" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" [(ngModel)]="createForm.password" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="createForm.status"><mat-option value="PENDING">Pending</mat-option><mat-option value="APPROVED">Approved</mat-option></mat-select></mat-form-field>
          </div>
          <div class="card-actions">
            <button mat-flat-button color="primary" (click)="createInstitute()">Create Institute</button>
            <button mat-stroked-button (click)="resetCreateForm()">Reset</button>
          </div>
          @if (createError) {
            <div class="msg error">{{ createError }}</div>
          }
          @if (createSuccess) {
            <div class="msg success">{{ createSuccess }}</div>
          }
        </div>
      </div>
    }

    @if (showEditInstitute()) {
      <div class="modal-backdrop">
        <div class="modal" style="max-width: 700px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;">Edit Institute</div>
            <button style="border:none;background:transparent;font-size:1.1rem;cursor:pointer;" (click)="showEditInstitute.set(false)">&times;</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="editInstituteForm.name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="editInstituteForm.code" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>College No</mat-label><input matInput [(ngModel)]="editInstituteForm.collegeNo" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>UDISE No</mat-label><input matInput [(ngModel)]="editInstituteForm.udiseNo" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Person</mat-label><input matInput [(ngModel)]="editInstituteForm.contactPerson" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label><input matInput type="email" [(ngModel)]="editInstituteForm.contactEmail" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Contact Mobile</mat-label><input matInput [(ngModel)]="editInstituteForm.contactMobile" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput [(ngModel)]="editInstituteForm.pincode" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Address</mat-label><input matInput [(ngModel)]="editInstituteForm.address" /></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>City</mat-label><input matInput [(ngModel)]="editInstituteForm.city" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="editInstituteForm.status"><mat-option value="APPROVED">Approved</mat-option><mat-option value="PENDING">Pending</mat-option><mat-option value="DISABLED">Disabled</mat-option><mat-option value="REJECTED">Rejected</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Accepting Applications</mat-label><mat-select [(ngModel)]="editInstituteForm.acceptingApplications"><mat-option [value]="true">Yes</mat-option><mat-option [value]="false">No</mat-option></mat-select></mat-form-field>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;"><button mat-flat-button color="primary" (click)="saveEditedInstitute()">Save</button><span style="color:#065f46;">{{ editInstituteSuccess }}</span><span style="color:#b91c1c;">{{ editInstituteError }}</span></div>
        </div>
      </div>
    }
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
      .table {
        width: 100%;
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
export class SuperInstitutesComponent implements OnInit {
  readonly institutes = signal<Institute[]>([]);
  selectedInstitute: Institute | null = null;
  viewingInstitute: Institute | null = null;
  readonly columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1.5, sortable: true, filter: true, minWidth: 200 },
    { field: 'collegeNo', headerName: 'College No', flex: 1, sortable: true, filter: true, minWidth: 120, valueGetter: (params: any) => params.data.collegeNo || '—' },
    { field: 'udiseNo', headerName: 'UDISE No', flex: 1, sortable: true, filter: true, minWidth: 120, valueGetter: (params: any) => params.data.udiseNo || '—' },
    { field: 'city', headerName: 'City', flex: 1, sortable: true, filter: true, minWidth: 120, valueGetter: (params: any) => params.data.city || '—' },
    { field: 'contactMobile', headerName: 'Mobile', flex: 1, sortable: true, filter: true, minWidth: 130, valueGetter: (params: any) => params.data.contactMobile || '—' },
    { field: 'contactEmail', headerName: 'Email', flex: 1.2, sortable: true, filter: true, minWidth: 180, valueGetter: (params: any) => params.data.contactEmail || '—' },
    { headerName: 'Actions', field: 'actions', flex: 0.8, minWidth: 90, cellRenderer: (params: any) => {
        return `<div style="display:flex;flex-wrap:wrap;gap:4px;"><button data-action=view style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:12px;">View</button></div>`;
      } }
  ];
  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };
  search = '';

  createForm = {
    name: '',
    code: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactMobile: '',
    username: '',
    password: '',
    status: 'APPROVED' as 'APPROVED' | 'PENDING'
  };
  createError = '';
  createSuccess = '';
  inviteLink = '';
  showEditInstitute = signal(false);
  showCreateInstitute = signal(false);
  editInstituteForm = {
    id: 0,
    name: '',
    code: '',
    address: '',
    district: '',
    taluka: '',
    city: '',
    pincode: '',
    contactPerson: '',
    contactEmail: '',
    contactMobile: '',
    collegeNo: '',
    udiseNo: '',
    status: 'APPROVED' as 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED',
    acceptingApplications: true
  };
  editInstituteError = '';
  editInstituteSuccess = '';

  private readonly http = inject(HttpClient);

  ngOnInit() {
    this.load();
  }

  load() {
    // For super admin, get ALL institutes (including PENDING)
    this.http.get<{ institutes: Institute[] }>(`${API_BASE_URL}/institutes/all`).subscribe({
      next: (r) => this.institutes.set(r.institutes),
      error: (err) => {
        console.error('Error loading institutes:', err);
        // Fallback to regular endpoint if /all is not available
        this.http.get<{ institutes: Institute[] }>(`${API_BASE_URL}/institutes`).subscribe(
          (r) => this.institutes.set(r.institutes)
        );
      }
    });
  }

  createInstitute() {
    this.createError = '';
    this.createSuccess = '';
    
    if (!this.createForm.name.trim() || !this.createForm.contactPerson.trim() || !this.createForm.username.trim() || !this.createForm.password.trim()) {
      this.createError = 'Name, contact person, username and password are required';
      return;
    }

    const payload = { ...this.createForm };
    this.http.post(`${API_BASE_URL}/institutes`, payload).subscribe({
      next: () => {
        this.createSuccess = 'Institute created successfully';
        this.resetCreateForm();
        this.load();
        setTimeout(() => {
          this.showCreateInstitute.set(false);
        }, 1500);
      },
      error: (e) => {
        this.createError = e?.error?.error || 'Failed to create institute';
      }
    });
  }

  resetCreateForm() {
    this.createForm = {
      name: '',
      code: '',
      address: '',
      contactPerson: '',
      contactEmail: '',
      contactMobile: '',
      username: '',
      password: '',
      status: 'APPROVED'
    };
    this.createError = '';
    this.createSuccess = '';
  }

  onRowClicked(row: Institute | undefined) {
    this.selectedInstitute = row ?? null;
  }

  openEditInstitute() {
    if (!this.selectedInstitute) return;
    const s = this.selectedInstitute;
    this.editInstituteForm = {
      ...this.editInstituteForm,
      id: s.id,
      name: s.name || '',
      code: s.code || '',
      address: s.address || '',
      district: s.district || '',
      taluka: s.taluka || '',
      city: s.city || '',
      pincode: s.pincode || '',
      contactPerson: s.contactPerson || '',
      contactEmail: s.contactEmail || '',
      contactMobile: s.contactMobile || '',
      collegeNo: s.collegeNo || '',
      udiseNo: s.udiseNo || '',
      status: (s.status as 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED') || 'PENDING',
      acceptingApplications: s.acceptingApplications ?? true
    };
    this.editInstituteError = '';
    this.editInstituteSuccess = '';
    this.showEditInstitute.set(true);
  }

  saveEditedInstitute() {
    this.editInstituteError = '';
    this.editInstituteSuccess = '';
    const payload = {
      name: this.editInstituteForm.name,
      code: this.editInstituteForm.code,
      address: this.editInstituteForm.address,
      district: this.editInstituteForm.district,
      taluka: this.editInstituteForm.taluka,
      city: this.editInstituteForm.city,
      pincode: this.editInstituteForm.pincode,
      contactPerson: this.editInstituteForm.contactPerson,
      contactEmail: this.editInstituteForm.contactEmail,
      contactMobile: this.editInstituteForm.contactMobile,
      collegeNo: this.editInstituteForm.collegeNo,
      udiseNo: this.editInstituteForm.udiseNo,
      status: this.editInstituteForm.status,
      acceptingApplications: this.editInstituteForm.acceptingApplications
    };
    this.http.patch(`${API_BASE_URL}/institutes/${this.editInstituteForm.id}`, payload).subscribe({
      next: () => {
        this.editInstituteSuccess = 'Institute updated successfully';
        this.showEditInstitute.set(false);
        this.load();
      },
      error: (e) => {
        this.editInstituteError = e?.error?.error || 'Could not update institute';
      }
    });
  }

  closeView() {
    this.viewingInstitute = null;
  }

  updateStatus(id: number, status: 'APPROVED' | 'PENDING') {
    this.http.patch(`${API_BASE_URL}/institutes/${id}/status`, { status }).subscribe(() => {
      this.selectedInstitute = null;
      this.viewingInstitute = null;
      this.load();
    });
  }

  onGridCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data;
    if (!action || !row) return;
    if (action === 'approve') {
      this.updateStatus(row.id, 'APPROVED');
      return;
    }
    if (action === 'pending') {
      this.updateStatus(row.id, 'PENDING');
      return;
    }
    if (action === 'view') {
      this.selectedInstitute = row;
      this.viewingInstitute = row;
    }
  }

  approve(id: number) {
    this.updateStatus(id, 'APPROVED');
  }

  generateInvite(instituteId: number) {
    this.inviteLink = '';
    this.http.post<{ activationLink: string }>(`${API_BASE_URL}/institutes/users/invite`, { instituteId }).subscribe({
      next: (r) => {
        this.inviteLink = `${window.location.origin}${r.activationLink}`;
      },
      error: (e) => {
        this.createError = e?.error?.error || 'Failed to generate invite';
      }
    });
  }
}

