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
import { MatTabsModule } from '@angular/material/tabs';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { API_BASE_URL } from '../../../core/api';

const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'EWS', 'Other'];
const TEACHER_TYPE_OPTIONS = ['Aided', 'Partially Aided 80', 'Partially Aided 60', 'Partially Aided 40', 'Partially Aided 20', 'Unaided', 'Permanent Unaided', 'Self Financed'];
const MAHARASHTRA_TEACHER_RETIREMENT_AGE = 60;

@Component({
  selector: 'app-institute-add-teacher',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatCardModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatTabsModule, AgGridModule, NgIf, NgFor],
  template: `
    <mat-card class="card">
      <div class="h">Teachers & Staff</div>
      <p class="p">Register staff using Aadhar first, reuse prior institute details when available, and capture examiner / moderator details for the board panel.</p>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-tab-group class="teacher-tabs" animationDuration="0ms" [selectedIndex]="activeTab()" (selectedIndexChange)="activeTab.set($event)">
          <mat-tab label="1. Identity">
            <div class="grid tab-content">
              <mat-form-field appearance="outline">
                <mat-label>Aadhar Number</mat-label>
                <input matInput formControlName="governmentId" maxlength="20" inputmode="numeric" (input)="normalizeGovernmentId()" (blur)="onAadharLookup()" />
              </mat-form-field>

              <div class="inline-action">
                <button mat-stroked-button color="primary" type="button" (click)="onAadharLookup()">Lookup Aadhar</button>
              </div>

              <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="fullName" [readonly]="isReadonly()" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Date of Birth</mat-label><input matInput [matDatepicker]="dobPicker" formControlName="dob" [readonly]="isReadonly()" /><mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle><mat-datepicker #dobPicker></mat-datepicker></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender" [disabled]="isReadonly()"><mat-option value="Male">Male</mat-option><mat-option value="Female">Female</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Qualification</mat-label><input matInput formControlName="qualification" [readonly]="isReadonly()" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Caste Category</mat-label><mat-select formControlName="casteCategory"><mat-option value="">Not specified</mat-option><mat-option *ngFor="let caste of casteOptions" [value]="caste">{{ caste }}</mat-option></mat-select></mat-form-field>
            </div>
          </mat-tab>

          <mat-tab label="2. Service & Contact">
            <div class="grid tab-content">
              <mat-form-field appearance="outline"><mat-label>Designation</mat-label><input matInput formControlName="designation" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Subject Specialization</mat-label><input matInput formControlName="subjectSpecialization" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Teacher Type</mat-label><mat-select formControlName="teacherType"><mat-option *ngFor="let type of teacherTypeOptions" [value]="type">{{ type }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Joining Date of this institute</mat-label><input matInput [matDatepicker]="dojPicker" formControlName="appointmentDate" /><mat-datepicker-toggle matSuffix [for]="dojPicker"></mat-datepicker-toggle><mat-datepicker #dojPicker></mat-datepicker></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Service Start Date</mat-label><input matInput [matDatepicker]="serviceStartPicker" formControlName="serviceStartDate" /><mat-datepicker-toggle matSuffix [for]="serviceStartPicker"></mat-datepicker-toggle><mat-datepicker #serviceStartPicker></mat-datepicker></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput formControlName="mobile" maxlength="10" inputmode="numeric" (input)="normalizeMobile()" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="active"><mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline" class="span-2"><mat-label>Certificate Details</mat-label><input matInput formControlName="certificates" placeholder="B.Ed, TET, MSCIT etc." /></mat-form-field>
            </div>
          </mat-tab>

          <mat-tab label="3. Board Duty">
            <div class="grid tab-content">
              <mat-form-field appearance="outline"><mat-label>Examiner experience (years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="examinerExperienceYears" /><mat-hint>Enter 0 if no examiner experience</mat-hint></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="hasExaminerExperience()"><mat-label>Previous Examiner Appointment No.</mat-label><input matInput formControlName="previousExaminerAppointmentNo" /></mat-form-field>

              <mat-form-field appearance="outline"><mat-label>Moderator experience (years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="moderatorExperienceYears" /><mat-hint>Enter 0 if no moderator experience</mat-hint></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="hasModeratorExperience()"><mat-label>Last Exam Moderator Name</mat-label><input matInput formControlName="lastModeratorName" /></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="hasModeratorExperience()"><mat-label>Last Moderator Appointment No.</mat-label><input matInput formControlName="lastModeratorAppointmentNo" /></mat-form-field>
              <mat-form-field appearance="outline" class="span-2" *ngIf="hasModeratorExperience()"><mat-label>Last Moderator College Name</mat-label><input matInput formControlName="lastModeratorCollegeName" /></mat-form-field>

              <mat-form-field appearance="outline"><mat-label>Chief Moderator experience (years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="chiefModeratorExperienceYears" /><mat-hint>Optional board panel history</mat-hint></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator Name</mat-label><input matInput formControlName="lastChiefModeratorName" /></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator Appointment No.</mat-label><input matInput formControlName="lastChiefModeratorAppointmentNo" /></mat-form-field>
              <mat-form-field appearance="outline" class="span-2" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator College Name</mat-label><input matInput formControlName="lastChiefModeratorCollegeName" /></mat-form-field>
            </div>
          </mat-tab>
        </mat-tab-group>

        <div class="calc-grid">
          <div class="calc-tile">
            <div class="calc-label">Total Experience</div>
            <div class="calc-value">{{ experience() || 'Will auto-calculate after service start date' }}</div>
          </div>
          <div class="calc-tile">
            <div class="calc-label">Retirement Date</div>
            <div class="calc-value">{{ retirementDateDisplay() || ('Auto-set at age ' + maharashtraRetirementAge) }}</div>
          </div>
          <div class="calc-tile">
            <div class="calc-label">Senior Pay Grade</div>
            <div class="calc-value">{{ seniorPayGradeStatus() }}</div>
          </div>
          <div class="calc-tile">
            <div class="calc-label">Selection Pay Grade</div>
            <div class="calc-value">{{ selectionPayGradeStatus() }}</div>
          </div>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" *ngIf="activeTab() > 0" (click)="prevStep()">Back</button>
          <span class="action-spacer"></span>
          <button mat-stroked-button color="primary" type="button" *ngIf="activeTab() < 2" (click)="nextStep()">Next</button>
          <button mat-flat-button color="primary" type="submit" *ngIf="activeTab() >= 1" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving…' : selectedTeacherId() ? 'Update Teacher' : 'Save Teacher' }}</button>
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
          <div><strong>Examiner Details:</strong> {{ viewingTeacher()?.examinerExperienceYears ? (viewingTeacher()?.examinerExperienceYears + ' years • Appointment No: ' + (viewingTeacher()?.previousExaminerAppointmentNo || 'Not added')) : 'No examiner experience added' }}</div>
          <div><strong>Moderator Details:</strong> {{ viewingTeacher()?.moderatorExperienceYears ? (viewingTeacher()?.moderatorExperienceYears + ' years • ' + (viewingTeacher()?.lastModeratorName || 'Name not added') + ' • ' + (viewingTeacher()?.lastModeratorAppointmentNo || 'Appointment no not added')) : 'No moderator experience added' }}</div>
          <div><strong>Chief Moderator Details:</strong> {{ viewingTeacher()?.chiefModeratorExperienceYears ? (viewingTeacher()?.chiefModeratorExperienceYears + ' years • ' + (viewingTeacher()?.lastChiefModeratorName || 'Name not added') + ' • ' + (viewingTeacher()?.lastChiefModeratorAppointmentNo || 'Appointment no not added')) : 'No chief moderator experience added' }}</div>
          <div><strong>Senior Pay Grade Training:</strong> {{ viewingTeacher()?.seniorPayGradeEligible ? 'Eligible' : 'Not yet eligible' }}</div>
          <div><strong>Selection Pay Grade Training:</strong> {{ viewingTeacher()?.selectionPayGradeEligible ? 'Eligible' : 'Not yet eligible' }}</div>
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
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .tab-content { padding: 20px 4px 12px; margin-bottom: 10px; }
    .h { font-weight: 800; }
    .p { color: #6b7280; margin-top: 4px; line-height: 1.45; }
    .teacher-tabs { margin-top: 12px; }
    .teacher-tabs :where(.mat-mdc-tab-body-content) { padding-top: 6px; }
    .inline-action { display: flex; align-items: center; min-height: 56px; }
    .span-2 { grid-column: span 2; }
    .calc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 14px 0; }
    .calc-tile { border: 1px solid #dbeafe; border-radius: 10px; padding: 10px 12px; background: #f8fbff; }
    .calc-label { font-size: 12px; color: #1d4ed8; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .02em; }
    .calc-value { color: #0f172a; font-weight: 600; line-height: 1.4; }
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
    .action-spacer { flex: 1 1 auto; }
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
    teacherType: new FormControl(TEACHER_TYPE_OPTIONS[0], { nonNullable: true }),
    casteCategory: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    mobile: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{0,10}$/)] }),
    certificates: new FormControl('', { nonNullable: true }),
    examinerExperienceYears: new FormControl<number | string>(0, { nonNullable: true }),
    previousExaminerAppointmentNo: new FormControl('', { nonNullable: true }),
    moderatorExperienceYears: new FormControl<number | string>(0, { nonNullable: true }),
    lastModeratorName: new FormControl('', { nonNullable: true }),
    lastModeratorAppointmentNo: new FormControl('', { nonNullable: true }),
    lastModeratorCollegeName: new FormControl('', { nonNullable: true }),
    chiefModeratorExperienceYears: new FormControl<number | string>(0, { nonNullable: true }),
    lastChiefModeratorName: new FormControl('', { nonNullable: true }),
    lastChiefModeratorAppointmentNo: new FormControl('', { nonNullable: true }),
    lastChiefModeratorCollegeName: new FormControl('', { nonNullable: true }),
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
  readonly seniorPayGradeStatus = signal('Need service start date');
  readonly selectionPayGradeStatus = signal('Need service start date');
  readonly activeTab = signal(0);

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

  hasExaminerExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.examinerExperienceYears.value) ?? 0) > 0;
  }

  hasModeratorExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.moderatorExperienceYears.value) ?? 0) > 0;
  }

  hasChiefModeratorExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.chiefModeratorExperienceYears.value) ?? 0) > 0;
  }

  nextStep() {
    this.activeTab.update((current) => Math.min(current + 1, 2));
  }

  prevStep() {
    this.activeTab.update((current) => Math.max(current - 1, 0));
  }

  private calculateExperienceYears(serviceStartDate: Date | string | null | undefined): number | null {
    if (!serviceStartDate) return null;
    const date = new Date(serviceStartDate);
    if (Number.isNaN(date.getTime())) return null;

    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return 0;

    return Number((diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
  }

  private calculateExperienceDisplay(serviceStartDate: Date | string | null | undefined): string {
    const numericYears = this.calculateExperienceYears(serviceStartDate);
    if (numericYears === null) return '';

    const years = Math.floor(numericYears);
    const months = Math.max(0, Math.round((numericYears - years) * 12));
    return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
  }

  private calculateMaharashtraRetirementDate(dob: Date | string | null | undefined): Date | null {
    if (!dob) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;

    return new Date(date.getFullYear() + MAHARASHTRA_TEACHER_RETIREMENT_AGE, date.getMonth() + 1, 0);
  }

  private refreshBoardDutyVisibility() {
    if (!this.hasExaminerExperience()) {
      this.form.controls.previousExaminerAppointmentNo.setValue('', { emitEvent: false });
    }

    if (!this.hasModeratorExperience()) {
      this.form.patchValue({
        lastModeratorName: '',
        lastModeratorAppointmentNo: '',
        lastModeratorCollegeName: ''
      }, { emitEvent: false });
    }

    if (!this.hasChiefModeratorExperience()) {
      this.form.patchValue({
        lastChiefModeratorName: '',
        lastChiefModeratorAppointmentNo: '',
        lastChiefModeratorCollegeName: ''
      }, { emitEvent: false });
    }
  }

  private refreshDerivedValues() {
    const serviceStartDate = this.form.controls.serviceStartDate.value;
    const dob = this.form.controls.dob.value;
    const totalYears = this.calculateExperienceYears(serviceStartDate);

    this.experience.set(this.calculateExperienceDisplay(serviceStartDate));
    this.seniorPayGradeStatus.set(
      totalYears === null ? 'Need service start date' : totalYears >= 12 ? `Eligible (${totalYears} years)` : `Not yet eligible (${totalYears} years)`
    );
    this.selectionPayGradeStatus.set(
      totalYears === null ? 'Need service start date' : totalYears >= 24 ? `Eligible (${totalYears} years)` : `Not yet eligible (${totalYears} years)`
    );

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
    { field: 'teacherType', headerName: 'Management Type', flex: 1.2 },
    {
      field: 'totalYearsService',
      headerName: 'Experience',
      valueGetter: (params: any) => params.data?.totalYearsService !== null && params.data?.totalYearsService !== undefined ? `${params.data.totalYearsService} years` : '-',
      flex: 1
    },
    {
      field: 'examinerExperienceYears',
      headerName: 'Examiner',
      valueGetter: (params: any) => params.data?.examinerExperienceYears ? `${params.data.examinerExperienceYears} yrs` : 'No',
      flex: 1
    },
    {
      field: 'moderatorExperienceYears',
      headerName: 'Moderator',
      valueGetter: (params: any) => params.data?.moderatorExperienceYears ? `${params.data.moderatorExperienceYears} yrs` : 'No',
      flex: 1
    },
    {
      field: 'retirementDate',
      headerName: 'Retirement Date',
      valueGetter: (params: any) => params.data?.retirementDate ? new Date(params.data.retirementDate).toLocaleDateString('en-GB') : '-',
      flex: 1
    },
    {
      field: 'seniorPayGradeEligible',
      headerName: 'Senior Grade',
      valueGetter: (params: any) => params.data?.seniorPayGradeEligible ? 'Eligible' : 'Pending',
      flex: 1
    },
    {
      field: 'selectionPayGradeEligible',
      headerName: 'Selection Grade',
      valueGetter: (params: any) => params.data?.selectionPayGradeEligible ? 'Eligible' : 'Pending',
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
    this.form.controls.examinerExperienceYears.valueChanges.subscribe(() => this.refreshBoardDutyVisibility());
    this.form.controls.moderatorExperienceYears.valueChanges.subscribe(() => this.refreshBoardDutyVisibility());
    this.form.controls.chiefModeratorExperienceYears.valueChanges.subscribe(() => this.refreshBoardDutyVisibility());
    this.refreshDerivedValues();
    this.refreshBoardDutyVisibility();
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
          teacherType: existing.teacherType || TEACHER_TYPE_OPTIONS[0],
          casteCategory: existing.casteCategory || existing.casterCategory || '',
          email: existing.email || '',
          mobile: existing.mobile || '',
          certificates: existing.certificates || '',
          examinerExperienceYears: existing.examinerExperienceYears ?? 0,
          previousExaminerAppointmentNo: existing.previousExaminerAppointmentNo || '',
          moderatorExperienceYears: existing.moderatorExperienceYears ?? 0,
          lastModeratorName: existing.lastModeratorName || '',
          lastModeratorAppointmentNo: existing.lastModeratorAppointmentNo || '',
          lastModeratorCollegeName: existing.lastModeratorCollegeName || '',
          chiefModeratorExperienceYears: existing.chiefModeratorExperienceYears ?? 0,
          lastChiefModeratorName: existing.lastChiefModeratorName || '',
          lastChiefModeratorAppointmentNo: existing.lastChiefModeratorAppointmentNo || '',
          lastChiefModeratorCollegeName: existing.lastChiefModeratorCollegeName || '',
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

    const examinerExperienceYears = this.toNumberOrUndefined(this.form.value.examinerExperienceYears);
    const moderatorExperienceYears = this.toNumberOrUndefined(this.form.value.moderatorExperienceYears);
    const chiefModeratorExperienceYears = this.toNumberOrUndefined(this.form.value.chiefModeratorExperienceYears);

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
      examinerExperienceYears,
      previousExaminerAppointmentNo: (examinerExperienceYears ?? 0) > 0 ? (this.form.value.previousExaminerAppointmentNo || undefined) : undefined,
      moderatorExperienceYears,
      lastModeratorName: (moderatorExperienceYears ?? 0) > 0 ? (this.form.value.lastModeratorName || undefined) : undefined,
      lastModeratorAppointmentNo: (moderatorExperienceYears ?? 0) > 0 ? (this.form.value.lastModeratorAppointmentNo || undefined) : undefined,
      lastModeratorCollegeName: (moderatorExperienceYears ?? 0) > 0 ? (this.form.value.lastModeratorCollegeName || undefined) : undefined,
      chiefModeratorExperienceYears,
      lastChiefModeratorName: (chiefModeratorExperienceYears ?? 0) > 0 ? (this.form.value.lastChiefModeratorName || undefined) : undefined,
      lastChiefModeratorAppointmentNo: (chiefModeratorExperienceYears ?? 0) > 0 ? (this.form.value.lastChiefModeratorAppointmentNo || undefined) : undefined,
      lastChiefModeratorCollegeName: (chiefModeratorExperienceYears ?? 0) > 0 ? (this.form.value.lastChiefModeratorCollegeName || undefined) : undefined,
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
    this.activeTab.set(0);
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
      teacherType: TEACHER_TYPE_OPTIONS[0],
      casteCategory: '',
      email: '',
      mobile: '',
      certificates: '',
      examinerExperienceYears: 0,
      previousExaminerAppointmentNo: '',
      moderatorExperienceYears: 0,
      lastModeratorName: '',
      lastModeratorAppointmentNo: '',
      lastModeratorCollegeName: '',
      chiefModeratorExperienceYears: 0,
      lastChiefModeratorName: '',
      lastChiefModeratorAppointmentNo: '',
      lastChiefModeratorCollegeName: '',
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
        teacherType: teacher.teacherType ?? TEACHER_TYPE_OPTIONS[0],
        casteCategory: teacher.casteCategory ?? teacher.casterCategory ?? '',
        email: teacher.email ?? '',
        mobile: teacher.mobile ?? '',
        certificates: teacher.certificates ?? '',
        examinerExperienceYears: teacher.examinerExperienceYears ?? 0,
        previousExaminerAppointmentNo: teacher.previousExaminerAppointmentNo ?? '',
        moderatorExperienceYears: teacher.moderatorExperienceYears ?? 0,
        lastModeratorName: teacher.lastModeratorName ?? '',
        lastModeratorAppointmentNo: teacher.lastModeratorAppointmentNo ?? '',
        lastModeratorCollegeName: teacher.lastModeratorCollegeName ?? '',
        chiefModeratorExperienceYears: teacher.chiefModeratorExperienceYears ?? 0,
        lastChiefModeratorName: teacher.lastChiefModeratorName ?? '',
        lastChiefModeratorAppointmentNo: teacher.lastChiefModeratorAppointmentNo ?? '',
        lastChiefModeratorCollegeName: teacher.lastChiefModeratorCollegeName ?? '',
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

  private toNumberOrUndefined(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

