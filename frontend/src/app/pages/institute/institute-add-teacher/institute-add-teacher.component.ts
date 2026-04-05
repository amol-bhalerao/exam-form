import { Component, OnInit, signal, computed } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'EWS', 'Other'];
const TEACHER_TYPE_OPTIONS = ['Government', 'Contract', 'Adhoc', 'Temporary'];
const MAHARASHTRA_TEACHER_RETIREMENT_AGE = 60;

@Component({
  selector: 'app-institute-add-teacher',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatCardModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule, AgGridModule, NgIf, NgFor],
  template: `
    <mat-card class="card">
      <div class="h">Teachers & Staff</div>
      <p class="p">Register staff using Aadhar first, reuse prior institute details when available, and manage records from the grid below.</p>

      <form [formGroup]="form" (ngSubmit)="save()" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Aadhar Number</mat-label>
          <input matInput formControlName="governmentId" maxlength="20" inputmode="numeric" (input)="normalizeGovernmentId()" (blur)="onAadharLookup()" />
        </mat-form-field>

        <div class="inline-action">
          <button mat-stroked-button color="primary" type="button" (click)="onAadharLookup()">Lookup Aadhar</button>
        </div>

        <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="fullName" [readonly]="isReadonly()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Designation</mat-label><input matInput formControlName="designation" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Subject Specialization</mat-label><input matInput formControlName="subjectSpecialization" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Qualification</mat-label><input matInput formControlName="qualification" [readonly]="isReadonly()" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Date of Birth</mat-label><input matInput [matDatepicker]="dobPicker" formControlName="dob" [readonly]="isReadonly()" /><mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle><mat-datepicker #dobPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Retirement Date</mat-label><input matInput [value]="retirementDateDisplay()" readonly /><mat-hint>Last day of retirement month at age {{ maharashtraRetirementAge }}</mat-hint></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Date of Joining</mat-label><input matInput [matDatepicker]="dojPicker" formControlName="appointmentDate" /><mat-datepicker-toggle matSuffix [for]="dojPicker"></mat-datepicker-toggle><mat-datepicker #dojPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Service Start Date</mat-label><input matInput [matDatepicker]="serviceStartPicker" formControlName="serviceStartDate" /><mat-datepicker-toggle matSuffix [for]="serviceStartPicker"></mat-datepicker-toggle><mat-datepicker #serviceStartPicker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Total Experience</mat-label><input matInput [value]="experience()" readonly /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Teacher Type</mat-label><mat-select formControlName="teacherType"><mat-option *ngFor="let type of teacherTypeOptions" [value]="type">{{ type }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Caste Category</mat-label><mat-select formControlName="casteCategory"><mat-option value="">Not specified</mat-option><mat-option *ngFor="let caste of casteOptions" [value]="caste">{{ caste }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender" [disabled]="isReadonly()"><mat-option value="Male">Male</mat-option><mat-option value="Female">Female</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput formControlName="mobile" maxlength="10" inputmode="numeric" (input)="normalizeMobile()" /></mat-form-field>
        <mat-form-field appearance="outline" class="span-2"><mat-label>Certificate Details</mat-label><input matInput formControlName="certificates" placeholder="B.Ed, TET, MSCIT etc." /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="active"><mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option></mat-select></mat-form-field>

        <div class="form-actions span-2">
          <button mat-flat-button color="primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving…' : selectedTeacherId() ? 'Update Teacher' : 'Add Teacher' }}</button>
          <button mat-stroked-button type="button" *ngIf="selectedTeacherId()" (click)="resetForm()">Cancel Edit</button>
        </div>
      </form>

      <div class="history-box" *ngIf="historyTeachers().length > 0">
        <div class="history-title">Previous institute history found for this Aadhar</div>
        <div class="history-item" *ngFor="let item of historyTeachers()">
          <strong>{{ item.institute?.name || 'Unknown Institute' }}</strong>
          <span> · {{ item.institute?.district || '-' }}</span>
          <span> · {{ item.serviceStartDate ? (item.serviceStartDate | date:'dd-MM-yyyy') : 'Start not set' }}</span>
          <span> → {{ item.leavingDate ? (item.leavingDate | date:'dd-MM-yyyy') : 'Present' }}</span>
        </div>
      </div>

      <div class="error" *ngIf="error()">{{ error() }}</div>

      <mat-form-field appearance="outline" class="search">
        <mat-label>Search teachers</mat-label>
        <input matInput [value]="searchText()" (input)="searchText.set($any($event.target).value)" placeholder="name, email, subject, college" />
      </mat-form-field>

      <div class="ag-theme-alpine table-box">
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
        <div class="modal-header">
          <h3>Teacher details</h3>
          <button mat-icon-button (click)="closeView()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="modal-content">
          <div><strong>Name:</strong> {{ viewingTeacher()?.fullName }}</div>
          <div><strong>Designation:</strong> {{ viewingTeacher()?.designation }}</div>
          <div><strong>Subject:</strong> {{ viewingTeacher()?.subjectSpecialization }}</div>
          <div><strong>DOB:</strong> {{ viewingTeacher()?.dob | date:'dd-MM-yyyy' }}</div>
          <div><strong>Retirement Date:</strong> {{ viewingTeacher()?.retirementDate | date:'dd-MM-yyyy' }}</div>
          <div><strong>Experience:</strong> {{ viewingTeacher()?.totalYearsService || 0 }} years</div>
          <div><strong>Teacher Type:</strong> {{ viewingTeacher()?.teacherType }}</div>
          <div><strong>Caste Category:</strong> {{ viewingTeacher()?.casteCategory }}</div>
          <div><strong>Aadhar:</strong> {{ viewingTeacher()?.governmentId }}</div>
          <div><strong>Email:</strong> {{ viewingTeacher()?.email }}</div>
          <div><strong>Mobile:</strong> {{ viewingTeacher()?.mobile }}</div>
          <div><strong>Institute:</strong> {{ viewingTeacher()?.institute?.name }}</div>
          <div><strong>College Address:</strong> {{ viewingTeacher()?.institute?.fullAddress || viewingTeacher()?.institute?.address || '-' }}</div>
          <div><strong>Status:</strong> {{ viewingTeacher()?.active ? 'Active' : 'Inactive' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { margin-bottom: 14px; padding: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 12px; }
    .h { font-weight: 800; }
    .p { color: #6b7280; margin-top: 4px; line-height: 1.45; }
    .inline-action { display: flex; align-items: center; }
    .span-2 { grid-column: span 2; }
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .history-box { background: #f8fafc; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px; margin: 8px 0 14px; }
    .history-title { font-weight: 700; color: #1d4ed8; margin-bottom: 6px; }
    .history-item { color: #334155; margin-bottom: 4px; }
    .error { color: #b91c1c; margin-top: 8px; }
    .search { width: min(360px, 100%); }
    .table-box { width: 100%; height: 380px; margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; width: min(680px, calc(100vw - 24px)); max-height: 80vh; overflow: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .modal-content { display: grid; gap: 8px; padding: 16px; }
    @media (max-width: 768px) {
      .span-2 { grid-column: span 1; }
      .form-actions { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class InstituteAddTeacherComponent implements OnInit {
  readonly form = new FormGroup({
    governmentId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{8,20}$/)] }),
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    designation: new FormControl('', { nonNullable: true }),
    subjectSpecialization: new FormControl('', { nonNullable: true }),
    qualification: new FormControl('', { nonNullable: true }),
    dob: new FormControl<Date | null>(null),
    appointmentDate: new FormControl<Date | null>(null),
    serviceStartDate: new FormControl<Date | null>(null),
    gender: new FormControl('Male', { nonNullable: true }),
    teacherType: new FormControl('Government', { nonNullable: true }),
    casteCategory: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,10}$/)] }),
    certificates: new FormControl('', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true })
  });

  readonly teachers = signal<any[]>([]);
  readonly historyTeachers = signal<any[]>([]);
  readonly searchText = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewingTeacher = signal<any | null>(null);
  readonly selectedTeacherId = signal<number | null>(null);
  readonly isReadonly = signal(false);
  readonly casteOptions = CASTE_OPTIONS;
  readonly teacherTypeOptions = TEACHER_TYPE_OPTIONS;
  readonly maharashtraRetirementAge = MAHARASHTRA_TEACHER_RETIREMENT_AGE;
  readonly experience = signal('');
  readonly retirementDateDisplay = signal('');

  readonly filteredTeachers = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    if (!q) return this.teachers();
    return this.teachers().filter((teacher) =>
      [
        teacher.fullName,
        teacher.email,
        teacher.mobile,
        teacher.subjectSpecialization,
        teacher.designation,
        teacher.institute?.name,
        teacher.institute?.district
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  private calculateExperienceDisplay(serviceStartDate: Date | string | null | undefined): string {
    if (!serviceStartDate) return '';
    const date = new Date(serviceStartDate);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return '0 years 0 months';

    const totalMonths = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
  }

  private calculateMaharashtraRetirementDate(dob: Date | string | null | undefined): Date | null {
    if (!dob) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;

    return new Date(date.getFullYear() + MAHARASHTRA_TEACHER_RETIREMENT_AGE, date.getMonth() + 1, 0);
  }

  private refreshDerivedValues() {
    const serviceStartDate = this.form.controls.serviceStartDate.value;
    const dob = this.form.controls.dob.value;
    this.experience.set(this.calculateExperienceDisplay(serviceStartDate));

    const retirementDate = this.calculateMaharashtraRetirementDate(dob);
    this.retirementDateDisplay.set(
      retirementDate
        ? `${retirementDate.toLocaleDateString('en-GB')} (Age ${MAHARASHTRA_TEACHER_RETIREMENT_AGE})`
        : ''
    );
  }

  readonly columnDefs: ColDef[] = [
    { field: 'fullName', headerName: 'Name', flex: 1.5 },
    { field: 'governmentId', headerName: 'Aadhar', flex: 1 },
    { field: 'designation', headerName: 'Designation', flex: 1 },
    { field: 'subjectSpecialization', headerName: 'Subject', flex: 1 },
    { field: 'teacherType', headerName: 'Type', flex: 1 },
    { field: 'casteCategory', headerName: 'Caste Category', flex: 1 },
    {
      field: 'totalYearsService',
      headerName: 'Experience',
      valueGetter: (params: any) => params.data?.totalYearsService !== null && params.data?.totalYearsService !== undefined ? `${params.data.totalYearsService} years` : '-',
      flex: 1
    },
    {
      field: 'retirementDate',
      headerName: 'Retirement Date',
      valueGetter: (params: any) => params.data?.retirementDate ? new Date(params.data.retirementDate).toLocaleDateString('en-GB') : '-',
      flex: 1
    },
    { headerName: 'College', valueGetter: (params: any) => params.data?.institute?.name ?? '-', flex: 1.4 },
    { headerName: 'District', valueGetter: (params: any) => params.data?.institute?.district ?? '-', flex: 1 },
    { field: 'mobile', headerName: 'Mobile', flex: 1 },
    {
      field: 'active',
      headerName: 'Status',
      valueGetter: (params: any) => (params.data?.active ? 'Active' : 'Inactive'),
      flex: 0.9
    },
    {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 210,
      flex: 1.2,
      cellRenderer: () => `
        <div style="display:flex;gap:4px;align-items:center;justify-content:flex-start;">
          <button data-action="view" style="border:none;background:#eef2ff;color:#1d4ed8;padding:3px 6px;border-radius:4px;">View</button>
          <button data-action="edit" style="border:none;background:#e0f2fe;color:#0369a1;padding:3px 6px;border-radius:4px;">Edit</button>
          <button data-action="toggle" style="border:none;background:#fef3c7;color:#92400e;padding:3px 6px;border-radius:4px;">Toggle</button>
          <button data-action="delete" style="border:none;background:#fee2e2;color:#b91c1c;padding:3px 6px;border-radius:4px;">Delete</button>
        </div>`
    }
  ];

  readonly defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 };

  constructor(private readonly http: HttpClient, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    this.form.controls.dob.valueChanges.subscribe(() => this.refreshDerivedValues());
    this.form.controls.serviceStartDate.valueChanges.subscribe(() => this.refreshDerivedValues());
    this.refreshDerivedValues();
    this.load();
  }

  load() {
    this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers`).subscribe({
      next: (response) => this.teachers.set(response.teachers || []),
      error: (err) => this.setError(err, 'Unable to load teachers')
    });
  }

  normalizeGovernmentId() {
    const value = (this.form.controls.governmentId.value || '').replace(/\D/g, '').slice(0, 20);
    this.form.controls.governmentId.setValue(value, { emitEvent: false });
  }

  normalizeMobile() {
    const value = (this.form.controls.mobile.value || '').replace(/\D/g, '').slice(0, 10);
    this.form.controls.mobile.setValue(value, { emitEvent: false });
  }

  onAadharLookup() {
    const governmentId = this.form.controls.governmentId.value.trim();
    if (!governmentId || governmentId.length < 8) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers/history?governmentId=${encodeURIComponent(governmentId)}`).subscribe({
      next: (response) => {
        this.loading.set(false);
        const history = response.teachers || [];
        this.historyTeachers.set(history);

        if (history.length === 0) {
          this.isReadonly.set(false);
          return;
        }

        const existing = history[0];
        this.isReadonly.set(true);
        this.form.patchValue({
          governmentId: existing.governmentId || governmentId,
          fullName: existing.fullName || '',
          designation: existing.designation || '',
          subjectSpecialization: existing.subjectSpecialization || '',
          qualification: existing.qualification || '',
          dob: existing.dob ? new Date(existing.dob) : null,
          appointmentDate: existing.appointmentDate ? new Date(existing.appointmentDate) : null,
          serviceStartDate: existing.serviceStartDate ? new Date(existing.serviceStartDate) : null,
          gender: existing.gender || 'Male',
          teacherType: existing.teacherType || 'Government',
          casteCategory: existing.casteCategory || existing.casterCategory || '',
          email: existing.email || '',
          mobile: existing.mobile || '',
          certificates: existing.certificates || '',
          active: true
        });
        this.snackBar.open('Previous institute history loaded', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.historyTeachers.set([]);
        this.setError(err, 'Aadhar lookup failed');
      }
    });
  }

  save() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const payload: any = {
      fullName: this.form.value.fullName,
      designation: this.form.value.designation,
      subjectSpecialization: this.form.value.subjectSpecialization,
      qualification: this.form.value.qualification,
      dob: this.form.value.dob ? this.formatDate(this.form.value.dob) : undefined,
      appointmentDate: this.form.value.appointmentDate ? this.formatDate(this.form.value.appointmentDate) : undefined,
      serviceStartDate: this.form.value.serviceStartDate ? this.formatDate(this.form.value.serviceStartDate) : undefined,
      gender: this.form.value.gender,
      governmentId: this.form.value.governmentId,
      casteCategory: this.form.value.casteCategory || undefined,
      teacherType: this.form.value.teacherType,
      email: this.form.value.email || undefined,
      mobile: this.form.value.mobile || undefined,
      certificates: this.form.value.certificates || undefined,
      certifications: this.form.value.certificates || undefined,
      active: this.form.value.active
    };

    const request$ = this.selectedTeacherId()
      ? this.http.put(`${API_BASE_URL}/institutes/me/teachers/${this.selectedTeacherId()}`, payload)
      : this.http.post(`${API_BASE_URL}/institutes/me/teachers`, payload);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open(this.selectedTeacherId() ? 'Teacher updated' : 'Teacher added', 'Close', { duration: 2000 });
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.setError(err, 'Save failed');
      }
    });
  }

  resetForm() {
    this.selectedTeacherId.set(null);
    this.isReadonly.set(false);
    this.historyTeachers.set([]);
    this.form.reset({
      governmentId: '',
      fullName: '',
      designation: '',
      subjectSpecialization: '',
      qualification: '',
      dob: null,
      appointmentDate: null,
      serviceStartDate: null,
      gender: 'Male',
      teacherType: 'Government',
      casteCategory: '',
      email: '',
      mobile: '',
      certificates: '',
      active: true
    });
  }

  onTeacherCellClicked(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const teacher = event.data;
    if (!action || !teacher) return;

    if (action === 'view') {
      this.viewingTeacher.set(teacher);
      return;
    }

    if (action === 'edit') {
      this.selectedTeacherId.set(teacher.id);
      this.isReadonly.set(false);
      this.historyTeachers.set([]);
      this.form.patchValue({
        governmentId: teacher.governmentId ?? '',
        fullName: teacher.fullName ?? '',
        designation: teacher.designation ?? '',
        subjectSpecialization: teacher.subjectSpecialization ?? '',
        qualification: teacher.qualification ?? '',
        dob: teacher.dob ? new Date(teacher.dob) : null,
        appointmentDate: teacher.appointmentDate ? new Date(teacher.appointmentDate) : null,
        serviceStartDate: teacher.serviceStartDate ? new Date(teacher.serviceStartDate) : null,
        gender: teacher.gender ?? 'Male',
        teacherType: teacher.teacherType ?? 'Government',
        casteCategory: teacher.casteCategory ?? teacher.casterCategory ?? '',
        email: teacher.email ?? '',
        mobile: teacher.mobile ?? '',
        certificates: teacher.certificates ?? '',
        active: teacher.active ?? true
      });
      return;
    }

    if (action === 'toggle') {
      this.http.patch(`${API_BASE_URL}/institutes/me/teachers/${teacher.id}/status`, { active: !teacher.active }).subscribe({
        next: () => {
          this.snackBar.open('Teacher status updated', 'Close', { duration: 2000 });
          this.load();
        },
        error: (err) => this.setError(err, 'Unable to update status')
      });
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${teacher.fullName}?`)) return;
      this.http.delete(`${API_BASE_URL}/institutes/me/teachers/${teacher.id}`).subscribe({
        next: () => {
          this.snackBar.open('Teacher deleted', 'Close', { duration: 2000 });
          this.load();
        },
        error: (err) => this.setError(err, 'Delete failed')
      });
    }
  }

  closeView() {
    this.viewingTeacher.set(null);
  }

  private setError(err: any, fallback: string) {
    const message = err?.error?.message || err?.error?.issues?.[0]?.message || err?.error?.error || fallback;
    this.error.set(message);
    this.snackBar.open(message, 'Close', { duration: 3500 });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

