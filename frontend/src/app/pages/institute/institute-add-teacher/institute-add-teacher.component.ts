import { Component, OnInit, signal, computed } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';
import * as XLSX from 'xlsx';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

@Component({
  selector: 'app-institute-add-teacher',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatCardModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatButtonModule, MatIconModule, AgGridModule, NgIf],
  template: `
    <mat-card class="card">
      <div class="h">Institute Teachers</div>
      <p class="p">Add teacher details and manage institute staff.</p>
      <form [formGroup]="form" (ngSubmit)="save()" class="grid">
        <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="fullName" [readonly]="isReadonly()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Designation</mat-label><input matInput formControlName="designation" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Subject Specialization</mat-label><input matInput formControlName="subjectSpecialization" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Qualification</mat-label><input matInput formControlName="qualification" [readonly]="isReadonly()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>DOB</mat-label><input matInput [matDatepicker]="dobPicker" formControlName="dob" [readonly]="isReadonly()" /><mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle><mat-datepicker #dobPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Date of Joining</mat-label><input matInput [matDatepicker]="dojPicker" formControlName="appointmentDate" /><mat-datepicker-toggle matSuffix [for]="dojPicker"></mat-datepicker-toggle><mat-datepicker #dojPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Service Start Date</mat-label><input matInput [matDatepicker]="serviceStartPicker" formControlName="serviceStartDate" [readonly]="isReadonly()" /><mat-datepicker-toggle matSuffix [for]="serviceStartPicker"></mat-datepicker-toggle><mat-datepicker #serviceStartPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Leaving Date</mat-label><input matInput [matDatepicker]="leavingDatePicker" formControlName="leavingDate" /><mat-datepicker-toggle matSuffix [for]="leavingDatePicker"></mat-datepicker-toggle><mat-datepicker #leavingDatePicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Leaving Note</mat-label><input matInput formControlName="leavingNote" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Teacher Type</mat-label><mat-select formControlName="teacherType"><mat-option value="Regular">Regular</mat-option><mat-option value="Contract">Contract</mat-option><mat-option value="Visiting">Visiting</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Caste Category</mat-label><input matInput formControlName="casteCategory" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Certification Keywords</mat-label><input matInput formControlName="certifications" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Certificates (comma separated)</mat-label><input matInput formControlName="certificates" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Total Experience (years)</mat-label><input matInput [value]="experience()" disabled /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Aadhar Number</mat-label><input matInput formControlName="governmentId" (blur)="onAadharLookup()" (keyup.enter)="onAadharLookup()" /></mat-form-field>
        <button mat-stroked-button color="accent" type="button" (click)="onAadharLookup()">Lookup Aadhar</button>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput formControlName="mobile" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender" [disabled]="isReadonly()"><mat-option value="Male">Male</mat-option><mat-option value="Female">Female</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Active</mat-label><mat-select formControlName="active" (selectionChange)="onActiveChange($event.value)"><mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option></mat-select></mat-form-field>
        <button mat-flat-button color="primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving...' : selectedTeacherId() ? 'Update Teacher' : 'Add Teacher' }}</button>
      </form>
      <div class="error" *ngIf="error()">{{ error() }}</div>
      <mat-form-field appearance="outline" class="search"><mat-label>Search teachers</mat-label><input matInput [value]="searchText()" (input)="searchText.set($any($event.target).value)" placeholder="name, email, subject" /></mat-form-field>
      <div class="ag-theme-alpine" style="width: 100%; height: 360px; margin-top: 10px;">
        <ag-grid-angular
          [rowData]="filteredTeachers()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          class="ag-theme-alpine"
          style="width:100%; height:100%;"
          [rowSelection]="{ mode: 'singleRow' }"
          (cellClicked)="onTeacherCellClicked($event)"
        ></ag-grid-angular>
      </div>
    </mat-card>

    <div class="modal-backdrop" *ngIf="viewingTeacher()">
      <div class="modal">
        <div class="modal-header"><h3>Teacher details</h3><button mat-icon-button (click)="closeView()"><mat-icon>close</mat-icon></button></div>
        <div class="modal-content">
          <div><strong>Name:</strong> {{ viewingTeacher()?.fullName }}</div>
          <div><strong>Designation:</strong> {{ viewingTeacher()?.designation }}</div>
          <div><strong>Subject:</strong> {{ viewingTeacher()?.subjectSpecialization }}</div>
          <div><strong>DOB:</strong> {{ viewingTeacher()?.dob | date:'dd-MM-yyyy' }}</div>
          <div><strong>DOJ:</strong> {{ viewingTeacher()?.appointmentDate | date:'dd-MM-yyyy' }}</div>
          <div><strong>Service Start:</strong> {{ viewingTeacher()?.serviceStartDate | date:'dd-MM-yyyy' }}</div>
          <div><strong>Leaving Date:</strong> {{ viewingTeacher()?.leavingDate | date:'dd-MM-yyyy' }}</div>
          <div><strong>Leaving Note:</strong> {{ viewingTeacher()?.leavingNote }}</div>
          <div><strong>Teacher Type:</strong> {{ viewingTeacher()?.teacherType }}</div>
          <div><strong>Caste Category:</strong> {{ viewingTeacher()?.casterCategory }}</div>
          <div><strong>Aadhar:</strong> {{ viewingTeacher()?.governmentId }}</div>
          <div><strong>Email:</strong> {{ viewingTeacher()?.email }}</div>
          <div><strong>Mobile:</strong> {{ viewingTeacher()?.mobile }}</div>
          <div><strong>Status:</strong> {{ viewingTeacher()?.active ? 'Active' : 'Inactive' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px; margin-bottom: 10px; }
    .h { font-weight: 800; }
    .p { color: #6b7280; margin-top: 4px; }
    .error { color: #b91c1c; margin-top: 8px; }
    .table { width: 100%; margin-top: 10px; }
  `]
})
export class InstituteAddTeacherComponent implements OnInit {
  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    designation: new FormControl('', { nonNullable: true }),
    subjectSpecialization: new FormControl('', { nonNullable: true }),
    qualification: new FormControl('', { nonNullable: true }),
    dob: new FormControl<Date | null>(null),
    appointmentDate: new FormControl<Date | null>(null),
    gender: new FormControl('Male', { nonNullable: true }),
    governmentId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(20)] }),
    casteCategory: new FormControl('', { nonNullable: true }),
    serviceStartDate: new FormControl<Date | null>(null),
    leavingDate: new FormControl<Date | null>(null),
    leavingNote: new FormControl('', { nonNullable: true }),
    certificates: new FormControl('', { nonNullable: true }),
    certifications: new FormControl('', { nonNullable: true }),
    teacherType: new FormControl('Regular', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true })
  });
  readonly teachers = signal<any[]>([]);
  readonly filteredTeachers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    if (!q) return this.teachers();
    return this.teachers().filter((t) =>
      [t.fullName, t.email, t.mobile, t.subjectSpecialization, t.designation].join(' ').toLowerCase().includes(q)
    );
  });
  readonly searchText = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewingTeacher = signal<any | null>(null);
  readonly selectedTeacherId = signal<number | null>(null);
  readonly isReadonly = signal(false); // For fixed fields from Aadhar lookup
  readonly experience = computed(() => {
    const doj = this.form.value.appointmentDate;
    if (!doj) return '';
    const d = new Date(doj);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    return `${years} year${years === 1 ? '' : 's'}`;
  });

  readonly columnDefs: ColDef[] = [
    { field: 'fullName', headerName: 'Name', sortable: true, filter: true, flex: 2 },
    { field: 'governmentId', headerName: 'Aadhar', sortable: true, filter: true, flex: 1 },
    { field: 'designation', headerName: 'Designation', sortable: true, filter: true, flex: 1 },
    { field: 'subjectSpecialization', headerName: 'Subject', sortable: true, filter: true, flex: 1 },
    { field: 'qualification', headerName: 'Qualification', sortable: true, filter: true, flex: 1 },
    { field: 'casteCategory', headerName: 'Caste Category', sortable: true, filter: true, flex: 1 },
    { field: 'serviceStartDate', headerName: 'Service Start', sortable: true, filter: true, valueGetter: (p:any) => p.data.serviceStartDate ? new Date(p.data.serviceStartDate).toLocaleDateString() : '' , flex: 1 },
    { field: 'leavingDate', headerName: 'Leaving Date', sortable: true, filter: true, valueGetter: (p:any)=>p.data.leavingDate ? new Date(p.data.leavingDate).toLocaleDateString() : '' , flex: 1 },
    { field: 'teacherType', headerName: 'Type', sortable: true, filter: true, flex: 1 },
    { field: 'email', headerName: 'Email', sortable: true, filter: true, flex: 1 },
    { field: 'mobile', headerName: 'Mobile', sortable: true, filter: true, flex: 1 },
    {
      field: 'active', headerName: 'Status', sortable: true, filter: true, flex: 1,
      valueGetter: (params: any) => (params.data?.active ? 'Active' : 'Inactive')
    },
    {
      headerName: 'Actions', field: 'actions', minWidth: 190, flex: 1,
      cellRenderer: (params: any) => {
        return `<div style="display:flex;gap:4px;align-items:center;justify-content:flex-start;"><button data-action=view class="ag-icon-button" style="border:none;background:#eef2ff;color:#1d4ed8;padding:3px 6px;border-radius:4px;">View</button><button data-action=edit class="ag-icon-button" style="border:none;background:#e0f2fe;color:#0369a1;padding:3px 6px;border-radius:4px;">Edit</button><button data-action=toggle class="ag-icon-button" style="border:none;background:#fef3c7;color:#92400e;padding:3px 6px;border-radius:4px;">Toggle</button><button data-action=delete class="ag-icon-button" style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 6px;border-radius:4px;">Delete</button></div>`;
      }
    }
  ];

  readonly defaultColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor(private readonly http: HttpClient) { }

  ngOnInit() { this.load(); }

  load() {
    this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers`).subscribe((r) => this.teachers.set(r.teachers));
  }

  onAadharLookup() {
    const governmentId = this.form.value.governmentId?.trim();
    if (!governmentId || governmentId.length < 10) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.http
      .get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers/history?governmentId=${encodeURIComponent(governmentId)}`)
      .subscribe({
        next: (resp) => {
          this.loading.set(false);
          if (resp.teachers.length > 0) {
            const existing = resp.teachers[0];
            this.selectedTeacherId.set(null); // create new in current institute, keep history reference
            this.isReadonly.set(true);
            this.form.patchValue({
              fullName: existing.fullName || '',
              designation: existing.designation || '',
              subjectSpecialization: existing.subjectSpecialization || '',
              qualification: existing.qualification || '',
              dob: existing.dob ? new Date(existing.dob) : null,
              appointmentDate: existing.appointmentDate ? new Date(existing.appointmentDate) : null,
              serviceStartDate: existing.serviceStartDate ? new Date(existing.serviceStartDate) : null,
              casteCategory: existing.casterCategory || '',
              teacherType: existing.teacherType || 'Regular',
              certifications: existing.certifications || '',
              certificates: existing.certificates || '',
              gender: existing.gender || 'Male',
              governmentId: existing.governmentId || governmentId,
              email: existing.email || '',
              mobile: existing.mobile || '',
              active: existing.active ?? true,
              leavingDate: existing.leavingDate ? new Date(existing.leavingDate) : null,
              leavingNote: existing.leavingNote || ''
            });
          } else {
            this.isReadonly.set(false);
            this.selectedTeacherId.set(null);
            // keep governmentId, reset others
            this.form.patchValue({
              fullName: '',
              designation: '',
              subjectSpecialization: '',
              qualification: '',
              dob: null,
              appointmentDate: null,
              serviceStartDate: null,
              casteCategory: '',
              teacherType: 'Regular',
              certifications: '',
              certificates: '',
              gender: 'Male',
              email: '',
              mobile: '',
              active: true,
              leavingDate: null,
              leavingNote: ''
            });
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Aadhar lookup failed');
        }
      });
  }

  onActiveChange(value: boolean) {
    if (value) {
      this.form.patchValue({ leavingDate: null, leavingNote: '' });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const payload: any = {
      ...this.form.value,
      dob: this.form.value.dob ? this.formatDate(this.form.value.dob) : undefined,
      appointmentDate: this.form.value.appointmentDate ? this.formatDate(this.form.value.appointmentDate) : undefined,
      serviceStartDate: this.form.value.serviceStartDate ? this.formatDate(this.form.value.serviceStartDate) : undefined,
      leavingDate: this.form.value.leavingDate ? this.formatDate(this.form.value.leavingDate) : undefined
    };

    if (payload.active === false) {
      if (!payload.leavingDate || !payload.leavingNote?.trim()) {
        this.loading.set(false);
        this.error.set('For inactive teachers, leaving date and leaving note are required.');
        return;
      }
    }

    const action$ = this.selectedTeacherId()
      ? this.http.put(`${API_BASE_URL}/institutes/me/teachers/${this.selectedTeacherId()}`, payload)
      : this.http.post(`${API_BASE_URL}/institutes/me/teachers`, payload);

    action$.subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedTeacherId.set(null);
        this.form.reset({
          fullName: '',
          designation: '',
          subjectSpecialization: '',
          qualification: '',
          casteCategory: '',
          certifications: '',
          certificates: '',
          teacherType: 'Regular',
          leavingNote: '',
          dob: null,
          appointmentDate: null,
          serviceStartDate: null,
          leavingDate: null,
          gender: 'Male',
          governmentId: '',
          email: '',
          mobile: '',
          active: true
        });
        this.load();
      },
      error: (e) => { this.loading.set(false); this.error.set(e?.error?.error ? JSON.stringify(e.error) : 'Save failed'); }
    });
  }

  onTeacherCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    if (!action) return;

    const teacher = event.data;
    if (!teacher) return;

    if (action === 'view') {
      this.viewingTeacher.set(teacher);
      return;
    }

    if (action === 'edit') {
      this.selectedTeacherId.set(teacher.id);
      this.form.patchValue({
        fullName: teacher.fullName ?? '',
        designation: teacher.designation ?? '',
        subjectSpecialization: teacher.subjectSpecialization ?? '',
        qualification: teacher.qualification ?? '',
        casteCategory: teacher.casterCategory ?? '',
        certifications: teacher.certifications ?? '',
        certificates: teacher.certificates ?? '',
        teacherType: teacher.teacherType ?? 'Regular',
        serviceStartDate: teacher.serviceStartDate ? new Date(teacher.serviceStartDate) : null,
        leavingDate: teacher.leavingDate ? new Date(teacher.leavingDate) : null,
        leavingNote: teacher.leavingNote ?? '',
        dob: teacher.dob ? new Date(teacher.dob) : null,
        appointmentDate: teacher.appointmentDate ? new Date(teacher.appointmentDate) : null,
        gender: teacher.gender ?? 'Male',
        governmentId: teacher.governmentId ?? '',
        email: teacher.email ?? '',
        mobile: teacher.mobile ?? '',
        active: teacher.active ?? true
      });
      return;
    }

    if (action === 'toggle') {
      this.http.patch(`${API_BASE_URL}/institutes/me/teachers/${teacher.id}/status`, { active: !teacher.active }).subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to update status')
      });
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete this teacher?')) return;
      this.http.delete(`${API_BASE_URL}/institutes/me/teachers/${teacher.id}`).subscribe({ next: () => this.load(), error: () => this.error.set('Delete failed') });
      return;
    }
  }

  viewTeacher(t: any) {
    this.viewingTeacher.set(t);
  }

  closeView() {
    this.viewingTeacher.set(null);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
