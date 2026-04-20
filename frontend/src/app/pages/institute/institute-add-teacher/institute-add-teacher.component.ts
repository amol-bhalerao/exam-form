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

const CASTE_OPTIONS = [
  'OPEN',
  'SC',
  'ST',
  'VJ-A',
  'NT-B',
  'NT-C',
  'NT-D',
  'SBC',
  'OBC',
  'SEBC',
  'EWS',
  'MINORITY',
  'ORPHAN',
  'DIVYANG',
  'OTHER'
];
const TEACHER_TYPE_OPTIONS = ['Aided', 'Partially Aided 80', 'Partially Aided 60', 'Partially Aided 40', 'Partially Aided 20', 'Unaided', 'Permanent Unaided', 'Self Financed'];
const DESIGNATION_OPTIONS = ['Assistant Teacher', 'Teacher', 'Supervisor', 'Voice Principal', 'Principal'];
const MAHARASHTRA_TEACHER_RETIREMENT_AGE = 58;

@Component({
  selector: 'app-institute-add-teacher',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatCardModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule, AgGridModule, NgIf, NgFor],
  template: `
    <div class="page-wrap">
    <mat-card class="card">
      <div class="header-row">
        <div class="header-copy">
          <div class="h">Teachers & Staff</div>
          <p class="p">Track registered teachers and open the registration form only when required.</p>
        </div>
        <button class="header-cta" mat-flat-button color="primary" type="button" (click)="openFormModal()">Add Teacher / Staff</button>
      </div>

      <div class="teacher-summary-card" *ngIf="teachers().length > 0">
        <div class="summary-title">Teacher Summary</div>
        <div class="summary-layout">
          <div class="summary-block summary-block--highlight">
            <div class="summary-block-title">Duty Readiness</div>
            <div class="summary-role-grid">
              <div><span>Total Teachers</span><strong>{{ teachers().length }}</strong></div>
              <div><span>Examiners</span><strong>{{ examinerReadyCount() }}</strong></div>
              <div><span>Moderators</span><strong>{{ moderatorReadyCount() }}</strong></div>
              <div><span>Chief Moderators</span><strong>{{ chiefModeratorReadyCount() }}</strong></div>
            </div>
          </div>

          <div class="summary-block">
            <div class="summary-block-title">Subject Wise Teachers</div>
            <div class="summary-list" *ngIf="subjectWiseSummary().length > 0; else noSubjects">
              <div class="summary-row" *ngFor="let item of subjectWiseSummary()">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            </div>
            <ng-template #noSubjects>
              <div class="summary-empty">No subject data available.</div>
            </ng-template>
          </div>

          <div class="summary-block">
            <div class="summary-block-title">Designation Wise Count</div>
            <div class="summary-list" *ngIf="designationWiseSummary().length > 0; else noDesignations">
              <div class="summary-row" *ngFor="let item of designationWiseSummary()">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            </div>
            <ng-template #noDesignations>
              <div class="summary-empty">No designation data available.</div>
            </ng-template>
          </div>

          <div class="summary-block">
            <div class="summary-block-title">Teacher Type Wise Count</div>
            <div class="summary-list" *ngIf="teacherTypeWiseSummary().length > 0; else noTeacherTypes">
              <div class="summary-row" *ngFor="let item of teacherTypeWiseSummary()">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            </div>
            <ng-template #noTeacherTypes>
              <div class="summary-empty">No teacher type data available.</div>
            </ng-template>
          </div>
        </div>
      </div>

      <div class="error" *ngIf="error()">{{ error() }}</div>

      <mat-form-field appearance="outline" class="search">
        <mat-label>Search teachers</mat-label>
        <input matInput [value]="searchText()" (input)="searchText.set($any($event.target).value)" />
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

    <div class="app-modal-backdrop" *ngIf="isFormModalOpen()">
      <div class="modal form-modal app-modal-panel app-modal-panel--xl">
        <div class="modal-header">
          <h3>{{ selectedTeacherId() ? 'Update Teacher / Staff' : 'Register Teacher / Staff' }}</h3>
          <button mat-icon-button type="button" (click)="closeFormModal()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="form-modal-content">
          <form class="teacher-form" [formGroup]="form" (ngSubmit)="save()">
        <section class="form-section">
          <div class="section-title">1. Identity & Aadhaar Lookup</div>
          <div class="section-sub">Lookup uses existing teacher records across institutes; if no history is found, enter details manually and continue.</div>
          <div class="grid section-grid">
            <mat-form-field appearance="outline">
              <mat-label>Aadhaar Number</mat-label>
              <input matInput formControlName="governmentId" maxlength="12" inputmode="numeric" (input)="normalizeGovernmentId()" (blur)="onAadharLookup()" />
              <mat-hint>Enter 12 digits</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="fullName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Date of Birth</mat-label><input matInput [matDatepicker]="dobPicker" formControlName="dob" /><mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle><mat-datepicker #dobPicker></mat-datepicker></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Gender</mat-label><mat-select formControlName="gender"><mat-option value="Male">Male</mat-option><mat-option value="Female">Female</mat-option><mat-option value="Other">Other</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Qualification</mat-label><input matInput formControlName="qualification" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Caste Category (Maharashtra)</mat-label><mat-select formControlName="casteCategory"><mat-option value="">Not specified</mat-option><mat-option *ngFor="let caste of casteOptions" [value]="caste">{{ caste }}</mat-option></mat-select></mat-form-field>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">2. Service & Contact</div>
          <div class="grid section-grid">
            <mat-form-field appearance="outline">
              <mat-label>Designation</mat-label>
              <mat-select formControlName="designation">
                <mat-option value="">Not specified</mat-option>
                <mat-option *ngFor="let designation of designationOptions" [value]="designation">{{ designation }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Subject Specialization</mat-label>
              <mat-select formControlName="subjectSpecialization" multiple>
                <mat-option *ngFor="let subject of availableSubjects()" [value]="subject">{{ subject }}</mat-option>
              </mat-select>
              <mat-hint>Select one or more subjects</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Teacher Type</mat-label><mat-select formControlName="teacherType"><mat-option *ngFor="let type of teacherTypeOptions" [value]="type">{{ type }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Joining Date of This Institute</mat-label><input matInput [matDatepicker]="dojPicker" formControlName="appointmentDate" /><mat-datepicker-toggle matSuffix [for]="dojPicker"></mat-datepicker-toggle><mat-datepicker #dojPicker></mat-datepicker></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Service Start Date</mat-label><input matInput [matDatepicker]="serviceStartPicker" formControlName="serviceStartDate" /><mat-datepicker-toggle matSuffix [for]="serviceStartPicker"></mat-datepicker-toggle><mat-datepicker #serviceStartPicker></mat-datepicker></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Mobile</mat-label><input matInput formControlName="mobile" maxlength="10" inputmode="numeric" (input)="normalizeMobile()" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="active"><mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline" class="span-2"><mat-label>Certificate Details</mat-label><input matInput formControlName="certificates" /></mat-form-field>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">3. Board Duty Experience</div>
          <div class="grid section-grid">
            <mat-form-field appearance="outline"><mat-label>Examiner Experience (Years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="examinerExperienceYears" /><mat-hint>{{ hasExaminerExperience() ? 'Examiner details are enabled below' : 'Set 0 if no examiner experience' }}</mat-hint></mat-form-field>
            <mat-form-field appearance="outline" *ngIf="hasExaminerExperience()"><mat-label>Previous Examiner Appointment No.</mat-label><input matInput formControlName="previousExaminerAppointmentNo" /></mat-form-field>

            <mat-form-field appearance="outline" *ngIf="showExaminerLinkedModeratorHistory()"><mat-label>Last Moderator Name</mat-label><input matInput formControlName="lastModeratorName" /></mat-form-field>
            <mat-form-field appearance="outline" *ngIf="showExaminerLinkedModeratorHistory()"><mat-label>Last Moderator Appointment No.</mat-label><input matInput formControlName="lastModeratorAppointmentNo" /></mat-form-field>
            <mat-form-field appearance="outline" class="span-2" *ngIf="showExaminerLinkedModeratorHistory()"><mat-label>Last Moderator College Name</mat-label><input matInput formControlName="lastModeratorCollegeName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Moderator Experience (Years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="moderatorExperienceYears" /><mat-hint>Track experience only; examiner-linked moderator history appears above</mat-hint></mat-form-field>

            <mat-form-field appearance="outline"><mat-label>Chief Moderator Experience (Years)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="chiefModeratorExperienceYears" /><mat-hint>{{ hasChiefModeratorExperience() ? 'Chief moderator details are required below' : 'Set 0 if no chief moderator experience' }}</mat-hint></mat-form-field>
            <mat-form-field appearance="outline" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator Name</mat-label><input matInput formControlName="lastChiefModeratorName" /></mat-form-field>
            <mat-form-field appearance="outline" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator Appointment No.</mat-label><input matInput formControlName="lastChiefModeratorAppointmentNo" /></mat-form-field>
            <mat-form-field appearance="outline" class="span-2" *ngIf="hasChiefModeratorExperience()"><mat-label>Last Chief Moderator College Name</mat-label><input matInput formControlName="lastChiefModeratorCollegeName" /></mat-form-field>
          </div>
        </section>

        <div class="derived-table">
          <table>
            <tbody>
              <tr>
                <th>Total Experience</th>
                <td>{{ experience() || 'Will auto-calculate after service start date' }}</td>
              </tr>
              <tr>
                <th>Retirement Date</th>
                <td>{{ retirementDateDisplay() || ('Auto-set at age ' + maharashtraRetirementAge) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-actions">
          <span class="action-spacer"></span>
          <button mat-stroked-button type="button" (click)="closeFormModal()">Close</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving…' : selectedTeacherId() ? 'Update Teacher' : 'Save Teacher' }}</button>
          <button mat-stroked-button type="button" *ngIf="selectedTeacherId()" (click)="resetForm()">Cancel Edit</button>
        </div>
          </form>

          <div class="history-box" *ngIf="historyTeachers().length > 0">
            <div class="history-title">Previous institute history found for this Aadhaar</div>
            <div class="history-item" *ngFor="let item of historyTeachers()">
              <strong>{{ item.institute?.name || 'Unknown Institute' }}</strong>
              <span> · {{ item.institute?.district || '-' }}</span>
              <span> · {{ item.serviceStartDate ? (item.serviceStartDate | date:'dd-MM-yyyy') : 'Start not set' }}</span>
              <span> → {{ item.leavingDate ? (item.leavingDate | date:'dd-MM-yyyy') : 'Present' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-modal-backdrop" *ngIf="viewingTeacher()">
      <div class="modal app-modal-panel app-modal-panel--md">
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
    </div>
  `,
  styles: [`
    .page-wrap { position: relative; min-height: calc(100vh - 130px); }
    .card { margin-bottom: 14px; margin-top: 10px; padding: 20px; border: 1px solid #dbe4f0; border-radius: 16px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }
    .header-row { display: grid; gap: 12px; }
    .header-copy { max-width: 860px; }
    .header-cta { justify-self: start; border-radius: 10px !important; font-weight: 700 !important; letter-spacing: 0.01em; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .section-grid { padding-top: 10px; }
    .form-section { border: 1px solid #dbe4f0; border-radius: 14px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); padding: 16px; margin: 0 0 16px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 8px 24px rgba(15, 23, 42, 0.05); }
    .section-title { font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 1rem; letter-spacing: 0.01em; }
    .section-sub { color: #64748b; font-size: 0.86rem; line-height: 1.4; }
    .h { font-weight: 800; font-size: 1.1rem; color: #0f172a; }
    .p { color: #6b7280; margin-top: 4px; line-height: 1.45; }
    .span-2 { grid-column: span 2; }
    .derived-table { margin: 8px 0 14px; border: 1px solid #bfdbfe; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(30, 64, 175, 0.08); }
    .derived-table table { width: 100%; border-collapse: collapse; }
    .derived-table th, .derived-table td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 0.9rem; }
    .derived-table th { width: 240px; background: #eff6ff; color: #1e3a8a; font-weight: 700; }
    .derived-table tr:last-child th, .derived-table tr:last-child td { border-bottom: 0; }
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 6px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
    .action-spacer { flex: 1 1 auto; }
    .history-box { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #dbeafe; border-radius: 10px; padding: 12px; margin: 8px 0 14px; }
    .history-title { font-weight: 700; color: #1d4ed8; margin-bottom: 6px; }
    .history-item { color: #334155; margin-bottom: 4px; }
    .error { color: #b91c1c; margin-top: 8px; }
    .search { width: min(360px, 100%); }
    .teacher-summary-card { margin-top: 12px; border: 1px solid #bfdbfe; border-radius: 14px; padding: 12px; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); box-shadow: 0 10px 24px rgba(30, 64, 175, 0.08); }
    .summary-title { font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .summary-layout { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .summary-block { border: 1px solid #dbe4f0; border-radius: 10px; background: #fff; padding: 10px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05); }
    .summary-block--highlight { background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%); }
    .summary-block-title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; font-weight: 800; margin-bottom: 8px; }
    .summary-role-grid { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .summary-role-grid div { border: 1px solid #dbeafe; border-radius: 8px; padding: 8px; background: #fff; display: grid; gap: 2px; }
    .summary-role-grid span { font-size: 0.74rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .summary-role-grid strong { font-size: 1.04rem; color: #0f172a; }
    .summary-list { display: grid; gap: 6px; max-height: 188px; overflow-y: auto; padding-right: 2px; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; font-size: 0.9rem; color: #334155; }
    .summary-row:last-child { border-bottom: 0; padding-bottom: 0; }
    .summary-row strong { color: #0f172a; font-weight: 700; }
    .summary-empty { color: #64748b; font-size: 0.86rem; }
    .table-box { width: 100%; height: 380px; margin-top: 10px; border: 1px solid #dbe4f0; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05); }
    .modal { background: white; border-radius: 14px; width: min(680px, calc(100vw - 24px)); max-height: 80vh; overflow: auto; border: 1px solid #dbe4f0; box-shadow: 0 30px 70px rgba(15, 23, 42, 0.24); }
    .form-modal { width: min(1080px, calc(100vw - 24px)); max-height: 90vh; }
    .form-modal-content { padding: 10px 20px 20px; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 30%); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #dbe4f0; background: linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%); position: sticky; top: 0; z-index: 2; }
    .modal-header h3 { margin: 0; font-size: 1.05rem; letter-spacing: 0.01em; color: #0f172a; }
    .modal-content { display: grid; gap: 8px; padding: 16px; }

    :host ::ng-deep .teacher-form .mat-mdc-form-field {
      margin-bottom: 2px;
    }

    /* Improve spacing between auto icon and field text/label for better readability */
    :host ::ng-deep .teacher-form mat-form-field:not(.mat-mdc-form-field-has-icon-prefix) .mat-mdc-text-field-wrapper::before {
      left: 12px !important;
    }

    :host ::ng-deep .teacher-form mat-form-field:not(.mat-mdc-form-field-has-icon-prefix) .mat-mdc-form-field-infix {
      padding-left: 30px !important;
    }

    :host ::ng-deep .teacher-form mat-form-field:not(.mat-mdc-form-field-has-icon-prefix) .mdc-floating-label {
      margin-left: 2px;
    }

    :host ::ng-deep .teacher-form .mat-mdc-text-field-wrapper {
      border-radius: 10px !important;
    }

    :host ::ng-deep .teacher-form .mat-mdc-form-field-subscript-wrapper {
      margin-top: 2px !important;
    }

    :host ::ng-deep .teacher-form .mdc-text-field__input::placeholder {
      opacity: 0.72;
    }

    @media (max-width: 860px) {
      .header-cta { width: 100%; }
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; gap: 10px; }
      .summary-layout { grid-template-columns: 1fr; }
      .summary-role-grid { grid-template-columns: 1fr 1fr; }
      .span-2 { grid-column: span 1; }
      .form-section { padding: 12px; margin-bottom: 12px; }
      .form-modal-content { padding: 8px 12px 14px; }
      .derived-table th { width: 40%; }
      .form-actions { flex-direction: column; align-items: stretch; }

      :host ::ng-deep .teacher-form mat-form-field:not(.mat-mdc-form-field-has-icon-prefix) .mat-mdc-form-field-infix {
        padding-left: 28px !important;
      }
    }
  `]
})
export class InstituteAddTeacherComponent implements OnInit {
  readonly form = new FormGroup({
    governmentId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{12}$/)] }),
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    designation: new FormControl('', { nonNullable: true }),
    subjectSpecialization: new FormControl<string[]>([], { nonNullable: true }),
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
  readonly isFormModalOpen = signal(false);
  readonly selectedTeacherId = signal<number | null>(null);
  readonly casteOptions = CASTE_OPTIONS;
  readonly designationOptions = DESIGNATION_OPTIONS;
  readonly teacherTypeOptions = TEACHER_TYPE_OPTIONS;
  readonly availableSubjects = signal<string[]>([]);
  readonly maharashtraRetirementAge = MAHARASHTRA_TEACHER_RETIREMENT_AGE;
  readonly experience = signal('');
  readonly retirementDateDisplay = signal('');
  readonly seniorPayGradeStatus = signal('Need service start date');
  readonly selectionPayGradeStatus = signal('Need service start date');

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

  readonly activeTeacherCount = computed(() => this.teachers().filter((teacher) => !!teacher.active).length);
  readonly inactiveTeacherCount = computed(() => this.teachers().filter((teacher) => !teacher.active).length);
  readonly examinerReadyCount = computed(() => this.teachers().filter((teacher) => (teacher.examinerExperienceYears || 0) > 0).length);
  readonly moderatorReadyCount = computed(() => this.teachers().filter((teacher) => (teacher.moderatorExperienceYears || 0) > 0).length);
  readonly chiefModeratorReadyCount = computed(() => this.teachers().filter((teacher) => (teacher.chiefModeratorExperienceYears || 0) > 0).length);

  readonly subjectWiseSummary = computed(() => this.buildCountSummary((teacher) => this.toSubjectSelection(teacher.subjectSpecialization)));
  readonly designationWiseSummary = computed(() => this.buildCountSummary((teacher) => teacher.designation));
  readonly teacherTypeWiseSummary = computed(() => this.buildCountSummary((teacher) => teacher.teacherType));

  hasExaminerExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.examinerExperienceYears.value) ?? 0) > 0;
  }

  hasModeratorExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.moderatorExperienceYears.value) ?? 0) > 0;
  }

  hasChiefModeratorExperience(): boolean {
    return (this.toNumberOrUndefined(this.form.controls.chiefModeratorExperienceYears.value) ?? 0) > 0;
  }

  showExaminerLinkedModeratorHistory(): boolean {
    return this.hasExaminerExperience();
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

    if (!this.showExaminerLinkedModeratorHistory()) {
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
    this.loadSubjects();
    this.load();
  }

  loadSubjects() {
    this.http.get<{ subjects: Array<{ name?: string | null }> }>(`${API_BASE_URL}/masters/subjects`).subscribe({
      next: (response) => {
        const subjects = Array.from(
          new Set(
            (response?.subjects || [])
              .map((subject) => String(subject?.name || '').trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        this.availableSubjects.set(subjects);
      },
      error: () => {
        this.availableSubjects.set([]);
      }
    });
  }

  topSubjectLabel(): string {
    const grouped = new Map<string, number>();
    for (const teacher of this.teachers()) {
      const key = String(teacher.subjectSpecialization || '').trim();
      if (!key) continue;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    const top = [...grouped.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]} (${top[1]})` : '-';
  }

  topDistrictLabel(): string {
    const grouped = new Map<string, number>();
    for (const teacher of this.teachers()) {
      const key = String(teacher.institute?.district || '').trim();
      if (!key) continue;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    const top = [...grouped.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]} (${top[1]})` : '-';
  }

  averageServiceYears(): string {
    const values = this.teachers().map((teacher) => Number(teacher.totalYearsService || 0)).filter((value) => !Number.isNaN(value));
    if (!values.length) return '0.0';
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return avg.toFixed(1);
  }

  load() {
    this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers`).subscribe({
      next: (response) => this.teachers.set(response.teachers || []),
      error: (err) => this.setError(err, 'Unable to load teachers')
    });
  }

  openFormModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  normalizeGovernmentId() {
    const value = (this.form.controls.governmentId.value || '').replace(/\D/g, '').slice(0, 12);
    this.form.controls.governmentId.setValue(value, { emitEvent: false });
  }

  normalizeMobile() {
    const value = (this.form.controls.mobile.value || '').replace(/\D/g, '').slice(0, 10);
    this.form.controls.mobile.setValue(value, { emitEvent: false });
  }

  onAadharLookup() {
    const governmentId = this.form.controls.governmentId.value.trim();
    if (!/^\d{12}$/.test(governmentId)) {
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
          this.snackBar.open('No previous institute history found. Please continue with manual entry.', 'Close', { duration: 3000 });
          return;
        }

        const existing = history[0];
        this.form.patchValue({
          governmentId: existing.governmentId || governmentId,
          fullName: existing.fullName || '',
          designation: existing.designation || '',
          subjectSpecialization: this.toSubjectSelection(existing.subjectSpecialization),
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
        this.snackBar.open('Aadhaar history found and prefilled. Please review and update fields as needed.', 'Close', { duration: 2600 });
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
      designation: this.form.value.designation || undefined,
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
      lastModeratorName: this.showExaminerLinkedModeratorHistory() ? (this.form.value.lastModeratorName || undefined) : undefined,
      lastModeratorAppointmentNo: this.showExaminerLinkedModeratorHistory() ? (this.form.value.lastModeratorAppointmentNo || undefined) : undefined,
      lastModeratorCollegeName: this.showExaminerLinkedModeratorHistory() ? (this.form.value.lastModeratorCollegeName || undefined) : undefined,
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
        this.isFormModalOpen.set(false);
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
    this.historyTeachers.set([]);
    this.form.reset({
      governmentId: '',
      fullName: '',
      designation: '',
      subjectSpecialization: [],
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
      this.isFormModalOpen.set(true);
      this.selectedTeacherId.set(teacher.id);
      this.historyTeachers.set([]);
      this.form.patchValue({
        governmentId: teacher.governmentId ?? '',
        fullName: teacher.fullName ?? '',
        designation: teacher.designation ?? '',
        subjectSpecialization: this.toSubjectSelection(teacher.subjectSpecialization),
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

  private toSubjectSelection(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((entry) => String(entry || '').trim()).filter(Boolean);
    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private buildCountSummary(selector: (teacher: any) => unknown): Array<{ label: string; count: number }> {
    const grouped = new Map<string, number>();

    for (const teacher of this.teachers()) {
      const selected = selector(teacher);
      const values = Array.isArray(selected) ? selected : [selected];

      for (const raw of values) {
        const label = String(raw || '').trim();
        if (!label) continue;
        grouped.set(label, (grouped.get(label) || 0) + 1);
      }
    }

    return [...grouped.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));
  }
}

