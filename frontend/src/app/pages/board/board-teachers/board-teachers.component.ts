import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { API_BASE_URL } from '../../../core/api';

type TeacherRow = {
  id: number;
  sourceTeacherIds?: number[];
  fullName: string;
  dob?: string;
  governmentId?: string;
  designation?: string;
  subjectSpecialization?: string;
  teacherType?: string;
  institute?: { name?: string; district?: string; address?: string; fullAddress?: string };
  institutes?: { id?: number; name?: string; district?: string; fullAddress?: string }[];
  instituteNames?: string;
  instituteCount?: number;
  active: boolean;
  createdAt: string;
  email?: string;
  mobile?: string;
  joiningDate?: string;
  retirementDate?: string;
  totalYearsService?: number;
  examinerExperienceYears?: number;
  previousExaminerAppointmentNo?: string;
  moderatorExperienceYears?: number;
  lastModeratorName?: string;
  lastModeratorAppointmentNo?: string;
  lastModeratorCollegeName?: string;
  chiefModeratorExperienceYears?: number;
  lastChiefModeratorName?: string;
  lastChiefModeratorAppointmentNo?: string;
  lastChiefModeratorCollegeName?: string;
  seniorPayGradeEligible?: boolean;
  selectionPayGradeEligible?: boolean;
  canCoordinateExam?: boolean;
  canExamine?: boolean;
  canPaperCheck?: boolean;
  readinessScore?: number;
  recommendedRoles?: string[];
};

@Component({
  selector: 'app-board-teachers',
  standalone: true,
  imports: [FormsModule, AgGridAngular, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, NgIf, NgFor],
  template: `
    <mat-card class="card">
      <div class="dashboard-grid">
        <div class="stat primary"><span>Total Teachers</span><strong>{{ metadata().total }}</strong></div>
        <div class="stat"><span>Active</span><strong>{{ metadata().activeCount }}</strong></div>
        <div class="stat"><span>Inactive</span><strong>{{ metadata().inactiveCount }}</strong></div>
        <div class="stat"><span>Multi-Institute</span><strong>{{ metadata().multiInstituteCount }}</strong></div>
        <div class="stat"><span>Coordinators</span><strong>{{ metadata().coordinatorCount }}</strong></div>
        <div class="stat"><span>Examiner Panel</span><strong>{{ metadata().examinerPanelCount }}</strong></div>
        <div class="stat"><span>Paper Checkers</span><strong>{{ metadata().paperCheckerCount }}</strong></div>
        <div class="stat"><span>Moderation Leads</span><strong>{{ metadata().moderationLeadCount }}</strong></div>
      </div>
      <div class="ops-grid">
        <button class="ops-card" type="button" *ngFor="let role of rolePresetCards" (click)="setRolePreset(role.roleFit)">
          <span>{{ role.label }}</span>
          <strong>{{ role.count() }}</strong>
          <small>{{ role.hint }}</small>
        </button>
      </div>
      <div class="readiness-grid">
        <div class="readiness-card high">
          <span>High Readiness (80+)</span>
          <strong>{{ readinessBuckets().high }}</strong>
          <small>{{ readinessShare('high') }}% of current result</small>
        </div>
        <div class="readiness-card medium">
          <span>Medium Readiness (60-79)</span>
          <strong>{{ readinessBuckets().medium }}</strong>
          <small>{{ readinessShare('medium') }}% of current result</small>
        </div>
        <div class="readiness-card low">
          <span>Low Readiness (<60)</span>
          <strong>{{ readinessBuckets().low }}</strong>
          <small>{{ readinessShare('low') }}% of current result</small>
        </div>
      </div>
      <div class="shortlist-row">
        <button mat-stroked-button type="button" [class.shortlist-active]="shortlistMode() === 'ALL'" (click)="setShortlistMode('ALL')">All ({{ rawTeachers().length }})</button>
        <button mat-stroked-button type="button" [class.shortlist-active]="shortlistMode() === 'HIGH'" (click)="setShortlistMode('HIGH')">High ({{ readinessBuckets().high }})</button>
        <button mat-stroked-button type="button" [class.shortlist-active]="shortlistMode() === 'MEDIUM'" (click)="setShortlistMode('MEDIUM')">Medium ({{ readinessBuckets().medium }})</button>
        <button mat-stroked-button type="button" [class.shortlist-active]="shortlistMode() === 'LOW'" (click)="setShortlistMode('LOW')">Low ({{ readinessBuckets().low }})</button>
        <button mat-stroked-button type="button" [class.shortlist-active]="shortlistMode() === 'TOP25'" (click)="setShortlistMode('TOP25')">Top 25 Readiness</button>
      </div>
      <div class="controls">
        <mat-form-field appearance="outline" class="w240"><mat-label>Search</mat-label><input matInput [(ngModel)]="search" (input)="load()" /></mat-form-field>
        <mat-form-field appearance="outline" class="w180"><mat-label>Status</mat-label><mat-select [(ngModel)]="statusFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="true">Active</mat-option><mat-option value="false">Inactive</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="w220"><mat-label>Institute</mat-label><input matInput [(ngModel)]="instituteFilter" (input)="load()" /></mat-form-field>
        <mat-form-field appearance="outline" class="w220"><mat-label>Board Duty</mat-label><mat-select [(ngModel)]="dutyFilter" (selectionChange)="load()"><mat-option value="">All duties</mat-option><mat-option value="EXAMINER">Examiner only</mat-option><mat-option value="MODERATOR">Moderator only</mat-option><mat-option value="CHIEF_MODERATOR">Chief Moderator only</mat-option><mat-option value="ANY_BOARD_DUTY">Any board duty</mat-option><mat-option value="NONE">No board duty</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="w220"><mat-label>Role Fit</mat-label><mat-select [(ngModel)]="roleFitFilter" (selectionChange)="load()"><mat-option value="">All role fits</mat-option><mat-option value="COORDINATOR">Exam Coordinators</mat-option><mat-option value="EXAMINER_PANEL">Examiner Panel</mat-option><mat-option value="PAPER_CHECKER">Paper Checkers</mat-option><mat-option value="MODERATION_LEAD">Moderation Leads</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="w220"><mat-label>Pay Grade Eligibility</mat-label><mat-select [(ngModel)]="eligibilityFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="SENIOR">Senior pay grade</mat-option><mat-option value="SELECTION">Selection pay grade</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="w180"><mat-label>Institute Links</mat-label><mat-select [(ngModel)]="multiInstituteFilter" (selectionChange)="load()"><mat-option value="">All</mat-option><mat-option value="true">Multi-institute only</mat-option><mat-option value="false">Single institute</mat-option></mat-select></mat-form-field>
        <button mat-stroked-button type="button" (click)="setRolePreset('COORDINATOR')">Coordinator List</button>
        <button mat-stroked-button type="button" (click)="setRolePreset('EXAMINER_PANEL')">Examiner List</button>
        <button mat-stroked-button type="button" (click)="setRolePreset('PAPER_CHECKER')">Paper Checking List</button>
        <button mat-flat-button color="primary" (click)="exportCsv()">Export Detailed CSV</button>
        <button mat-stroked-button color="primary" (click)="printGrid()">Print Summary</button>
      </div>
      <div class="toolbar-note">Filters apply to the merged board teacher record, so one teacher appears once even if linked to multiple institutes.</div>
      <div class="status-row" *ngIf="loading() || errorMessage() || !teachers().length">
        <span class="loading-chip" *ngIf="loading()">Loading teachers...</span>
        <span class="error-chip" *ngIf="errorMessage()">{{ errorMessage() }}</span>
        <span class="empty-chip" *ngIf="!loading() && !errorMessage() && !teachers().length">No teacher records match current filters.</span>
      </div>
      <div class="ag-theme-alpine table-box" style="height: 420px; width: 100%;">
        <ag-grid-angular
          style="width: 100%; height: 100%;"
          class="ag-theme-alpine"
          [rowData]="teachers()"
          [columnDefs]="columnDefs"
          [pagination]="true"
          [paginationPageSize]="metadata().limit"
          [paginationPageSizeSelector]="[10, 20, 50, 100]"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onGridAction($event)"
        ></ag-grid-angular>
      </div>
    </mat-card>

    <div class="app-modal-backdrop" *ngIf="viewingTeacher() as teacher">
      <div class="modal-card app-modal-panel app-modal-panel--lg">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ teacher.fullName }}</div>
            <div class="modal-subtitle">{{ teacher.subjectSpecialization || 'Subject not set' }} • {{ teacher.teacherType || 'Type not set' }}</div>
          </div>
          <div class="modal-header-actions">
            <button mat-stroked-button color="primary" type="button" (click)="printTeacherDetail(teacher)">Print Detail</button>
            <button mat-icon-button type="button" (click)="closeView()"><mat-icon>close</mat-icon></button>
          </div>
        </div>

        <div class="modal-grid">
          <div class="info-section">
            <div class="section-heading">Personal Information</div>
            <div><strong>DOB:</strong> {{ formatDate(teacher.dob) }}</div>
            <div><strong>Aadhar:</strong> {{ teacher.governmentId || '-' }}</div>
            <div><strong>Mobile:</strong> {{ teacher.mobile || '-' }}</div>
            <div><strong>Email:</strong> {{ teacher.email || '-' }}</div>
          </div>

          <div class="info-section">
            <div class="section-heading">Service Summary</div>
            <div><strong>Joining Date:</strong> {{ formatDate(teacher.joiningDate) }}</div>
            <div><strong>Retirement Date:</strong> {{ formatDate(teacher.retirementDate) }}</div>
            <div><strong>Total Service:</strong> {{ teacher.totalYearsService ?? 0 }} years</div>
            <div><strong>Senior Pay Grade:</strong> {{ teacher.seniorPayGradeEligible ? 'Eligible' : 'Not yet eligible' }}</div>
            <div><strong>Selection Pay Grade:</strong> {{ teacher.selectionPayGradeEligible ? 'Eligible' : 'Not yet eligible' }}</div>
          </div>

          <div class="info-section">
            <div class="section-heading">Board Duty Summary</div>
            <div><strong>Examiner:</strong> {{ teacher.examinerExperienceYears ? (teacher.examinerExperienceYears + ' years') : 'No experience added' }}</div>
            <div><strong>Examiner Appointment No:</strong> {{ teacher.previousExaminerAppointmentNo || '-' }}</div>
            <div><strong>Moderator:</strong> {{ teacher.moderatorExperienceYears ? (teacher.moderatorExperienceYears + ' years') : 'No experience added' }}</div>
            <div><strong>Moderator Name / No:</strong> {{ teacher.lastModeratorName || '-' }} / {{ teacher.lastModeratorAppointmentNo || '-' }}</div>
            <div><strong>Moderator College:</strong> {{ teacher.lastModeratorCollegeName || '-' }}</div>
            <div><strong>Readiness Score:</strong> {{ teacher.readinessScore ?? 0 }}/100</div>
            <div><strong>Recommended Roles:</strong> {{ (teacher.recommendedRoles || []).join(', ') || '-' }}</div>
          </div>

          <div class="info-section">
            <div class="section-heading">Chief Moderator</div>
            <div><strong>Experience:</strong> {{ teacher.chiefModeratorExperienceYears ? (teacher.chiefModeratorExperienceYears + ' years') : 'No experience added' }}</div>
            <div><strong>Name / No:</strong> {{ teacher.lastChiefModeratorName || '-' }} / {{ teacher.lastChiefModeratorAppointmentNo || '-' }}</div>
            <div><strong>College:</strong> {{ teacher.lastChiefModeratorCollegeName || '-' }}</div>
          </div>

          <div class="info-section span-2">
            <div class="section-heading">Institute Associations</div>
            <div class="chips-row">
              <span class="pill">{{ teacher.instituteCount || 0 }} institute link(s)</span>
              <span class="pill">{{ teacher.active ? 'Active at board level' : 'Inactive at board level' }}</span>
            </div>
            <div class="association-list" *ngIf="teacher.institutes?.length; else noInstituteLinks">
              <div class="association-item" *ngFor="let item of teacher.institutes">
                <div><strong>{{ item.name || 'Unknown Institute' }}</strong></div>
                <div>{{ item.district || '-' }}</div>
                <div>{{ item.fullAddress || '-' }}</div>
              </div>
            </div>
            <ng-template #noInstituteLinks>
              <div class="empty-note">No institute association details available.</div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.card { margin-bottom: 14px; padding: 16px; }`,
    `.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }`,
    `.stat { background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%); border: 1px solid #dbeafe; padding: 10px 12px; border-radius: 10px; display: grid; gap: 2px; }`,
    `.stat span { color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }`,
    `.stat strong { color: #0f172a; font-size: 1.15rem; line-height: 1.2; }`,
    `.stat.primary { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); border-color: #1d4ed8; }`,
    `.stat.primary span, .stat.primary strong { color: #eff6ff; }`,
    `.ops-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 10px; }`,
    `.ops-card { border: 1px solid #cbd5e1; background: linear-gradient(155deg, #ffffff 0%, #f1f5f9 100%); border-radius: 10px; padding: 10px 12px; text-align: left; display: grid; gap: 2px; cursor: pointer; }`,
    `.ops-card span { color: #334155; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }`,
    `.ops-card strong { color: #0f172a; font-size: 1.05rem; }`,
    `.ops-card small { color: #64748b; font-size: 11px; }`,
    `.ops-card:hover { border-color: #1d4ed8; transform: translateY(-1px); transition: all .16s ease; }`,
    `.readiness-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 10px; }`,
    `.readiness-card { border-radius: 10px; padding: 10px 12px; display: grid; gap: 2px; border: 1px solid #cbd5e1; }`,
    `.readiness-card span { font-size: 12px; color: #334155; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }`,
    `.readiness-card strong { font-size: 1.1rem; color: #0f172a; }`,
    `.readiness-card small { color: #64748b; font-size: 11px; }`,
    `.readiness-card.high { background: #ecfeff; border-color: #99f6e4; }`,
    `.readiness-card.medium { background: #fffbeb; border-color: #fde68a; }`,
    `.readiness-card.low { background: #fef2f2; border-color: #fecaca; }`,
    `.shortlist-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }`,
    `.shortlist-active { background: #dbeafe; border-color: #1d4ed8; color: #1d4ed8; }`,
    `.controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }`,
    `.toolbar-note { color: #475569; font-size: 13px; margin-bottom: 10px; }`,
    `.status-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }`,
    `.loading-chip, .error-chip, .empty-chip { padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }`,
    `.loading-chip { background: #e0f2fe; color: #0c4a6e; }`,
    `.error-chip { background: #fee2e2; color: #991b1b; }`,
    `.empty-chip { background: #f1f5f9; color: #334155; }`,
    `.w240 { width: 240px; }`,
    `.w180 { width: 180px; }`,
    `.w220 { width: 220px; }`,
    `.table-box { border: 1px solid #e2e8f0; border-radius: 6px; }`,
    `.modal-card { background: #fff; border-radius: 14px; width: min(980px, calc(100vw - 24px)); max-height: 88vh; overflow: auto; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25); }`,
    `.modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 16px 18px; border-bottom: 1px solid #e2e8f0; }`,
    `.modal-title { font-size: 1.15rem; font-weight: 700; }`,
    `.modal-subtitle { color: #64748b; margin-top: 4px; }`,
    `.modal-header-actions { display: flex; align-items: center; gap: 8px; }`,
    `.modal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; padding: 16px 18px 18px; }`,
    `.info-section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: grid; gap: 6px; background: #f8fafc; }`,
    `.section-heading { font-weight: 700; color: #1d4ed8; margin-bottom: 2px; }`,
    `.span-2 { grid-column: span 2; }`,
    `.chips-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }`,
    `.pill { background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 12px; }`,
    `.association-list { display: grid; gap: 8px; }`,
    `.association-item { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; background: white; }`,
    `.empty-note { color: #64748b; }`
  ]
})
export class BoardTeachersComponent implements OnInit {
  readonly rolePresetCards = [
    { roleFit: 'COORDINATOR', label: 'Exam Coordinators', hint: 'Institution and shift planning', count: () => this.metadata().coordinatorCount },
    { roleFit: 'EXAMINER_PANEL', label: 'Examiner Panel', hint: 'Question paper and evaluation work', count: () => this.metadata().examinerPanelCount },
    { roleFit: 'PAPER_CHECKER', label: 'Paper Checkers', hint: 'High-volume checking shortlist', count: () => this.metadata().paperCheckerCount },
    { roleFit: 'MODERATION_LEAD', label: 'Moderation Leads', hint: 'Policy and consistency checks', count: () => this.metadata().moderationLeadCount }
  ] as const;
  readonly rawTeachers = signal<TeacherRow[]>([]);
  readonly teachers = signal<TeacherRow[]>([]);
  readonly viewingTeacher = signal<TeacherRow | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly shortlistMode = signal<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'TOP25'>('ALL');
  readonly readinessBuckets = signal({ high: 0, medium: 0, low: 0 });
  readonly metadata = signal({ page: 1, limit: 20, total: 0, activeCount: 0, inactiveCount: 0, multiInstituteCount: 0, coordinatorCount: 0, examinerPanelCount: 0, paperCheckerCount: 0, moderationLeadCount: 0 });
  search = '';
  statusFilter = '';
  instituteFilter = '';
  dutyFilter = '';
  roleFitFilter = '';
  eligibilityFilter = '';
  multiInstituteFilter = '';

  readonly columnDefs: ColDef[] = [
    { field: 'fullName', headerName: 'Full Name', pinned: 'left', minWidth: 180 },
    { field: 'dob', headerName: 'DOB', valueGetter: (params: any) => this.formatDate(params.data?.dob), minWidth: 110 },
    { field: 'governmentId', headerName: 'Aadhar', minWidth: 130 },
    { field: 'subjectSpecialization', headerName: 'Subject', minWidth: 150 },
    { field: 'mobile', headerName: 'Mobile', minWidth: 120 },
    { field: 'email', headerName: 'E-mail', minWidth: 180 },
    { field: 'joiningDate', headerName: 'Joining Date', valueGetter: (params: any) => this.formatDate(params.data?.joiningDate), minWidth: 120 },
    { field: 'retirementDate', headerName: 'Retirement Date', valueGetter: (params: any) => this.formatDate(params.data?.retirementDate), minWidth: 130 },
    {
      field: 'totalYearsService',
      headerName: 'Service',
      valueGetter: (params: any) => params.data?.totalYearsService !== undefined && params.data?.totalYearsService !== null ? `${params.data.totalYearsService} years` : '-',
      minWidth: 120
    },
    {
      field: 'readinessScore',
      headerName: 'Readiness',
      valueGetter: (params: any) => params.data?.readinessScore !== undefined ? `${params.data.readinessScore}/100` : '-',
      minWidth: 120
    },
    {
      field: 'recommendedRoles',
      headerName: 'Recommended Roles',
      valueGetter: (params: any) => (params.data?.recommendedRoles || []).join(', ') || '-',
      minWidth: 220
    },
    {
      headerName: 'Examiner Details',
      valueGetter: (params: any) => params.data?.examinerExperienceYears ? `${params.data.examinerExperienceYears} yrs${params.data?.previousExaminerAppointmentNo ? ` • ${params.data.previousExaminerAppointmentNo}` : ''}` : 'No',
      minWidth: 190
    },
    {
      headerName: 'Moderator Details',
      valueGetter: (params: any) => params.data?.moderatorExperienceYears ? `${params.data.moderatorExperienceYears} yrs${params.data?.lastModeratorName ? ` • ${params.data.lastModeratorName}` : ''}` : 'No',
      minWidth: 200
    },
    {
      headerName: 'Chief Moderator',
      valueGetter: (params: any) => params.data?.chiefModeratorExperienceYears ? `${params.data.chiefModeratorExperienceYears} yrs${params.data?.lastChiefModeratorName ? ` • ${params.data.lastChiefModeratorName}` : ''}` : 'No',
      minWidth: 200
    },
    { headerName: 'Institutes', valueGetter: (params: any) => params.data?.instituteNames ?? params.data?.institute?.name ?? '-', minWidth: 220 },
    { headerName: 'Status', valueGetter: (params: any) => (params.data.active ? 'Active' : 'Inactive'), minWidth: 100 },
    { headerName: 'Actions', field: 'actions', flex: 1, minWidth: 170, cellRenderer: () => `<div style="display:flex;gap:4px;"><button data-action=view style="border:none;background:#dbeafe;color:#1d4ed8;padding:3px 6px;border-radius:4px;">View</button><button data-action=toggle style="border:none;background:#fef3c7;color:#92400e;padding:3px 6px;border-radius:4px;">Toggle</button></div>` }
  ];

  defaultColDef = { flex: 1, minWidth: 120, filter: true, sortable: true };

  constructor(private readonly http: HttpClient) {}

  ngOnInit() { this.load(); }

  private buildQuery(page: number, limit: number) {
    const q = new URLSearchParams();
    if (this.search) q.set('search', this.search);
    if (this.statusFilter) q.set('active', this.statusFilter);
    if (this.instituteFilter) q.set('institute', this.instituteFilter);
    if (this.dutyFilter) q.set('dutyType', this.dutyFilter);
    if (this.roleFitFilter) q.set('roleFit', this.roleFitFilter);
    if (this.eligibilityFilter) q.set('eligibility', this.eligibilityFilter);
    if (this.multiInstituteFilter) q.set('multiInstitute', this.multiInstituteFilter);
    q.set('page', `${page}`);
    q.set('limit', `${limit}`);
    return q;
  }

  setRolePreset(roleFit: string) {
    this.roleFitFilter = roleFit;
    this.shortlistMode.set('ALL');
    this.load();
  }

  setShortlistMode(mode: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'TOP25') {
    this.shortlistMode.set(mode);
    this.applyShortlist();
  }

  readinessShare(bucket: 'high' | 'medium' | 'low') {
    const total = this.rawTeachers().length;
    if (!total) return 0;
    const value = this.readinessBuckets()[bucket];
    return Math.round((value / total) * 100);
  }

  private applyShortlist() {
    const source = this.rawTeachers();
    const mode = this.shortlistMode();
    const sorted = [...source].sort((a, b) => (b.readinessScore ?? 0) - (a.readinessScore ?? 0));

    if (mode === 'ALL') {
      this.teachers.set(source);
      return;
    }
    if (mode === 'TOP25') {
      this.teachers.set(sorted.slice(0, 25));
      return;
    }

    const filtered = source.filter((teacher) => {
      const score = teacher.readinessScore ?? 0;
      if (mode === 'HIGH') return score >= 80;
      if (mode === 'MEDIUM') return score >= 60 && score < 80;
      return score < 60;
    });
    this.teachers.set(filtered);
  }

  private updateReadinessBuckets(rows: TeacherRow[]) {
    const buckets = { high: 0, medium: 0, low: 0 };
    for (const row of rows) {
      const score = row.readinessScore ?? 0;
      if (score >= 80) buckets.high += 1;
      else if (score >= 60) buckets.medium += 1;
      else buckets.low += 1;
    }
    this.readinessBuckets.set(buckets);
  }

  private fetchAllTeachers(onDone: (rows: TeacherRow[]) => void) {
    const query = this.buildQuery(1, 10000);
    this.http.get<{ teachers: TeacherRow[] }>(`${API_BASE_URL}/institutes/board/teachers?${query.toString()}`).subscribe({
      next: (response) => onDone(response.teachers || []),
      error: () => {
        this.errorMessage.set('Failed to fetch teachers for export/print. Please retry.');
        onDone([]);
      }
    });
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set('');
    const q = this.buildQuery(this.metadata().page, this.metadata().limit);
    this.http.get<{ teachers: TeacherRow[]; metadata: any }>(`${API_BASE_URL}/institutes/board/teachers?${q.toString()}`).subscribe({
      next: (r) => {
        const rows = r.teachers || [];
        this.rawTeachers.set(rows);
        this.updateReadinessBuckets(rows);
        this.applyShortlist();
        this.metadata.set({ ...this.metadata(), ...r.metadata });
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.rawTeachers.set([]);
        this.teachers.set([]);
        this.readinessBuckets.set({ high: 0, medium: 0, low: 0 });
        this.errorMessage.set(err?.status ? `Unable to load teachers (${err.status}).` : 'Unable to load teachers.');
      }
    });
  }

  exportCsv() {
    this.fetchAllTeachers((teachers) => {
      const rows = teachers.map((t) => ({
        Name: t.fullName,
        DOB: this.formatDate(t.dob),
        Aadhar: t.governmentId ?? '',
        TeacherType: t.teacherType ?? '',
        Subject: t.subjectSpecialization ?? '',
        Institutes: t.instituteNames ?? t.institute?.name ?? '',
        InstituteCount: t.instituteCount ?? 0,
        Email: t.email ?? '',
        Mobile: t.mobile ?? '',
        JoiningDate: this.formatDate(t.joiningDate),
        RetirementDate: this.formatDate(t.retirementDate),
        TotalService: t.totalYearsService ?? '',
        ReadinessScore: t.readinessScore ?? '',
        RecommendedRoles: (t.recommendedRoles || []).join(', '),
        SeniorPayGrade: t.seniorPayGradeEligible ? 'Eligible' : 'No',
        SelectionPayGrade: t.selectionPayGradeEligible ? 'Eligible' : 'No',
        CanCoordinateExam: t.canCoordinateExam ? 'Yes' : 'No',
        CanExamine: t.canExamine ? 'Yes' : 'No',
        CanPaperCheck: t.canPaperCheck ? 'Yes' : 'No',
        ExaminerExperience: t.examinerExperienceYears ? `${t.examinerExperienceYears} yrs` : 'No',
        ExaminerAppointmentNo: t.previousExaminerAppointmentNo ?? '',
        ModeratorExperience: t.moderatorExperienceYears ? `${t.moderatorExperienceYears} yrs` : 'No',
        ModeratorName: t.lastModeratorName ?? '',
        ModeratorAppointmentNo: t.lastModeratorAppointmentNo ?? '',
        ModeratorCollege: t.lastModeratorCollegeName ?? '',
        ChiefModeratorExperience: t.chiefModeratorExperienceYears ? `${t.chiefModeratorExperienceYears} yrs` : 'No',
        ChiefModeratorName: t.lastChiefModeratorName ?? '',
        ChiefModeratorAppointmentNo: t.lastChiefModeratorAppointmentNo ?? '',
        ChiefModeratorCollege: t.lastChiefModeratorCollegeName ?? '',
        Status: t.active ? 'Active' : 'Inactive'
      }));
      if (!rows.length) {
        alert('No teacher rows available for export with current filters.');
        return;
      }
      const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `teachers-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  printGrid() {
    this.fetchAllTeachers((teachers) => {
      if (!teachers.length) {
        alert('No teacher rows available for print with current filters.');
        return;
      }
      const rows = teachers.map((t) => `<tr><td>${t.fullName}</td><td>${this.formatDate(t.dob)}</td><td>${t.governmentId ?? ''}</td><td>${t.subjectSpecialization ?? ''}</td><td>${t.instituteNames ?? t.institute?.name ?? ''}</td><td>${this.formatDate(t.joiningDate)}</td><td>${this.formatDate(t.retirementDate)}</td><td>${t.totalYearsService ?? ''}</td><td>${t.readinessScore ?? ''}</td><td>${(t.recommendedRoles || []).join(', ')}</td><td>${t.seniorPayGradeEligible ? 'Eligible' : 'No'}</td><td>${t.selectionPayGradeEligible ? 'Eligible' : 'No'}</td><td>${t.canCoordinateExam ? 'Yes' : 'No'}</td><td>${t.canExamine ? 'Yes' : 'No'}</td><td>${t.canPaperCheck ? 'Yes' : 'No'}</td><td>${t.examinerExperienceYears ? `${t.examinerExperienceYears} yrs` : 'No'}</td><td>${t.moderatorExperienceYears ? `${t.moderatorExperienceYears} yrs` : 'No'}</td><td>${t.chiefModeratorExperienceYears ? `${t.chiefModeratorExperienceYears} yrs` : 'No'}</td><td>${t.email ?? ''}</td><td>${t.mobile ?? ''}</td><td>${t.active ? 'Active' : 'Inactive'}</td></tr>`).join('');
      const html = `<html><head><style>body{font-family:Arial,sans-serif;padding:16px;} .summary{margin-bottom:12px;font-size:14px;} table{width:100%;border-collapse:collapse;}th,td{border:1px solid #666;padding:6px;text-align:left;} th{background:#eef2ff;}</style></head><body><h2>Board Teacher Summary</h2><div class="summary">Generated: ${new Date().toLocaleString()}<br/>Total: ${teachers.length} | Active: ${this.metadata().activeCount} | Multi-Institute: ${this.metadata().multiInstituteCount}</div><table><thead><tr><th>Name</th><th>DOB</th><th>Aadhar</th><th>Subject</th><th>Institutes</th><th>Joining</th><th>Retirement</th><th>Total Service</th><th>Readiness</th><th>Recommended Roles</th><th>Senior Grade</th><th>Selection Grade</th><th>Can Coordinate</th><th>Can Examine</th><th>Can Paper Check</th><th>Examiner</th><th>Moderator</th><th>Chief Moderator</th><th>Email</th><th>Mobile</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(html);
      w.document.close();
      w.print();
    });
  }

  onGridAction(event: any) {
    const action = (event.event?.target as HTMLElement)?.closest('button')?.dataset?.['action'];
    const row = event.data as TeacherRow | undefined;
    if (!action || !row) return;

    if (action === 'view') {
      this.viewingTeacher.set(row);
      return;
    }

    if (action === 'toggle') {
      const newStatus = !row.active;
      this.http.patch(`${API_BASE_URL}/institutes/board/teachers/${row.id}`, { active: newStatus, teacherIds: row.sourceTeacherIds ?? [row.id] }).subscribe({
        next: () => this.load(),
        error: () => alert('Status update failed')
      });
      return;
    }
  }

  closeView() {
    this.viewingTeacher.set(null);
  }

  printTeacherDetail(teacher: TeacherRow) {
    const institutes = (teacher.institutes || [])
      .map((item) => `<li><strong>${item.name || 'Unknown Institute'}</strong> — ${item.district || '-'} — ${item.fullAddress || '-'}</li>`)
      .join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
            h2 { margin-bottom: 4px; }
            .muted { color: #6b7280; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
            ul { margin: 8px 0 0 18px; }
          </style>
        </head>
        <body>
          <h2>${teacher.fullName}</h2>
          <div class="muted">${teacher.subjectSpecialization || 'Subject not set'} • ${teacher.teacherType || 'Type not set'}</div>
          <div class="grid">
            <div class="card"><strong>Personal</strong><br/>DOB: ${this.formatDate(teacher.dob)}<br/>Aadhar: ${teacher.governmentId || '-'}<br/>Mobile: ${teacher.mobile || '-'}<br/>Email: ${teacher.email || '-'}</div>
            <div class="card"><strong>Service</strong><br/>Joining: ${this.formatDate(teacher.joiningDate)}<br/>Retirement: ${this.formatDate(teacher.retirementDate)}<br/>Total Service: ${teacher.totalYearsService ?? 0} years<br/>Senior Grade: ${teacher.seniorPayGradeEligible ? 'Eligible' : 'No'}<br/>Selection Grade: ${teacher.selectionPayGradeEligible ? 'Eligible' : 'No'}</div>
            <div class="card"><strong>Board Duty</strong><br/>Examiner: ${teacher.examinerExperienceYears ? `${teacher.examinerExperienceYears} years` : 'No'}<br/>Examiner Appointment: ${teacher.previousExaminerAppointmentNo || '-'}<br/>Moderator: ${teacher.moderatorExperienceYears ? `${teacher.moderatorExperienceYears} years` : 'No'}<br/>Moderator Name/No: ${teacher.lastModeratorName || '-'} / ${teacher.lastModeratorAppointmentNo || '-'}<br/>Moderator College: ${teacher.lastModeratorCollegeName || '-'}</div>
            <div class="card"><strong>Chief Moderator</strong><br/>Experience: ${teacher.chiefModeratorExperienceYears ? `${teacher.chiefModeratorExperienceYears} years` : 'No'}<br/>Name/No: ${teacher.lastChiefModeratorName || '-'} / ${teacher.lastChiefModeratorAppointmentNo || '-'}<br/>College: ${teacher.lastChiefModeratorCollegeName || '-'}</div>
          </div>
          <div class="card" style="margin-top:12px;"><strong>Institute Associations</strong><ul>${institutes || '<li>No institute links available</li>'}</ul></div>
        </body>
      </html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  formatDate(value?: string) {
    return value ? new Date(value).toLocaleDateString('en-GB') : '-';
  }
}
